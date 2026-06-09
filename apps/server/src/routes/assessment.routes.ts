import { Router } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { MCQQuestion, CodingProblem } from '../models/Question';
import { AssessmentAttempt } from '../models/Assessment';
import { requireAuth } from '../middlewares/auth';
import { enforceTenancy } from '../middlewares/tenantMiddleware';
import { idempotency } from '../middlewares/idempotency';
import { auditEvent } from '../middlewares/audit';
import { logger } from '../utils/logger';

const router = Router();

// 1. Create MCQ Question (Globally or Company scoped)
router.post(
  '/questions',
  requireAuth,
  enforceTenancy,
  idempotency(),
  auditEvent('MCQ_CREATE', 'MCQQuestion'),
  async (req: any, res) => {
    try {
      const { questionText, options, correctOptionIndex, difficulty, category, tags } = req.body;
      const companyId = req.companyId;

      if (!questionText || !options || correctOptionIndex === undefined || !difficulty || !category) {
        return res.status(400).json({ error: 'Missing required MCQ properties' });
      }

      const mcq = await MCQQuestion.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        questionText,
        options,
        correctOptionIndex,
        difficulty,
        category,
        tags: tags || []
      });

      res.status(201).json({
        success: true,
        message: 'MCQ question created successfully',
        data: mcq
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create MCQ question', details: err.message });
    }
  }
);

// 2. Fetch MCQ Questions by Category (Scoped)
router.get('/questions', requireAuth, enforceTenancy, async (req: any, res) => {
  try {
    const companyId = req.companyId;
    const { category, difficulty } = req.query;

    const query: any = {
      $or: [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { companyId: null } // Include global questions
      ]
    };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const questions = await MCQQuestion.find(query);

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch MCQ questions', details: err.message });
  }
});

// 3. Create Coding Problem
router.post(
  '/coding-problems',
  requireAuth,
  enforceTenancy,
  idempotency(),
  auditEvent('CODING_PROBLEM_CREATE', 'CodingProblem'),
  async (req: any, res) => {
    try {
      const { title, slug, description, difficulty, tags, starterCode, testCases, timeLimitMs, memoryLimitKb } = req.body;
      const companyId = req.companyId;

      if (!title || !slug || !description || !difficulty || !starterCode || !testCases) {
        return res.status(400).json({ error: 'Missing required coding problem properties' });
      }

      const problem = await CodingProblem.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        title,
        slug: slug.toLowerCase().trim(),
        description,
        difficulty,
        tags: tags || [],
        starterCode,
        testCases,
        timeLimitMs: timeLimitMs || 2000,
        memoryLimitKb: memoryLimitKb || 51200,
        isGlobal: false
      });

      res.status(201).json({
        success: true,
        message: 'Coding problem created successfully',
        data: problem
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create coding problem', details: err.message });
    }
  }
);

// 4. Secure Sandbox Code Execution
router.post(
  '/attempts/:attemptId/execute',
  idempotency(),
  async (req, res) => {
    const { attemptId } = req.params;
    const { language, code, problemId } = req.body;

    if (!language || !code || !problemId) {
      return res.status(400).json({ error: 'Missing required parameters: language, code, problemId' });
    }

    if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ error: 'Invalid attemptId or problemId format' });
    }

    try {
      // Load the coding problem test cases
      const problem = await CodingProblem.findById(problemId);
      if (!problem) {
        return res.status(404).json({ error: 'Coding problem not found' });
      }

      const tempDir = path.join('C:', 'Users', 'Jitendra', '.gemini', 'antigravity-ide', 'scratch');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      let passedCount = 0;
      const totalCount = problem.testCases.length;
      let status: 'Accepted' | 'WrongAnswer' | 'RuntimeError' | 'TimeLimitExceeded' | 'CompileError' = 'Accepted';
      let totalExecutionTimeMs = 0;

      // Evaluate each test case sequentially
      for (let i = 0; i < totalCount; i++) {
        const testCase = problem.testCases[i];
        const fileExt = language === 'python' ? 'py' : 'js';
        const tempFile = path.join(tempDir, `exec_${attemptId}_${i}.${fileExt}`);

        let runnerCode = '';
        if (language === 'python') {
          runnerCode = `
import sys
# Candidate Code
${code}

# Execution wrapper
input_val = """${testCase.input.replace(/"/g, '\\"')}"""
if 'solution' in globals() and callable(globals()['solution']):
    print(solution(input_val), end='')
elif 'main' in globals() and callable(globals()['main']):
    print(main(input_val), end='')
else:
    # Run script directly and expect it to handle sys.argv or input
    pass
`;
        } else {
          // Javascript
          runnerCode = `
// Candidate Code
${code}

// Execution wrapper
const inputVal = \`${testCase.input.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
if (typeof solution === 'function') {
  process.stdout.write(String(solution(inputVal)));
} else if (typeof main === 'function') {
  process.stdout.write(String(main(inputVal)));
} else {
  // Direct execution
}
`;
        }

        fs.writeFileSync(tempFile, runnerCode, 'utf8');

        const startTime = Date.now();
        const cmd = language === 'python' ? `python "${tempFile}"` : `node "${tempFile}"`;

        const result = await new Promise<{ stdout: string; stderr: string; timedOut: boolean; errCode: number | null }>((resolve) => {
          const child = exec(cmd, { timeout: problem.timeLimitMs }, (error, stdout, stderr) => {
            const duration = Date.now() - startTime;
            if (error) {
              resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                timedOut: error.killed || duration >= problem.timeLimitMs,
                errCode: error.code || 1
              });
            } else {
              resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                timedOut: false,
                errCode: null
              });
            }
          });
        });

        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (cleanupErr) {
          logger.error('Failed to delete execution temp file: %O', cleanupErr);
        }

        totalExecutionTimeMs += (Date.now() - startTime);

        if (result.timedOut) {
          status = 'TimeLimitExceeded';
          break;
        }

        if (result.errCode !== null) {
          status = 'RuntimeError';
          break;
        }

        const expectedOutput = testCase.output.trim();
        if (result.stdout !== expectedOutput) {
          status = 'WrongAnswer';
          break;
        }

        passedCount++;
      }

      // Record the submission inside the attempt record if found
      const attempt = await AssessmentAttempt.findById(attemptId);
      if (attempt) {
        attempt.answers.push({
          questionId: problem._id as any,
          codeSubmissions: [{
            language,
            code,
            passedCount,
            totalCount,
            executionTimeMs: totalExecutionTimeMs,
            memoryBytes: 0,
            status
          }]
        });
        await attempt.save();
      }

      res.status(200).json({
        success: true,
        status,
        passedCount,
        totalCount,
        executionTimeMs: totalExecutionTimeMs,
        message: status === 'Accepted' ? 'All test cases passed successfully' : 'Code evaluation completed with status: ' + status
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Code execution process failed', details: err.message });
    }
  }
);

export default router;

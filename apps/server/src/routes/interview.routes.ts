import { Router } from 'express';
import mongoose from 'mongoose';
import { Interview } from '../models/Interview';
import { Candidate } from '../models/Candidate';
import { Job } from '../models/Job';
import { AIUsage } from '../models/AIUsage';
import { requireAuth } from '../middlewares/auth';
import { enforceTenancy } from '../middlewares/tenantMiddleware';
import { idempotency } from '../middlewares/idempotency';
import { auditEvent } from '../middlewares/audit';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

// Apply auth and tenancy globally
router.use(requireAuth, enforceTenancy);

// Helper to generate AI responses using OpenAI with a local fallback
async function generateAIResponse(
  messages: { role: 'assistant' | 'user' | 'system'; content: string }[],
  companyId: string
) {
  // If OpenAI API key is missing or is the default placeholder, fallback to the structured mock
  if (!config.openaiApiKey || config.openaiApiKey.startsWith('your_openai')) {
    return generateMockAIResponse(messages);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI response failed: ${response.status} - ${errText}`);
    }

    const data: any = await response.json();
    const reply = data.choices[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || 100;
    const cost = (tokens / 1000000) * 0.20; // estimate for gpt-4o-mini

    // Log the token consumption
    await AIUsage.create({
      companyId: new mongoose.Types.ObjectId(companyId),
      serviceUsed: 'InterviewAgent',
      tokensConsumed: tokens,
      costUsd: cost,
      fallbackModel: 'gpt-4o-mini'
    });

    return { reply, tokens, cost };
  } catch (err) {
    logger.warn('OpenAI request failed, triggering high-fidelity local fallback: %O', err);
    return generateMockAIResponse(messages);
  }
}

// Local mock interview question engine
function generateMockAIResponse(messages: { role: string; content: string }[]) {
  const userMessages = messages.filter(m => m.role === 'user');
  const turnCount = userMessages.length;

  let reply = '';
  if (turnCount === 0) {
    reply = "Welcome to the HireNova AI Recruitment interview! Could you start by introducing yourself, and sharing a summary of your technical experience?";
  } else if (turnCount === 1) {
    reply = "That is a great summary. As a follow-up, how do you ensure strict data isolation and security in a multi-tenant SaaS backend architecture?";
  } else if (turnCount === 2) {
    reply = "Excellent. In terms of caching and performance, what strategies or algorithms do you use to implement high-performance sliding-window rate limiters?";
  } else if (turnCount === 3) {
    reply = "Very clear. Finally, if you had to build a coding runner sandbox locally, what containerization and runtime isolation safeguards would you implement to prevent RCE?";
  } else {
    reply = "Thank you for sharing your expertise. That concludes our technical AI interview today. We will analyze your responses and get back to you shortly. Have a wonderful day!";
  }

  return {
    reply,
    tokens: 90,
    cost: 0.000018
  };
}

// Start AI Interview Session
router.post(
  '/start',
  idempotency(),
  auditEvent('INTERVIEW_START', 'Interview'),
  async (req: any, res) => {
    try {
      const companyId = req.companyId;
      const { candidateId, jobId } = req.body;

      if (!candidateId || !jobId) {
        return res.status(400).json({ error: 'candidateId and jobId are required parameters' });
      }

      if (!mongoose.Types.ObjectId.isValid(candidateId) || !mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ error: 'Invalid candidateId or jobId format' });
      }

      // Check candidate and job exist
      const candidate = await Candidate.findOne({ _id: candidateId, companyId: new mongoose.Types.ObjectId(companyId) });
      const job = await Job.findOne({ _id: jobId, companyId: new mongoose.Types.ObjectId(companyId) });

      if (!candidate || !job) {
        return res.status(404).json({ error: 'Candidate or Job not found under this tenant context' });
      }

      // Create new interview session
      const interview = await Interview.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        candidateId: new mongoose.Types.ObjectId(candidateId),
        jobId: new mongoose.Types.ObjectId(jobId),
        status: 'InProgress',
        messages: []
      });

      // Generate first question
      const systemPrompt = `You are HireNova's technical AI interviewer. You are interviewing candidate "${candidate.name}" for the job role "${job.title}". Keep your questions brief, highly technical, and professional. Ask one question at a time.`;
      
      const promptMessages: { role: 'assistant' | 'user' | 'system'; content: string }[] = [
        { role: 'system', content: systemPrompt }
      ];

      const aiResult = await generateAIResponse(promptMessages, companyId);
      
      interview.messages.push({
        role: 'system',
        content: systemPrompt,
        timestamp: new Date()
      });

      interview.messages.push({
        role: 'assistant',
        content: aiResult.reply,
        timestamp: new Date()
      });

      await interview.save();

      res.status(201).json({
        success: true,
        message: 'Interview session started',
        data: {
          interviewId: interview._id,
          firstQuestion: aiResult.reply
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to start interview', details: err.message });
    }
  }
);

// Submit response and get next question
router.post(
  '/:id/message',
  async (req: any, res) => {
    try {
      const companyId = req.companyId;
      const { id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'message property is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid interview ID format' });
      }

      const interview = await Interview.findOne({
        _id: id,
        companyId: new mongoose.Types.ObjectId(companyId)
      });

      if (!interview) {
        return res.status(404).json({ error: 'Interview session not found' });
      }

      if (interview.status === 'Completed') {
        return res.status(400).json({ error: 'This interview has already been completed' });
      }

      // Add user message
      interview.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Count candidate responses (turns)
      const turns = interview.messages.filter(m => m.role === 'user').length;

      let nextResponse = '';
      if (turns >= 4) {
        // Wrap up interview on the 4th turn
        nextResponse = "Thank you for sharing your expertise. That concludes our technical AI interview today. We will analyze your responses and get back to you shortly. Have a wonderful day!";
        interview.status = 'Completed';
      } else {
        // Query next AI question
        const promptMessages = interview.messages.map(m => ({
          role: m.role,
          content: m.content
        }));

        const aiResult = await generateAIResponse(promptMessages, companyId);
        nextResponse = aiResult.reply;
      }

      interview.messages.push({
        role: 'assistant',
        content: nextResponse,
        timestamp: new Date()
      });

      await interview.save();

      res.status(200).json({
        success: true,
        data: {
          reply: nextResponse,
          status: interview.status
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to process message', details: err.message });
    }
  }
);

export default router;

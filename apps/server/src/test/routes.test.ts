import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import http from 'http';
import mainRouter from '../routes';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';
import { Application } from '../models/Application';
import { MCQQuestion, CodingProblem } from '../models/Question';
import { AssessmentAttempt } from '../models/Assessment';
import { Interview } from '../models/Interview';
import { AIUsage } from '../models/AIUsage';
import { IdempotencyKey } from '../models/IdempotencyKey';

const app = express();
app.use(express.json());
app.use('/api/v1', mainRouter);

describe('HireNova Route Integration Tests', () => {
  let server: http.Server;
  let adminToken: string;
  let companyId: string;
  let jobId: string;
  let candidateId: string;
  let applicationId: string;
  let attemptId: string;
  let interviewId: string;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/hirenova_route_test';
    await mongoose.connect(mongoUri);

    // Build unique index constraints
    await Company.init();
    await User.init();
    await Job.init();
    await Candidate.init();
    await Application.init();
    await CodingProblem.init();
    await AssessmentAttempt.init();
    await Interview.init();

    server = app.listen(0);
  });

  afterAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.connection.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe('1. Authentication Routes', () => {
    it('should register a new company tenant and CompanyAdmin', async () => {
      const res = await request(server)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jitendra Admin',
          email: 'admin@hirenova.test',
          password: 'securePassword123',
          companyName: 'HireNova Corp',
          companySlug: 'hirenova-corp'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.company.slug).toBe('hirenova-corp');

      adminToken = res.body.data.token;
      companyId = res.body.data.company.id;
    });

    it('should login the registered admin user', async () => {
      const res = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@hirenova.test',
          password: 'securePassword123',
          companySlug: 'hirenova-corp'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('2. Job Management Routes', () => {
    it('should create a new job posting', async () => {
      const res = await request(server)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Full Stack Engineer',
          description: 'Looking for a Senior JS dev',
          type: 'Full-Time',
          location: 'Remote',
          department: 'Engineering',
          requirements: ['TypeScript', 'Node.js', 'React']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Full Stack Engineer');
      expect(res.body.data.companyId).toBe(companyId);

      jobId = res.body.data._id;
    });

    it('should list all jobs for this tenant', async () => {
      const res = await request(server)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('3. Candidate & ATS Pipeline Routes', () => {
    it('should create a candidate profile', async () => {
      const res = await request(server)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'John Doe',
          email: 'john.doe@test.com',
          phone: '+123456789',
          parsedData: {
            skills: ['TypeScript', 'Node.js'],
            experience: [],
            education: []
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('john.doe@test.com');

      candidateId = res.body.data._id;
    });

    it('should apply the candidate to the job', async () => {
      const res = await request(server)
        .post('/api/v1/candidates/applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          jobId,
          candidateId,
          resumeMatchScore: 85,
          evaluationNotes: 'Strong matches in TypeScript'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStage).toBe('Applied');

      applicationId = res.body.data._id;
    });

    it('should move the application stage', async () => {
      const res = await request(server)
        .put(`/api/v1/candidates/applications/${applicationId}/stage`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stage: 'Technical Assessment',
          status: 'Interviewing'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStage).toBe('Technical Assessment');
    });
  });

  describe('4. MCQ & Coding Problem Bank', () => {
    it('should create an MCQ question', async () => {
      const res = await request(server)
        .post('/api/v1/assessments/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'What is Node.js?',
          options: ['Browser runtime', 'Server-side runtime', 'Styling compiler', 'Database'],
          correctOptionIndex: 1,
          difficulty: 'Easy',
          category: 'NodeJS'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('NodeJS');
    });

    it('should query questions by category', async () => {
      const res = await request(server)
        .get('/api/v1/assessments/questions?category=NodeJS')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('5. Sandbox Code Execution Runner', () => {
    let problemId: string;

    beforeAll(async () => {
      // Create a coding problem and an attempt
      const problem = await CodingProblem.create({
        title: 'Add Two Numbers',
        slug: 'add-two-numbers',
        description: 'Write a function solution(input) that adds two comma-separated numbers.',
        difficulty: 'Easy',
        starterCode: [{ language: 'javascript', code: 'function solution(input) { }' }],
        testCases: [
          { input: '3,5', output: '8', isHidden: false },
          { input: '10,20', output: '30', isHidden: true }
        ],
        timeLimitMs: 2000,
        memoryLimitKb: 51200,
        companyId: new mongoose.Types.ObjectId(companyId)
      });

      problemId = problem._id.toString();

      const attempt = await AssessmentAttempt.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        assessmentId: new mongoose.Types.ObjectId(),
        applicationId: new mongoose.Types.ObjectId(applicationId),
        candidateId: new mongoose.Types.ObjectId(candidateId),
        status: 'InProgress'
      });

      attemptId = attempt._id.toString();
    });

    it('should execute candidate code successfully and pass tests', async () => {
      const code = `
        function solution(input) {
          const [a, b] = input.split(',').map(Number);
          return a + b;
        }
      `;

      const res = await request(server)
        .post(`/api/v1/assessments/attempts/${attemptId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          language: 'javascript',
          code,
          problemId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('Accepted');
      expect(res.body.passedCount).toBe(2);
    });

    it('should fail with WrongAnswer on incorrect code', async () => {
      const code = `
        function solution(input) {
          return 999;
        }
      `;

      const res = await request(server)
        .post(`/api/v1/assessments/attempts/${attemptId}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          language: 'javascript',
          code,
          problemId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('WrongAnswer');
      expect(res.body.passedCount).toBe(0);
    });
  });

  describe('6. AI Interview & LLM RAG', () => {
    it('should start an AI interview session', async () => {
      const res = await request(server)
        .post('/api/v1/interviews/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          candidateId,
          jobId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.interviewId).toBeDefined();
      expect(res.body.data.firstQuestion).toBeDefined();

      interviewId = res.body.data.interviewId;
    });

    it('should process chat messages and return next response', async () => {
      const res = await request(server)
        .post(`/api/v1/interviews/${interviewId}/message`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'My name is John Doe and I have 5 years experience with Node.js and TypeScript.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();
      expect(res.body.data.status).toBe('InProgress');
    });
  });
});

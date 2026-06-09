import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import http from 'http';
import { enforceTenancy } from '../middlewares/tenantMiddleware';
import { auditEvent } from '../middlewares/audit';
import { idempotency } from '../middlewares/idempotency';
import { AuditLog } from '../models/Audit';
import { IdempotencyKey } from '../models/IdempotencyKey';

const app = express();
app.use(express.json());

// Mock Auth injection for testing tenancy
app.use((req: any, res, next) => {
  if (req.headers['mock-user-id']) {
    req.user = {
      userId: req.headers['mock-user-id'],
      companyId: req.headers['mock-company-id'],
      role: 'recruiter',
      permissions: ['jobs:create']
    };
  }
  next();
});

// Register routes
app.get('/test-tenancy', enforceTenancy, (req: any, res) => {
  res.status(200).json({ companyId: req.companyId });
});

app.post('/test-idempotent-audit', idempotency(), auditEvent('TEST_CREATE', 'TestEntity'), (req, res) => {
  const { value } = req.body;
  res.status(201).json({ success: true, echoedValue: value });
});

describe('Middlewares Integration Tests', () => {
  let server: http.Server;

  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/hirenova_test';
    await mongoose.connect(mongoUri);
    
    // Explicitly create the unique index synchronously on the collection to guarantee uniqueness
    await IdempotencyKey.collection.createIndex({ key: 1 }, { unique: true });
    
    // Force index builds to ensure other constraints are active
    await IdempotencyKey.init();
    await AuditLog.init();
    server = app.listen(0);
  });

  afterAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.connection.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(async () => {
    await AuditLog.deleteMany({});
    await IdempotencyKey.deleteMany({});
  });

  describe('enforceTenancy middleware', () => {
    it('should return 401 when tenant context is missing', async () => {
      const res = await request(server).get('/test-tenancy');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should populate companyId when tenant context exists in token', async () => {
      const mockCompanyId = new mongoose.Types.ObjectId().toString();
      const res = await request(server)
        .get('/test-tenancy')
        .set('mock-user-id', 'user123')
        .set('mock-company-id', mockCompanyId);
      
      expect(res.status).toBe(200);
      expect(res.body.companyId).toBe(mockCompanyId);
    });
  });

  describe('auditEvent middleware', () => {
    it('should log audit record on successful request', async () => {
      const mockCompanyId = new mongoose.Types.ObjectId().toString();
      const mockUserId = new mongoose.Types.ObjectId().toString();

      const res = await request(server)
        .post('/test-idempotent-audit')
        .set('mock-user-id', mockUserId)
        .set('mock-company-id', mockCompanyId)
        .send({ value: 'hello' });

      expect(res.status).toBe(201);
      expect(res.body.echoedValue).toBe('hello');

      // Wait briefly for async audit creation
      await new Promise((resolve) => setTimeout(resolve, 200));

      const audits = await AuditLog.find({});
      expect(audits.length).toBe(1);
      expect(audits[0].action).toBe('TEST_CREATE');
      expect(audits[0].entityName).toBe('TestEntity');
      expect(audits[0].companyId?.toString()).toBe(mockCompanyId);
      expect(audits[0].userId?.toString()).toBe(mockUserId);
    });

    it('should not log audit record on failed request (status >= 400)', async () => {
      app.post('/test-fail', auditEvent('FAIL_ACTION', 'FailEntity'), (req, res) => {
        res.status(400).json({ error: 'failed' });
      });

      const res = await request(server)
        .post('/test-fail')
        .send({});

      expect(res.status).toBe(400);

      await new Promise((resolve) => setTimeout(resolve, 200));
      const audits = await AuditLog.find({ action: 'FAIL_ACTION' });
      expect(audits.length).toBe(0);
    });
  });

  describe('idempotency middleware', () => {
    it('should allow first request to proceed and cache it', async () => {
      const key = 'idemp-key-1';
      const mockCompanyId = new mongoose.Types.ObjectId().toString();
      const mockUserId = new mongoose.Types.ObjectId().toString();

      const res1 = await request(server)
        .post('/test-idempotent-audit')
        .set('idempotency-key', key)
        .set('mock-user-id', mockUserId)
        .set('mock-company-id', mockCompanyId)
        .send({ value: 'foo' });

      expect(res1.status).toBe(201);
      expect(res1.body.echoedValue).toBe('foo');

      // Subsequent request with same key returns cached result
      const res2 = await request(server)
        .post('/test-idempotent-audit')
        .set('idempotency-key', key)
        .set('mock-user-id', mockUserId)
        .set('mock-company-id', mockCompanyId)
        .send({ value: 'bar' });

      expect(res2.status).toBe(201);
      expect(res2.body.echoedValue).toBe('foo');
    });

    it('should return 409 conflict when duplicate request is in-flight', async () => {
      const key = 'idemp-key-2';
      const mockCompanyId = new mongoose.Types.ObjectId().toString();
      const mockUserId = new mongoose.Types.ObjectId().toString();

      app.post('/test-slow', idempotency(), (req, res) => {
        setTimeout(() => {
          res.status(200).json({ done: true });
        }, 150);
      });

      const address = server.address();
      const port = (address as any).port;
      const url = `http://127.0.0.1:${port}/test-slow`;

      // Fire the first request concurrently
      const p1 = fetch(url, {
        method: 'POST',
        headers: {
          'idempotency-key': key,
          'mock-user-id': mockUserId,
          'mock-company-id': mockCompanyId
        }
      });

      // Let first request start execution and write in-flight lock to DB
      await new Promise((resolve) => setTimeout(resolve, 30));

      // Fire concurrent second request
      const res2 = await fetch(url, {
        method: 'POST',
        headers: {
          'idempotency-key': key,
          'mock-user-id': mockUserId,
          'mock-company-id': mockCompanyId
        }
      });

      expect(res2.status).toBe(409);
      const res2Body: any = await res2.json();
      expect(res2Body.code).toBe('IDEMPOTENCY_CONFLICT');

      const res1 = await p1;
      expect(res1.status).toBe(200);
    });
  });
});

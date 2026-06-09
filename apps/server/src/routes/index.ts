import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { enforceTenancy } from '../middlewares/tenantMiddleware';
import { requirePermissions } from '../middlewares/rbac';
import { generateAccessToken } from '../utils/jwt';
import { idempotency } from '../middlewares/idempotency';
import { auditEvent } from '../middlewares/audit';
import { AssessmentIntegrityLog } from '../models';
import mongoose from 'mongoose';

const router = Router();

// Global health endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'online', service: 'HireNova v1 API core' });
});

// Mock Auth endpoint to generate token for local development testing
router.post('/auth/mock-token', (req, res) => {
  const { userId, companyId, role, permissions } = req.body;
  
  if (!userId || !companyId || !role) {
    return res.status(400).json({ error: 'Missing mock payload properties (userId, companyId, role)' });
  }

  const token = generateAccessToken({ userId, companyId, role, permissions: permissions || [] });

  res.status(200).json({ success: true, token });
});

// Assessment integrity route protected by idempotency and audit middlewares
router.post(
  '/assessments/attempts/:attemptId/integrity',
  idempotency(),
  auditEvent('RECORD_INTEGRITY_VIOLATION', 'AssessmentIntegrityLog'),
  async (req, res) => {
    try {
      const { attemptId } = req.params;
      const { candidateId, eventType, riskScore, details } = req.body;

      if (!candidateId || !eventType || riskScore === undefined) {
        return res.status(400).json({
          error: 'Missing required payload parameters: candidateId, eventType, riskScore'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(candidateId) || !mongoose.Types.ObjectId.isValid(attemptId)) {
        return res.status(400).json({
          error: 'Invalid candidateId or attemptId format'
        });
      }

      const logEntry = await AssessmentIntegrityLog.create({
        candidateId: new mongoose.Types.ObjectId(candidateId),
        attemptId: new mongoose.Types.ObjectId(attemptId),
        eventType,
        riskScore,
        details
      });

      res.status(201).json({
        success: true,
        message: 'Assessment integrity log recorded successfully',
        data: logEntry
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to record assessment integrity log',
        details: err.message
      });
    }
  }
);

// Sample protected routes to test RLS & RBAC tenancy
router.get('/test-tenancy', requireAuth, enforceTenancy, (req: any, res) => {
  res.status(200).json({
    message: 'Authorized successfully',
    resolvedTenant: req.companyId,
    resolvedUser: req.user
  });
});

router.get('/test-rbac', requireAuth, requirePermissions('jobs:create'), (req: any, res) => {
  res.status(200).json({
    message: 'Access granted. Permitted action node found.',
    resolvedUser: req.user
  });
});

export default router;

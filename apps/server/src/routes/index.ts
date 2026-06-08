import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { enforceTenancy } from '../middlewares/tenantMiddleware';
import { requirePermissions } from '../middlewares/rbac';

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

  // Use local signing function
  const { generateAccessToken } = require('../utils/jwt');
  const token = generateAccessToken({ userId, companyId, role, permissions: permissions || [] });

  res.status(200).json({ success: true, token });
});

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

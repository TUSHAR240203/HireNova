import { Router } from 'express';
import mongoose from 'mongoose';
import { AuditLog } from '../models/Audit';
import { AIUsage } from '../models/AIUsage';
import { requireAuth } from '../middlewares/auth';
import { enforceTenancy } from '../middlewares/tenantMiddleware';

const router = Router();

// Require authentication and multi-tenant isolation
router.use(requireAuth, enforceTenancy);

// Fetch audit logs (up to 100 recent entries)
router.get('/', async (req: any, res) => {
  try {
    const companyId = req.companyId;
    const logs = await AuditLog.find({ companyId: new mongoose.Types.ObjectId(companyId) })
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
  }
});

// Fetch AI consumption usage logs (up to 100 recent entries)
router.get('/ai-usage', async (req: any, res) => {
  try {
    const companyId = req.companyId;
    const usage = await AIUsage.find({ companyId: new mongoose.Types.ObjectId(companyId) })
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: usage
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch AI usage logs', details: err.message });
  }
});

export default router;

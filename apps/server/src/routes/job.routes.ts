import { Router } from 'express';
import mongoose from 'mongoose';
import { Job } from '../models/Job';
import { requireAuth } from '../middlewares/auth';
import { enforceTenancy } from '../middlewares/tenantMiddleware';
import { idempotency } from '../middlewares/idempotency';
import { auditEvent } from '../middlewares/audit';

const router = Router();

// Apply auth and tenancy globally for all job routes
router.use(requireAuth, enforceTenancy);

// Create a Job
router.post(
  '/',
  idempotency(),
  auditEvent('JOB_CREATE', 'Job'),
  async (req: any, res) => {
    try {
      const { title, description, status, department, location, type, requirements, pipelineStages } = req.body;
      const companyId = req.companyId;

      if (!title || !description || !type) {
        return res.status(400).json({ error: 'Missing required fields: title, description, type' });
      }

      const job = await Job.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        title,
        description,
        status: status || 'Draft',
        department,
        location,
        type,
        requirements: requirements || [],
        pipelineStages,
        createdBy: new mongoose.Types.ObjectId(req.user.userId)
      });

      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: job
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create job', details: err.message });
    }
  }
);

// List all Jobs with multi-tenant isolation
router.get('/', async (req: any, res) => {
  try {
    const companyId = req.companyId;
    const { status, search, department } = req.query;

    const query: any = { companyId: new mongoose.Types.ObjectId(companyId) };
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$text = { $search: search };
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: jobs
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch jobs', details: err.message });
  }
});

// Fetch single Job details
router.get('/:id', async (req: any, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Job ID format' });
    }

    const job = await Job.findOne({ _id: id, companyId: new mongoose.Types.ObjectId(companyId) });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch job', details: err.message });
  }
});

// Update Job specs
router.put(
  '/:id',
  idempotency(),
  auditEvent('JOB_UPDATE', 'Job'),
  async (req: any, res) => {
    try {
      const companyId = req.companyId;
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid Job ID format' });
      }

      updateData.updatedBy = new mongoose.Types.ObjectId(req.user.userId);

      const job = await Job.findOneAndUpdate(
        { _id: id, companyId: new mongoose.Types.ObjectId(companyId) },
        updateData,
        { new: true, runValidators: true }
      );

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Job updated successfully',
        data: job
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update job', details: err.message });
    }
  }
);

// Delete Job
router.delete(
  '/:id',
  auditEvent('JOB_DELETE', 'Job'),
  async (req: any, res) => {
    try {
      const companyId = req.companyId;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid Job ID format' });
      }

      const job = await Job.findOneAndDelete({ _id: id, companyId: new mongoose.Types.ObjectId(companyId) });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Job deleted successfully',
        data: { id: job._id }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete job', details: err.message });
    }
  }
);

export default router;

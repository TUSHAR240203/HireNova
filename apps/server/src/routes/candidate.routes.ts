import { Router } from 'express';
import mongoose from 'mongoose';
import { Candidate } from '../models/Candidate';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { requireAuth } from '../middlewares/auth';
import { enforceTenancy } from '../middlewares/tenantMiddleware';
import { idempotency } from '../middlewares/idempotency';
import { auditEvent } from '../middlewares/audit';

const router = Router();

// Apply auth and tenancy globally
router.use(requireAuth, enforceTenancy);

// Create a Candidate
router.post(
  '/',
  idempotency(),
  auditEvent('CANDIDATE_CREATE', 'Candidate'),
  async (req: any, res) => {
    try {
      const companyId = req.companyId;
      const { name, email, phone, resumeUrl, parsedData, talentPool } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required properties' });
      }

      const existingCandidate = await Candidate.findOne({ companyId: new mongoose.Types.ObjectId(companyId), email: email.toLowerCase().trim() });
      if (existingCandidate) {
        return res.status(400).json({ error: 'Candidate with this email already exists in this tenant context.' });
      }

      const candidate = await Candidate.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        name,
        email: email.toLowerCase().trim(),
        phone,
        resumeUrl,
        parsedData: parsedData || { skills: [], experience: [], education: [] },
        talentPool: talentPool || false
      });

      res.status(201).json({
        success: true,
        message: 'Candidate profile registered successfully',
        data: candidate
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create candidate', details: err.message });
    }
  }
);

// Bulk Upload Candidates
router.post(
  '/bulk-upload',
  idempotency(),
  auditEvent('CANDIDATES_BULK_UPLOAD', 'Candidate'),
  async (req: any, res) => {
    try {
      const companyId = req.companyId;
      const { candidates } = req.body;

      if (!candidates || !Array.isArray(candidates)) {
        return res.status(400).json({ error: 'Candidates must be an array of profiles' });
      }

      const createdCandidates = [];
      for (const item of candidates) {
        if (!item.name || !item.email) continue;
        
        const exists = await Candidate.findOne({ companyId: new mongoose.Types.ObjectId(companyId), email: item.email.toLowerCase().trim() });
        if (exists) continue;

        const candidate = await Candidate.create({
          companyId: new mongoose.Types.ObjectId(companyId),
          name: item.name,
          email: item.email.toLowerCase().trim(),
          phone: item.phone,
          resumeUrl: item.resumeUrl,
          parsedData: item.parsedData || { skills: [], experience: [], education: [] },
          talentPool: item.talentPool || false
        });
        createdCandidates.push(candidate);
      }

      res.status(201).json({
        success: true,
        message: `Successfully uploaded ${createdCandidates.length} candidates`,
        data: createdCandidates
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed bulk uploading candidates', details: err.message });
    }
  }
);

// Create Application
router.post(
  '/applications',
  idempotency(),
  auditEvent('APPLICATION_CREATE', 'Application'),
  async (req: any, res) => {
    try {
      const companyId = req.companyId;
      const { jobId, candidateId, resumeMatchScore, evaluationNotes } = req.body;

      if (!jobId || !candidateId) {
        return res.status(400).json({ error: 'jobId and candidateId are required' });
      }

      if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
        return res.status(400).json({ error: 'Invalid jobId or candidateId format' });
      }

      const job = await Job.findOne({ _id: jobId, companyId: new mongoose.Types.ObjectId(companyId) });
      if (!job) {
        return res.status(404).json({ error: 'Job not found under this tenant context' });
      }

      const candidate = await Candidate.findOne({ _id: candidateId, companyId: new mongoose.Types.ObjectId(companyId) });
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found under this tenant context' });
      }

      const existingApplication = await Application.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        jobId: new mongoose.Types.ObjectId(jobId),
        candidateId: new mongoose.Types.ObjectId(candidateId)
      });

      if (existingApplication) {
        return res.status(400).json({ error: 'Candidate has already applied to this job' });
      }

      const initialStage = job.pipelineStages[0]?.name || 'Applied';

      const application = await Application.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        jobId: new mongoose.Types.ObjectId(jobId),
        candidateId: new mongoose.Types.ObjectId(candidateId),
        currentStage: initialStage,
        status: 'Applied',
        resumeMatchScore: resumeMatchScore || 0,
        evaluationNotes,
        timeline: [{
          stage: initialStage,
          status: 'Applied',
          updatedAt: new Date(),
          updatedBy: new mongoose.Types.ObjectId(req.user.userId) as any
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Application created successfully',
        data: application
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to apply candidate', details: err.message });
    }
  }
);

// Update Application Stage
router.put(
  '/applications/:id/stage',
  auditEvent('APPLICATION_STAGE_UPDATE', 'Application'),
  async (req: any, res) => {
    try {
      const companyId = req.companyId;
      const { id } = req.params;
      const { stage, status } = req.body;

      if (!stage) {
        return res.status(400).json({ error: 'stage parameter is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid application ID format' });
      }

      const application = await Application.findOne({
        _id: id,
        companyId: new mongoose.Types.ObjectId(companyId)
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      application.currentStage = stage;
      if (status) {
        application.status = status;
      }
      application.timeline.push({
        stage,
        status: status || application.status,
        updatedAt: new Date(),
        updatedBy: new mongoose.Types.ObjectId(req.user.userId) as any
      });

      await application.save();

      res.status(200).json({
        success: true,
        message: 'Application stage updated successfully',
        data: application
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update application stage', details: err.message });
    }
  }
);

// Get all Applications (scoped to tenant)
router.get('/applications', async (req: any, res) => {
  try {
    const companyId = req.companyId;
    const { jobId, status } = req.query;

    const query: any = { companyId: new mongoose.Types.ObjectId(companyId) };
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      query.jobId = new mongoose.Types.ObjectId(jobId);
    }
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('jobId', 'title status')
      .populate('candidateId', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch applications', details: err.message });
  }
});

// Fetch all candidates for the current company tenant
router.get('/', async (req: any, res) => {
  try {
    const companyId = req.companyId;
    const candidates = await Candidate.find({ companyId: new mongoose.Types.ObjectId(companyId) }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: candidates
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch candidates', details: err.message });
  }
});

export default router;

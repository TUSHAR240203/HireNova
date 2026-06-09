import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const router = Router();

// Tenant registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, companyName, companySlug } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ error: 'Missing required registration properties' });
    }

    // Resolve or generate company slug
    const resolvedSlug = (companySlug || companyName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if company slug already exists
    const existingCompany = await Company.findOne({ slug: resolvedSlug });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company slug is already taken. Please specify a unique slug.' });
    }

    // Create Company
    const company = await Company.create({
      name: companyName,
      slug: resolvedSlug,
      tier: 'Starter',
      isActive: true
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User as CompanyAdmin
    const user = await User.create({
      companyId: company._id,
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'CompanyAdmin',
      mfaEnabled: false
    });

    const jwtPayload = {
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      companyId: (company._id as mongoose.Types.ObjectId).toString(),
      role: user.role,
      permissions: ['jobs:create', 'jobs:read', 'jobs:update', 'jobs:delete', 'candidates:upload', 'assessments:manage']
    };

    const token = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    res.status(201).json({
      success: true,
      message: 'Company tenant and admin user registered successfully',
      data: {
        token,
        refreshToken,
        company: { id: company._id, name: company.name, slug: company.slug },
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, companySlug } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    if (companySlug) {
      const company = await Company.findOne({ slug: companySlug.toLowerCase().trim() });
      if (!company) {
        return res.status(401).json({ error: 'Invalid credentials or company slug' });
      }
      user = await User.findOne({ companyId: company._id, email: email.toLowerCase().trim() });
    } else {
      // Fallback: search globally if slug is not specified
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const company = await Company.findById(user.companyId);
    if (!company || !company.isActive) {
      return res.status(401).json({ error: 'Company tenant is inactive or invalid' });
    }

    // Set permission matrix mapping based on user role
    const permissions =
      user.role === 'CompanyAdmin'
        ? ['jobs:create', 'jobs:read', 'jobs:update', 'jobs:delete', 'candidates:upload', 'assessments:manage']
        : ['jobs:read', 'candidates:read'];

    const jwtPayload = {
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      companyId: (company._id as mongoose.Types.ObjectId).toString(),
      role: user.role,
      permissions
    };

    const token = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        refreshToken,
        company: { id: company._id, name: company.name, slug: company.slug },
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

export default router;

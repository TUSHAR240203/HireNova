import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // In production, replace with specific tenant custom domains or whitelist
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));

// Parse request bodies
app.use(express.json());

// Global Logging middleware
app.use((req, res, next) => {
  console.log(`[Request Triggered]: ${req.method} ${req.path} - Origin: ${req.ip}`);
  next();
});

// Central Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mock route to trigger validation error check
app.get('/test-error', (req, res, next) => {
  const err: any = new Error('Database operational connection failed');
  err.statusCode = 503;
  err.code = 'DB_CONN_TIMEOUT';
  next(err);
});

// Error handling middleware
app.use(errorHandler);

// Boot Express Server
app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🚀 HireNova Server active on Port ${config.port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});

export default app;

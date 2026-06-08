import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { logger } from './utils/logger';

import apiRouter from './routes';

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // In production, replace with specific tenant custom domains or whitelist
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'idempotency-key']
}));

// Parse request bodies
app.use(express.json());

// Apply global rate limiting middleware (100 requests per minute)
app.use(rateLimiter({ windowMs: 60 * 1000, max: 100 }));

// HTTP Request logging mapped via Winston
app.use((req, res, next) => {
  logger.info(`HTTP Request: ${req.method} ${req.path} - Client IP: ${req.ip}`);
  next();
});

// Wire central API routing endpoints under version namespaces
app.use('/api/v1', apiRouter);

// Error handling middleware
app.use(errorHandler);

// Boot Express Server
app.listen(config.port, () => {
  logger.info(`🚀 HireNova Server active on Port ${config.port}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

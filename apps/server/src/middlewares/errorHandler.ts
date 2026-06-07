import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error Context]: ${err.stack || err.message}`);

  // Handle Schema Validation failures
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Failed',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle Operational errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR'
  });
}

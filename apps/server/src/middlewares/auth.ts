import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { TenantRequest } from './tenantMiddleware';

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenantReq = req as TenantRequest;
  const authHeader = tenantReq.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. Missing authorization header.',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    tenantReq.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      error: 'Invalid authorization token.',
      code: 'INVALID_TOKEN'
    });
  }
}

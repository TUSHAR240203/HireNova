import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../utils/redis';
import { TenantRequest } from './tenantMiddleware';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantReq = req as TenantRequest;
    // Determine limit identifier: user identifier (if logged in) or client IP
    const identifier = tenantReq.user?.userId || tenantReq.ip || 'anonymous';
    const key = `ratelimit:${tenantReq.method}:${tenantReq.path}:${identifier}`;
    
    const now = Date.now();
    const clearBefore = now - options.windowMs;

    try {
      // Execute Redis transaction using sliding-window pattern
      const multi = redisClient.multi();
      multi.zRemRangeByScore(key, 0, clearBefore);
      multi.zAdd(key, { score: now, value: now.toString() });
      multi.zCard(key);
      multi.expire(key, Math.ceil(options.windowMs / 1000));

      const results = await multi.exec();
      
      // The third execution item card (zCard) returns actual hit count
      const currentRequestCount = results[2] as number;

      if (currentRequestCount > options.max) {
        logger.warn(`Rate limit triggered for key: ${key}. Count: ${currentRequestCount}/${options.max}`);
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      next();
    } catch (err) {
      logger.error('Rate Limiter execution failed: %O', err);
      // Fallback: Proceed on rate limiter failure to maintain API availability
      next();
    }
  };
}

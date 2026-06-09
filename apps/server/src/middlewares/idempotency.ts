import { Request, Response, NextFunction } from 'express';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { logger } from '../utils/logger';

export function idempotency() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check idempotency for mutating requests only
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const key = req.headers['idempotency-key'] as string;
    if (!key) {
      return next();
    }

    const inFlightExpiry = new Date(Date.now() + 60 * 1000); // 1 minute lock
    const completedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours retention

    try {
      // Insert in-flight placeholder status 102 (Processing) to lock concurrent double-submits
      await IdempotencyKey.create({
        key,
        responseStatus: 102,
        responseBody: { message: 'Request in progress' },
        expiresAt: inFlightExpiry
      });
    } catch (err: any) {
      if (err.code === 11000) {
        // Unique key constraint violated: a request with this key already exists
        try {
          const existingRecord = await IdempotencyKey.findOne({ key });
          if (existingRecord) {
            if (existingRecord.responseStatus === 102) {
              return res.status(409).json({
                error: 'A request with this idempotency key is already in progress.',
                code: 'IDEMPOTENCY_CONFLICT'
              });
            }
            return res
              .status(existingRecord.responseStatus)
              .json(existingRecord.responseBody);
          }
        } catch (findErr) {
          logger.error('Failed to retrieve existing idempotency key: %O', findErr);
          return res.status(500).json({ error: 'Internal server error resolving idempotency key' });
        }
      } else {
        logger.error('Failed to write idempotency key placeholder: %O', err);
        return next();
      }
    }

    // Intercept response to record status and payload
    const originalJson = res.json;
    res.json = function (body: any): Response {
      res.json = originalJson;

      if (res.statusCode < 500) {
        // Cache successful and client-side error responses (e.g. 2xx, 4xx)
        IdempotencyKey.findOneAndUpdate(
          { key },
          {
            responseStatus: res.statusCode,
            responseBody: body,
            expiresAt: completedExpiry
          }
        ).catch((updateErr) => {
          logger.error('Failed to update idempotency key cache: %O', updateErr);
        });
      } else {
        // Delete key on server errors to allow immediate retry
        IdempotencyKey.deleteOne({ key }).catch((deleteErr) => {
          logger.error('Failed to clean up failed idempotency key: %O', deleteErr);
        });
      }

      return originalJson.call(res, body);
    };

    next();
  };
}

import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/Audit';
import { TenantRequest } from './tenantMiddleware';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export function auditEvent(action: string, entityName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantReq = req as TenantRequest;
    const originalJson = res.json;

    res.json = function (body: any): Response {
      // Restore original json method to avoid loops
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log auditing details asynchronously so response isn't blocked
        Promise.resolve().then(async () => {
          try {
            const companyId = tenantReq.companyId || tenantReq.user?.companyId;
            const userId = tenantReq.user?.userId;

            // Resolve entityId from route parameters or response payload data
            const entityIdStr =
              req.params.id ||
              req.params.attemptId ||
              (body && body.data && (body.data._id || body.data.id));

            let entityId: mongoose.Types.ObjectId;
            if (entityIdStr && mongoose.Types.ObjectId.isValid(entityIdStr)) {
              entityId = new mongoose.Types.ObjectId(entityIdStr);
            } else {
              entityId = new mongoose.Types.ObjectId();
            }

            await AuditLog.create({
              companyId: companyId ? new mongoose.Types.ObjectId(companyId) : undefined,
              userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
              action,
              entityName,
              entityId,
              ipAddress: req.ip || req.socket.remoteAddress,
              userAgent: req.headers['user-agent'],
              timestamp: new Date()
            });
          } catch (auditErr) {
            logger.error('Failed to create audit log entry: %O', auditErr);
          }
        });
      }

      return originalJson.call(res, body);
    };

    next();
  };
}

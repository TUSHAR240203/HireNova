import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from './tenantMiddleware';

/**
 * Enforces role-based permissions on user session.
 * SuperAdmin is authorized by default.
 */
export function requirePermissions(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantReq = req as TenantRequest;
    const user = tenantReq.user;

    if (!user) {
      return res.status(401).json({
        error: 'Authentication context missing.',
        code: 'AUTH_REQUIRED'
      });
    }

    // SuperAdmin bypasses all permission constraints
    if (user.role === 'SuperAdmin') {
      return next();
    }

    // Verify user owns at least one of the target permission nodes
    const hasPermission = requiredPermissions.every(perm => 
      user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden. You do not have permissions to access this resource.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
}

/**
 * Enforces role membership on user session.
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantReq = req as TenantRequest;
    const user = tenantReq.user;

    if (!user) {
      return res.status(401).json({
        error: 'Authentication context missing.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (user.role === 'SuperAdmin') {
      return next();
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: 'Forbidden. Access restricted for your role profile.',
        code: 'ROLE_RESTRICTED'
      });
    }

    next();
  };
}

import { Request, Response, NextFunction } from 'express';

export function enforceTenancy(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenantReq = req as TenantRequest;
  // Extract tenant identity exclusively from cryptographically verified token payload
  const companyId = tenantReq.user?.companyId;

  if (!companyId) {
    return res.status(401).json({
      error: 'Unauthorized. Tenant context could not be resolved from session.'
    });
  }

  // Bind tenant identifier for repository query layers
  tenantReq.companyId = companyId;
  next();
}
export interface TenantRequest extends Request {
  user?: {
    userId: string;
    companyId: string;
    role: string;
    permissions: string[];
  };
  companyId?: string;
}

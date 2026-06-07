import { Request, Response, NextFunction } from 'express';

export function enforceTenancy(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  // Extract tenant identity exclusively from cryptographically verified token payload
  const companyId = req.user?.companyId;

  if (!companyId) {
    return res.status(401).json({
      error: 'Unauthorized. Tenant context could not be resolved from session.'
    });
  }

  // Bind tenant identifier for repository query layers
  req.companyId = companyId;
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

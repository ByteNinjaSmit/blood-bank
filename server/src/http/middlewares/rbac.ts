// Role-based + permission-based access control middleware.
//
// Usage in a router:
//   router.post(
//     '/units/:id/release',
//     authenticate,
//     requireRole(['bbo', 'lab-tech-serology']),
//     requirePermission('unit:release'),
//     controller.release,
//   );

import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors';
import type { Permission, Role } from '@/shared/enums';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  permissions: ReadonlyArray<Permission>;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
    id?: string;
  }
}

export function requireRole(allowed: ReadonlyArray<Role>) {
  const set = new Set<Role>(allowed);
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!set.has(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' cannot access this resource`));
    }
    next();
  };
}

export function requirePermission(needed: Permission | ReadonlyArray<Permission>) {
  const list: ReadonlyArray<Permission> = Array.isArray(needed) ? needed : [needed];
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    const have = new Set<Permission>(req.user.permissions);
    const missing = list.filter((p) => !have.has(p));
    if (missing.length > 0) {
      return next(new ForbiddenError(`Missing permission(s): ${missing.join(', ')}`));
    }
    next();
  };
}

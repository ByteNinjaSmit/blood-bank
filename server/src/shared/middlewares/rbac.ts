// Permission-based access control middleware. `role` is a free-text
// display label only (see user.model.ts) — it carries no authorization
// weight; requirePermission(...) + the per-user permission grid (see
// role-map.ts) are the sole source of truth for what a user can do.
//
// Usage in a router:
//   router.post(
//     '/units/:id/release',
//     authenticate,
//     requirePermission('unit:release'),
//     controller.release,
//   );

import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors';
import type { Permission } from '@/shared/enums';

export interface AuthenticatedUser {
  id: string;
  role: string;
  // Bypasses every requirePermission(...) check — the sole mechanism for
  // "this account has unconditional full access" (see
  // server/CLAUDE.md / role-map.ts projectPermissions()), decoupled from
  // the free-text role label.
  isFullAccess: boolean;
  permissions: ReadonlyArray<Permission>;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
    id?: string;
  }
}

export function requirePermission(needed: Permission | ReadonlyArray<Permission>) {
  const list: ReadonlyArray<Permission> = Array.isArray(needed) ? needed : [needed];
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (req.user.isFullAccess) return next();
    const have = new Set<Permission>(req.user.permissions);
    const missing = list.filter((p) => !have.has(p));
    if (missing.length > 0) {
      return next(new ForbiddenError(`Missing permission(s): ${missing.join(', ')}`));
    }
    next();
  };
}

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/shared/errors';
import { env } from '@/core/config/env';
import { mapLegacyRole, projectPermissions } from '@/shared/role-map';
import type { AuthenticatedUser } from './rbac';
import { UserModel } from '@/modules/user/user.model';

interface LegacyJwtPayload {
  userID: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header) return next(new UnauthorizedError('Token not provided'));

  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return next(new UnauthorizedError('Token not provided'));

  let payload: LegacyJwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET_KEY) as LegacyJwtPayload;
  } catch {
    return next(new UnauthorizedError('Invalid token'));
  }

  let userDoc: unknown;
  try {
    userDoc = await UserModel.findById(payload.userID).lean();
  } catch {
    return next(new UnauthorizedError('User lookup failed'));
  }
  if (!userDoc) return next(new UnauthorizedError('User not found'));

  const legacyUser = userDoc as {
    _id: { toString(): string };
    role: string;
    permissions?: Array<{
      moduleName: string;
      view?: boolean;
      create?: boolean;
      update?: boolean;
      delete?: boolean;
    }>;
    status?: string;
  };

  if (legacyUser.status === 'blocked' || legacyUser.status === 'rejected') {
    return next(new UnauthorizedError('User is not active'));
  }

  const newRole = mapLegacyRole(legacyUser.role);
  const permissions = projectPermissions(newRole, legacyUser.permissions ?? []);

  const user: AuthenticatedUser = {
    id: legacyUser._id.toString(),
    role: newRole,
    permissions,
  };
  req.user = user;
  next();
}

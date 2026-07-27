import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/shared/errors';
import { env } from '@/core/config/env';
import { resolveRole, projectPermissions } from '@/shared/role-map';
import type { AuthenticatedUser } from './rbac';
import { UserModel } from '@/modules/user/user.model';

interface JwtPayload {
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

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET_KEY) as JwtPayload;
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }

  let userDoc: unknown;
  try {
    userDoc = await UserModel.findById(payload.userID).lean();
  } catch {
    return next(new UnauthorizedError('User lookup failed'));
  }
  if (!userDoc) return next(new UnauthorizedError('User not found'));

  const rawUser = userDoc as {
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

  // Only active accounts may proceed. Inactive, pending, blocked, rejected all refused.
  if (rawUser.status !== 'active') {
    return next(new UnauthorizedError('Account is not active'));
  }

  const resolvedRole = resolveRole(rawUser.role);
  const permissions = projectPermissions(resolvedRole, rawUser.permissions ?? []);

  req.user = { id: rawUser._id.toString(), role: resolvedRole, permissions } as AuthenticatedUser;
  next();
}

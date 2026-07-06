// Auth service. Password + OTP login, OTP registration, refresh-token
// rotation, logout, current-user. Returns tokens; the controller sets
// the httpOnly refresh cookie. OTP emails go through the notification
// queue.

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { childLogger } from '@/core/logger';
import { env } from '@/core/config/env';
import {
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  NotFoundError,
} from '@/shared/errors';
import { notificationService } from '@/modules/notification/notification.service';
import { authRepo, type UserRecord } from './auth.repository';
import { userRepo } from '@/modules/user/user.repository';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  parseDuration,
} from './auth.tokens';

const log = childLogger({ module: 'auth-service' });

const OTP_TTL_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 30;

export interface PublicUser {
  userId: string;
  publicId?: string;
  name: unknown;
  email: string;
  phone?: string;
  role: string;
  permissions: unknown[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: PublicUser;
}

function toPublic(u: UserRecord): PublicUser {
  return {
    userId: u.id,
    publicId: u.publicId,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    permissions: u.permissions,
  };
}

async function issuePair(user: UserRecord, ip?: string): Promise<TokenPair> {
  const accessToken = signAccessToken({ userID: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
  await authRepo.storeRefresh(user.id, refreshToken, expiresAt, ip);
  await authRepo.touchLastLogin(user.id);
  return { accessToken, refreshToken, expiresIn: env.ACCESS_TOKEN_EXPIRY, user: toPublic(user) };
}

function sixDigit(): string {
  return ('000000' + crypto.randomInt(0, 1_000_000)).slice(-6);
}

export const authService = {
  // ---- Password login (single step) ----
  async login(email: string, password: string, ip?: string): Promise<TokenPair> {
    const user = await authRepo.findUserByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (user.status !== 'active') throw new ForbiddenError('Account pending admin approval');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid credentials');
    log.info({ userId: user.id }, 'password login');
    return issuePair(user, ip);
  },

  async resendOtp(email: string, txnId: string, purpose: 'REGISTER') {
    const otp = await authRepo.findOtp(email, txnId, purpose);
    if (!otp) throw new NotFoundError('OTP session');
    if (otp.expiresAt < new Date()) throw new ValidationError('OTP expired. Start again.');
    const since = (Date.now() - new Date(otp.lastSentAt).getTime()) / 1000;
    if (since < RESEND_COOLDOWN_SECONDS) {
      throw new ValidationError(
        `Wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - since)}s before resending`,
      );
    }
    const code = sixDigit();
    otp.codeHash = await bcrypt.hash(code, 10);
    otp.lastSentAt = new Date();
    await otp.save();
    await notificationService.send({
      type: 'REGISTER_OTP',
      to: email,
      payload: {
        code,
        expiresInSeconds: Math.max(0, Math.floor((otp.expiresAt.getTime() - Date.now()) / 1000)),
      },
    });
    return { txnId, email, resendCooldownSeconds: RESEND_COOLDOWN_SECONDS };
  },

  // ---- Registration via OTP ----
  async startRegister(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    password: string;
    campId?: string;
  }) {
    if (await authRepo.findUserByEmail(input.email)) {
      throw new ConflictError('Email already exists');
    }
    if (input.phone && (await authRepo.findUserByPhone(input.phone))) {
      throw new ConflictError('Phone number already in use');
    }
    const publicId = await userRepo.nextPublicId();
    const code = sixDigit();
    const txnId = crypto.randomUUID();
    await authRepo.upsertOtp({
      email: input.email.toLowerCase(),
      txnId,
      codeHash: await bcrypt.hash(code, 10),
      purpose: 'REGISTER',
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      payload: {
        publicId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        role: input.role,
        passwordHash: await bcrypt.hash(input.password, 10),
        campId: input.campId ?? null,
      },
    });
    await notificationService.send({
      type: 'REGISTER_OTP',
      to: input.email,
      payload: { code, expiresInSeconds: OTP_TTL_SECONDS },
    });
    return {
      txnId,
      email: input.email,
      expiresInSeconds: OTP_TTL_SECONDS,
      resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
    };
  },

  async verifyRegister(email: string, txnId: string, code: string): Promise<PublicUser> {
    const otp = await authRepo.findOtp(email, txnId, 'REGISTER');
    if (!otp) throw new NotFoundError('OTP session');
    if (otp.expiresAt < new Date()) {
      await authRepo.deleteOtp(email, txnId);
      throw new ValidationError('OTP expired. Start again.');
    }
    if (otp.attempts >= otp.maxAttempts) {
      await authRepo.deleteOtp(email, txnId);
      throw new ValidationError('Too many attempts. Start again.');
    }
    const match = await bcrypt.compare(code, otp.codeHash);
    if (!match) {
      otp.attempts += 1;
      await otp.save();
      throw new UnauthorizedError('Invalid OTP');
    }
    const payload = (otp.payload ?? {}) as Record<string, string | null>;
    await authRepo.deleteOtp(email, txnId);

    if (await authRepo.findUserByEmail(email)) throw new ConflictError('Email already exists');

    const user = await authRepo.createUser({
      publicId: payload.publicId,
      name: { first: payload.firstName, last: payload.lastName },
      email: email.toLowerCase(),
      phone: payload.phone ?? null,
      role: payload.role,
      password: payload.passwordHash, // already bcrypt-hashed; model pre-save skips re-hash
      permissions: [],
      campId: payload.campId ?? null,
      status: 'pending',
    });
    log.info({ userId: user.id }, 'user registered (pending approval)');
    return toPublic(user);
  },

  // ---- Refresh (rotate) ----
  async refresh(oldToken: string, ip?: string): Promise<TokenPair> {
    let claims: { userID: string };
    try {
      claims = verifyRefreshToken(oldToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const stored = await authRepo.findRefresh(oldToken);
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      // Token reuse / theft detection: revoke the whole family.
      if (stored && stored.revoked) {
        await authRepo.revokeAllForUser(claims.userID);
      }
      throw new UnauthorizedError('Refresh token invalid or expired');
    }
    const user = await authRepo.findUserById(claims.userID);
    if (!user) throw new UnauthorizedError('User not found');

    const pair = await issuePair(user, ip);
    await authRepo.revokeRefresh(oldToken, ip, pair.refreshToken);
    return pair;
  },

  // ---- Logout ----
  async logout(token: string | undefined, ip?: string): Promise<void> {
    if (token) await authRepo.revokeRefresh(token, ip);
  },

  // ---- Current user ----
  async current(userId: string): Promise<PublicUser> {
    const user = await authRepo.findUserById(userId);
    if (!user) throw new NotFoundError('User', userId);
    return toPublic(user);
  },
};

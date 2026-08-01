import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ValidateAuth } from './auth.validator';
import { authService } from './auth.service';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from './auth.cookies';
import { UnauthorizedError, ExternalServiceError } from '@/shared/errors';

// Mongo/network failures surface as plain MongooseError/MongoError
// subclasses, not AppError, so they'd otherwise fall through to a slow,
// generic 500. Caught explicitly here so a dropped DB connection fails
// the refresh call fast with a clear, retryable status instead of
// hanging the client's request.
function isDbConnectivityError(err: unknown): boolean {
  if (mongoose.connection.readyState !== 1) return true;
  const name = (err as { name?: string })?.name ?? '';
  return (
    name === 'MongoNetworkError' ||
    name === 'MongooseServerSelectionError' ||
    name === 'MongoServerSelectionError'
  );
}

function ip(req: Request): string | undefined {
  return req.ip;
}

function requestMeta(req: Request): { ip?: string; userAgent?: string } {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = ValidateAuth.login(req);
      const pair = await authService.login(email, password, requestMeta(req));
      setRefreshCookie(res, pair.refreshToken);
      res.json({
        success: true,
        data: { user: pair.user, accessToken: pair.accessToken, expiresIn: pair.expiresIn },
        requestId: req.id,
      });
    } catch (e) {
      next(e);
    }
  },

  async startRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const body = ValidateAuth.startRegister(req);
      const data = await authService.startRegister(body);
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },

  async verifyRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, txnId, code } = ValidateAuth.verifyOtp(req);
      const user = await authService.verifyRegister(email, txnId, code);
      res.status(201).json({ success: true, data: { user }, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },

  async resendRegisterOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, txnId } = ValidateAuth.resendOtp(req);
      const data = await authService.resendOtp(email, txnId, 'REGISTER');
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      if (!token) {
        clearRefreshCookie(res);
        throw new UnauthorizedError('No refresh token');
      }
      const pair = await authService.refresh(token, ip(req));
      setRefreshCookie(res, pair.refreshToken);
      res.json({
        success: true,
        data: { accessToken: pair.accessToken, expiresIn: pair.expiresIn, user: pair.user },
        requestId: req.id,
      });
    } catch (e) {
      clearRefreshCookie(res);
      if (e instanceof UnauthorizedError) {
        next(e);
        return;
      }
      if (isDbConnectivityError(e)) {
        next(new ExternalServiceError('database', e));
        return;
      }
      next(e);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      await authService.logout(token, requestMeta(req));
      clearRefreshCookie(res);
      res.json({ success: true, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },

  async current(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const user = await authService.current(req.user.id);
      res.json({ success: true, data: { user }, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
};

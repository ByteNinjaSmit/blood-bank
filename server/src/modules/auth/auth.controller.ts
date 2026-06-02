import type { NextFunction, Request, Response } from 'express';
import { ValidateAuth } from './auth.validator';
import { authService } from './auth.service';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from './auth.cookies';
import { UnauthorizedError } from '@/shared/errors';

function ip(req: Request): string | undefined {
  return req.ip;
}

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = ValidateAuth.login(req);
      const pair = await authService.login(email, password, ip(req));
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

  async startOtpLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = ValidateAuth.startOtp(req);
      const data = await authService.startOtpLogin(email, password);
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },

  async verifyOtpLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, txnId, code } = ValidateAuth.verifyOtp(req);
      const pair = await authService.verifyOtpLogin(email, txnId, code, ip(req));
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

  async resendOtpLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, txnId } = ValidateAuth.resendOtp(req);
      const data = await authService.resendOtp(email, txnId, 'LOGIN');
      res.json({ success: true, data, requestId: req.id });
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
      next(e);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      await authService.logout(token, ip(req));
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

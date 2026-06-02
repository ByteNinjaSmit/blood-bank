import { z } from 'zod';
import type { Request } from 'express';
import { ROLE } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const StartOtpBody = LoginBody;

export const VerifyOtpBody = z.object({
  email: z.string().email(),
  txnId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const ResendOtpBody = z.object({
  email: z.string().email(),
  txnId: z.string().min(1),
});

export const StartRegisterBody = z.object({
  // publicId removed — generated server-side to guarantee sequential uniqueness
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^\d{10}$/)
    .optional(),
  role: z.enum(ROLE),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  campId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i)
    .optional(),
});

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateAuth = {
  login: (req: Request) => parseOrThrow(LoginBody, req.body, 'request body'),
  startOtp: (req: Request) => parseOrThrow(StartOtpBody, req.body, 'request body'),
  verifyOtp: (req: Request) => parseOrThrow(VerifyOtpBody, req.body, 'request body'),
  resendOtp: (req: Request) => parseOrThrow(ResendOtpBody, req.body, 'request body'),
  startRegister: (req: Request) => parseOrThrow(StartRegisterBody, req.body, 'request body'),
};

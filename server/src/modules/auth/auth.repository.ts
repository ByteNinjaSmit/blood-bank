import { Types } from 'mongoose';
import { RefreshTokenModel, OtpModel } from './auth.model';
import { UserModel } from '@/modules/user/user.model';

export interface UserRecord {
  id: string;
  publicId?: string;
  name: unknown;
  email: string;
  phone?: string;
  role: string;
  status: string;
  permissions: unknown[];
  passwordHash: string;
}

interface RawUser {
  _id: { toString(): string };
  publicId?: string;
  name: unknown;
  email: string;
  phone?: string;
  role: string;
  status: string;
  permissions?: unknown[];
  password: string;
}

function toUser(raw: RawUser): UserRecord {
  return {
    id: raw._id.toString(),
    publicId: raw.publicId,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    role: raw.role,
    status: raw.status,
    permissions: raw.permissions ?? [],
    passwordHash: raw.password,
  };
}

export const authRepo = {
  // ---- users ----
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const raw = (await UserModel.findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean()) as unknown as RawUser | null;
    return raw ? toUser(raw) : null;
  },
  async findUserById(id: string): Promise<UserRecord | null> {
    const raw = (await UserModel.findById(id)
      .select('+password')
      .lean()) as unknown as RawUser | null;
    return raw ? toUser(raw) : null;
  },
  async findUserByPhone(phone: string): Promise<UserRecord | null> {
    const raw = (await UserModel.findOne({ phone })
      .select('+password')
      .lean()) as unknown as RawUser | null;
    return raw ? toUser(raw) : null;
  },
  async createUser(doc: Record<string, unknown>): Promise<UserRecord> {
    const created = await UserModel.create(doc);
    return toUser(created.toObject() as unknown as RawUser);
  },
  async touchLastLogin(id: string): Promise<void> {
    await UserModel.updateOne({ _id: new Types.ObjectId(id) }, { lastLoginAt: new Date() });
  },

  // ---- refresh tokens ----
  async storeRefresh(userId: string, token: string, expiresAt: Date, ip?: string) {
    await RefreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      token,
      expiresAt,
      createdByIp: ip,
    });
  },
  async findRefresh(token: string) {
    return RefreshTokenModel.findOne({ token });
  },
  async revokeRefresh(token: string, ip?: string, replacedBy?: string) {
    await RefreshTokenModel.updateOne(
      { token },
      {
        revoked: true,
        revokedAt: new Date(),
        revokedByIp: ip,
        replacedByToken: replacedBy ?? null,
      },
    );
  },
  async revokeAllForUser(userId: string) {
    await RefreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), revoked: false },
      { revoked: true, revokedAt: new Date() },
    );
  },

  // ---- OTP ----
  async upsertOtp(doc: {
    email: string;
    txnId: string;
    codeHash: string;
    purpose: 'REGISTER';
    expiresAt: Date;
    payload?: unknown;
  }) {
    await OtpModel.deleteMany({ email: doc.email, purpose: doc.purpose });
    await OtpModel.create({ ...doc, attempts: 0, maxAttempts: 5, lastSentAt: new Date() });
  },
  async findOtp(email: string, txnId: string, purpose: 'REGISTER') {
    return OtpModel.findOne({ email, txnId, purpose });
  },
  async deleteOtp(email: string, txnId: string) {
    await OtpModel.deleteMany({ email, txnId });
  },
};

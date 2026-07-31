import { Types } from 'mongoose';
import { UserModel } from './user.model';

export interface UserDto {
  id: string;
  publicId?: string;
  name: { first: string; last: string };
  email: string;
  phone?: string;
  role: string;
  roleId?: string | null;
  isFullAccess: boolean;
  status: string;
  permissions: unknown[];
  campId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface RawUser {
  _id: { toString(): string };
  publicId?: string;
  name: { first: string; last: string };
  email: string;
  phone?: string;
  role: string;
  roleId?: { toString(): string } | null;
  isFullAccess?: boolean;
  status: string;
  permissions?: unknown[];
  campId?: { toString(): string } | null;
  createdAt?: Date;
  updatedAt?: Date;
}

function toDto(raw: RawUser): UserDto {
  return {
    id: raw._id.toString(),
    publicId: raw.publicId,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    role: raw.role,
    roleId: raw.roleId ? raw.roleId.toString() : null,
    isFullAccess: !!raw.isFullAccess,
    status: raw.status,
    permissions: raw.permissions ?? [],
    campId: raw.campId ? raw.campId.toString() : null,
    createdAt: raw.createdAt?.toISOString(),
    updatedAt: raw.updatedAt?.toISOString(),
  };
}

export interface ListUsersFilter {
  role?: string;
  status?: string;
  campId?: string;
  search?: string;
  page: number;
  limit: number;
}

export const userRepo = {
  async existsByEmail(email: string): Promise<boolean> {
    return Boolean(await UserModel.exists({ email: email.toLowerCase() }));
  },

  async nextPublicId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `USR-${year}-`;
    const highest = await UserModel.findOne({ publicId: new RegExp(`^${prefix}`) }, { publicId: 1 })
      .sort({ publicId: -1 })
      .lean();
    let next = 1;
    if (highest?.publicId) {
      const seq = String(highest.publicId).split('-')[2];
      if (seq) next = Number.parseInt(seq, 10) + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  },

  async create(doc: Record<string, unknown>): Promise<UserDto> {
    const created = await UserModel.create(doc);
    return toDto(created.toObject() as unknown as RawUser);
  },

  async list(f: ListUsersFilter): Promise<{ items: UserDto[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (f.role) filter.role = f.role;
    if (f.status) filter.status = f.status;
    if (f.campId) filter.campId = new Types.ObjectId(f.campId);
    if (f.search) {
      filter.$or = [
        { 'name.first': { $regex: f.search, $options: 'i' } },
        { 'name.last': { $regex: f.search, $options: 'i' } },
        { email: { $regex: f.search, $options: 'i' } },
      ];
    }
    const skip = (f.page - 1) * f.limit;
    const [docs, total] = await Promise.all([
      UserModel.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(f.limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);
    return { items: (docs as unknown as RawUser[]).map(toDto), total };
  },

  async findByIdOrPublicId(id: string): Promise<UserDto | null> {
    const query = id.startsWith('USR-') ? { publicId: id } : { _id: id };
    const raw = (await UserModel.findOne(query)
      .select('-password')
      .lean()) as unknown as RawUser | null;
    return raw ? toDto(raw) : null;
  },

  async updateByIdOrPublicId(id: string, patch: Record<string, unknown>): Promise<UserDto | null> {
    const query = id.startsWith('USR-') ? { publicId: id } : { _id: id };
    const doc = await UserModel.findOne(query);
    if (!doc) return null;
    Object.assign(doc, patch);
    await doc.save();
    const obj = doc.toObject() as unknown as RawUser & { password?: string };
    delete obj.password;
    return toDto(obj);
  },
};

import { RoleModel } from './role.model';
import { UserModel } from '@/modules/user/user.model';

export interface RoleDto {
  id: string;
  name: string;
  description: string;
  isFullAccess: boolean;
  permissions: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

interface RawRole {
  _id: { toString(): string };
  name: string;
  description?: string;
  isFullAccess?: boolean;
  permissions?: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}

function toDto(raw: RawRole): RoleDto {
  return {
    id: raw._id.toString(),
    name: raw.name,
    description: raw.description ?? '',
    isFullAccess: !!raw.isFullAccess,
    permissions: raw.permissions ?? [],
    createdAt: raw.createdAt?.toISOString(),
    updatedAt: raw.updatedAt?.toISOString(),
  };
}

export interface ListRolesFilter {
  search?: string;
  page: number;
  limit: number;
}

export const roleRepo = {
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, unknown> = { name: new RegExp(`^${name}$`, 'i') };
    if (excludeId) filter._id = { $ne: excludeId };
    return Boolean(await RoleModel.exists(filter));
  },

  async create(doc: Record<string, unknown>): Promise<RoleDto> {
    const created = await RoleModel.create(doc);
    return toDto(created.toObject() as unknown as RawRole);
  },

  async list(f: ListRolesFilter): Promise<{ items: RoleDto[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (f.search) filter.name = { $regex: f.search, $options: 'i' };
    const skip = (f.page - 1) * f.limit;
    const [docs, total] = await Promise.all([
      RoleModel.find(filter).sort({ name: 1 }).skip(skip).limit(f.limit).lean(),
      RoleModel.countDocuments(filter),
    ]);
    return { items: (docs as unknown as RawRole[]).map(toDto), total };
  },

  async findById(id: string): Promise<RoleDto | null> {
    const raw = (await RoleModel.findById(id).lean()) as unknown as RawRole | null;
    return raw ? toDto(raw) : null;
  },

  async update(id: string, patch: Record<string, unknown>): Promise<RoleDto | null> {
    const doc = await RoleModel.findById(id);
    if (!doc) return null;
    Object.assign(doc, patch);
    await doc.save();
    return toDto(doc.toObject() as unknown as RawRole);
  },

  async remove(id: string): Promise<boolean> {
    const res = await RoleModel.findByIdAndDelete(id);
    return Boolean(res);
  },

  async countUsersWithRole(id: string): Promise<number> {
    return UserModel.countDocuments({ roleId: id });
  },
};

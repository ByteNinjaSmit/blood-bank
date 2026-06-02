import bcrypt from 'bcryptjs';
import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
import { userRepo, type ListUsersFilter, type UserDto } from './user.repository';

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  password: string;
  permissions?: unknown[];
  campId?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
  permissions?: unknown[];
  campId?: string;
  status?: string;
}

const log = childLogger({ module: 'user-service' });

export const userService = {
  async create(input: CreateUserInput, actorId: string): Promise<UserDto> {
    if (await userRepo.existsByEmail(input.email)) {
      throw new ConflictError('User with this email already exists');
    }
    const publicId = await userRepo.nextPublicId();
    const user = await userRepo.create({
      publicId,
      name: { first: input.firstName, last: input.lastName },
      email: input.email.toLowerCase(),
      phone: input.phone,
      role: input.role,
      password: input.password, // hashed by model pre-save hook
      permissions: input.permissions ?? [],
      campId: input.campId ?? null,
      status: 'active',
      createdBy: actorId,
      updatedBy: actorId,
    });
    await auditService.record({
      actorId,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      after: { email: user.email, role: user.role },
    });
    log.info({ userId: user.id, actorId }, 'user created');
    return user;
  },

  async list(filter: ListUsersFilter) {
    const { items, total } = await userRepo.list(filter);
    return {
      items,
      pagination: {
        total,
        page: filter.page,
        limit: filter.limit,
        pages: Math.ceil(total / filter.limit),
      },
    };
  },

  async get(id: string): Promise<UserDto> {
    const user = await userRepo.findByIdOrPublicId(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  },

  async update(id: string, input: UpdateUserInput, actorId: string): Promise<UserDto> {
    const existing = await userRepo.findByIdOrPublicId(id);
    if (!existing) throw new NotFoundError('User', id);

    if (input.email && input.email.toLowerCase() !== existing.email) {
      if (await userRepo.existsByEmail(input.email)) {
        throw new ConflictError('Email is already in use by another user');
      }
    }

    const patch: Record<string, unknown> = { updatedBy: actorId };
    if (input.firstName) patch['name.first'] = input.firstName;
    if (input.lastName) patch['name.last'] = input.lastName;
    if (input.email) patch.email = input.email.toLowerCase();
    if (input.phone) patch.phone = input.phone;
    if (input.role) patch.role = input.role;
    if (input.permissions) patch.permissions = input.permissions;
    if (input.campId) patch.campId = input.campId;
    if (input.status) patch.status = input.status;
    if (input.password) patch.password = await bcrypt.hash(input.password, 10);

    const updated = await userRepo.updateByIdOrPublicId(id, patch);
    if (!updated) throw new NotFoundError('User', id);
    await auditService.record({
      actorId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: updated.id,
    });
    return updated;
  },

  async deactivate(id: string, actorId: string): Promise<void> {
    const updated = await userRepo.updateByIdOrPublicId(id, {
      status: 'inactive',
      updatedBy: actorId,
    });
    if (!updated) throw new NotFoundError('User', id);
    await auditService.record({
      actorId,
      action: 'DELETE',
      entityType: 'User',
      entityId: updated.id,
      reason: 'soft delete (deactivate)',
    });
    log.warn({ userId: updated.id, actorId }, 'user deactivated');
  },
};

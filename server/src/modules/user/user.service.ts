import bcrypt from 'bcryptjs';
import { childLogger } from '@/core/logger';
import { cached, invalidate } from '@/core/cache';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
import { userRepo, type ListUsersFilter, type UserDto } from './user.repository';

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  roleId?: string;
  isFullAccess?: boolean;
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
  roleId?: string;
  isFullAccess?: boolean;
  password?: string;
  permissions?: unknown[];
  campId?: string;
  status?: string;
}

const log = childLogger({ module: 'user-service' });

const USER_TTL = 120; // 2 min — staff roster changes infrequently
const userDetailKey = (id: string) => `user:detail:${id}`;

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
      roleId: input.roleId ?? null,
      isFullAccess: input.isFullAccess ?? false,
      password: input.password,
      permissions: input.permissions ?? [],
      campId: input.campId ?? null,
      status: 'active',
      createdBy: actorId,
      updatedBy: actorId,
    });
    await auditService.record({
      actorId,
      module: 'user',
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      after: { email: user.email, role: user.role },
    });
    await invalidate('user:*');
    log.info({ userId: user.id, actorId }, 'user created');
    return user;
  },

  async list(filter: ListUsersFilter) {
    // Cache simple unfiltered first-page staff roster (used by camp + donation forms).
    const isSimple = !filter.search && !filter.campId && filter.page === 1;
    const key = isSimple
      ? `user:list:role=${filter.role ?? 'all'}:status=${filter.status ?? 'all'}:limit=${filter.limit}`
      : null;

    const fetch = async () => {
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
    };

    return key ? cached(key, USER_TTL, fetch) : fetch();
  },

  async get(id: string): Promise<UserDto> {
    const user = await cached(userDetailKey(id), USER_TTL, () => userRepo.findByIdOrPublicId(id));
    if (!user) throw new NotFoundError('User', id);
    return user;
  },

  async update(id: string, input: UpdateUserInput, actorId: string, editReason?: string): Promise<UserDto> {
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
    if (input.roleId !== undefined) patch.roleId = input.roleId;
    if (input.isFullAccess !== undefined) patch.isFullAccess = input.isFullAccess;
    if (input.permissions) patch.permissions = input.permissions;
    if (input.campId) patch.campId = input.campId;
    if (input.status) patch.status = input.status;
    const passwordChanged = Boolean(input.password);
    if (input.password) patch.password = await bcrypt.hash(input.password, 10);

    const updated = await userRepo.updateByIdOrPublicId(id, patch);
    if (!updated) throw new NotFoundError('User', id);

    // Password changes are audited as their own event, with no before/after
    // snapshot — the hash must never be constructed into a diffable object
    // in the first place, not merely redacted downstream.
    if (passwordChanged) {
      await auditService.record({
        actorId,
        module: 'user',
        action: 'UPDATE',
        entityType: 'User',
        entityId: updated.id,
        changedFields: ['password'],
        reason: actorId === id ? 'self-service password change' : 'admin password reset',
        severity: 'warning',
      });
    }

    // Non-password profile fields, if any, get a real before/after diff —
    // the redaction map already strips password-family keys centrally, so
    // there's no risk of a hash leaking through here.
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (input.firstName) { before.firstName = existing.name.first; after.firstName = input.firstName; }
    if (input.lastName) { before.lastName = existing.name.last; after.lastName = input.lastName; }
    if (input.email) { before.email = existing.email; after.email = input.email.toLowerCase(); }
    if (input.phone) { before.phone = existing.phone; after.phone = input.phone; }
    if (input.role) { before.role = existing.role; after.role = input.role; }
    if (input.roleId !== undefined) { before.roleId = existing.roleId; after.roleId = input.roleId; }
    if (input.isFullAccess !== undefined) { before.isFullAccess = existing.isFullAccess; after.isFullAccess = input.isFullAccess; }
    if (input.permissions) { before.permissions = existing.permissions; after.permissions = input.permissions; }
    if (input.campId) { before.campId = existing.campId; after.campId = input.campId; }
    if (input.status) { before.status = existing.status; after.status = input.status; }
    if (Object.keys(after).length > 0) {
      await auditService.record({
        actorId,
        module: 'user',
        action: 'UPDATE',
        entityType: 'User',
        entityId: updated.id,
        before,
        after,
        reason: editReason,
      });
    }
    await invalidate('user:*');
    return updated;
  },

  async deactivate(id: string, actorId: string, reason?: string): Promise<void> {
    const updated = await userRepo.updateByIdOrPublicId(id, {
      status: 'inactive',
      updatedBy: actorId,
    });
    if (!updated) throw new NotFoundError('User', id);
    await auditService.record({
      actorId,
      module: 'user',
      action: 'DELETE',
      entityType: 'User',
      entityId: updated.id,
      reason: reason?.trim() || 'soft delete (deactivate)',
    });
    await invalidate('user:*');
    log.warn({ userId: updated.id, actorId }, 'user deactivated');
  },
};

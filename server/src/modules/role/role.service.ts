import { childLogger } from '@/core/logger';
import { cached, invalidate } from '@/core/cache';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
import { roleRepo, type ListRolesFilter, type RoleDto } from './role.repository';

export interface CreateRoleInput {
  name: string;
  description?: string;
  isFullAccess?: boolean;
  permissions?: unknown[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  isFullAccess?: boolean;
  permissions?: unknown[];
}

const log = childLogger({ module: 'role-service' });

const ROLE_TTL = 300; // 5 min — role templates change rarely
const roleDetailKey = (id: string) => `role:detail:${id}`;

export const roleService = {
  async create(input: CreateRoleInput, actorId: string): Promise<RoleDto> {
    if (await roleRepo.existsByName(input.name)) {
      throw new ConflictError('A role with this name already exists');
    }
    const role = await roleRepo.create({
      name: input.name,
      description: input.description ?? '',
      isFullAccess: input.isFullAccess ?? false,
      permissions: input.permissions ?? [],
      createdBy: actorId,
      updatedBy: actorId,
    });
    await auditService.record({
      actorId,
      module: 'role',
      action: 'CREATE',
      entityType: 'Role',
      entityId: role.id,
      after: { name: role.name },
    });
    await invalidate('role:*');
    log.info({ roleId: role.id, actorId }, 'role created');
    return role;
  },

  async list(filter: ListRolesFilter) {
    const { items, total } = await roleRepo.list(filter);
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

  async get(id: string): Promise<RoleDto> {
    const role = await cached(roleDetailKey(id), ROLE_TTL, () => roleRepo.findById(id));
    if (!role) throw new NotFoundError('Role', id);
    return role;
  },

  async update(id: string, input: UpdateRoleInput, actorId: string): Promise<RoleDto> {
    const existing = await roleRepo.findById(id);
    if (!existing) throw new NotFoundError('Role', id);

    if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      if (await roleRepo.existsByName(input.name, id)) {
        throw new ConflictError('A role with this name already exists');
      }
    }

    const patch: Record<string, unknown> = { updatedBy: actorId };
    if (input.name) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.isFullAccess !== undefined) patch.isFullAccess = input.isFullAccess;
    if (input.permissions) patch.permissions = input.permissions;

    const updated = await roleRepo.update(id, patch);
    if (!updated) throw new NotFoundError('Role', id);

    await auditService.record({
      actorId,
      module: 'role',
      action: 'UPDATE',
      entityType: 'Role',
      entityId: updated.id,
      before: { name: existing.name, permissions: existing.permissions },
      after: { name: updated.name, permissions: updated.permissions },
    });
    await invalidate('role:*');
    return updated;
  },

  async remove(id: string, actorId: string): Promise<void> {
    const existing = await roleRepo.findById(id);
    if (!existing) throw new NotFoundError('Role', id);

    const usersWithRole = await roleRepo.countUsersWithRole(id);
    if (usersWithRole > 0) {
      throw new ConflictError(
        `Cannot delete role "${existing.name}" — it is currently assigned to ${usersWithRole} user(s)`,
      );
    }

    await roleRepo.remove(id);
    await auditService.record({
      actorId,
      module: 'role',
      action: 'DELETE',
      entityType: 'Role',
      entityId: id,
      before: { name: existing.name },
    });
    await invalidate('role:*');
    log.warn({ roleId: id, actorId }, 'role deleted');
  },
};

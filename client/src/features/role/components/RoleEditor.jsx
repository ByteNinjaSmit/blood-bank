import React, { useState } from 'react';
import { toast } from 'sonner';
import PermissionsEditor from '@/features/user/components/permissions-editor/PermissionsEditor';
import { draftFromGrid, gridFromDraft } from '@/features/user/components/permissions-editor/grid-conversion';
import { useCreateRole, useUpdateRole } from '../queries';

function toForm(role) {
  return {
    name: role?.name || '',
    description: role?.description || '',
    isFullAccess: !!role?.isFullAccess,
    permissionsDraft: draftFromGrid(role?.permissions || []),
  };
}

export default function RoleEditor({ role, onDone, onCancel }) {
  const editingId = role?.id ?? null;
  const [form, setForm] = useState(() => toForm(role));
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const saving = createRole.isPending || updateRole.isPending;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      isFullAccess: form.isFullAccess,
      permissions: gridFromDraft(form.permissionsDraft),
    };
    try {
      if (editingId) {
        await updateRole.mutateAsync({ id: editingId, data: payload });
        toast.success('Role updated');
      } else {
        await createRole.mutateAsync(payload);
        toast.success('Role created');
      }
      onDone();
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-600">Role Name</label>
          <input
            required
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300"
            placeholder="e.g. Lab Technician"
            value={form.name}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">Description</label>
          <input
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300"
            placeholder="Optional"
            value={form.description}
            onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
          />
        </div>
      </div>

      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 flex items-start gap-2">
        <input
          type="checkbox"
          id="roleIsFullAccess"
          className="mt-0.5"
          checked={!!form.isFullAccess}
          onChange={(e) => setForm((v) => ({ ...v, isFullAccess: e.target.checked }))}
        />
        <label htmlFor="roleIsFullAccess" className="text-sm text-amber-900">
          <span className="font-semibold">Full Access</span> — a user assigned this role will bypass every permission check, regardless of the checklist below.
        </label>
      </div>

      <div className={form.isFullAccess ? 'opacity-50 pointer-events-none' : ''}>
        <div className="font-medium mb-2 text-slate-800">Permissions</div>
        <p className="text-xs text-slate-500 mb-2">
          This is the same checklist used on individual users — applying this role to a user copies these permissions onto them.
        </p>
        <PermissionsEditor
          draft={form.permissionsDraft}
          onChange={(permissionsDraft) => setForm((v) => ({ ...v, permissionsDraft }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-md border hover:bg-slate-50">Cancel</button>
        <button disabled={saving} type="submit" className="px-3 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 shadow-sm">
          {editingId ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  );
}

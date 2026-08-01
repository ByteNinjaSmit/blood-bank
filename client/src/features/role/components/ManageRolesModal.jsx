import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRoleList, useDeleteRole } from '../queries';
import RoleEditor from './RoleEditor';

export default function ManageRolesModal({ onClose }) {
  const { data, isLoading } = useRoleList();
  const roles = data ?? [];
  const deleteRole = useDeleteRole();

  const [editorState, setEditorState] = useState(null); // null | { role: null | Role }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () => setEditorState({ role: null });
  const openEdit = (role) => setEditorState({ role });
  const closeEditor = () => setEditorState(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast.success('Role deleted');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete role');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (editorState) {
    return (
      <Dialog open onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editorState.role ? 'Edit Role' : 'New Role'}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <RoleEditor role={editorState.role} onDone={closeEditor} onCancel={closeEditor} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
        </DialogHeader>
        <div className="pt-2 space-y-4">
        <div className="flex justify-end">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Role
          </button>
        </div>

        {isLoading && <div className="text-sm text-slate-500 py-6 text-center">Loading roles…</div>}

        {!isLoading && roles.length === 0 && (
          <div className="text-sm text-slate-500 py-6 text-center">No roles created yet.</div>
        )}

        {!isLoading && roles.length > 0 && (
          <div className="border rounded-lg overflow-hidden divide-y">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5">
                    {role.name}
                    {role.isFullAccess && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <ShieldCheck className="w-3 h-3" /> Full Access
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <div className="text-xs text-slate-500 mt-0.5">{role.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    title="Edit"
                    onClick={() => openEdit(role)}
                    className="p-2 rounded-md border hover:bg-slate-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => setDeleteTarget(role)}
                    className="p-2 rounded-md border hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600 text-sm">
              {deleteTarget ? `Delete role "${deleteTarget.name}"? This cannot be undone.` : ''}
            </p>
            <DialogFooter>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-2 rounded-md shadow-sm text-sm bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

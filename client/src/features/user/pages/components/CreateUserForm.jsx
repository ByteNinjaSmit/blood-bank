import React, { useEffect } from "react";
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav";
import PermissionsEditor from "../../components/permissions-editor/PermissionsEditor";
import { draftFromGrid } from "../../components/permissions-editor/grid-conversion";
import { useRoleList } from "@/features/role/queries";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CreateUserForm({
  form,
  setForm,
  editingId,
  loading,
  onSubmit,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  const { data: roles } = useRoleList();
  const roleOptions = roles ?? [];

  const onRoleChange = (e) => {
    const roleId = e.target.value;
    if (!roleId) {
      // "— Custom —" placeholder: only clears the applied-role link, the
      // permission grid is left exactly as it is (never silently wiped).
      setForm((v) => ({ ...v, roleId: null }));
      return;
    }
    const role = roleOptions.find((r) => r.id === roleId);
    if (!role) return;
    // One-time template copy — applying a role overwrites the grid now,
    // but the user's permissions stay independently editable afterward,
    // and later edits to the role itself never cascade back here.
    setForm((v) => ({
      ...v,
      role: role.name,
      roleId: role.id,
      isFullAccess: role.isFullAccess,
      permissionsDraft: draftFromGrid(role.permissions || []),
    }));
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-slate-50/60">
          <DialogTitle className="font-semibold text-slate-800">{editingId ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600">Public ID</label>
              <input className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.publicId} onChange={(e)=>setForm(v=>({...v, publicId:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-slate-600">First Name</label>
              <input required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.firstName} onChange={(e)=>setForm(v=>({...v, firstName:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-slate-600">Last Name</label>
              <input required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.lastName} onChange={(e)=>setForm(v=>({...v, lastName:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-slate-600">Email</label>
              <input type="email" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.email} onChange={(e)=>setForm(v=>({...v, email:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-slate-600">Phone</label>
              <input className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.phone} onChange={(e)=>setForm(v=>({...v, phone:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-slate-600">Role</label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300"
                value={form.roleId || ""}
                onChange={onRoleChange}
              >
                <option value="">— Custom (no role) —</option>
                {roleOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-0.5">Selecting a role fills in the checklist below from that role's template — you can still adjust individual permissions afterward. Later changes to the role itself won't retroactively affect this user.</p>
            </div>
            <div>
              <label className="text-xs text-slate-600">Status</label>
              <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300 capitalize" value={form.status} onChange={(e)=>setForm(v=>({...v, status:e.target.value}))}>
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="blocked">blocked</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600">Password {editingId ? '(leave blank to keep unchanged)' : ''}</label>
              <input type="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.password} onChange={(e)=>setForm(v=>({...v, password:e.target.value}))} />
            </div>
          </div>

          <div className="mt-2 p-3 rounded-lg border border-amber-200 bg-amber-50 flex items-start gap-2">
            <input
              type="checkbox"
              id="isFullAccess"
              className="mt-0.5"
              checked={!!form.isFullAccess}
              onChange={(e) => setForm(v => ({ ...v, isFullAccess: e.target.checked }))}
            />
            <label htmlFor="isFullAccess" className="text-sm text-amber-900">
              <span className="font-semibold">Full Access</span> — bypasses every permission check below; this user can do everything, regardless of what's granted.
            </label>
          </div>

          <div className={`mt-2 ${form.isFullAccess ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="font-medium mb-2 text-slate-800">Permissions</div>
            <p className="text-xs text-slate-500 mb-2">
              Grant a whole module at once, or expand it to set permissions per page.
            </p>
            <PermissionsEditor
              draft={form.permissionsDraft}
              onChange={(permissionsDraft) => setForm((v) => ({ ...v, permissionsDraft }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-3 py-2 rounded-md border hover:bg-slate-50">Cancel</button>
            <button disabled={loading} type="submit" className="px-3 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 shadow-sm">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

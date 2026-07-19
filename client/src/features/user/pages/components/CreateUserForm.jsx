import React, { useEffect } from "react";
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav";

export default function CreateUserForm({
  form,
  setForm,
  editingId,
  RoleArray,
  loading,
  onSubmit,
  onCancel,
  setPerm,
  setAllForModule,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e)=>e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50/60">
          <div className="font-semibold text-slate-800">{editingId ? 'Edit User' : 'Create User'}</div>
          <button onClick={onCancel} className="px-2 py-1 rounded-md border hover:bg-slate-50">Close</button>
        </div>
        <form onSubmit={onSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="p-4 md:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
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
              <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={form.role} onChange={(e)=>setForm(v=>({...v, role:e.target.value}))}>
                {RoleArray.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
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

          <div className="mt-2">
            <div className="font-medium mb-2 text-slate-800">Permissions</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-3 py-2 text-left">Module</th>
                    <th className="px-3 py-2 text-center">All</th>
                    <th className="px-3 py-2 text-center">View</th>
                    <th className="px-3 py-2 text-center">Create</th>
                    <th className="px-3 py-2 text-center">Update</th>
                    <th className="px-3 py-2 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {form.permissions.map((p) => (
                    <tr key={p.moduleName} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2">{p.moduleName}</td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={p.view && p.create && p.update && p.delete} onChange={(e)=>setAllForModule(p.moduleName, e.target.checked)} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={p.view} onChange={(e)=>setPerm(p.moduleName, 'view', e.target.checked)} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={p.create} onChange={(e)=>setPerm(p.moduleName, 'create', e.target.checked)} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={p.update} onChange={(e)=>setPerm(p.moduleName, 'update', e.target.checked)} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={p.delete} onChange={(e)=>setPerm(p.moduleName, 'delete', e.target.checked)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-3 py-2 rounded-md border hover:bg-slate-50">Cancel</button>
            <button disabled={loading} type="submit" className="px-3 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 shadow-sm">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

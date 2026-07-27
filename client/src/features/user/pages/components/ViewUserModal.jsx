import React, { useEffect } from "react";

export default function ViewUserModal({ user, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e)=>e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50/60">
          <div className="font-semibold text-slate-800">User Details</div>
          <button onClick={onClose} className="px-2 py-1 rounded-md border hover:bg-slate-50">Close</button>
        </div>
        <div className="p-4 md:p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Public ID:</span> <span className="font-medium">{user.publicId}</span></div>
            <div><span className="text-slate-500">Name:</span> <span className="font-medium">{user?.name?.first} {user?.name?.last}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="font-medium">{user.email}</span></div>
            <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{user.phone}</span></div>
            <div className="capitalize"><span className="text-slate-500">Role:</span> <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 ml-1">{user.role}</span></div>
            <div className="capitalize"><span className="text-slate-500">Status:</span> <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-white ml-1 ${user.status === 'active' ? 'bg-green-600' : 'bg-slate-500'}`}>{user.status}</span></div>
            <div><span className="text-slate-500">Last Login:</span> <span className="font-medium">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</span></div>
          </div>
          <div>
            <div className="font-medium mb-2 text-slate-800">Permissions</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border rounded-lg overflow-hidden">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-2 py-1 text-left">Resource</th>
                    <th className="px-2 py-1 text-left">Scope</th>
                    <th className="px-2 py-1 text-center">View</th>
                    <th className="px-2 py-1 text-center">Create</th>
                    <th className="px-2 py-1 text-center">Update</th>
                    <th className="px-2 py-1 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(user.permissions || []).map((p, i) => (
                    <tr key={`${p.moduleName}-${p.pageId || 'module'}-${i}`} className="hover:bg-slate-50/60">
                      <td className="px-2 py-1">{p.moduleName}</td>
                      <td className="px-2 py-1 text-slate-500">{p.pageId ? `page: ${p.pageId}` : 'whole module'}</td>
                      <td className="px-2 py-1 text-center">{p.view ? '✔' : '—'}</td>
                      <td className="px-2 py-1 text-center">{p.create ? '✔' : '—'}</td>
                      <td className="px-2 py-1 text-center">{p.update ? '✔' : '—'}</td>
                      <td className="px-2 py-1 text-center">{p.delete ? '✔' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

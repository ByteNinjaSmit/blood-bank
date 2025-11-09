import React from "react";
import ActionMenu from "./ActionMenu";

function UserRow({
  u,
  canView,
  canUpdate,
  canDelete,
  onView,
  onEdit,
  onApprove,
  onReject,
  onBlock,
  onDeactivate,
  onDelete,
  openMenuId,
  setOpenMenuId,
  selected,
  onToggle,
  statusChipClass,
}) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-3 py-2"><input type="checkbox" checked={selected} onChange={(e)=>onToggle(u._id, e.target.checked)} /></td>
      <td className="px-3 py-2">{u.publicId}</td>
      <td className="px-3 py-2">{u?.name?.first} {u?.name?.last}</td>
      <td className="px-3 py-2">{u.email}</td>
      <td className="px-3 py-2">{u.phone}</td>
      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
          {u.role}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-white capitalize ${statusChipClass(u.status)}`}>
          {u.status}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        <ActionMenu
          row={u}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          canView={canView}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onView={onView}
          onEdit={onEdit}
          onApprove={onApprove}
          onReject={onReject}
          onBlock={onBlock}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

export default function UsersTable({
  users,
  canView,
  canUpdate,
  canDelete,
  onView,
  onEdit,
  onApprove,
  onReject,
  onBlock,
  onDeactivate,
  onDelete,
  openMenuId,
  setOpenMenuId,
  selectedIds,
  setSelectedIds,
  statusChipClass,
}) {
  const allOnPageSelected = users.length > 0 && users.every(u => selectedIds.has(u._id));
  const toggleAll = (checked) => {
    const next = new Set(selectedIds);
    if (checked) users.forEach(u => next.add(u._id));
    else users.forEach(u => next.delete(u._id));
    setSelectedIds(next);
  };
  const toggleOne = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id); else next.delete(id);
    setSelectedIds(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
<div className="overflow-x-auto overflow-y-visible relative">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left w-8"><input type="checkbox" checked={allOnPageSelected} onChange={(e)=>toggleAll(e.target.checked)} /></th>
              <th className="px-3 py-2 text-left">Public ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <UserRow
                key={u._id}
                u={u}
                canView={canView}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onView={onView}
                onEdit={onEdit}
                onApprove={onApprove}
                onReject={onReject}
                onBlock={onBlock}
                onDeactivate={onDeactivate}
                onDelete={onDelete}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                selected={selectedIds.has(u._id)}
                onToggle={toggleOne}
                statusChipClass={statusChipClass}
              />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-500">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

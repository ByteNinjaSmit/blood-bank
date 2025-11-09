import React from "react";
import { Eye, Edit as EditIcon, Check, XCircle, Ban, PauseCircle, Trash2, MoreHorizontal, ChevronDown } from "lucide-react";

export default function ActionMenu({
  row,
  openMenuId,
  setOpenMenuId,
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
}) {
  const open = openMenuId === row._id;
  return (
    <div className="relative inline-block text-left">
      <button onClick={() => setOpenMenuId(open ? null : row._id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border bg-white hover:bg-slate-50">
        <MoreHorizontal className="w-4 h-4" />
        <span className="hidden lg:inline">Actions</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-md border bg-white shadow-lg z-50">
          <div className="py-1 text-sm">
            {canView && (
              <button onClick={() => { onView(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2"><Eye className="w-4 h-4"/> View</button>
            )}
            {canUpdate && (
              <button onClick={() => { onEdit(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2"><EditIcon className="w-4 h-4"/> Edit</button>
            )}
            {canUpdate && row.status !== 'active' && (
              <button onClick={() => { onApprove(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2 text-green-700"><Check className="w-4 h-4"/> Approve</button>
            )}
            {canUpdate && row.status === 'pending' && (
              <button onClick={() => { onReject(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2 text-rose-700"><XCircle className="w-4 h-4"/> Reject</button>
            )}
            {canUpdate && row.status !== 'blocked' && (
              <button onClick={() => { onBlock(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2 text-red-700"><Ban className="w-4 h-4"/> Block</button>
            )}
            {canUpdate && row.status === 'active' && (
              <button onClick={() => { onDeactivate(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2"><PauseCircle className="w-4 h-4"/> Deactivate</button>
            )}
            {canDelete && (
              <button onClick={() => { onDelete(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2 text-red-700"><Trash2 className="w-4 h-4"/> Delete</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

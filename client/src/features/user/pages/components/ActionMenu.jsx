import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  Eye, Edit as EditIcon, Check, XCircle, Ban,
  PauseCircle, Trash2, MoreHorizontal, ChevronDown 
} from "lucide-react";

export default function ActionMenu({...props}) {
  const {
    row, openMenuId, setOpenMenuId,
    canView, canUpdate, canDelete,
    onView, onEdit, onApprove, onReject, onBlock, onDeactivate, onDelete,
  } = props;

  const open = openMenuId === row._id;
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  // calculate absolute position away from table
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 180, // width of menu
      });
    }
  };

  useEffect(() => {
    if (open) updatePosition();
  }, [open]);

  // Close menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpenMenuId(open ? null : row._id)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border bg-white hover:bg-slate-50"
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="hidden lg:inline">Actions</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: position.top, left: position.left }}
            className="w-44 origin-top-right rounded-md border bg-white shadow-lg z-[999999]"
          >
            <div className="py-1 text-sm">
              {canView && (
                <button
                  onClick={() => { onView(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
              )}
              {canUpdate && (
                <button
                  onClick={() => { onEdit(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <EditIcon className="w-4 h-4" /> Edit
                </button>
              )}

              {canUpdate && row.status !== "active" && (
                <button
                  onClick={() => { onApprove(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-green-700 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
              )}

              {canUpdate && row.status === "pending" && (
                <button
                  onClick={() => { onReject(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-rose-700 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              )}

              {canUpdate && row.status !== "blocked" && (
                <button
                  onClick={() => { onBlock(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-red-700 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" /> Block
                </button>
              )}

              {canUpdate && row.status === "active" && (
                <button
                  onClick={() => { onDeactivate(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <PauseCircle className="w-4 h-4" /> Deactivate
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => { onDelete(row); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-2 text-red-700 hover:bg-slate-50 inline-flex items-center gap-2"
                  title="Deactivates the account — this system does not support permanently deleting users"
                >
                  <Trash2 className="w-4 h-4" /> Deactivate
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

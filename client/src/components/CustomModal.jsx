import React, { useEffect } from "react";

export default function CustomModal({
  open,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "primary", // primary | danger | default
  showClose = true,
}) {
  useEffect(() => {
    const onKey = (e) => { if (open && e.key === "Escape") onCancel?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClasses =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : confirmVariant === "primary"
      ? "bg-slate-900 hover:bg-black text-white"
      : "border bg-white hover:bg-slate-50";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e)=>e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50/60">
          <div className="font-semibold text-slate-800">{title}</div>
          {showClose && (
            <button onClick={onCancel} className="px-2 py-1 rounded-md border hover:bg-slate-50">Close</button>
          )}
        </div>
        <div className="p-4 space-y-4">
          {description && <p className="text-slate-600 text-sm">{description}</p>}
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onCancel} className="px-3 py-2 rounded-md border bg-white hover:bg-slate-50">{cancelText}</button>
            <button onClick={onConfirm} className={`px-3 py-2 rounded-md shadow-sm ${confirmClasses}`}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

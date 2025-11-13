import React from "react";
import { RefreshCcw, Plus } from "lucide-react";

export default function Header({ onRefresh, onNew, canCreate }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">User Management</h2>
        <p className="text-slate-500 text-sm">Create, edit, delete users and manage their roles and permissions.</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
        {canCreate && (
          <button onClick={onNew} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 shadow-sm">
            <Plus className="w-4 h-4" /> New User
          </button>
        )}
      </div>
    </div>
  );
}

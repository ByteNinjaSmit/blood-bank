import React from "react";
import { RefreshCcw, Plus, UserCog } from "lucide-react";

export default function Header({ onRefresh, onNew, canCreate }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
          <UserCog className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Staff accounts & role management</p>
        </div>
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

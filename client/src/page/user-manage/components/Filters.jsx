import React from "react";
import { Filter as FilterIcon, Search as SearchIcon } from "lucide-react";

export default function Filters({
  search,
  onSearch,
  roleFilter,
  onRoleFilter,
  statusFilter,
  onStatusFilter,
  rowsPerPage,
  onRowsPerPage,
  total,
  startIndex,
  endIndex,
  RoleArray,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs text-slate-600">Search</label>
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full border rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300"
              placeholder="Search by name, email, phone, or ID"
              value={search}
              onChange={(e)=>onSearch(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-600">Role</label>
          <div className="relative">
            <FilterIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select className="w-full border rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={roleFilter} onChange={(e)=>onRoleFilter(e.target.value)}>
              <option value="">All</option>
              {RoleArray.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-600">Status</label>
          <div className="relative">
            <FilterIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select className="w-full border rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-red-100 focus:border-red-300" value={statusFilter} onChange={(e)=>onStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="blocked">blocked</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-sm text-slate-600">Showing {total ? startIndex + 1 : 0}-{endIndex} of {total}</div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Rows per page</label>
          <select className="border rounded-lg px-2 py-1" value={rowsPerPage} onChange={(e)=>onRowsPerPage(Number(e.target.value))}>
            {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

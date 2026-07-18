import React from 'react';
import { Search } from 'lucide-react';

const AUDIT_ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'STATE_TRANSITION', 'RELEASE',
  'RESERVE', 'ISSUE', 'DISCARD', 'OVERRIDE', 'LOGIN', 'EXPORT', 'PRINT',
];

const SEVERITIES = ['info', 'warning', 'critical'];

const fieldClass =
  'border border-gray-200 rounded px-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400';

export default function AuditFilterBar({ filters, onChange, modules = [] }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const reset = () =>
    onChange({
      module: '',
      action: '',
      severity: '',
      actor: '',
      entityId: '',
      q: '',
      dateFrom: '',
      dateTo: '',
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Module</label>
        <select value={filters.module || ''} onChange={(e) => set({ module: e.target.value })} className={`${fieldClass} w-40`}>
          <option value="">All Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Action</label>
        <select value={filters.action || ''} onChange={(e) => set({ action: e.target.value })} className={`${fieldClass} w-40`}>
          <option value="">All Actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Severity</label>
        <select value={filters.severity || ''} onChange={(e) => set({ severity: e.target.value })} className={`${fieldClass} w-32`}>
          <option value="">All</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Entity / Search</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Entity ID, label..."
            value={filters.q || ''}
            onChange={(e) => set({ q: e.target.value })}
            className={`${fieldClass} pl-8 w-48`}
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">From Date</label>
        <input type="date" value={filters.dateFrom || ''} onChange={(e) => set({ dateFrom: e.target.value })} className={fieldClass} />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">To Date</label>
        <input type="date" value={filters.dateTo || ''} onChange={(e) => set({ dateTo: e.target.value })} className={fieldClass} />
      </div>
      {hasActiveFilters && (
        <button
          onClick={reset}
          className="text-xs font-semibold text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg"
        >
          Reset
        </button>
      )}
    </div>
  );
}

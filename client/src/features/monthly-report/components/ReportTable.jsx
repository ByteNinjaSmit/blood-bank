import React from 'react';
import { BLOOD_GROUPS as GROUP_LABELS } from '@/lib/blood-groups';

export function NotTracked({ note }) {
  return (
    <div className="text-xs text-slate-500 italic bg-slate-50 border border-dashed border-slate-200 rounded-md px-3 py-2">
      Not tracked in system{note ? ` — ${note}` : ''}
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden break-inside-avoid print:border-slate-400">
      <div className="bg-slate-800 text-white px-4 py-2 text-sm font-semibold print:bg-white print:text-slate-900 print:border-b print:border-slate-400 print:[print-color-adjust:exact]">
        {title}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

// Renders one product x blood-group matrix per entity (hospital / storage centre).
export function EntityBreakdown({ entities, emptyLabel = 'No units issued to any entity for this period.' }) {
  if (!entities || entities.length === 0) {
    return <div className="text-xs text-slate-400 italic px-1">{emptyLabel}</div>;
  }
  return (
    <div className="space-y-4">
      {entities.map((entity) => {
        const headers = ['Component', ...GROUP_LABELS, 'Total'];
        const rows = entity.rows.map((r) => [
          r.product,
          ...GROUP_LABELS.map((g) => r.byGroup[g] ?? 0),
          r.total,
        ]);
        return (
          <div key={entity.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">{entity.name}</div>
              <div className="text-xs text-slate-500">Total issued: {entity.total}</div>
            </div>
            <ReportTable headers={headers} rows={rows} alignRight={headers.map((_, i) => i).filter((i) => i > 0)} />
          </div>
        );
      })}
    </div>
  );
}

export function ReportTable({ headers, rows, alignRight = [] }) {
  if (!rows || rows.length === 0) {
    return <div className="text-xs text-slate-400 italic px-1">No records for this period.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-slate-200">
        <thead className="bg-slate-100">
          <tr>
            {headers.map((h, i) => (
              <th
                key={h}
                className={`px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide border-b border-slate-200 ${
                  alignRight.includes(i) ? 'text-right' : 'text-left'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-1.5 text-slate-700 ${alignRight.includes(ci) ? 'text-right tabular-nums' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

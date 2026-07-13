import React from 'react';
import Modal from '@/components/shared/Modal';
import { User, Clock, Globe, Monitor, Hash } from 'lucide-react';

function diffRows(before, after, changedFields) {
  const keys = changedFields?.length
    ? changedFields
    : Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  return keys.map((key) => ({
    key,
    before: before && key in before ? before[key] : undefined,
    after: after && key in after ? after[key] : undefined,
  }));
}

function renderValue(v) {
  if (v === undefined) return <span className="text-gray-300 italic">—</span>;
  if (v === null) return <span className="text-gray-400 italic">null</span>;
  if (typeof v === 'object') return <span className="font-mono">{JSON.stringify(v)}</span>;
  return String(v);
}

export default function AuditDetailDrawer({ isOpen, onClose, entry }) {
  if (!entry) return null;
  const rows = diffRows(entry.before, entry.after, entry.changedFields);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Entry Detail" size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            {entry.at ? new Date(entry.at).toLocaleString('en-IN') : '—'}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <User className="w-3.5 h-3.5" />
            {entry.role || 'unknown role'}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Globe className="w-3.5 h-3.5" />
            {entry.ip || '—'}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 truncate" title={entry.userAgent}>
            <Monitor className="w-3.5 h-3.5" />
            {entry.userAgent ? entry.userAgent.slice(0, 24) + '…' : '—'}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
            <Hash className="w-3.5 h-3.5" />
            {entry.entityType} / {entry.entityLabel || entry.entityId}
          </div>
          <div className="col-span-2 text-gray-600">
            Request: <span className="font-mono">{entry.requestId || '—'}</span>
          </div>
        </div>

        {entry.reason && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-900">
            <span className="font-bold uppercase tracking-wide">Reason: </span>
            {entry.reason}
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Changed Fields</h3>
          {rows.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No field-level diff recorded for this entry.</p>
          ) : (
            <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase">Field</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase">Before</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase">After</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-gray-50">
                    <td className="px-3 py-2 font-semibold text-gray-700">{r.key}</td>
                    <td className="px-3 py-2 text-red-600 bg-red-50/40">{renderValue(r.before)}</td>
                    <td className="px-3 py-2 text-green-700 bg-green-50/40">{renderValue(r.after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}

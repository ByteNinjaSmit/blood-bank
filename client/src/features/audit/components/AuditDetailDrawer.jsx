import React from 'react';
import Modal from '@/components/shared/Modal';
import { User, Clock, Globe, Monitor, Hash } from 'lucide-react';

// Internal/technical DTO fields that duplicate what's already shown in
// the entry header (entity type/label, timestamps) — noise in a
// before/after diff, not a meaningful business-field change. Most
// module DTOs carry a raw Mongo `id`/`_id`, which otherwise renders as
// a confusing bare ObjectId row (e.g. a bulk-transfer DELETE's "id: 68f2…").
const NOISE_DIFF_KEYS = new Set(['id', '_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']);

function diffRows(before, after, changedFields) {
  const keys = changedFields?.length
    ? changedFields
    : Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})])).filter(
        (key) => !NOISE_DIFF_KEYS.has(key),
      );
  return keys.map((key) => ({
    key,
    before: before && key in before ? before[key] : undefined,
    after: after && key in after ? after[key] : undefined,
  }));
}

// "indeterminate" is the internal TTI decision/result value — the lab
// term shown to staff everywhere else in the app is "Shadeness".
function humanize(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/indeterminate/gi, 'Shadeness');
}

function renderValue(v) {
  if (v === undefined) return <span className="text-gray-300 italic">—</span>;
  if (v === null) return <span className="text-gray-400 italic">null</span>;
  if (typeof v === 'string') return humanize(v);
  if (typeof v === 'object') return <span className="font-mono">{JSON.stringify(v)}</span>;
  return String(v);
}

const TEST_LABELS = { HIV: 'HIV', HBSAG: 'HBsAg', HCV: 'HCV', SYPHILIS: 'VDRL', MALARIA: 'MP' };

function testLabel(name) {
  return TEST_LABELS[name] || name;
}

function resultLabel(result) {
  if (result === 'INDETERMINATE') return 'Shadeness';
  if (result === 'NEGATIVE') return 'Negative';
  if (result === 'REACTIVE') return 'Reactive';
  return result || '—';
}

// Renders a TTI test-panel diff (before/after arrays of {testName,
// result, ...}) as a per-test comparison table instead of raw JSON.
function TestPanelDiff({ before, after }) {
  const beforeMap = new Map((before || []).map((t) => [t.testName, t]));
  const afterMap = new Map((after || []).map((t) => [t.testName, t]));
  const names = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()]));

  if (names.length === 0) {
    return <span className="text-gray-300 italic">—</span>;
  }

  return (
    <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left px-3 py-1.5 font-bold text-gray-500 uppercase">Test</th>
          <th className="text-left px-3 py-1.5 font-bold text-gray-500 uppercase">Before</th>
          <th className="text-left px-3 py-1.5 font-bold text-gray-500 uppercase">After</th>
        </tr>
      </thead>
      <tbody>
        {names.map((name) => {
          const b = beforeMap.get(name);
          const a = afterMap.get(name);
          const changed = (b?.result ?? null) !== (a?.result ?? null);
          return (
            <tr key={name} className="border-t border-gray-50">
              <td className="px-3 py-1.5 font-semibold text-gray-700">{testLabel(name)}</td>
              <td className={`px-3 py-1.5 ${changed ? 'text-red-600 bg-red-50/40' : 'text-gray-500'}`}>
                {b ? resultLabel(b.result) : <span className="text-gray-300 italic">not tested</span>}
              </td>
              <td className={`px-3 py-1.5 ${changed ? 'text-green-700 bg-green-50/40' : 'text-gray-500'}`}>
                {a ? resultLabel(a.result) : <span className="text-gray-300 italic">not tested</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const CRUD_FLAGS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

// Renders a permissions diff (before/after arrays of {moduleName, view,
// create, update, delete}) as added/removed CRUD-flag chips per module,
// instead of dumping the raw permission array as JSON.
function PermissionsDiff({ before, after }) {
  const beforeMap = new Map((before || []).map((p) => [p.moduleName, p]));
  const afterMap = new Map((after || []).map((p) => [p.moduleName, p]));
  const modules = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()])).sort();

  if (modules.length === 0) {
    return <span className="text-gray-300 italic">—</span>;
  }

  return (
    <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left px-3 py-1.5 font-bold text-gray-500 uppercase">Module</th>
          <th className="text-left px-3 py-1.5 font-bold text-gray-500 uppercase">Change</th>
        </tr>
      </thead>
      <tbody>
        {modules.map((moduleName) => {
          const b = beforeMap.get(moduleName);
          const a = afterMap.get(moduleName);
          const added = CRUD_FLAGS.filter((f) => !b?.[f.key] && a?.[f.key]);
          const removed = CRUD_FLAGS.filter((f) => b?.[f.key] && !a?.[f.key]);
          const unchanged = !a && !b ? [] : CRUD_FLAGS.filter((f) => !!b?.[f.key] === !!a?.[f.key] && (b?.[f.key] || a?.[f.key]));
          return (
            <tr key={moduleName} className="border-t border-gray-50">
              <td className="px-3 py-1.5 font-semibold text-gray-700 align-top whitespace-nowrap">{moduleName}</td>
              <td className="px-3 py-1.5">
                {!b && a ? (
                  <span className="text-green-700 bg-green-50/40 px-1.5 py-0.5 rounded">module access granted ({unchanged.map((f) => f.label).join(', ') || 'no flags'})</span>
                ) : b && !a ? (
                  <span className="text-red-600 bg-red-50/40 px-1.5 py-0.5 rounded">module access removed</span>
                ) : added.length === 0 && removed.length === 0 ? (
                  <span className="text-gray-400 italic">no change</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {added.map((f) => (
                      <span key={`add-${f.key}`} className="text-green-700 bg-green-50/40 px-1.5 py-0.5 rounded">+{f.label}</span>
                    ))}
                    {removed.map((f) => (
                      <span key={`rm-${f.key}`} className="text-red-600 bg-red-50/40 px-1.5 py-0.5 rounded">−{f.label}</span>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
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
            {humanize(entry.reason)}
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Changed Fields</h3>
          {rows.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No field-level diff recorded for this entry.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) =>
                r.key === 'tests' ? (
                  <div key={r.key}>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Test Results</div>
                    <TestPanelDiff before={r.before} after={r.after} />
                  </div>
                ) : r.key === 'permissions' ? (
                  <div key={r.key}>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Permissions</div>
                    <PermissionsDiff before={r.before} after={r.after} />
                  </div>
                ) : (
                  <table key={r.key} className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-gray-700 bg-gray-50 w-1/4">{r.key}</td>
                        <td className="px-3 py-2 text-red-600 bg-red-50/40 w-3/8">{renderValue(r.before)}</td>
                        <td className="px-3 py-2 text-green-700 bg-green-50/40 w-3/8">{renderValue(r.after)}</td>
                      </tr>
                    </tbody>
                  </table>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

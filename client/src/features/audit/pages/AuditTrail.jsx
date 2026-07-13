import React, { useMemo, useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useAuditSearch } from '../queries';
import { auditApi } from '../api';
import AuditFilterBar from '../components/AuditFilterBar';
import AuditDetailDrawer from '../components/AuditDetailDrawer';
import Pagination from '@/features/user/pages/components/Pagination';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { downloadExcelReport } from '@/utils/excelExportHelper';

const READ_ROLES = ['system-admin', 'bbo', 'qa-manager', 'auditor'];

// "indeterminate" is the internal TTI decision/result value — the lab
// term shown to staff everywhere else in the app is "Shadeness".
function humanize(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/indeterminate/gi, 'Shadeness');
}

const MODULE_OPTIONS = [
  'unit', 'tti', 'crossmatch', 'issue', 'donor', 'donation', 'deferral',
  'transfusion', 'adverse-reaction', 'lookback', 'requisition', 'vendor',
  'purchase-order', 'goods-receipt', 'bag-stock', 'bag-inspection',
  'bag-issue', 'bag-discard', 'bulk-transfer', 'discard', 'component',
  'donor-card', 'monthly-report-input', 'appointment', 'auth', 'user',
  'hospital', 'camp', 'chemical-inventory',
];

const SEVERITY_BADGE = {
  info: 'bg-gray-100 text-gray-700 border-gray-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

const ACTION_BADGE = {
  CREATE: 'bg-green-50 text-green-700 border-green-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  STATE_TRANSITION: 'bg-purple-50 text-purple-700 border-purple-200',
  RELEASE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESERVE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ISSUE: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  DISCARD: 'bg-orange-50 text-orange-700 border-orange-200',
  OVERRIDE: 'bg-red-100 text-red-800 border-red-200',
  LOGIN: 'bg-gray-50 text-gray-600 border-gray-200',
};

// Adjacent rows that stem from ONE underlying operation (e.g. editing a
// TTI result to Shadeness cascades a separate STATE_TRANSITION audit
// entry per BloodUnit it quarantines) share a `requestId` — see
// server/src/shared/utils/with-audit.ts and unit.repository.ts. Older
// entries written before requestId threading was added (or from flows
// that don't have it yet) fall back to clustering by identical
// module+action+reason within a short time window.
const GROUP_TIME_WINDOW_MS = 5000;

// Deterministic color per "type" of log (module+action) so the same
// kind of event always reads the same color across the whole table —
// e.g. all TTI-driven unit quarantine cascades are sky blue.
const TYPE_COLOR_PALETTE = [
  { row: 'bg-sky-200/80 hover:bg-sky-300/80', bar: 'bg-sky-600' },
  { row: 'bg-violet-200/80 hover:bg-violet-300/80', bar: 'bg-violet-600' },
  { row: 'bg-amber-200/80 hover:bg-amber-300/80', bar: 'bg-amber-600' },
  { row: 'bg-rose-200/80 hover:bg-rose-300/80', bar: 'bg-rose-600' },
  { row: 'bg-emerald-200/80 hover:bg-emerald-300/80', bar: 'bg-emerald-600' },
  { row: 'bg-teal-200/80 hover:bg-teal-300/80', bar: 'bg-teal-600' },
  { row: 'bg-fuchsia-200/80 hover:bg-fuchsia-300/80', bar: 'bg-fuchsia-600' },
  { row: 'bg-orange-200/80 hover:bg-orange-300/80', bar: 'bg-orange-600' },
  { row: 'bg-indigo-200/80 hover:bg-indigo-300/80', bar: 'bg-indigo-600' },
  { row: 'bg-lime-200/80 hover:bg-lime-300/80', bar: 'bg-lime-600' },
];

// Human-meaningful pins for the well-known cascade types — kept small
// and explicit rather than relying purely on the hash so the most
// common cascades (TTI -> unit quarantine, reactive discard) land on
// intuitive colors. Anything not listed falls back to a deterministic
// hash of module+action so it's still stable across page loads.
const TYPE_COLOR_OVERRIDES = {
  'unit:STATE_TRANSITION': TYPE_COLOR_PALETTE[0], // sky — component status cascades (TTI quarantine/release/discard)
  'tti:UPDATE': TYPE_COLOR_PALETTE[1],
  'tti:RELEASE': TYPE_COLOR_PALETTE[1],
  'bag-discard:CREATE': TYPE_COLOR_PALETTE[3],
  'discard:CREATE': TYPE_COLOR_PALETTE[3],
};

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorForType(moduleName, action) {
  const key = `${moduleName}:${action}`;
  return TYPE_COLOR_OVERRIDES[key] || TYPE_COLOR_PALETTE[hashString(key) % TYPE_COLOR_PALETTE.length];
}

// Clusters ADJACENT rows (current page order only) that belong to the
// same underlying operation, so a batch of cascade entries renders as
// one visually-grouped, consistently-colored block instead of N
// unrelated-looking rows.
function groupAuditRows(rows) {
  const groups = [];
  let current = null;

  for (const entry of rows) {
    const entryTime = entry.at ? new Date(entry.at).getTime() : null;
    const groupKey = entry.requestId
      ? `req:${entry.requestId}`
      : `heur:${entry.module}|${entry.action}|${entry.reason || ''}`;

    const withinWindow =
      current?.lastTime != null && entryTime != null && Math.abs(entryTime - current.lastTime) <= GROUP_TIME_WINDOW_MS;
    const canJoin = current && current.key === groupKey && (Boolean(entry.requestId) || withinWindow);

    if (canJoin) {
      current.entries.push(entry);
      current.lastTime = entryTime;
    } else {
      current = {
        key: groupKey,
        entries: [entry],
        lastTime: entryTime,
        color: colorForType(entry.module, entry.action),
      };
      groups.push(current);
    }
  }
  return groups;
}

export default function AuditTrail() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    module: '', action: '', severity: '', actor: '', entityId: '', q: '', dateFrom: '', dateTo: '',
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const limit = 25;

  const handleFilterChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const { data, isLoading, isError } = useAuditSearch(filters, page, limit);
  const rows = useMemo(() => data?.data || [], [data]);
  const groups = useMemo(() => groupAuditRows(rows), [rows]);
  const pagination = data?.pagination || { totalPages: 1, total: 0 };

  const canView = user && READ_ROLES.includes(user.role);

  const handleExport = async (exportAll) => {
    setExporting(true);
    try {
      const exportFilters = exportAll ? {} : filters;
      const items = await auditApi.export(exportFilters);
      await downloadExcelReport(
        [{
          name: 'Audit Trail',
          title: 'SANJIVANI BLOOD BANK, KOPARGAON',
          subtitle: 'Audit Trail Export',
          reportPeriod: filters.dateFrom || filters.dateTo
            ? `${filters.dateFrom || 'earliest'} to ${filters.dateTo || 'latest'}`
            : 'All Records',
          headers: ['Timestamp', 'Module', 'Entity Type', 'Entity', 'Action', 'Actor Role', 'Reason', 'Changed Fields'],
          rows: items.map((e) => [
            e.at ? new Date(e.at).toLocaleString('en-IN') : '',
            e.module || '',
            e.entityType || '',
            e.entityLabel || e.entityId || '',
            e.action || '',
            e.role || '',
            humanize(e.reason) || '',
            (e.changedFields || []).join(', '),
          ]),
        }],
        `Audit-Trail-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } finally {
      setExporting(false);
    }
  };

  const summary = useMemo(() => ({
    critical: rows.filter((r) => r.severity === 'critical').length,
    warning: rows.filter((r) => r.severity === 'warning').length,
  }), [rows]);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="font-semibold">Access restricted</p>
          <p className="text-sm">Only system-admin, BBO, QA Manager, and Auditor roles can view the audit trail.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-500 text-sm">
              Centralized, append-only record of every clinical and operational mutation across the system.
            </p>
          </div>
        </div>
        <ExportExcelDropdown onExport={handleExport} isLoading={exporting} />
      </div>

      <AuditFilterBar filters={filters} onChange={handleFilterChange} modules={MODULE_OPTIONS} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-sm">
            {pagination.total ?? rows.length} record(s)
          </h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {summary.critical > 0 && <span className="text-red-600 font-semibold">{summary.critical} critical</span>}
            {summary.warning > 0 && <span className="text-amber-600 font-semibold">{summary.warning} warning</span>}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading audit trail…</div>
        ) : isError ? (
          <div className="text-center py-12 text-sm text-red-500">Failed to load audit trail.</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">No audit records matching the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                <tr>
                  <th className="text-left px-4 py-2.5">Timestamp</th>
                  <th className="text-left px-4 py-2.5">Module</th>
                  <th className="text-left px-4 py-2.5">Entity</th>
                  <th className="text-left px-4 py-2.5">Action</th>
                  <th className="text-left px-4 py-2.5">Actor Role</th>
                  <th className="text-left px-4 py-2.5">Reason</th>
                  <th className="text-left px-4 py-2.5">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {groups.map((group) =>
                  group.entries.map((entry) => (
                    <tr
                      key={entry._id || `${entry.entityId}-${entry.at}`}
                      className={`relative cursor-pointer transition-colors ${group.color.row}`}
                      onClick={() => setSelected(entry)}
                    >
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle ${group.color.bar}`} />
                        {entry.at ? new Date(entry.at).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{entry.module || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-700">
                        <span className="font-mono text-xs">{entry.entityLabel || entry.entityId}</span>
                        <span className="text-gray-400 text-xs ml-1">({entry.entityType})</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${ACTION_BADGE[entry.action] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{entry.role || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">{humanize(entry.reason) || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${SEVERITY_BADGE[entry.severity] || SEVERITY_BADGE.info}`}>
                          {entry.severity || 'info'}
                        </span>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-50">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            />
          </div>
        )}
      </div>

      <AuditDetailDrawer isOpen={Boolean(selected)} onClose={() => setSelected(null)} entry={selected} />
    </div>
  );
}

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Search, ArrowUpDown, Undo2, Activity, Ban, Clock } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { checkAccess } from '@/features/user/pages/utils/access';
import { useDeferralList, useLiftDeferral } from '@/features/deferral/queries';
import CustomModal from '@/components/CustomModal';

const PAGE_SIZE = 20;

const daysBetween = (a, b) => Math.ceil((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));

function deferralStatus(entry) {
  if (entry.liftedAt) return 'lifted';
  if (entry.type === 'PERMANENT') return 'active';
  if (entry.untilDate && new Date(entry.untilDate) <= new Date()) return 'expired';
  return 'active';
}

function DaysDeferredCell({ entry }) {
  const status = deferralStatus(entry);
  const now = new Date();
  const since = new Date(entry.createdAt);
  const elapsedDays = Math.max(0, daysBetween(now, since));

  if (entry.type === 'PERMANENT') {
    return (
      <div className="text-xs">
        <span className="font-semibold text-red-700">Permanent</span>
        <div className="text-gray-400">{elapsedDays} days since deferred</div>
      </div>
    );
  }

  if (status === 'lifted') {
    return <span className="text-xs text-gray-500">Lifted</span>;
  }

  if (status === 'expired') {
    return <span className="text-xs text-emerald-600 font-medium">Period ended ({elapsedDays}d ago)</span>;
  }

  const remaining = entry.untilDate ? Math.max(0, daysBetween(new Date(entry.untilDate), now)) : null;
  return (
    <div className="text-xs">
      <span className="font-semibold text-amber-700">{remaining} days remaining</span>
      <div className="text-gray-400">{elapsedDays} days deferred so far</div>
    </div>
  );
}

function StatusBadge({ entry }) {
  const status = deferralStatus(entry);
  const styles = {
    active: 'bg-red-50 text-red-700 border-red-200',
    expired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    lifted: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  const labels = { active: 'Active', expired: 'Period Ended', lifted: 'Lifted' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function DeferralRegister() {
  const { user } = useAuth();
  // Deferral Register lives under Master Register — gate it on that
  // permission, not the general Donor module (see useDonorRegister.js).
  const access = checkAccess(user, ['master register', 'master-register']);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('active');
  const [sortOrder, setSortOrder] = useState('desc');
  const [liftTarget, setLiftTarget] = useState(null);
  const [liftReason, setLiftReason] = useState('');

  const filters = {
    page,
    limit: PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder,
    ...(search ? { search } : {}),
    ...(type ? { type } : {}),
    status,
  };

  const { data, isLoading, isError } = useDeferralList(filters);
  const liftMutation = useLiftDeferral();

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { totalPages: 0, totalCount: 0 };

  const resetFilters = () => {
    setSearch('');
    setType('');
    setStatus('active');
    setSortOrder('desc');
    setPage(1);
  };

  const openLiftModal = (entry) => {
    setLiftTarget(entry);
    setLiftReason('');
  };

  const handleLiftConfirm = async () => {
    if (!liftTarget) return;
    try {
      await liftMutation.mutateAsync({ id: liftTarget.id, data: { reason: liftReason || undefined } });
      toast.success('Deferral lifted');
      setLiftTarget(null);
    } catch (e) {
      toast.error(e?.message || 'Failed to lift deferral');
    }
  };

  const activeCount = items.filter((e) => deferralStatus(e) === 'active').length;
  const permanentCount = items.filter((e) => e.type === 'PERMANENT').length;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4 flex items-center gap-3 text-gray-700 bg-white border-gray-200">
          <Activity className="w-5 h-5 flex-shrink-0 opacity-70" />
          <div>
            <p className="text-xs font-medium opacity-70">Total Records</p>
            <p className="text-2xl font-bold leading-none mt-0.5">{pagination.totalCount ?? 0}</p>
          </div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3 text-red-700 bg-red-50 border-red-200">
          <Clock className="w-5 h-5 flex-shrink-0 opacity-70" />
          <div>
            <p className="text-xs font-medium opacity-70">Active (this page)</p>
            <p className="text-2xl font-bold leading-none mt-0.5">{activeCount}</p>
          </div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3 text-rose-700 bg-rose-50 border-rose-200">
          <Ban className="w-5 h-5 flex-shrink-0 opacity-70" />
          <div>
            <p className="text-xs font-medium opacity-70">Permanent (this page)</p>
            <p className="text-2xl font-bold leading-none mt-0.5">{permanentCount}</p>
          </div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3 text-orange-700 bg-orange-50 border-orange-200">
          <Activity className="w-5 h-5 flex-shrink-0 opacity-70" />
          <div>
            <p className="text-xs font-medium opacity-70">Showing</p>
            <p className="text-2xl font-bold leading-none mt-0.5">{items.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by donor name, ID, or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="PERMANENT">Permanent</option>
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="active">Currently Active</option>
              <option value="lifted">Lifted</option>
              <option value="all">All Records</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            title="Toggle sort order"
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg text-sm text-orange-800 hover:bg-orange-50 transition-colors font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading deferral register…</div>
        ) : isError ? (
          <div className="p-10 text-center text-red-600 text-sm">Failed to load deferral register.</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No deferred donors found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Group</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deferred On</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Deferred</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((entry) => {
                  const canLift = access.canUpdate && deferralStatus(entry) === 'active';
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">
                        {entry.donor?.donorId || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{entry.donor?.name || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {entry.donor?.bloodGroup} {entry.donor?.rh === 'Positive' || entry.donor?.rh === 'POSITIVE' ? '+' : entry.donor?.rh === 'Negative' || entry.donor?.rh === 'NEGATIVE' ? '-' : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.donor?.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                          entry.type === 'PERMANENT'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {entry.type === 'PERMANENT' ? 'Permanent' : 'Temporary'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate" title={entry.reason}>
                        {entry.reason}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <DaysDeferredCell entry={entry} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge entry={entry} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canLift ? (
                          <button
                            onClick={() => openLiftModal(entry)}
                            title="Lift Deferral"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors text-xs font-medium"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Lift
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm">
            <span className="text-gray-500 text-xs">
              {pagination.totalCount} total record{pagination.totalCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
              >
                Previous
              </button>
              <span className="text-xs text-gray-600 px-1">Page {page} / {pagination.totalPages || 1}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                disabled={page >= (pagination.totalPages || 1)}
                className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lift Deferral Modal */}
      <CustomModal
        open={Boolean(liftTarget)}
        title="Lift Donor Deferral"
        description={`Confirm lifting the ${liftTarget?.type === 'PERMANENT' ? 'permanent' : 'temporary'} deferral for ${liftTarget?.donor?.name || 'this donor'}.`}
        onCancel={() => setLiftTarget(null)}
        onConfirm={handleLiftConfirm}
        confirmText={liftMutation.isPending ? 'Lifting...' : 'Lift Deferral'}
        confirmVariant="primary"
      >
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">Remarks (optional)</label>
          <textarea
            value={liftReason}
            onChange={(e) => setLiftReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Reason for lifting this deferral..."
          />
        </div>
      </CustomModal>
    </>
  );
}

import React, { useState } from 'react';
import { RotateCcw, Users, Droplets, Building2, Home, Truck, Hospital as HospitalIcon, AlertTriangle, Trash2, Tent, RefreshCw, Eye, FileSpreadsheet, Loader2 } from 'lucide-react';
import DeletedStockTransferModal from '@/features/mis/components/DeletedStockTransferModal';
import { toast } from 'sonner';
import { downloadExcelReport, buildExportMeta } from '@/utils/excelExportHelper';
import { buildRecycleBinSheet } from '@/features/mis/recycleBinExcel';
import { useDonorList, useRestoreDonor, usePermanentDeleteDonor } from '@/features/donor/queries';
import { useDonationList, useRestoreDonation, usePermanentDeleteDonation } from '@/features/donation/queries';
import { useHospitalList, useRestoreHospital, usePermanentDeleteHospital } from '@/features/hospital/queries';
import { useCampList, useRestoreCamp, usePermanentDeleteCamp } from '@/features/camp/queries';
import { useAffectedRecords } from '@/features/affected-records/queries';
import { useBulkTransferList, useRestoreBulkTransfer } from '@/features/bulk-transfer/queries';
import { useStorageTransferList, useRestoreStorageTransfer } from '@/features/storage-transfer/queries';
import useAccess from '@/features/access/useAccess';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useDeleteWithReason } from '@/hooks/useDeleteWithReason';

const TABS = [
  { key: 'donor', label: 'Donor', icon: Users },
  { key: 'donation', label: 'Donation', icon: Droplets },
  { key: 'stockTransfers', label: 'Stock Transfers', icon: Truck },
  { key: 'hospital', label: 'Hospital', icon: HospitalIcon },
  { key: 'camp', label: 'Camp', icon: Tent },
  { key: 'affected', label: 'Affected Records', icon: AlertTriangle },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

const formatBloodGroup = (bloodGroup, rhFactor) => {
  if (!bloodGroup) return '';
  const baseGroup = bloodGroup.replace(/[\s+−-]+$/, '');
  const rh = String(rhFactor || '').toUpperCase();
  const sign = rh === 'POSITIVE' ? ' +' : rh === 'NEGATIVE' ? ' −' : '';
  return `${baseGroup}${sign}`;
};

// Generic list table for tabs that don't need a bespoke layout (Stock
// Transfers, Hospital, Affected Records) — reuses one table shell instead
// of duplicating the donor/donation table structure for every module.
function SimpleTable({ columns, rows, rowKey, emptyLabel, renderActions }) {
  const colSpan = columns.length + (renderActions ? 1 : 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</th>
            ))}
            {renderActions && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="p-12 text-center text-gray-400 text-sm">{emptyLabel}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-gray-700">{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>
                ))}
                {renderActions && <td className="px-4 py-3 text-right">{renderActions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function RecycleBin() {
  const { can, canViewPage } = useAccess();
  const canPermanentDelete = can('mis', 'delete', 'mis-recycle-bin');
  const canView = canViewPage('mis', 'mis-recycle-bin');

  const [activeTab, setActiveTab] = useState('donor');
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [stockTransferDetail, setStockTransferDetail] = useState(null); // { record, module }
  const [exporting, setExporting] = useState(false);

  const donorQuery = useDonorList({ deletedOnly: true, page: 1, pageSize: 500 });
  const donationQuery = useDonationList({ deletedOnly: true, page: 1, pageSize: 500 });
  const bulkTransferQuery = useBulkTransferList({ deletedOnly: true, page: 1, limit: 200 });
  const storageTransferQuery = useStorageTransferList({ deletedOnly: true, page: 1, limit: 200 });
  const hospitalQuery = useHospitalList({ deletedOnly: true, limit: 500 });
  const campQuery = useCampList({ deletedOnly: true });
  const affectedQuery = useAffectedRecords();

  const restoreDonorMutation = useRestoreDonor();
  const restoreDonationMutation = useRestoreDonation();
  const restoreHospitalMutation = useRestoreHospital();
  const restoreCampMutation = useRestoreCamp();
  const restoreBulkTransferMutation = useRestoreBulkTransfer();
  const restoreStorageTransferMutation = useRestoreStorageTransfer();

  const permanentDeleteDonor = usePermanentDeleteDonor();
  const permanentDeleteDonation = usePermanentDeleteDonation();
  const permanentDeleteHospital = usePermanentDeleteHospital();
  const permanentDeleteCamp = usePermanentDeleteCamp();

  const donorItems = donorQuery.data?.items ?? [];
  const donationItems = donationQuery.data?.items ?? [];
  const stockTransferItems = [
    ...(bulkTransferQuery.data?.data ?? []).map((r) => ({ ...r, __module: 'bulk-transfer' })),
    ...(storageTransferQuery.data?.data ?? []).map((r) => ({ ...r, __module: 'storage-transfer' })),
  ].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const hospitalItems = hospitalQuery.data?.items ?? [];
  const campItems = campQuery.data ?? [];
  const affectedItems = affectedQuery.data ?? [];

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const meta = buildExportMeta({}, {});
      const sheet = buildRecycleBinSheet(
        { donorItems, donationItems, stockTransferItems, hospitalItems, campItems, affectedItems },
        meta,
      );
      await downloadExcelReport([sheet], `Recycle_Bin_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      toast.error('Failed to generate Excel report');
    } finally {
      setExporting(false);
    }
  };

  const openRestoreModal = (item) => {
    setRestoreTarget(item);
    setShowRestoreModal(true);
  };
  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setRestoreTarget(null);
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    try {
      if (activeTab === 'donor') {
        await restoreDonorMutation.mutateAsync(restoreTarget._id || restoreTarget.id);
        toast.success('Donor restored to Master Register');
      } else if (activeTab === 'donation') {
        await restoreDonationMutation.mutateAsync(restoreTarget.id);
        toast.success('Donation restored to Master Register');
      } else if (activeTab === 'hospital') {
        await restoreHospitalMutation.mutateAsync(restoreTarget._id || restoreTarget.id);
        toast.success('Hospital and its requisitions restored');
      } else if (activeTab === 'camp') {
        await restoreCampMutation.mutateAsync(restoreTarget._id || restoreTarget.id);
        toast.success('Camp restored');
      } else if (activeTab === 'stockTransfers') {
        if (restoreTarget.__module === 'bulk-transfer') {
          await restoreBulkTransferMutation.mutateAsync(restoreTarget.id);
        } else {
          await restoreStorageTransferMutation.mutateAsync(restoreTarget.id);
        }
        toast.success('Stock transfer restored — bags re-claimed from stock');
      }
    } catch (e) {
      // Bags are always available or the whole restore is refused — this
      // is the guard the user relies on, so surface the exact reason.
      toast.error(e?.message ?? 'Failed to restore record');
    }
    closeRestoreModal();
  };

  // Permanent delete — one shared reason dialog, reused for every module
  // that already exposes a permanentDelete endpoint (donor, donation,
  // hospital, camp). Recycle-Bin-only, gated to system-admin.
  const { requestDelete: requestPermanentDelete, DeleteReasonDialog: PermanentDeleteDialog } = useDeleteWithReason({
    onDelete: async (item, reason) => {
      const id = item._id || item.id;
      if (item.__module === 'donor') await permanentDeleteDonor.mutateAsync({ id, reason });
      else if (item.__module === 'donation') await permanentDeleteDonation.mutateAsync({ id, reason });
      else if (item.__module === 'hospital') await permanentDeleteHospital.mutateAsync({ id, reason });
      else if (item.__module === 'camp') {
        try {
          await permanentDeleteCamp.mutateAsync({ id, reason });
        } catch (e) {
          if (e?.code === 'CONFLICT') {
            toast.error(e.message || 'Camp has donation records and cannot be permanently deleted.');
            return;
          }
          throw e;
        }
      }
      toast.success('Record permanently deleted');
    },
    title: 'Permanently Delete Record',
    actionLabel: 'Permanently Delete',
    message: 'This cannot be undone. The record and its cascade-deleted descendants will be erased entirely, not just hidden.',
    fieldLabel: 'Reason for Permanent Deletion',
  });

  const isLoading =
    (activeTab === 'donor' && donorQuery.isLoading) ||
    (activeTab === 'donation' && donationQuery.isLoading) ||
    (activeTab === 'stockTransfers' && (bulkTransferQuery.isLoading || storageTransferQuery.isLoading)) ||
    (activeTab === 'hospital' && hospitalQuery.isLoading) ||
    (activeTab === 'camp' && campQuery.isLoading) ||
    (activeTab === 'affected' && affectedQuery.isLoading);

  const isError =
    (activeTab === 'donor' && donorQuery.isError) ||
    (activeTab === 'donation' && donationQuery.isError) ||
    (activeTab === 'stockTransfers' && (bulkTransferQuery.isError || storageTransferQuery.isError)) ||
    (activeTab === 'hospital' && hospitalQuery.isError) ||
    (activeTab === 'camp' && campQuery.isError) ||
    (activeTab === 'affected' && affectedQuery.isError);

  const isFetching =
    (activeTab === 'donor' && donorQuery.isFetching) ||
    (activeTab === 'donation' && donationQuery.isFetching) ||
    (activeTab === 'stockTransfers' && (bulkTransferQuery.isFetching || storageTransferQuery.isFetching)) ||
    (activeTab === 'hospital' && hospitalQuery.isFetching) ||
    (activeTab === 'camp' && campQuery.isFetching) ||
    (activeTab === 'affected' && affectedQuery.isFetching);

  const refetchActive = () => {
    if (activeTab === 'donor') donorQuery.refetch();
    else if (activeTab === 'donation') donationQuery.refetch();
    else if (activeTab === 'stockTransfers') { bulkTransferQuery.refetch(); storageTransferQuery.refetch(); }
    else if (activeTab === 'hospital') hospitalQuery.refetch();
    else if (activeTab === 'camp') campQuery.refetch();
    else if (activeTab === 'affected') affectedQuery.refetch();
  };

  const RestoreButton = ({ onClick, label = 'Recover' }) => (
    <button
      onClick={onClick}
      title={label}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 text-xs font-medium transition-colors"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  const PermanentDeleteButton = ({ item, module }) => canPermanentDelete ? (
    <button
      onClick={() => requestPermanentDelete({ ...item, __module: module })}
      title="Permanently Delete"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-medium transition-colors ml-1.5"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  ) : null;

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="font-semibold">Access restricted</p>
          <p className="text-sm">You don't have permission to view the Recycle Bin. Contact an administrator to request access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                <RotateCcw className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
                <p className="text-gray-500 text-sm">Deleted records across the system — restore them, or view records preserved (not deleted) because they already participate in a completed workflow.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting}
                title="Export all Recycle Bin tabs to Excel"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-green-600" />}
                Export Excel
              </button>
              <button
                type="button"
                onClick={refetchActive}
                disabled={isFetching}
                title="Refresh"
                aria-label="Refresh"
                className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-6 border-b border-gray-200 -mb-px overflow-x-auto">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-orange-800 text-orange-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
          ) : isError ? (
            <div className="p-10 text-center text-red-600 text-sm">Failed to load records.</div>
          ) : activeTab === 'donor' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">DOB</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sex</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Group</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Donation</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason for Deletion</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deleted On</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donorItems.length === 0 ? (
                      <tr><td colSpan={11} className="p-12 text-center text-gray-400 text-sm">No deleted donors.</td></tr>
                    ) : donorItems.map((donor) => {
                      const donorSource = donor.source || 'inhouse';
                      return (
                        <tr key={donor._id || donor.id} className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{donor.donorId || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">
                            {donor.name?.firstName} {donor.name?.middleName || ''} {donor.name?.lastName}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                              donorSource === 'camp'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {donorSource === 'camp' ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                              {donorSource === 'camp' ? 'Camp' : 'Inhouse'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{formatDate(donor.dob)}</td>
                          <td className="px-4 py-3 text-gray-600">{donor.sex}</td>
                          <td className="px-4 py-3 text-gray-600">{donor.phone}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {donor.bloodGroup} {donor.rh === 'Positive' || donor.rh === 'POSITIVE' ? '+' : donor.rh === 'Negative' || donor.rh === 'NEGATIVE' ? '-' : ''}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(donor.lastDonationDate)}</td>
                          <td className="px-4 py-3 text-xs text-gray-700 max-w-[220px]">{donor.deleteReason || <span className="text-gray-400">—</span>}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(donor.deletedAt)}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <RestoreButton onClick={() => openRestoreModal(donor)} />
                            <PermanentDeleteButton item={donor} module="donor" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          ) : activeTab === 'donation' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bag No</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Units</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fitness</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Collected</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deleted On</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donationItems.length === 0 ? (
                      <tr><td colSpan={10} className="p-12 text-center text-gray-400 text-sm">No deleted donations.</td></tr>
                    ) : donationItems.map((d) => {
                      const isCamp = !!d.campId;
                      return (
                      <React.Fragment key={d.id}>
                        <tr className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{d.bagNo || d.donationId}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">
                            {d.donorName || <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                              isCamp
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {isCamp ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                              {isCamp ? 'Camp' : 'Inhouse'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                              {d.donationType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {d.bloodGroup
                              ? formatBloodGroup(d.bloodGroup, d.rhFactor)
                              : <span className="text-gray-400 font-normal text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 font-medium">{d.unitCount}</td>
                          <td className="px-4 py-3">
                            {d.isFit === true && <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200 font-medium">Fit</span>}
                            {d.isFit === false && <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200 font-medium">Unfit</span>}
                            {d.isFit == null && <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(d.collectedAt)}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(d.deletedAt)}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <RestoreButton onClick={() => openRestoreModal(d)} />
                            <PermanentDeleteButton item={d} module="donation" />
                          </td>
                        </tr>
                        {(d.deleteReason || d.deletedWithDonor) && (
                          <tr>
                            <td colSpan={10} className="px-4 pb-3 pt-0 bg-gray-50/50">
                              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                                <span className="font-semibold">Reason for deletion:</span>{' '}
                                {d.deleteReason || '—'}
                                {d.deletedWithDonor && (
                                  <span className="ml-2 text-red-600">
                                    · Deleted together with donor{d.donorName ? ` (${d.donorName})` : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          ) : activeTab === 'stockTransfers' ? (
            <SimpleTable
              emptyLabel="No deleted bulk transfers or storage batches."
              rowKey={(r) => `${r.__module}-${r.id}`}
              columns={[
                { key: 'module', label: 'Source', render: (r) => (r.__module === 'bulk-transfer' ? 'Bulk Transfer' : 'Storage') },
                { key: 'transferId', label: 'Transfer ID' },
                { key: 'bags', label: 'Bags', render: (r) => `${r.items?.length || 0} bag${(r.items?.length || 0) !== 1 ? 's' : ''}` },
                { key: 'deleteReason', label: 'Reason for Deletion', render: (r) => r.deleteReason || '—' },
                { key: 'updatedAt', label: 'Deleted On', render: (r) => formatDate(r.updatedAt) },
              ]}
              rows={stockTransferItems}
              renderActions={(r) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setStockTransferDetail({ record: r, module: r.__module })}
                    title="View bag details"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Bags
                  </button>
                  <RestoreButton onClick={() => openRestoreModal(r)} />
                </div>
              )}
            />
          ) : activeTab === 'hospital' ? (
            <SimpleTable
              emptyLabel="No deleted hospitals."
              rowKey={(h) => h._id || h.id}
              columns={[
                { key: 'hospitalId', label: 'Hospital ID' },
                { key: 'name', label: 'Name' },
                { key: 'contactPerson', label: 'Contact Person' },
                { key: 'phone', label: 'Phone' },
                { key: 'deleteReason', label: 'Reason for Deletion', render: (h) => h.deleteReason || '—' },
                { key: 'deletedAt', label: 'Deleted On', render: (h) => formatDate(h.deletedAt) },
              ]}
              rows={hospitalItems}
              renderActions={(h) => (
                <>
                  <RestoreButton onClick={() => openRestoreModal(h)} />
                  <PermanentDeleteButton item={h} module="hospital" />
                </>
              )}
            />
          ) : activeTab === 'camp' ? (
            <SimpleTable
              emptyLabel="No deleted camps."
              rowKey={(c) => c._id || c.id}
              columns={[
                { key: 'campId', label: 'Camp ID' },
                { key: 'name', label: 'Name' },
                { key: 'address', label: 'Address' },
                { key: 'donationCount', label: 'Donations' },
                { key: 'deleteReason', label: 'Reason for Deletion', render: (c) => c.deleteReason || '—' },
                { key: 'deletedAt', label: 'Deleted On', render: (c) => formatDate(c.deletedAt) },
              ]}
              rows={campItems}
              renderActions={(c) => (
                <>
                  <RestoreButton onClick={() => openRestoreModal(c)} />
                  <PermanentDeleteButton item={c} module="camp" />
                </>
              )}
            />
          ) : (
            <SimpleTable
              emptyLabel="No records currently preserved as affected."
              rowKey={(r) => r.id}
              columns={[
                { key: 'entityType', label: 'Record Type' },
                { key: 'entityLabel', label: 'Record' },
                { key: 'affectedByModule', label: 'Affected By (Parent)', render: (r) => (
                  <span className="capitalize">{r.affectedByModule || '—'}</span>
                ) },
                { key: 'currentStatus', label: 'Current Status' },
                { key: 'affectedReason', label: 'Why Affected' },
                { key: 'affectedDate', label: 'Since', render: (r) => formatDate(r.affectedDate) },
              ]}
              rows={affectedItems}
            />
          )}
        </div>
      </div>

      {/* Recover confirmation modal */}
      <Dialog open={showRestoreModal && !!restoreTarget} onOpenChange={(o) => { if (!o) closeRestoreModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recover Record</DialogTitle>
            <DialogDescription>This record (and everything cascade-deleted with it) will reappear in its normal module.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={closeRestoreModal} className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={handleRestoreConfirm} className="px-3 py-2 rounded-md shadow-sm text-sm bg-slate-900 hover:bg-black text-white">Recover</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {PermanentDeleteDialog}

      <DeletedStockTransferModal
        record={stockTransferDetail?.record}
        module={stockTransferDetail?.module}
        onClose={() => setStockTransferDetail(null)}
      />
    </div>
  );
}

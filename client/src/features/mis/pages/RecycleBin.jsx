import React, { useState } from 'react';
import { RotateCcw, Users, Droplets, Building2, Home, Truck, Hospital as HospitalIcon, AlertTriangle, Trash2, Tent } from 'lucide-react';
import { toast } from 'sonner';
import { useDonorList, useRestoreDonor, usePermanentDeleteDonor } from '@/features/donor/queries';
import { useDonationList, useRestoreDonation, usePermanentDeleteDonation } from '@/features/donation/queries';
import { useVendorList, useRestoreVendor, usePermanentDeleteVendor } from '@/features/bag-procurement/queries';
import { useHospitalList, useRestoreHospital, usePermanentDeleteHospital } from '@/features/hospital/queries';
import { useCampList, useRestoreCamp, usePermanentDeleteCamp } from '@/features/camp/queries';
import { useAffectedRecords } from '@/features/affected-records/queries';
import { useAuth } from '@/store/auth';
import CustomModal from '@/components/CustomModal';
import { useDeleteWithReason } from '@/hooks/useDeleteWithReason';

const TABS = [
  { key: 'donor', label: 'Donor', icon: Users },
  { key: 'donation', label: 'Donation', icon: Droplets },
  { key: 'vendor', label: 'Vendor', icon: Truck },
  { key: 'hospital', label: 'Hospital', icon: HospitalIcon },
  { key: 'camp', label: 'Camp', icon: Tent },
  { key: 'affected', label: 'Affected Records', icon: AlertTriangle },
];

const PERMANENT_DELETE_ROLES = ['system-admin'];
const READ_ROLES = ['system-admin', 'bbo', 'qa-manager', 'auditor'];

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

// Generic list table for tabs that don't need a bespoke layout (Vendor,
// Hospital, Affected Records) — reuses one table shell instead of
// duplicating the donor/donation table structure for every module.
function SimpleTable({ columns, rows, rowKey, emptyLabel, renderActions }) {
  if (rows.length === 0) {
    return <div className="p-12 text-center text-gray-400 text-sm">{emptyLabel}</div>;
  }
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
          {rows.map((row) => (
            <tr key={rowKey(row)} className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-gray-700">{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>
              ))}
              {renderActions && <td className="px-4 py-3 text-right">{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecycleBin() {
  const { user } = useAuth();
  const canPermanentDelete = user && PERMANENT_DELETE_ROLES.includes(user.role);
  const canView = user && READ_ROLES.includes(user.role);

  const [activeTab, setActiveTab] = useState('donor');
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const donorQuery = useDonorList({ deletedOnly: true, page: 1, pageSize: 500 });
  const donationQuery = useDonationList({ deletedOnly: true, page: 1, pageSize: 500 });
  const vendorQuery = useVendorList({ deletedOnly: true, pageSize: 500 });
  const hospitalQuery = useHospitalList({ deletedOnly: true, limit: 500 });
  const campQuery = useCampList({ deletedOnly: true });
  const affectedQuery = useAffectedRecords();

  const restoreDonorMutation = useRestoreDonor();
  const restoreDonationMutation = useRestoreDonation();
  const restoreVendorMutation = useRestoreVendor();
  const restoreHospitalMutation = useRestoreHospital();
  const restoreCampMutation = useRestoreCamp();

  const permanentDeleteDonor = usePermanentDeleteDonor();
  const permanentDeleteDonation = usePermanentDeleteDonation();
  const permanentDeleteVendor = usePermanentDeleteVendor();
  const permanentDeleteHospital = usePermanentDeleteHospital();
  const permanentDeleteCamp = usePermanentDeleteCamp();

  const donorItems = donorQuery.data?.items ?? [];
  const donationItems = donationQuery.data?.items ?? [];
  const vendorItems = vendorQuery.data?.items ?? vendorQuery.data?.vendors ?? (Array.isArray(vendorQuery.data) ? vendorQuery.data : []);
  const hospitalItems = hospitalQuery.data?.items ?? [];
  const campItems = campQuery.data ?? [];
  const affectedItems = affectedQuery.data ?? [];

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
      } else if (activeTab === 'vendor') {
        await restoreVendorMutation.mutateAsync(restoreTarget._id || restoreTarget.id);
        toast.success('Vendor and its purchase orders / goods receipts restored');
      } else if (activeTab === 'hospital') {
        await restoreHospitalMutation.mutateAsync(restoreTarget._id || restoreTarget.id);
        toast.success('Hospital and its requisitions restored');
      } else if (activeTab === 'camp') {
        await restoreCampMutation.mutateAsync(restoreTarget._id || restoreTarget.id);
        toast.success('Camp restored');
      }
    } catch (e) {
      toast.error(e?.message ?? 'Failed to restore record');
    }
    closeRestoreModal();
  };

  // Permanent delete — one shared reason dialog, reused for every module
  // that already exposes a permanentDelete endpoint (donor, vendor,
  // hospital). Recycle-Bin-only, gated to system-admin.
  const { requestDelete: requestPermanentDelete, DeleteReasonDialog: PermanentDeleteDialog } = useDeleteWithReason({
    onDelete: async (item, reason) => {
      const id = item._id || item.id;
      if (item.__module === 'donor') await permanentDeleteDonor.mutateAsync({ id, reason });
      else if (item.__module === 'donation') await permanentDeleteDonation.mutateAsync({ id, reason });
      else if (item.__module === 'vendor') await permanentDeleteVendor.mutateAsync({ id, reason });
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
    (activeTab === 'vendor' && vendorQuery.isLoading) ||
    (activeTab === 'hospital' && hospitalQuery.isLoading) ||
    (activeTab === 'camp' && campQuery.isLoading) ||
    (activeTab === 'affected' && affectedQuery.isLoading);

  const isError =
    (activeTab === 'donor' && donorQuery.isError) ||
    (activeTab === 'donation' && donationQuery.isError) ||
    (activeTab === 'vendor' && vendorQuery.isError) ||
    (activeTab === 'hospital' && hospitalQuery.isError) ||
    (activeTab === 'camp' && campQuery.isError) ||
    (activeTab === 'affected' && affectedQuery.isError);

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
          <p className="text-sm">Only system-admin, BBO, QA Manager, and Auditor roles can view the Recycle Bin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-800 rounded-lg">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
              <p className="text-gray-500 text-sm">Deleted records across the system — restore them, or view records preserved (not deleted) because they already participate in a completed workflow.</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
          ) : isError ? (
            <div className="p-10 text-center text-red-600 text-sm">Failed to load records.</div>
          ) : activeTab === 'donor' ? (
            donorItems.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">No deleted donors.</div>
            ) : (
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
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deleted On</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donorItems.map((donor) => {
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
                          <td className="px-4 py-3 text-xs text-gray-600">{donor.eligibilityStatus || 'N/A'}</td>
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
            )
          ) : activeTab === 'donation' ? (
            donationItems.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">No deleted donations.</div>
            ) : (
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
                    {donationItems.map((d) => {
                      const isCamp = !!d.campId;
                      return (
                        <tr key={d.id} className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === 'vendor' ? (
            <SimpleTable
              emptyLabel="No deleted vendors."
              rowKey={(v) => v._id || v.id}
              columns={[
                { key: 'vendorId', label: 'Vendor ID' },
                { key: 'name', label: 'Name' },
                { key: 'manufacturer', label: 'Manufacturer' },
                { key: 'drugLicenseNo', label: 'Drug License' },
                { key: 'deletedAt', label: 'Deleted On', render: (v) => formatDate(v.deletedAt) },
              ]}
              rows={vendorItems}
              renderActions={(v) => (
                <>
                  <RestoreButton onClick={() => openRestoreModal(v)} />
                  <PermanentDeleteButton item={v} module="vendor" />
                </>
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
                { key: 'affectedByModule', label: 'Affected By (Parent)' },
                { key: 'currentStatus', label: 'Current Status' },
                { key: 'affectedReason', label: 'Why Affected' },
                { key: 'affectedDate', label: 'Since', render: (r) => formatDate(r.affectedDate) },
                { key: 'canAutoRecover', label: 'Auto-Recoverable', render: (r) => (r.canAutoRecover ? 'Yes' : 'No — manual review') },
              ]}
              rows={affectedItems}
            />
          )}
        </div>
      </div>

      {/* Recover confirmation modal */}
      <CustomModal
        open={showRestoreModal && !!restoreTarget}
        title="Recover Record"
        description="This record (and everything cascade-deleted with it) will reappear in its normal module."
        onCancel={closeRestoreModal}
        onConfirm={handleRestoreConfirm}
        confirmText="Recover"
        confirmVariant="primary"
      />

      {PermanentDeleteDialog}
    </div>
  );
}

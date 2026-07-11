import React, { useState } from 'react';
import { RotateCcw, Users, Droplets, Building2, Home } from 'lucide-react';
import { toast } from 'sonner';
import { useDonorList, useRestoreDonor } from '@/features/donor/queries';
import { useDonationList, useRestoreDonation } from '@/features/donation/queries';
import CustomModal from '@/components/CustomModal';

const TABS = [
  { key: 'donor', label: 'Donor', icon: Users },
  { key: 'donation', label: 'Donation', icon: Droplets },
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

export default function RecycleBin() {
  const [activeTab, setActiveTab] = useState('donor');
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const donorQuery = useDonorList({ deletedOnly: true, page: 1, pageSize: 500 });
  const donationQuery = useDonationList({ deletedOnly: true, page: 1, pageSize: 500 });
  const restoreDonorMutation = useRestoreDonor();
  const restoreDonationMutation = useRestoreDonation();

  const donorItems = donorQuery.data?.items ?? [];
  const donationItems = donationQuery.data?.items ?? [];

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
      } else {
        await restoreDonationMutation.mutateAsync(restoreTarget.id);
        toast.success('Donation restored to Master Register');
      }
    } catch (e) {
      toast.error(e?.message ?? 'Failed to restore record');
    }
    closeRestoreModal();
  };

  const isLoading = activeTab === 'donor' ? donorQuery.isLoading : donationQuery.isLoading;
  const isError = activeTab === 'donor' ? donorQuery.isError : donationQuery.isError;

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
              <p className="text-gray-500 text-sm">Deleted donors and donations — restore them back to the Master Register</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-6 border-b border-gray-200 -mb-px">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
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
                            {donor.bloodGroup} {donor.rh === 'Positive' ? '+' : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(donor.lastDonationDate)}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{donor.eligibilityStatus || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(donor.deletedAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openRestoreModal(donor)}
                              title="Recover Donor"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 text-xs font-medium transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Recover
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : donationItems.length === 0 ? (
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
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openRestoreModal(d)}
                            title="Recover Donation"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 text-xs font-medium transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Recover
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recover confirmation modal */}
      <CustomModal
        open={showRestoreModal && !!restoreTarget}
        title={activeTab === 'donor' ? 'Recover Donor' : 'Recover Donation'}
        description={
          activeTab === 'donor'
            ? `Recover donor ${restoreTarget ? (`${restoreTarget?.name?.firstName || ''} ${restoreTarget?.name?.lastName || ''}`.trim() || restoreTarget?.donorId) : ''}? It will reappear in the Master Register.`
            : `Recover donation ${restoreTarget?.bagNo || restoreTarget?.donationId || ''}? It will reappear in the Master Register.`
        }
        onCancel={closeRestoreModal}
        onConfirm={handleRestoreConfirm}
        confirmText="Recover"
        confirmVariant="primary"
      />
    </div>
  );
}

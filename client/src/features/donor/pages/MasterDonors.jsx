import React, { useState } from 'react';
import { Users, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DonorDetails from '@/features/donor/components/DonorDetails';
import DeferralRegister from '@/features/donor/components/DeferralRegister';
import RegisterExportDropdown from '@/components/shared/RegisterExportDropdown';
import { TABS } from './master-donors/constants';
import { tabEmptyText } from './master-donors/donorRegister.utils';
import { useDonorRegister } from './master-donors/useDonorRegister';
import DonorStatsCards from './master-donors/DonorStatsCards';
import DonorFilterBar from './master-donors/DonorFilterBar';
import DonorRegisterTable from './master-donors/DonorRegisterTable';
import DonorEditModal from './master-donors/DonorEditModal';

const DONOR_REGISTERS = [
  { key: 'all', label: 'Master Donor Register (All)' },
  { key: 'inhouse', label: 'Inhouse Donor Register' },
  { key: 'camp', label: 'Camp Donor Register' },
  { key: 'deferral', label: 'Donor Deferral Register' },
];

const MasterDonors = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const reg = useDonorRegister(activeTab);

  const switchTab = (key) => {
    setActiveTab(key);
    reg.resetFilters();
  };

  if (!reg.donorAccess.canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-500">You don't have permission to view the Master Register. Contact an administrator to request access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                <Users className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Master Register — Donors</h1>
                <p className="text-gray-500 text-sm">Donor registry & eligibility</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => reg.refetch()}
                disabled={reg.isFetching}
                title="Refresh"
                aria-label="Refresh"
                className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${reg.isFetching ? 'animate-spin' : ''}`} />
              </button>
              <RegisterExportDropdown onExport={reg.handleExportRegister} isLoading={reg.excelLoading} registers={DONOR_REGISTERS} />
              <button
                onClick={() => navigate('/master-register/donor-creation')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-800 text-white rounded-lg text-sm font-semibold hover:bg-orange-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Donor
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-6 border-b border-gray-200 -mb-px">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {activeTab === 'deferral' ? (
          <DeferralRegister />
        ) : (
          <>
            <DonorStatsCards
              total={reg.total}
              eligible={reg.eligible}
              deferred={reg.deferred}
              showing={reg.items.length}
            />
            <DonorFilterBar
              filters={reg.filters}
              setSearchQuery={reg.setSearchQuery}
              setBloodGroupFilter={reg.setBloodGroupFilter}
              setRhFilter={reg.setRhFilter}
              setEligibilityFilter={reg.setEligibilityFilter}
              setFromDate={reg.setFromDate}
              setToDate={reg.setToDate}
              setSortBy={reg.setSortBy}
              setPage={reg.setPage}
              toggleOrder={reg.toggleOrder}
              resetFilters={reg.resetFilters}
              submitSearch={reg.submitSearch}
            />
            <DonorRegisterTable
              activeTab={activeTab}
              items={reg.items}
              isLoading={reg.isLoading}
              isError={reg.isError}
              emptyText={tabEmptyText(activeTab)}
              donorAccess={reg.donorAccess}
              onView={reg.handleViewDonor}
              onEdit={reg.handleEditDonor}
              onDelete={reg.handleDelete}
              page={reg.page}
              total={reg.total}
              totalPages={reg.totalPages}
              setPage={reg.setPage}
            />
          </>
        )}
      </div>

      {/* Edit Donor Modal */}
      <DonorEditModal
        isOpen={reg.showEditModal}
        donor={reg.selectedDonor}
        onSubmit={reg.handleUpdateDonor}
        onClose={reg.closeEditModal}
        loading={reg.loading}
      />

      {/* Donor Details Modal */}
      <DonorDetails
        donor={reg.selectedDonor}
        isOpen={reg.showDetailsModal}
        onClose={reg.closeDetailsModal}
      />

      {/* Delete confirmation — mandatory reason, soft delete only, donor moves to Recycle Bin */}
      {reg.DeleteReasonDialog}
    </div>
  );
};

export default MasterDonors;

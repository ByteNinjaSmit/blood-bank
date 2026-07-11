import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DonorDetails from '@/features/donor/components/DonorDetails';
import CustomModal from '@/components/CustomModal';
import DeferralRegister from '@/features/donor/components/DeferralRegister';
import RegisterExportDropdown from '@/features/donor/components/RegisterExportDropdown';
import { TABS } from './master-donors/constants';
import { tabEmptyText } from './master-donors/donorRegister.utils';
import { useDonorRegister } from './master-donors/useDonorRegister';
import DonorStatsCards from './master-donors/DonorStatsCards';
import DonorFilterBar from './master-donors/DonorFilterBar';
import DonorRegisterTable from './master-donors/DonorRegisterTable';
import DonorEditModal from './master-donors/DonorEditModal';

const MasterDonors = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const reg = useDonorRegister(activeTab);

  const switchTab = (key) => {
    setActiveTab(key);
    reg.resetFilters();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-800 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Master Register — Donors</h1>
                <p className="text-gray-500 text-sm">Inhouse, Camp & combined master register</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RegisterExportDropdown onExport={reg.handleExportRegister} isLoading={reg.excelLoading} />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
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

      {/* Delete confirmation modal — soft delete only, donor moves to Recycle Bin */}
      <CustomModal
        open={reg.showDeleteModal && !!reg.deleteTarget}
        title="Delete Donor"
        description={`Delete donor ${(reg.deleteTarget && (`${reg.deleteTarget?.name?.firstName || ''} ${reg.deleteTarget?.name?.lastName || ''}`.trim() || reg.deleteTarget?.donorId)) || ''}? It will be moved to the Recycle Bin, where it can be restored or permanently removed.`}
        onCancel={reg.closeDeleteModal}
        onConfirm={reg.handleDeleteConfirm}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default MasterDonors;

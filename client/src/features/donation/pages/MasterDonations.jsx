import React, { useState } from 'react';
import { Droplets, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DonationDetails from '../components/DonationDetails';
import Modal from '@/components/shared/Modal';
import CustomModal from '@/components/CustomModal';
import RegisterExportDropdown from '@/components/shared/RegisterExportDropdown';
import { DONATION_REGISTERS, TABS } from './master-donations/constants';
import { tabEmptyText } from './master-donations/donationRegister.utils';
import { useDonationRegister } from './master-donations/useDonationRegister';
import DonationStatsCards from './master-donations/DonationStatsCards';
import DonationFilterBar from './master-donations/DonationFilterBar';
import DonationRegisterTable from './master-donations/DonationRegisterTable';
import DonationTimelineDrawer from './master-donations/DonationTimelineDrawer';

export default function MasterDonations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const reg = useDonationRegister(activeTab, setActiveTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-800 rounded-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Master Register — Donations</h1>
                <p className="text-gray-500 text-sm">Inhouse, Camp & combined master register</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RegisterExportDropdown onExport={reg.handleExportRegister} isLoading={reg.excelLoading} registers={DONATION_REGISTERS} />
              <button
                onClick={() => navigate('/master-register/donor-creation')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-800 text-white rounded-lg text-sm font-semibold hover:bg-orange-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Donation
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
                  onClick={() => reg.switchTab(tab.key)}
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
        <DonationStatsCards
          totalCount={reg.totalCount}
          fitCount={reg.fitCount}
          unfitCount={reg.unfitCount}
          showing={reg.filteredItems.length}
        />
        <DonationFilterBar
          filters={reg.filters}
          setSearchQuery={reg.setSearchQuery}
          setBagTypeFilter={reg.setBagTypeFilter}
          setBloodGroupFilter={reg.setBloodGroupFilter}
          setStatusFilter={reg.setStatusFilter}
          setFromDate={reg.setFromDate}
          setToDate={reg.setToDate}
          setSortBy={reg.setSortBy}
          toggleOrder={reg.toggleOrder}
          resetFilters={reg.resetFilters}
          onFilterChange={reg.handleFilterChange}
        />
        <DonationRegisterTable
          activeTab={activeTab}
          displayedItems={reg.displayedItems}
          filteredItems={reg.filteredItems}
          isLoading={reg.isLoading}
          isError={reg.isError}
          emptyText={tabEmptyText(activeTab)}
          donationAccess={reg.donationAccess}
          trackId={reg.trackId}
          onTrack={reg.setTrackId}
          onView={reg.setViewDonationId}
          onDelete={reg.handleDelete}
          currentPage={reg.currentPage}
          totalPages={reg.totalPages}
          setCurrentPage={reg.setCurrentPage}
        />
      </div>

      {/* Timeline drawer */}
      {reg.trackId && (
        <DonationTimelineDrawer
          isCampTab={activeTab === 'camp'}
          detail={reg.detail}
          detailLoading={reg.detailLoading}
          onClose={() => reg.setTrackId(null)}
        />
      )}

      {/* Details modal */}
      <Modal
        isOpen={!!reg.viewDonationId}
        onClose={() => reg.setViewDonationId(null)}
        title="Donation Details"
        size="lg"
        className="bg-gradient-to-b from-orange-50 to-white"
      >
        {reg.viewDetailLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading details…</div>
        ) : reg.viewDetail ? (
          <DonationDetails donation={reg.viewDetail} />
        ) : (
          <div className="py-16 text-center text-gray-400 text-sm">Donation not found.</div>
        )}
      </Modal>

      {/* Delete confirmation modal — soft delete only, donation moves to Recycle Bin */}
      <CustomModal
        open={reg.showDeleteModal && !!reg.deleteTarget}
        title="Delete Donation"
        description={`Delete donation ${reg.deleteTarget?.bagNo || reg.deleteTarget?.donationId || ''}? It will be moved to the Recycle Bin, where it can be restored or permanently removed.`}
        onCancel={() => {
          reg.setShowDeleteModal(false);
          reg.setDeleteTarget(null);
        }}
        onConfirm={reg.handleDeleteConfirm}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

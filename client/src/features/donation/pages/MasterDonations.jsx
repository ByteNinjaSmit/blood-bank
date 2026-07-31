import React, { useState } from 'react';
import { Droplets, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DonationDetails from '../components/DonationDetails';
import Modal from '@/components/shared/Modal';
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
              <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                <Droplets className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Master Register — Donations</h1>
                <p className="text-gray-500 text-sm">Inhouse, Camp & combined master register</p>
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
          setSearchInput={reg.setSearchInput}
          setBagTypeFilter={reg.setBagTypeFilter}
          setBloodGroupFilter={reg.setBloodGroupFilter}
          setStatusFilter={reg.setStatusFilter}
          setFromDate={reg.setFromDate}
          setToDate={reg.setToDate}
          setSortBy={reg.setSortBy}
          toggleOrder={reg.toggleOrder}
          resetFilters={reg.resetFilters}
          onFilterChange={reg.handleFilterChange}
          onSearchSubmit={reg.runSearchLookup}
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

      {/* Delete confirmation — mandatory reason, soft delete only, donation moves to Recycle Bin */}
      {reg.DeleteReasonDialog}
    </div>
  );
}

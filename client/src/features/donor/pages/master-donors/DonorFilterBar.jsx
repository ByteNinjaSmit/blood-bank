import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

// Presentational filter bar for the donor register. All state lives in the
// parent hook; this component only renders inputs and calls setters.
export default function DonorFilterBar({
  filters,
  setSearchQuery,
  setBloodGroupFilter,
  setRhFilter,
  setEligibilityFilter,
  setFromDate,
  setToDate,
  setSortBy,
  setPage,
  toggleOrder,
  resetFilters,
}) {
  const { searchQuery, bloodGroupFilter, rhFilter, eligibilityFilter, fromDate, toDate, sortBy, order } = filters;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or donor ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={bloodGroupFilter}
            onChange={(e) => {
              setBloodGroupFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="">All Blood Groups</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="O">O</option>
          </select>
          <select
            value={rhFilter}
            onChange={(e) => {
              setRhFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="">All Rh</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
          </select>
          <select
            value={eligibilityFilter}
            onChange={(e) => {
              setEligibilityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="eligible">Eligible</option>
            <option value="recently-donated">Recently Donated</option>
            <option value="deferred">Deferred</option>
            <option value="temp-deferred">Temp Deferred</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Registered From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Registered To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
          >
            <option value="createdAt">Registered Date</option>
            <option value="lastDonationDate">Last Donation Date</option>
            <option value="name">Name</option>
            <option value="dob">Date of Birth</option>
          </select>
        </div>
        <button
          type="button"
          onClick={toggleOrder}
          title="Toggle sort order"
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
          {order === 'desc' ? 'Newest First' : 'Oldest First'}
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
  );
}

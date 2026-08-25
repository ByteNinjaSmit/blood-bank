import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import SearchBox from '@/components/shared/SearchBox';

// Presentational filter bar for the donation register.
export default function DonationFilterBar({
  filters,
  setSearchInput,
  setBagTypeFilter,
  setBloodGroupFilter,
  setStatusFilter,
  setTtiRetestFilter,
  setFromDate,
  setToDate,
  setSortBy,
  toggleOrder,
  resetFilters,
  onFilterChange,
  onSearchSubmit,
}) {
  const { searchInput, bagTypeFilter, bloodGroupFilter, statusFilter, ttiRetestFilter, fromDate, toDate, sortBy, order } = filters;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBox
            placeholder="Search by bag number or donor name..."
            value={searchInput}
            onChange={setSearchInput}
            onSearch={onSearchSubmit}
            inputClassName="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={bagTypeFilter}
            onChange={(e) => onFilterChange(setBagTypeFilter, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="">All Bag Types</option>
            <option value="SB">Single Bag (SB)</option>
            <option value="DB">Double Bag (DB)</option>
            <option value="TB">Triple Bag (TB)</option>
            <option value="QB">Quadruple Bag (QB)</option>
          </select>
          <select
            value={bloodGroupFilter}
            onChange={(e) => onFilterChange(setBloodGroupFilter, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="">All Blood Groups</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="O">O</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => onFilterChange(setStatusFilter, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="collected">Collected</option>
            <option value="testing">Testing</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="issued">Issued</option>
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ttiRetestFilter}
              onChange={(e) => onFilterChange(setTtiRetestFilter, e.target.checked)}
            />
            TTD Retest Only
          </label>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Collected From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFilterChange(setFromDate, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Collected To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onFilterChange(setToDate, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onFilterChange(setSortBy, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
          >
            <option value="collectedAt">Collection Date</option>
            <option value="bagNo">Bag No</option>
            <option value="donorName">Donor Name</option>
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

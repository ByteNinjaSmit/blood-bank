import React, { useState } from 'react';
import { useLotList } from '../queries';
import { Calendar, AlertCircle, ShieldAlert, CheckCircle, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import SearchBox from '@/components/shared/SearchBox';

export default function ExpiryMonitoring() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');

  const { data: lotsData, isLoading, isFetching, refetch } = useLotList({
    search: searchQuery || undefined,
    status: expiryFilter || undefined,
  });

  const getStatusMeta = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        label: 'Expired',
        color: 'bg-red-50 text-red-700 border-red-200',
        badge: 'bg-red-600 text-white',
        icon: <ShieldAlert className="w-5 h-5 text-red-700" />,
        daysText: `${Math.abs(diffDays)} days ago`,
      };
    } else if (diffDays <= 30) {
      return {
        label: 'Near Expiry (30 Days)',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        badge: 'bg-orange-500 text-white',
        icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
        daysText: `${diffDays} days left`,
      };
    } else if (diffDays <= 90) {
      return {
        label: 'Near Expiry (90 Days)',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        badge: 'bg-yellow-500 text-gray-950',
        icon: <Calendar className="w-5 h-5 text-yellow-600" />,
        daysText: `${diffDays} days left`,
      };
    } else {
      return {
        label: 'Active',
        color: 'bg-green-50 text-green-700 border-green-200',
        badge: 'bg-green-600 text-white',
        icon: <ShieldCheck className="w-5 h-5 text-green-700" />,
        daysText: `${diffDays} days left`,
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <Clock className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expiry Monitoring Dashboard</h1>
            <p className="text-gray-500 text-sm">Chemical expiry tracking</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
          aria-label="Refresh"
          className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <SearchBox
            placeholder="Search by lot number, chemical..."
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => setSearchQuery(searchInput)}
            inputClassName="bg-gray-50 border-gray-200 focus:ring-red-400"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
          {['', 'Active', 'Near Expiry (90 Days)', 'Near Expiry (30 Days)', 'Expired'].map((filter) => (
            <button
              key={filter}
              onClick={() => setExpiryFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                expiryFilter === filter
                  ? 'bg-red-800 text-white border-red-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter || 'All Expiry States'}
            </button>
          ))}
        </div>
      </div>

      {/* Lot List Card Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading expiry records...</div>
      ) : (!lotsData?.items || lotsData.items.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-sm text-gray-500">
          No stock lots matching this expiry status found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lotsData.items.map((lot) => {
            const meta = getStatusMeta(lot.expiryDate);
            return (
              <div key={lot._id} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:border-red-100 transition-colors`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}>
                      {meta.label}
                    </span>
                    {meta.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{lot.chemicalId?.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Category: {lot.chemicalId?.categoryId?.name}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-50 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-semibold text-gray-400 block uppercase text-[9px] tracking-wide">Lot No</span>
                      <span className="font-mono text-gray-800">{lot.lotNumber}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-400 block uppercase text-[9px] tracking-wide">Batch No</span>
                      <span className="font-mono text-gray-800">{lot.batchNumber}</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-5 p-3 rounded-lg border ${meta.color} flex justify-between items-center text-xs`}>
                  <div className="flex flex-col">
                    <span className="font-semibold uppercase text-[9px] tracking-wide block opacity-70">Expiry Date</span>
                    <span className="font-bold">{new Date(lot.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm block">{meta.daysText}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

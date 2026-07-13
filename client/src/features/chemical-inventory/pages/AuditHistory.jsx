import React, { useState } from 'react';
import { useHistoryList, useChemicalList } from '../queries';
import { List, Search, User, Clipboard, Plus, Play, CheckCircle, AlertTriangle, Trash, History } from 'lucide-react';

const ACTION_TYPES = ['PURCHASE', 'OPEN', 'CONSUME', 'ADJUSTMENT', 'EXPIRY_DISCARD', 'DELETE'];

export default function AuditHistory() {
  const [chemicalFilter, setChemicalFilter] = useState('');
  const [lotSearch, setLotSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: chemicals } = useChemicalList();
  const { data: logs, isLoading } = useHistoryList({
    chemicalId: chemicalFilter || undefined,
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'PURCHASE':
        return {
          label: 'Purchase Added',
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: <Plus className="w-4 h-4 text-green-600" />,
        };
      case 'OPEN':
        return {
          label: 'Bottle Opened',
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: <Play className="w-4 h-4 text-orange-600" />,
        };
      case 'CONSUME':
        return {
          label: 'Bottle Consumed',
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <CheckCircle className="w-4 h-4 text-gray-600" />,
        };
      case 'ADJUSTMENT':
        return {
          label: 'Stock Adjustment',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clipboard className="w-4 h-4 text-blue-600" />,
        };
      case 'EXPIRY_DISCARD':
        return {
          label: 'Expired / Discarded',
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        };
      case 'DELETE':
        return {
          label: 'Deleted',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <Trash className="w-4 h-4 text-red-800" />,
        };
      default:
        return {
          label: action,
          color: 'bg-gray-50 text-gray-500 border-gray-200',
          icon: <Clipboard className="w-4 h-4 text-gray-500" />,
        };
    }
  };

  const filteredLogs = (logs || []).filter((log) => {
    if (lotSearch.trim() && !log.lotId?.lotNumber?.toLowerCase().includes(lotSearch.toLowerCase())) return false;
    if (actionFilter && log.action !== actionFilter) return false;
    if (fromDate && new Date(log.createdAt) < new Date(fromDate)) return false;
    if (toDate && new Date(log.createdAt) > new Date(`${toDate}T23:59:59`)) return false;
    return true;
  });

  const fieldClass = 'border border-gray-200 rounded px-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400';

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
          <History className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movement Audit History</h1>
          <p className="text-gray-500 text-sm">Chemical inventory audit history</p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Filter by Chemical</label>
            <select
              value={chemicalFilter}
              onChange={(e) => setChemicalFilter(e.target.value)}
              className={`${fieldClass} w-52`}
            >
              <option value="">All Chemicals</option>
              {(chemicals || []).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Lot Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search Lot Number..."
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
                className={`${fieldClass} pl-8 w-44`}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Action</label>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={`${fieldClass} w-40`}>
              <option value="">All Actions</option>
              {ACTION_TYPES.map((a) => (<option key={a} value={a}>{a.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={fieldClass} />
          </div>
          {(chemicalFilter || lotSearch || actionFilter || fromDate || toDate) && (
            <button
              onClick={() => { setChemicalFilter(''); setLotSearch(''); setActionFilter(''); setFromDate(''); setToDate(''); }}
              className="text-xs font-semibold text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Timeline List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50">
          <h2 className="font-bold text-gray-800 text-sm">Movement Log Records</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading audit history timeline...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">No logs matching search criteria.</div>
        ) : (
          <div className="p-6">
            <div className="relative border-l border-gray-100 ml-4 space-y-6">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div key={log._id} className="relative pl-6">
                    {/* Circle icon marker */}
                    <div className="absolute -left-[14px] top-1.5 p-1 bg-white border border-gray-200 rounded-full shadow-sm">
                      {badge.icon}
                    </div>
                    {/* Log Card */}
                    <div className="p-4 bg-gray-50 hover:bg-red-50/5 border border-gray-100 rounded-lg transition-colors space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{log.chemicalId?.name}</span>
                          <span className="text-xs text-gray-400 font-mono">Lot: {log.lotId?.lotNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{log.remarks}</p>
                      <div className="pt-2 border-t border-gray-100/50 flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold">
                        <User className="w-3.5 h-3.5" />
                        <span>Logged By: {[log.createdBy?.name?.first, log.createdBy?.name?.last].filter(Boolean).join(' ') || log.createdBy?.email || '—'}</span>
                        <span className="mx-1.5">|</span>
                        <span>Quantity Impacted: {log.quantity} unit(s)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

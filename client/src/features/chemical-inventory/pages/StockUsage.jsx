import React, { useState } from 'react';
import { Search, FlaskConical, Play, CheckCircle, Info } from 'lucide-react';
import { useLotList, useUpdateUsage } from '../queries';
import { toast } from 'sonner';

export default function StockUsage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: lotsData, isLoading } = useLotList({
    search: searchQuery || undefined,
    status: statusFilter === 'Expired' ? 'Expired' : undefined,
  });

  const updateUsage = useUpdateUsage();

  const handleOpen = (lotId, qty = 1) => {
    updateUsage.mutateAsync({ id: lotId, action: 'OPEN', quantity: qty })
      .then(() => toast.success('Moved unit from Available to In Use'))
      .catch((err) => toast.error(err.message || 'Action failed'));
  };

  const handleConsume = (lotId, qty = 1) => {
    updateUsage.mutateAsync({ id: lotId, action: 'CONSUME', quantity: qty })
      .then(() => toast.success('Moved unit from In Use to Consumed'))
      .catch((err) => toast.error(err.message || 'Action failed'));
  };

  const filteredLots = (lotsData?.items || []).filter((lot) => {
    // If not Expired filter, let's keep all active lots.
    if (statusFilter === 'In Use') return lot.qtyInUse > 0;
    if (statusFilter === 'Available') return lot.qtyAvailable > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Usage Logic</h1>
        <p className="text-sm text-gray-500 font-medium">Start chemical units (Available ➔ In Use) and complete them (In Use ➔ Consumed)</p>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by lot, batch, chemical name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {['', 'Available', 'In Use', 'Expired'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                statusFilter === filter
                  ? 'bg-red-800 text-white border-red-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter || 'All Stocks'}
            </button>
          ))}
        </div>
      </div>

      {/* Lots Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Chemical / Reagent', 'Lot Details', 'Expiry Date', 'Available', 'In Use', 'Consumed', 'Usage Progress', 'Actions'].map((h) => (
                  <th key={h} className="px-2 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">Loading inventory stock lots...</td></tr>
              ) : filteredLots.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">No active stock lots found.</td></tr>
              ) : filteredLots.map((lot) => {
                const total = lot.qtyPurchased;
                const isExpired = new Date(lot.expiryDate) <= new Date();

                // Compute percentages for visual segmented bar
                const availPct = (lot.qtyAvailable / total) * 100;
                const inUsePct = (lot.qtyInUse / total) * 100;
                const consumedPct = (lot.qtyConsumed / total) * 100;

                return (
                  <tr key={lot._id} className="hover:bg-red-50/10 transition-colors">
                    {/* Chemical Details */}
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-50 rounded-lg text-red-700 shrink-0">
                          <FlaskConical className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-900 truncate">{lot.chemicalId?.name}</span>
                          <span className="text-[10px] text-gray-400 truncate">{lot.chemicalId?.categoryId?.name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Lot Details */}
                    <td className="px-2 py-3 text-xs">
                      <div className="flex flex-col text-gray-600 text-left">
                        <span><span className="font-semibold">Lot:</span> {lot.lotNumber}</span>
                        <span><span className="font-semibold">Batch:</span> {lot.batchNumber}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Inv: {lot.invoiceNumber}</span>
                      </div>
                    </td>

                    {/* Expiry Date */}
                    <td className="px-2 py-3 text-xs">
                      <div className="flex flex-col text-left">
                        <span className={`font-semibold ${isExpired ? 'text-red-700' : 'text-gray-700'}`}>
                          {new Date(lot.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {isExpired ? (
                          <span className="text-[10px] text-red-600 font-bold uppercase">Expired</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            {Math.ceil((new Date(lot.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Available badges */}
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                        {lot.qtyAvailable} Available
                      </span>
                    </td>

                    {/* In Use badges */}
                    <td className="px-2 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${lot.qtyInUse > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        {lot.qtyInUse} In Use
                      </span>
                    </td>

                    {/* Consumed badges */}
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                        {lot.qtyConsumed} Consumed
                      </span>
                    </td>

                    {/* Usage Visual Meter */}
                    <td className="px-2 py-3 w-[140px]">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                          <div style={{ width: `${availPct}%` }} className="h-full bg-green-500" title={`Available: ${lot.qtyAvailable}`} />
                          <div style={{ width: `${inUsePct}%` }} className="h-full bg-orange-500" title={`In Use: ${lot.qtyInUse}`} />
                          <div style={{ width: `${consumedPct}%` }} className="h-full bg-gray-400" title={`Consumed: ${lot.qtyConsumed}`} />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                          <span>Tot: {total}</span>
                          <span>Avail + Use + Cons = {lot.qtyAvailable + lot.qtyInUse + lot.qtyConsumed}</span>
                        </div>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1.5 justify-start">
                        {/* Start Using (Open) */}
                        <button
                          disabled={lot.qtyAvailable === 0 || isExpired}
                          onClick={() => handleOpen(lot._id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-700 text-white text-xs font-bold rounded hover:bg-green-800 disabled:opacity-30 disabled:hover:bg-green-700 transition-colors whitespace-nowrap"
                          title="Open one unit to start using"
                        >
                          <Play className="w-3 h-3 fill-current" /> Open
                        </button>

                        {/* Complete (Consume) */}
                        <button
                          disabled={lot.qtyInUse === 0}
                          onClick={() => handleConsume(lot._id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700 disabled:opacity-30 disabled:hover:bg-orange-600 transition-colors whitespace-nowrap"
                          title="Mark one opened unit as fully consumed"
                        >
                          <CheckCircle className="w-3 h-3" /> Finish
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

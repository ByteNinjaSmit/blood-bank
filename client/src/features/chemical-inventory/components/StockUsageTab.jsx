import React, { useState, useEffect } from 'react';
import { FlaskConical, Play, CheckCircle, RefreshCw } from 'lucide-react';
import { useLotList, useUpdateUsage } from '../queries';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportChemicalUsage } from '@/utils/excelExportHelper';
import { chemicalInventoryApi } from '../api';
import SearchBox from '@/components/shared/SearchBox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

function FinishBoxModal({ isOpen, lot, onClose, onConfirm, isPending }) {
  const [remaining, setRemaining] = useState('0');

  useEffect(() => {
    if (isOpen) setRemaining('0');
  }, [isOpen]);

  if (!lot) return null;

  const maxUnits = lot.unitsPerPack || 96;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Finish Box — {lot.chemicalId?.name}</DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            This box has {maxUnits} wells per pack. Enter how many wells are left over. Enter 0 if the box is fully used up.
          </p>
        </DialogHeader>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Wells Remaining</label>
          <input
            type="number"
            min="0"
            max={maxUnits}
            value={remaining}
            onChange={(e) => setRemaining(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            autoFocus
          />
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(Math.max(0, Math.min(maxUnits, Number(remaining) || 0)))}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
          >
            {isPending ? 'Saving...' : 'Confirm'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StockUsageTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [finishModalLot, setFinishModalLot] = useState(null);

  const { data: lotsData, isLoading, isFetching, refetch } = useLotList({
    search: searchQuery || undefined,
    status: statusFilter === 'Expired' ? 'Expired' : undefined,
    pageSize: 200,
  });

  const updateUsage = useUpdateUsage();

  const isVialTracked = (lot) => lot.packType === 'VIALS' || lot.packType === 'BOX';

  const handleOpen = (lotId, qty = 1) => {
    updateUsage.mutateAsync({ id: lotId, action: 'OPEN', quantity: qty })
      .then(() => toast.success('Moved unit from Available to In Use'))
      .catch((err) => toast.error(err.message || 'Action failed'));
  };

  const handleConsume = (lot, qty = 1) => {
    if (isVialTracked(lot)) {
      setFinishModalLot(lot);
      return;
    }
    updateUsage.mutateAsync({ id: lot._id, action: 'CONSUME', quantity: qty })
      .then(() => toast.success('Moved unit from In Use to Consumed'))
      .catch((err) => toast.error(err.message || 'Action failed'));
  };

  const handleConfirmFinishBox = (vialsRemaining) => {
    if (!finishModalLot) return;
    updateUsage.mutateAsync({ id: finishModalLot._id, action: 'CONSUME', quantity: 1, unitsRemaining: vialsRemaining })
      .then(() => {
        toast.success(
          vialsRemaining > 0
            ? `Box set aside with ${vialsRemaining} wells remaining — resumes on next Open`
            : 'Box fully consumed'
        );
        setFinishModalLot(null);
      })
      .catch((err) => toast.error(err.message || 'Action failed'));
  };

  const filteredLots = (lotsData?.items || [])
    .filter((lot) => {
      // If not Expired filter, let's keep all active lots.
      if (statusFilter === 'In Use') return lot.qtyInUse > 0;
      if (statusFilter === 'Available') return lot.qtyAvailable > 0;
      return true;
    })
    // Group by chemical name (A-Z), then oldest purchase entry on top within each chemical —
    // mirrors FIFO usage order so operators work through older stock first.
    .sort((a, b) => {
      const nameCompare = (a.chemicalId?.name || '').localeCompare(b.chemicalId?.name || '');
      if (nameCompare !== 0) return nameCompare;
      return new Date(a.purchaseDate) - new Date(b.purchaseDate);
    });

  const [excelLoading, setExcelLoading] = useState(false);

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let rawLots = [];
      if (exportAll) {
        const res = await chemicalInventoryApi.lot.list({
          search: searchQuery || undefined,
          status: statusFilter === 'Expired' ? 'Expired' : undefined,
          limit: 5000,
        });
        const items = res?.items || res || [];
        rawLots = items.filter((lot) => {
          if (statusFilter === 'In Use') return lot.qtyInUse > 0;
          if (statusFilter === 'Available') return lot.qtyAvailable > 0;
          return true;
        });
      } else {
        rawLots = filteredLots;
      }

      if (rawLots.length === 0) {
        toast.info("No records to export");
        return;
      }

      const dataToExport = rawLots.map(lot => ({
        _id: lot._id,
        chemicalName: lot.chemicalId?.name || '—',
        category: lot.chemicalId?.categoryId?.name || '—',
        lotNumber: lot.lotNumber || '—',
        batchNumber: lot.batchNumber || '—',
        invoiceNumber: lot.invoiceNumber || '—',
        expiryDate: lot.expiryDate,
        qtyPurchased: lot.qtyPurchased ?? 0,
        qtyAvailable: lot.qtyAvailable ?? 0,
        qtyInUse: lot.qtyInUse ?? 0,
        qtyConsumed: lot.qtyConsumed ?? 0,
      }));

      await exportChemicalUsage(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex justify-end gap-2">
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
        <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <SearchBox
            placeholder="Search by lot, batch, chemical name..."
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => setSearchQuery(searchInput)}
            inputClassName="bg-gray-50 border-gray-200 focus:ring-red-400"
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
                        {isVialTracked(lot) && (
                          <div className="text-[9px] font-semibold">
                            {lot.openBoxUnitsRemaining != null ? (
                              <span className="text-amber-700">Open box: {lot.openBoxUnitsRemaining}/{lot.unitsPerPack || 96} wells left</span>
                            ) : (
                              <span className="text-gray-400">{lot.unitsPerPack || 96} wells/box</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1.5 justify-start">
                        {/* Start Using (Open) */}
                        <button
                          disabled={
                            isExpired ||
                            (lot.qtyAvailable === 0 && !(isVialTracked(lot) && (lot.openBoxUnitsRemaining ?? 0) > 0))
                          }
                          onClick={() => handleOpen(lot._id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-700 text-white text-xs font-bold rounded hover:bg-green-800 disabled:opacity-30 disabled:hover:bg-green-700 transition-colors whitespace-nowrap"
                          title={
                            isVialTracked(lot) && (lot.openBoxUnitsRemaining ?? 0) > 0
                              ? 'Resume the box already in progress'
                              : 'Open one unit to start using'
                          }
                        >
                          <Play className="w-3 h-3 fill-current" /> Open
                        </button>

                        {/* Complete (Consume) */}
                        <button
                          disabled={lot.qtyInUse === 0}
                          onClick={() => handleConsume(lot)}
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

      <FinishBoxModal
        isOpen={Boolean(finishModalLot)}
        lot={finishModalLot}
        isPending={updateUsage.isPending}
        onClose={() => setFinishModalLot(null)}
        onConfirm={handleConfirmFinishBox}
      />
    </div>
  );
}

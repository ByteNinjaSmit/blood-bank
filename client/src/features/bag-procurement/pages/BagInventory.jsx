import { useState } from 'react';
import { Warehouse, AlertTriangle } from 'lucide-react';
import { useBagStockList, useOpenBagStockBox } from '../queries';
import { useStockSummary } from '@/features/inventory/queries';
import { formatBloodBagQty } from '../utils/qtyHelper';

const STATUS_BADGE = {
  AVAILABLE:    'bg-green-50 text-green-700 border-green-200',
  LOW_STOCK:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  OUT_OF_STOCK: 'bg-red-50 text-red-700 border-red-200',
  QUARANTINE:   'bg-orange-50 text-orange-700 border-orange-200',
  EXPIRED:      'bg-gray-100 text-gray-600 border-gray-200',
};

const BAG_TYPE_COLORS = {
  SINGLE:     'bg-blue-50 text-blue-700 border-blue-200',
  DOUBLE:     'bg-purple-50 text-purple-700 border-purple-200',
  TRIPLE:     'bg-rose-50 text-rose-700 border-rose-200',
  QUADRUPLE:  'bg-amber-50 text-amber-700 border-amber-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function SummaryCard({ bagType, count }) {
  const colorClass = BAG_TYPE_COLORS[bagType] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <div className="text-2xl font-bold">{count ?? 0}</div>
      <div className="text-xs font-semibold uppercase tracking-wide mt-0.5">{bagType}</div>
      <div className="text-xs opacity-75 mt-0.5">{formatBloodBagQty(count)}</div>
    </div>
  );
}

function isNearExpiry(dateStr) {
  if (!dateStr) return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMPONENT_THEMES = {
  RBC: {
    bgClass: 'bg-red-50/20 border-red-100',
    titleClass: 'text-red-800 border-red-200',
    labelClass: 'bg-red-700 text-white',
    activeBubble: 'border-red-300 bg-red-50 text-red-800',
    activeText: 'text-red-900',
    activeBgLabel: 'text-red-700',
  },
  FFP: {
    bgClass: 'bg-amber-50/20 border-amber-100',
    titleClass: 'text-amber-800 border-amber-200',
    labelClass: 'bg-amber-700 text-white',
    activeBubble: 'border-amber-300 bg-amber-50 text-amber-800',
    activeText: 'text-amber-900',
    activeBgLabel: 'text-amber-700',
  },
  Platelets: {
    bgClass: 'bg-yellow-50/20 border-yellow-100',
    titleClass: 'text-yellow-800 border-yellow-200',
    labelClass: 'bg-yellow-700 text-white',
    activeBubble: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    activeText: 'text-yellow-900',
    activeBgLabel: 'text-yellow-700',
  },
  Cryo: {
    bgClass: 'bg-blue-50/20 border-blue-100',
    titleClass: 'text-blue-800 border-blue-200',
    labelClass: 'bg-blue-700 text-white',
    activeBubble: 'border-blue-300 bg-blue-50 text-blue-800',
    activeText: 'text-blue-900',
    activeBgLabel: 'text-blue-700',
  },
};

function ComponentStockLines({ stockSummary }) {
  const initialStock = () => ({ 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 });
  const stocks = {
    RBC: initialStock(),
    FFP: initialStock(),
    Platelets: initialStock(),
    Cryo: initialStock(),
  };

  if (stockSummary && Array.isArray(stockSummary)) {
    stockSummary.forEach((s) => {
      let type = s.componentType;
      if (type === 'PRBC' || type === 'RBC') type = 'RBC';
      else if (type === 'FFP') type = 'FFP';
      else if (type === 'PLATELET_CONCENTRATE' || type === 'Platelet' || type === 'PLATELET') type = 'Platelets';
      else if (type === 'CRYOPRECIPITATE' || type === 'Cryo' || type === 'CRYO') type = 'Cryo';
      else return;
      
      const rh = s.rhFactor === 'POSITIVE' || s.rhFactor === 'Positive' ? '+' : s.rhFactor === 'NEGATIVE' || s.rhFactor === 'Negative' ? '-' : '';
      const key = `${s.aboGroup}${rh}`;
      if (stocks[type] && stocks[type][key] !== undefined) {
        stocks[type][key] += s.count;
      }
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 overflow-hidden">
      <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2 text-red-800">
        Blood Component Stock Summary
      </h2>
      
      <div className="overflow-x-auto overflow-y-hidden pb-2">
        <div className="min-w-[680px]">
          {/* Header Row */}
          <div className="flex items-center gap-4 mb-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-[120px] text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Component</div>
            <div className="flex-1 flex items-center justify-between">
              {BLOOD_GROUPS.map((bg, idx) => (
                <div key={bg} className="flex items-center justify-center flex-1">
                  {idx > 0 && <div className="h-4 w-[1px] bg-gray-300 mr-4" />}
                  <span className="text-xs font-extrabold text-gray-700 w-12 text-center uppercase tracking-wider">
                    {bg}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {Object.keys(stocks).map((type) => {
              const theme = COMPONENT_THEMES[type];
              const data = stocks[type];
              return (
                <div key={type} className={`flex items-center gap-4 p-3 rounded-xl border ${theme.bgClass}`}>
                  {/* Left Label */}
                  <div className="w-[120px] flex items-center">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${theme.labelClass} shadow-sm text-center w-full`}>
                      {type}
                    </span>
                  </div>

                  {/* Stock Columns */}
                  <div className="flex-1 flex items-center justify-between">
                    {BLOOD_GROUPS.map((bg, idx) => {
                      const count = data[bg] ?? 0;
                      const hasStock = count > 0;
                      return (
                        <div key={bg} className="flex items-center justify-center flex-1">
                          {idx > 0 && <div className="h-8 w-[1px] bg-gray-200 mr-4" />}
                          <div className={`flex items-center justify-center w-12 h-10 rounded-full border transition-all duration-200 ${
                            hasStock 
                              ? `${theme.activeBubble} shadow-sm font-black` 
                              : 'border-gray-200 bg-gray-50/30 text-gray-400 font-medium'
                          }`}>
                            <span className="text-xs">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BagInventory() {
  const { data, isLoading } = useBagStockList({});
  const { data: stockSummaryData } = useStockSummary();
  const openBoxMutation = useOpenBagStockBox();

  const [confirmOpenBoxId, setConfirmOpenBoxId] = useState(null);
  const [confirmOpenBoxBatch, setConfirmOpenBoxBatch] = useState('');

  const stocks   = data?.items ?? data?.bagStocks ?? (Array.isArray(data) ? data : []);

  const doubleStocks = stocks.filter((s) => s.bagType === 'DOUBLE');
  const tripleStocks = stocks.filter((s) => s.bagType === 'TRIPLE');

  const doubleRemaining = doubleStocks.reduce((sum, s) => sum + (s.openingStock + s.receivedQty - s.issuedQty - s.damagedQty - s.discardedQty), 0);
  const doubleUsed = doubleStocks.reduce((sum, s) => sum + s.issuedQty, 0);

  const tripleRemaining = tripleStocks.reduce((sum, s) => sum + (s.openingStock + s.receivedQty - s.issuedQty - s.damagedQty - s.discardedQty), 0);
  const tripleUsed = tripleStocks.reduce((sum, s) => sum + s.issuedQty, 0);

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const formatRemainingStock = (unopenedBoxes, closingStock) => {
    const openedBags = Math.max(0, closingStock - unopenedBoxes * 45);
    const pkts = Math.floor(openedBags / 5);
    const bags = openedBags % 5;
    return `${unopenedBoxes} Box + ${pkts} Packets + ${bags} Bags`;
  };

  const handleOpenBox = (id, batchNo) => {
    setConfirmOpenBoxId(id);
    setConfirmOpenBoxBatch(batchNo);
  };

  const confirmOpenBox = async () => {
    if (!confirmOpenBoxId) return;
    try {
      await openBoxMutation.mutateAsync(confirmOpenBoxId);
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmOpenBoxId(null);
      setConfirmOpenBoxBatch('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Blood Bag Stock Register</h1>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Inventory Overview</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ComponentStockLines stockSummary={stockSummaryData} />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-purple-50 rounded-xl border border-purple-200 shadow-sm p-4">
            <div className="text-2xl font-bold text-purple-700">{doubleRemaining}</div>
            <div className="text-xs text-purple-500 font-semibold uppercase tracking-wide mt-0.5">Double Bags Remaining</div>
            <div className="text-xs opacity-75 mt-0.5 text-purple-600">{formatBloodBagQty(doubleRemaining)}</div>
          </div>
          <div className="bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm p-4">
            <div className="text-2xl font-bold text-indigo-700">{doubleUsed}</div>
            <div className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mt-0.5">Double Bags Used</div>
            <div className="text-xs opacity-75 mt-0.5 text-indigo-600">{formatBloodBagQty(doubleUsed)}</div>
          </div>
          <div className="bg-rose-50 rounded-xl border border-rose-200 shadow-sm p-4">
            <div className="text-2xl font-bold text-rose-700">{tripleRemaining}</div>
            <div className="text-xs text-rose-500 font-semibold uppercase tracking-wide mt-0.5">Triple Bags Remaining</div>
            <div className="text-xs opacity-75 mt-0.5 text-rose-600">{formatBloodBagQty(tripleRemaining)}</div>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4">
            <div className="text-2xl font-bold text-amber-700">{tripleUsed}</div>
            <div className="text-xs text-amber-500 font-semibold uppercase tracking-wide mt-0.5">Triple Bags Used</div>
            <div className="text-xs opacity-75 mt-0.5 text-amber-600">{formatBloodBagQty(tripleUsed)}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
            <span className="text-gray-600">Expiry &lt; 30 days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
            <span className="text-gray-600">Zero stock</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Bag Type', 'Batch No', 'Expiry', 'Total Ordered', 'Remaining Stock', 'Issued', 'Discarded', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : stocks.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : stocks.map((s) => {
                  const closing = (s.openingStock ?? 0) + (s.receivedQty ?? 0)
                    - (s.issuedQty ?? 0) - (s.damagedQty ?? 0) - (s.discardedQty ?? 0);
                  const nearExpiry = isNearExpiry(s.expiryDate);
                  const zeroStock  = closing === 0;

                  const statusVal = zeroStock ? 'OUT_OF_STOCK' : (s.unopenedBoxes === 0 ? 'LOW_STOCK' : 'AVAILABLE');

                  const rowClass = zeroStock
                    ? 'bg-red-50/60 hover:bg-red-100/40'
                    : nearExpiry
                    ? 'bg-yellow-50/60 hover:bg-yellow-100/40'
                    : 'hover:bg-orange-50/20';

                  return (
                    <tr key={s.id} className={`transition-colors ${rowClass}`}>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${BAG_TYPE_COLORS[s.bagType] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {s.bagType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{s.batchNumber || s.batchNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          {fmtDate(s.expiryDate)}
                          {nearExpiry && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {Math.floor(s.receivedQty / 45)} Box
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 font-semibold">
                        {formatRemainingStock(s.unopenedBoxes, closing)} ({closing} bags)
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{formatBloodBagQty(s.issuedQty ?? 0)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{formatBloodBagQty(s.discardedQty ?? 0)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={statusVal} />
                          <span className="text-[10px] text-gray-500 font-semibold whitespace-nowrap">
                            Opened bags for use: {Math.max(0, closing - (s.unopenedBoxes ?? 0) * 45)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleOpenBox(s.id, s.batchNumber || s.batchNo)}
                          disabled={s.unopenedBoxes <= 0 || openBoxMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-700 text-white text-xs font-semibold rounded hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                          Open Box
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpenBoxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-green-55 rounded-full text-green-600 mb-4 border border-green-100">
                <Warehouse className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-950 mb-2">Open Blood Bag Box?</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Are you sure you want to open one box from batch <span className="font-mono font-bold text-gray-800">{confirmOpenBoxBatch}</span>? This will make <span className="font-semibold text-green-700">45 bags</span> available for use.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => {
                    setConfirmOpenBoxId(null);
                    setConfirmOpenBoxBatch('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-55 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOpenBox}
                  disabled={openBoxMutation.isPending}
                  className="flex-1 py-2 px-4 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 active:bg-green-900 transition-colors shadow-sm disabled:opacity-50"
                >
                  {openBoxMutation.isPending ? 'Opening...' : 'Open Box'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

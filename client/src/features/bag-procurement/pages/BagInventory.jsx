import { Warehouse, AlertTriangle } from 'lucide-react';
import { useBagStockList, useBagStockSummary } from '../queries';
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

export default function BagInventory() {
  const { data, isLoading } = useBagStockList({});
  const { data: summaryData } = useBagStockSummary();

  const stocks   = data?.items ?? data?.bagStocks ?? (Array.isArray(data) ? data : []);
  const summary  = summaryData ?? {};

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

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
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['SINGLE', 'DOUBLE', 'TRIPLE', 'QUADRUPLE'].map((t) => (
            <SummaryCard key={t} bagType={t} count={summary[t.toLowerCase()] ?? summary[t]} />
          ))}
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
                  {['Bag Type', 'Manufacturer', 'Batch No', 'Expiry', 'Opening', 'Received', 'Issued', 'Damaged', 'Discarded', 'Closing Stock', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={11} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : stocks.length === 0 ? (
                  <tr><td colSpan={11} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : stocks.map((s) => {
                  const closing = (s.openingStock ?? 0) + (s.quantityReceived ?? 0)
                    - (s.quantityIssued ?? 0) - (s.quantityDamaged ?? 0) - (s.quantityDiscarded ?? 0);
                  const nearExpiry = isNearExpiry(s.expiryDate);
                  const zeroStock  = closing === 0;

                  const rowClass = zeroStock
                    ? 'bg-red-50/60 hover:bg-red-100/40'
                    : nearExpiry
                    ? 'bg-yellow-50/60 hover:bg-yellow-100/40'
                    : 'hover:bg-orange-50/20';

                  return (
                    <tr key={s._id} className={`transition-colors ${rowClass}`}>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${BAG_TYPE_COLORS[s.bagType] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {s.bagType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{s.manufacturerName || s.vendor?.vendorName || '—'}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{s.batchNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          {fmtDate(s.expiryDate)}
                          {nearExpiry && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{formatBloodBagQty(s.openingStock)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{formatBloodBagQty(s.quantityReceived)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{formatBloodBagQty(s.quantityIssued)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{formatBloodBagQty(s.quantityDamaged)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{formatBloodBagQty(s.quantityDiscarded)}</td>
                      <td className="px-4 py-3 text-xs font-bold">
                        <span className={zeroStock ? 'text-red-600' : 'text-gray-900'}>{formatBloodBagQty(closing)}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

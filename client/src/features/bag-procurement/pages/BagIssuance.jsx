import { useState } from 'react';
import { Syringe, Plus, X } from 'lucide-react';
import {
  useBagIssueList,
  useIssueBag,
  useMarkBagUsed,
  useReturnBag,
  useMarkBagDamaged,
} from '../queries';
import { useBagStockList } from '../queries';

const STATUS_BADGE = {
  ISSUED:   'bg-blue-50 text-blue-700 border-blue-200',
  USED:     'bg-purple-50 text-purple-700 border-purple-200',
  RETURNED: 'bg-green-50 text-green-700 border-green-200',
  DAMAGED:  'bg-red-50 text-red-700 border-red-200',
};

const COLLECTION_ROOMS = ['Room 1', 'Room 2', 'Room 3', 'Mobile Unit', 'Camp Site'];

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function IssueDrawer({ onClose, stockItems }) {
  const [stockId, setStockId] = useState('');
  const [collectionRoom, setCollectionRoom] = useState('');
  const issueBag = useIssueBag();

  const selected = stockItems.find((s) => s._id === stockId);

  const handleSubmit = (e) => {
    e.preventDefault();
    issueBag.mutateAsync({
      stockId,
      bagType: selected?.bagType,
      collectionRoom,
    }).then(onClose).catch(() => {});
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">Issue Bag for Collection</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Stock Item *</label>
            <select required value={stockId} onChange={(e) => setStockId(e.target.value)} className={fieldClass}>
              <option value="">Select stock item...</option>
              {stockItems.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.bagType} — Batch {s.batchNo} (Avail: {s.closingStock ?? s.quantityAvailable ?? 0})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">Bag Type</span>
                <span className="font-semibold text-gray-800">{selected.bagType}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">Manufacturer</span>
                <span>{selected.manufacturerName || '—'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">Batch No</span>
                <span className="font-mono">{selected.batchNo}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">Expiry</span>
                <span>{selected.expiryDate
                  ? new Date(selected.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Collection Room *</label>
            <select required value={collectionRoom} onChange={(e) => setCollectionRoom(e.target.value)} className={fieldClass}>
              <option value="">Select room...</option>
              {COLLECTION_ROOMS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={issueBag.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {issueBag.isPending ? 'Issuing…' : 'Issue Bag'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function BagIssuance() {
  const [showDrawer, setShowDrawer] = useState(false);
  const { data, isLoading } = useBagIssueList({});
  const { data: stockData } = useBagStockList({ status: 'AVAILABLE' });
  const markUsed    = useMarkBagUsed();
  const returnBag   = useReturnBag();
  const markDamaged = useMarkBagDamaged();

  const issues    = data?.bagIssues ?? data ?? [];
  const stockItems = stockData?.bagStocks ?? stockData ?? [];

  const stats = {
    total:    issues.length,
    inUse:    issues.filter((i) => i.status === 'ISSUED').length,
    returned: issues.filter((i) => i.status === 'RETURNED').length,
    damaged:  issues.filter((i) => i.status === 'DAMAGED').length,
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <Syringe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bag Issuance for Collection</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Blood Collection Ops</p>
            </div>
          </div>
          <button onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
            <Plus className="w-4 h-4" /> Issue New Bag
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Issued" value={stats.total}    color="text-gray-900" />
          <StatCard label="In Use"       value={stats.inUse}    color="text-blue-700" />
          <StatCard label="Returned"     value={stats.returned} color="text-green-700" />
          <StatCard label="Damaged"      value={stats.damaged}  color="text-red-700" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Issue No', 'Bag Serial No', 'Bag Type', 'Batch No', 'Issued By', 'Issue Date', 'Collection Room', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : issues.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : issues.map((iss) => (
                  <tr key={iss._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{iss.issueNo ?? iss._id?.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{iss.bagSerialNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{iss.bagType}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{iss.batchNo ?? iss.stock?.batchNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{iss.issuedBy?.name ?? iss.issuedById ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(iss.issueDate ?? iss.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{iss.collectionRoom ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={iss.status} /></td>
                    <td className="px-4 py-3">
                      {iss.status === 'ISSUED' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => markUsed.mutate({ id: iss._id, data: {} })}
                            className="px-2 py-1 text-xs font-medium text-purple-700 border border-purple-200 rounded-md hover:bg-purple-50">
                            Used
                          </button>
                          <button onClick={() => returnBag.mutate(iss._id)}
                            className="px-2 py-1 text-xs font-medium text-green-700 border border-green-200 rounded-md hover:bg-green-50">
                            Return
                          </button>
                          <button onClick={() => markDamaged.mutate({ id: iss._id, data: {} })}
                            className="px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50">
                            Damaged
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <IssueDrawer onClose={() => setShowDrawer(false)} stockItems={stockItems} />}
    </div>
  );
}

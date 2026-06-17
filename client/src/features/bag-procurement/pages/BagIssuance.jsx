import { useState } from 'react';
import { Syringe, Plus, X } from 'lucide-react';
import {
  useBagIssueList,
  useBagIssueDetail,
  useIssueBag,
  useMarkBagUsed,
  useReturnBag,
  useMarkBagDamaged,
} from '../queries';
import { useBagStockList } from '../queries';
import { formatBloodBagQty } from '../utils/qtyHelper';

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
                  {s.bagType} — Batch {s.batchNo} (Avail: {formatBloodBagQty(s.closingStock ?? s.quantityAvailable ?? 0)})
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
  const [viewingIssueId, setViewingIssueId] = useState(null);
  const { data, isLoading } = useBagIssueList({});
  const { data: stockData } = useBagStockList({ status: 'AVAILABLE' });
  const markUsed    = useMarkBagUsed();
  const returnBag   = useReturnBag();
  const markDamaged = useMarkBagDamaged();

  const issues    = data?.items ?? data?.bagIssues ?? (Array.isArray(data) ? data : []);
  const stockItems = stockData?.items ?? stockData?.bagStocks ?? (Array.isArray(stockData) ? stockData : []);

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
                  {['Issue No', 'Bag Serial No', 'Bag Type', 'Batch No', 'Segment No', 'Issued By', 'Issue Date', 'Collection Room', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : issues.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : issues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{iss.issueNumber ?? iss.issueNo ?? iss.id?.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{iss.bagSerialNumber ?? iss.bagSerialNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{iss.bagType}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{iss.batchNumber ?? iss.batchNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-purple-850 font-semibold">{iss.segmentNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{iss.issuedBy?.name ?? iss.issuedById ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(iss.issueDate ?? iss.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{iss.collectionRoom ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={iss.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewingIssueId(iss.id)}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors shadow-2xs bg-white">
                          View
                        </button>
                        {iss.status === 'ISSUED' && (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => markUsed.mutate({ id: iss.id, data: {} })}
                              className="px-2 py-1 text-xs font-medium text-purple-700 border border-purple-200 rounded-md hover:bg-purple-50">
                              Used
                            </button>
                            <button onClick={() => returnBag.mutate(iss.id)}
                              className="px-2 py-1 text-xs font-medium text-green-700 border border-green-200 rounded-md hover:bg-green-50">
                              Return
                            </button>
                            <button onClick={() => markDamaged.mutate({ id: iss.id, data: {} })}
                              className="px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50">
                              Damaged
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <IssueDrawer onClose={() => setShowDrawer(false)} stockItems={stockItems} />}
      {viewingIssueId && <ViewIssueModal id={viewingIssueId} onClose={() => setViewingIssueId(null)} />}
    </div>
  );
}

function ViewIssueModal({ id, onClose }) {
  const { data: issue, isLoading } = useBagIssueDetail(id);

  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-4 border-orange-850 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500 font-medium">Loading bag details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 text-center">
            <p className="text-red-500 font-medium">Failed to load bag issue details.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  const donor = typeof issue.donorId === 'object' ? issue.donorId : null;
  const donation = typeof issue.donationId === 'object' ? issue.donationId : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-orange-800 to-orange-900">
            <h2 className="text-base font-bold text-white">Bag Issuance Information</h2>
            <button onClick={onClose} className="text-orange-250 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Bag Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-1">Bag & Collection Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><span className="text-gray-500 font-medium">Issue No:</span> <span className="font-mono text-gray-900 font-semibold">{issue.issueNumber}</span></div>
                <div><span className="text-gray-500 font-medium">Bag Serial No:</span> <span className="font-mono text-gray-900 font-semibold">{issue.bagSerialNumber}</span></div>
                <div><span className="text-gray-500 font-medium">Bag Type:</span> <span className="text-gray-800 font-semibold">{issue.bagType}</span></div>
                <div><span className="text-gray-500 font-medium">Batch No:</span> <span className="font-mono text-gray-800 font-semibold">{issue.batchNumber}</span></div>
                <div><span className="text-gray-500 font-medium">Collection Room:</span> <span className="text-gray-800">{issue.collectionRoom || '—'}</span></div>
                <div><span className="text-gray-500 font-medium">Issue Date:</span> <span className="text-gray-800">{new Date(issue.issueDate).toLocaleString('en-IN')}</span></div>
                <div><span className="text-gray-500 font-medium">Current Status:</span> <span className="capitalize text-gray-800 font-bold">{issue.status}</span></div>
                {issue.notes && <div className="col-span-2"><span className="text-gray-500 font-medium">Notes:</span> <span className="text-gray-800 italic">{issue.notes}</span></div>}
              </div>
            </div>

            {/* Donor Details */}
            {donor ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wider border-b pb-1">
                  Donor Information
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-orange-50/20 border border-orange-100 rounded-xl p-4">
                  <div>
                    <span className="text-gray-500 font-medium">Name:</span>{' '}
                    <span className="text-gray-900 font-bold">
                      {[donor.name?.firstName, donor.name?.middleName, donor.name?.lastName].filter(Boolean).join(' ')}
                    </span>
                  </div>
                  <div><span className="text-gray-500 font-medium">Donor ID:</span> <span className="font-mono text-gray-800">{donor.id}</span></div>
                  <div><span className="text-gray-500 font-medium">Blood Group:</span> <span className="text-red-700 font-bold">{donor.bloodGroup} {donor.rh}</span></div>
                  <div><span className="text-gray-500 font-medium">Phone:</span> <span className="text-gray-800">{donor.phone || '—'}</span></div>
                  <div><span className="text-gray-500 font-medium">Email:</span> <span className="text-gray-800">{donor.email || '—'}</span></div>
                  <div><span className="text-gray-500 font-medium">Sex / DOB:</span> <span className="text-gray-800">{donor.sex || '—'} / {donor.dob ? new Date(donor.dob).toLocaleDateString('en-IN') : '—'}</span></div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 font-medium bg-gray-50 border rounded-xl p-3 text-center">
                No donor linked. This bag has not been used for a donation yet.
              </div>
            )}

            {/* Donation Details */}
            {donation ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider border-b pb-1">
                  Donation Information
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-purple-50/20 border border-purple-100 rounded-xl p-4">
                  <div><span className="text-gray-500 font-medium">Donation ID:</span> <span className="font-mono text-gray-900 font-semibold">{donation.donationId}</span></div>
                  <div><span className="text-gray-500 font-medium">Donation Type:</span> <span className="text-gray-800 font-semibold">{donation.donationType?.replace('_', ' ')}</span></div>
                  <div><span className="text-gray-500 font-medium">Segment No:</span> <span className="font-mono text-gray-950 font-bold text-purple-800">{donation.segmentNo || '—'}</span></div>
                  <div><span className="text-gray-500 font-medium">Collection Date:</span> <span className="text-gray-800">{donation.collectedAt ? new Date(donation.collectedAt).toLocaleString('en-IN') : '—'}</span></div>
                  <div><span className="text-gray-500 font-medium">Bag Type used:</span> <span className="text-gray-800">{donation.typeOfBag || '—'}</span></div>
                  {donation.medicalExam && (
                    <div className="col-span-2 pt-2 border-t border-purple-100/55 grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-500 font-medium block">Haemoglobin</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.hbGdl ? `${donation.medicalExam.hbGdl} g/dL` : '—'}</span></div>
                      <div><span className="text-gray-500 font-medium block">Weight</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.weightKg ? `${donation.medicalExam.weightKg} kg` : '—'}</span></div>
                      <div><span className="text-gray-500 font-medium block">Pulse</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.pulseBpm ? `${donation.medicalExam.pulseBpm} bpm` : '—'}</span></div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { Trash2, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useBagDiscardList, useCreateBagDiscard, useApproveBagDiscard, useRemoveBagDiscard } from '../queries';
import { useBagStockList } from '../queries';
import { formatBloodBagQty, calcTotalBags } from '../utils/qtyHelper';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportBagDiscardRegister } from '@/utils/excelExportHelper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_BADGE = {
  PENDING_APPROVAL: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  DISPOSED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const DISCARD_REASONS = [
  'EXPIRED',
  'DAMAGED_PACKAGING',
  'FAILED_INSPECTION',
  'CONTAMINATION',
  'TEMPERATURE_EXCURSION',
  'LEAKAGE',
  'SEAL_BROKEN',
  'MANUFACTURING_DEFECT',
  'OTHER',
];

const DISPOSAL_METHODS = [
  'INCINERATION',
  'AUTOCLAVE',
  'CHEMICAL_DISINFECTION',
  'BIOMEDICAL_WASTE_CONTRACTOR',
];

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function DiscardDrawer({ onClose, stockItems }) {
  const [stockId, setStockId] = useState('');
  const [bagType, setBagType] = useState('');
  const [boxes, setBoxes] = useState('');
  const [packets, setPackets] = useState('');
  const [bags, setBags] = useState('');
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [discardDate, setDiscardDate] = useState(() => new Date().toISOString().slice(0, 10));
  const createDiscard = useCreateBagDiscard();

  const handleSelectStock = (id) => {
    setStockId(id);
    const s = stockItems.find((st) => st._id === id);
    if (s) setBagType(s.bagType);
  };

  const totalQty = calcTotalBags(boxes, packets, bags);

  const handleSubmit = (e) => {
    e.preventDefault();
    createDiscard.mutateAsync({
      stockId,
      bagType,
      quantity: totalQty,
      reason,
      reasonDetail,
      discardDate,
    }).then(onClose).catch(() => { });
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white';

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Discard Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Stock Item *</label>
            <select required value={stockId} onChange={(e) => handleSelectStock(e.target.value)} className={fieldClass}>
              <option value="">Select stock...</option>
              {stockItems.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.bagType} — Batch {s.batchNo} (Avail: {formatBloodBagQty(s.closingStock ?? s.quantityAvailable ?? 0)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bag Type</label>
            <input readOnly value={bagType} className={`${fieldClass} bg-gray-50 cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Quantity to Discard *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Boxes</label>
                <input type="number" min="0" value={boxes} onChange={(e) => setBoxes(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-center" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Packets</label>
                <input type="number" min="0" value={packets} onChange={(e) => setPackets(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-center" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Loose Bags</label>
                <input type="number" min="0" value={bags} onChange={(e) => setBags(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-center" />
              </div>
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">Total Bags to Discard: <strong>{totalQty}</strong> bags</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Discard Date *</label>
            <input required type="date" value={discardDate} onChange={(e) => setDiscardDate(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Reason *</label>
            <select required value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass}>
              <option value="">Select reason...</option>
              {DISCARD_REASONS.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Reason Details</label>
            <textarea value={reasonDetail} onChange={(e) => setReasonDetail(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createDiscard.isPending || totalQty <= 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {createDiscard.isPending ? 'Saving…' : 'Create Discard'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApproveDrawer({ discard, onClose }) {
  const [disposalMethod, setDisposalMethod] = useState('');
  const [manifestNo, setManifestNo] = useState('');
  const [disposalDate, setDisposalDate] = useState('');
  const approveDiscard = useApproveBagDiscard();

  const handleSubmit = (e) => {
    e.preventDefault();
    approveDiscard.mutateAsync({
      id: discard._id,
      data: {
        disposalMethod,
        biomedicalWasteManifestNo: manifestNo,
        disposalDate,
      },
    }).then(onClose).catch(() => { });
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white';

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Discard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Bag Type</span>
              <span className="font-semibold">{discard.bagType}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Quantity</span>
              <span className="font-bold">{formatBloodBagQty(discard.quantity)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Reason</span>
              <span>{discard.reason?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Disposal Method *</label>
            <select required value={disposalMethod} onChange={(e) => setDisposalMethod(e.target.value)} className={fieldClass}>
              <option value="">Select method...</option>
              {DISPOSAL_METHODS.map((m) => (
                <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">BMW Manifest No</label>
            <input value={manifestNo} onChange={(e) => setManifestNo(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Disposal Date *</label>
            <input required type="date" value={disposalDate} onChange={(e) => setDisposalDate(e.target.value)} className={fieldClass} />
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={approveDiscard.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60">
              {approveDiscard.isPending ? 'Approving…' : 'Approve & Dispose'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveDrawer({ discard, onClose }) {
  const [reason, setReason] = useState('');
  const removeDiscard = useRemoveBagDiscard();

  const handleSubmit = (e) => {
    e.preventDefault();
    removeDiscard.mutateAsync({ id: discard._id, reason })
      .then(() => {
        toast.success(`Discard entry ${discard.discardId ?? ''} removed — bag returned to stock`);
        onClose();
      })
      .catch(() => { });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Discard Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-red-100 bg-red-50/50 p-3 text-sm space-y-1">
            <p className="text-gray-700">
              This removes the discard entry entirely and returns <strong>{formatBloodBagQty(discard.quantity)}</strong> {discard.bagType}
              {' '}bag(s) in batch <strong>{discard.stock?.batchNo ?? discard.batchNo ?? '—'}</strong> back to available bag inventory.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Reason *</label>
            <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Why is this discard entry being removed?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={removeDiscard.isPending || !reason.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-60">
              {removeDiscard.isPending ? 'Removing…' : 'Remove & Return to Stock'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BagDiscard() {
  const [showDiscardDrawer, setShowDiscardDrawer] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [reasonFilter, setReasonFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { data, isLoading, refetch, isFetching } = useBagDiscardList({
    reason: reasonFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const { data: stockData } = useBagStockList({});

  const discards = data?.items ?? data?.bagDiscards ?? (Array.isArray(data) ? data : []);
  const stockItems = stockData?.items ?? stockData?.bagStocks ?? (Array.isArray(stockData) ? stockData : []);
  const [excelLoading, setExcelLoading] = useState(false);

  const handleExportExcel = async () => {
    if (discards.length === 0) {
      toast.info('No discard records to export');
      return;
    }
    try {
      setExcelLoading(true);
      await exportBagDiscardRegister(discards);
    } catch (e) {
      toast.error('Failed to generate Excel report');
    } finally {
      setExcelLoading(false);
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <Trash2 className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bag Discard Register</h1>
              <p className="text-gray-500 text-sm">Biomedical Waste Tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <button onClick={() => setShowDiscardDrawer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
              <Plus className="w-4 h-4" /> Create Discard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
            <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">All Reasons</option>
              {DISCARD_REASONS.map((r) => (<option key={r} value={r}>{r.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Discard Date From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Discard Date To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {(reasonFilter || fromDate || toDate) && (
            <button onClick={() => { setReasonFilter(''); setFromDate(''); setToDate(''); }}
              className="px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 rounded-lg font-medium">
              Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Discard ID', 'Bag Type', 'Batch No', 'Qty', 'Reason', 'Discard Date', 'Approved By', 'Disposal Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : discards.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : discards.map((d) => (
                  <tr key={d._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{d.discardId ?? d._id?.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.bagType}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{d.stock?.batchNo ?? d.batchNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{formatBloodBagQty(d.quantity)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                        {d.reason?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(d.discardDate ?? d.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.approvedBy?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(d.disposalDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {d.status === 'PENDING_APPROVAL' && (
                          <button onClick={() => setApproveTarget(d)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200 rounded-md hover:bg-green-50">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        <button onClick={() => setRemoveTarget(d)}
                          title="Delete this discard entry and return the bag(s) to stock"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDiscardDrawer && (
        <DiscardDrawer onClose={() => setShowDiscardDrawer(false)} stockItems={stockItems} />
      )}
      {approveTarget && (
        <ApproveDrawer discard={approveTarget} onClose={() => setApproveTarget(null)} />
      )}
      {removeTarget && (
        <RemoveDrawer discard={removeTarget} onClose={() => setRemoveTarget(null)} />
      )}
    </div>
  );
}

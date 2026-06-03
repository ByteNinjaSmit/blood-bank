import { useState } from 'react';
import { PackageCheck, Plus, X } from 'lucide-react';
import {
  useGRNList,
  useCreateGRN,
  useAcceptGRN,
} from '../queries';
import { usePOList } from '../queries';

const STATUS_BADGE = {
  PENDING:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const EMPTY_BATCH = {
  bagType: 'SINGLE', batchNo: '', mfgDate: '', expiryDate: '',
  quantityReceived: '', quantityAccepted: '', quantityRejected: '',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
}

function GRNDrawer({ onClose, pos }) {
  const [poId, setPoId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [taxableAmount, setTaxableAmount] = useState('');
  const [cgst, setCgst] = useState('');
  const [sgst, setSgst] = useState('');
  const [igst, setIgst] = useState('');
  const [batches, setBatches] = useState([{ ...EMPTY_BATCH }]);
  const createGRN = useCreateGRN();

  const updateBatch = (i, k, v) => setBatches((bs) => bs.map((b, idx) => idx === i ? { ...b, [k]: v } : b));
  const addBatch    = () => setBatches((bs) => [...bs, { ...EMPTY_BATCH }]);
  const removeBatch = (i) => setBatches((bs) => bs.filter((_, idx) => idx !== i));

  const netAmount = Number(taxableAmount || 0) + Number(cgst || 0) + Number(sgst || 0) + Number(igst || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    createGRN.mutateAsync({
      purchaseOrderId: poId,
      invoiceNo,
      invoiceDate,
      receivedDate,
      taxableAmount: Number(taxableAmount),
      cgst: Number(cgst),
      sgst: Number(sgst),
      igst: Number(igst),
      netAmount,
      batchLines: batches.map((b) => ({
        bagType: b.bagType,
        batchNo: b.batchNo,
        mfgDate: b.mfgDate,
        expiryDate: b.expiryDate,
        quantityReceived: Number(b.quantityReceived),
        quantityAccepted: Number(b.quantityAccepted),
        quantityRejected: Number(b.quantityRejected),
      })),
    }).then(onClose).catch(() => {});
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">Create Goods Receipt (GRN)</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* PO + Invoice */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Purchase Order *</label>
              <select required value={poId} onChange={(e) => setPoId(e.target.value)} className={`${fieldClass} bg-white`}>
                <option value="">Select PO...</option>
                {(pos ?? []).filter((p) => p.status === 'APPROVED').map((p) => (
                  <option key={p._id} value={p._id}>{p.poNumber} — {p.vendor?.vendorName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Invoice No *</label>
              <input required value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Received Date</label>
              <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className={fieldClass} />
            </div>
          </div>

          {/* GST Financials */}
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">GST Financials</div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Taxable Amount', val: taxableAmount, set: setTaxableAmount },
                { label: 'CGST (₹)',       val: cgst,          set: setCgst },
                { label: 'SGST (₹)',       val: sgst,          set: setSgst },
                { label: 'IGST (₹)',       val: igst,          set: setIgst },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type="number" value={val} onChange={(e) => set(e.target.value)} className={fieldClass} />
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-semibold text-gray-800">
              Net Amount: ₹{netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Batch Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Batch Lines</span>
              <button type="button" onClick={addBatch}
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-900">
                <Plus className="w-3.5 h-3.5" /> Add Batch
              </button>
            </div>
            <div className="space-y-3">
              {batches.map((b, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 relative">
                  {batches.length > 1 && (
                    <button type="button" onClick={() => removeBatch(i)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Bag Type</label>
                      <select value={b.bagType} onChange={(e) => updateBatch(i, 'bagType', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400">
                        {['SINGLE', 'DOUBLE', 'TRIPLE', 'QUADRUPLE'].map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Batch No *</label>
                      <input required value={b.batchNo} onChange={(e) => updateBatch(i, 'batchNo', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Mfg Date</label>
                      <input type="date" value={b.mfgDate} onChange={(e) => updateBatch(i, 'mfgDate', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Expiry Date</label>
                      <input type="date" value={b.expiryDate} onChange={(e) => updateBatch(i, 'expiryDate', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Qty Received</label>
                      <input type="number" value={b.quantityReceived} onChange={(e) => updateBatch(i, 'quantityReceived', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Qty Accepted</label>
                      <input type="number" value={b.quantityAccepted} onChange={(e) => updateBatch(i, 'quantityAccepted', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Qty Rejected</label>
                      <input type="number" value={b.quantityRejected} onChange={(e) => updateBatch(i, 'quantityRejected', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createGRN.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {createGRN.isPending ? 'Saving…' : 'Create GRN'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function GoodsReceipt() {
  const [showDrawer, setShowDrawer] = useState(false);
  const { data, isLoading } = useGRNList({});
  const { data: poData } = usePOList({});
  const acceptGRN = useAcceptGRN();

  const grns = data?.goodsReceipts ?? data ?? [];
  const pos  = poData?.purchaseOrders ?? poData ?? [];

  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtMoney = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <PackageCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Goods Receipt (GRN)</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Inward Stock Register</p>
            </div>
          </div>
          <button onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
            <Plus className="w-4 h-4" /> Create GRN
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['GRN Number', 'Invoice No', 'Vendor', 'Received Date', 'Net Amount', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : grns.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : grns.map((g) => (
                  <tr key={g._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{g.grnNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{g.invoiceNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{g.purchaseOrder?.vendor?.vendorName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(g.receivedDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{fmtMoney(g.netAmount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={g.status} /></td>
                    <td className="px-4 py-3">
                      {g.status === 'PENDING' && (
                        <button onClick={() => acceptGRN.mutate(g._id)}
                          className="px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200 rounded-md hover:bg-green-50">
                          Accept
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <GRNDrawer onClose={() => setShowDrawer(false)} pos={pos} />}
    </div>
  );
}

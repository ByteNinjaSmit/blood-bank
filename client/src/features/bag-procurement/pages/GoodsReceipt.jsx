import { useState } from 'react';
import { PackageCheck, Plus, X } from 'lucide-react';
import {
  useGRNList,
  useCreateGRN,
  useUpdateGRN,
  useVendorList,
} from '../queries';
import { usePOList } from '../queries';
import { formatBloodBagQty } from '../utils/qtyHelper';

const STATUS_BADGE = {
  PENDING:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const EMPTY_BATCH = {
  bagType: 'DOUBLE', batchNo: '', mfgDate: '', expiryDate: '',
  quantityReceived: '',
};

const ANTICOAGULANT_DISPLAY = {
  CPDA_1: 'CPDA-1',
  CPD: 'CPD',
  ACD: 'ACD',
  SAG_MANNITOL: 'SAG-M',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
}

function GRNDrawer({ onClose, pos, vendors, grnToEdit }) {
  const [poId, setPoId] = useState(grnToEdit?.poId || '');
  const [invoiceNo, setInvoiceNo] = useState(grnToEdit?.invoiceNo || '');
  const [billDate, setBillDate] = useState(grnToEdit?.billDate ? new Date(grnToEdit.billDate).toISOString().split('T')[0] : '');
  const [receivedDate, setReceivedDate] = useState(grnToEdit?.receivedDate ? new Date(grnToEdit.receivedDate).toISOString().split('T')[0] : '');
  const [taxableAmount, setTaxableAmount] = useState(grnToEdit?.financials?.basicAmountRs || '');
  const [cgst, setCgst] = useState(grnToEdit?.financials?.cgstRs || '');
  const [sgst, setSgst] = useState(grnToEdit?.financials?.sgstRs || '');
  const [igst, setIgst] = useState(grnToEdit?.financials?.igstRs || '');
  const [batches, setBatches] = useState(
    grnToEdit?.batchLines?.length > 0
      ? grnToEdit.batchLines.map((b) => ({
          bagType: b.bagType,
          batchNo: b.batchNumber,
          mfgDate: b.manufacturingDate ? new Date(b.manufacturingDate).toISOString().split('T')[0] : '',
          expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : '',
          quantityReceived: b.quantityReceived,
        }))
      : [{ ...EMPTY_BATCH }]
  );
  const createGRN = useCreateGRN();
  const updateGRN = useUpdateGRN();

  const selectedPo = pos.find((p) => (p._id ?? p.id) === poId);

  const updateBatch = (i, k, v) => setBatches((bs) => bs.map((b, idx) => idx === i ? { ...b, [k]: v } : b));
  const addBatch    = () => setBatches((bs) => [...bs, { ...EMPTY_BATCH }]);
  const removeBatch = (i) => setBatches((bs) => bs.filter((_, idx) => idx !== i));

  const netAmount = Number(taxableAmount || 0) + Number(cgst || 0) + Number(sgst || 0) + Number(igst || 0);

  const handlePoChange = (e) => {
    const selectedPoId = e.target.value;
    setPoId(selectedPoId);
    if (!selectedPoId) {
      setInvoiceNo('');
      setBillDate('');
      return;
    }
    const selectedPo = pos.find((p) => (p._id ?? p.id) === selectedPoId);
    if (selectedPo) {
      if (selectedPo.billDate) setBillDate(selectedPo.billDate.split('T')[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      poId,
      vendorName: vendors.find(v => (v._id ?? v.id) === pos.find(p => (p._id ?? p.id) === poId)?.vendorId)?.name || 'Unknown Vendor',
      invoiceNo,
      billDate: billDate || undefined,
      receivedDate: receivedDate || undefined,
      financials: {
        basicAmountRs: Number(taxableAmount) || 0,
        cgstRs: Number(cgst) || 0,
        sgstRs: Number(sgst) || 0,
        igstRs: Number(igst) || 0,
        netAmountRs: netAmount || 0,
      },
      batchLines: batches.map((b) => ({
        bagType: b.bagType,
        batchNumber: b.batchNo,
        manufacturingDate: b.mfgDate || undefined,
        expiryDate: b.expiryDate,
        quantityReceived: Number(b.quantityReceived),
      })),
    };

    const promise = grnToEdit
      ? updateGRN.mutateAsync({ id: grnToEdit.id ?? grnToEdit._id, data: payload })
      : createGRN.mutateAsync(payload);

    promise.then(onClose).catch((err) => {
      console.error('GRN SAVE ERROR:', err.message);
      if (err.details) {
        console.error('GRN SAVE DETAILS:', err.details);
      }
    });
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">{grnToEdit ? 'Edit Goods Receipt (GRN)' : 'Create Goods Receipt (GRN)'}</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* PO + Invoice */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Purchase Order *</label>
              <select required disabled={Boolean(grnToEdit)} value={poId} onChange={handlePoChange} className={`${fieldClass} bg-white disabled:opacity-75`}>
                <option value="">Select PO...</option>
                {(pos ?? []).filter((p) => p.status !== 'CANCELLED' && p.status !== 'REJECTED').map((p) => (
                  <option key={p._id ?? p.id} value={p._id ?? p.id}>
                    {p.poNumber} — {vendors.find(v => (v._id ?? v.id) === p.vendorId)?.name || 'Unknown Vendor'}
                    {p.billDate ? ` (Bill Date: ${new Date(p.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})` : ''}
                  </option>
                ))}
              </select>
              {selectedPo && (
                <div className="mt-2 bg-orange-50/50 border border-orange-100 rounded-lg p-3">
                  <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Ordered Quantities in PO</span>
                    <span className="font-normal text-gray-400 normal-case">(1 Box = 45 bags, 1 Pkt = 5 bags)</span>
                  </div>
                  <div className="space-y-1.5">
                    {(selectedPo.lineItems ?? []).map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-gray-700">
                        <span className="font-semibold text-gray-600">
                          {it.bagType} ({it.capacityMl} mL, {ANTICOAGULANT_DISPLAY[it.anticoagulant] ?? it.anticoagulant})
                        </span>
                        <span className="font-mono bg-white border border-gray-200 px-2 py-0.5 rounded text-[11px] text-gray-800 shadow-sm">
                          {formatBloodBagQty(it.quantityOrdered)}
                        </span>
                      </div>
                    ))}
                    {(!selectedPo.lineItems || selectedPo.lineItems.length === 0) && (
                      <div className="text-xs text-gray-500 italic">No items found in this PO.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Invoice No *</label>
              <input required value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bill Date</label>
              <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className={fieldClass} />
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
                        {['DOUBLE', 'TRIPLE'].map((t) => <option key={t}>{t}</option>)}
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
                      <label className="block text-xs text-gray-500 mb-1">Expiry Date *</label>
                      <input required type="date" value={b.expiryDate} onChange={(e) => updateBatch(i, 'expiryDate', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Qty Received *</label>
                      <input required type="number" value={b.quantityReceived} onChange={(e) => updateBatch(i, 'quantityReceived', e.target.value)}
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
            <button type="submit" disabled={createGRN.isPending || updateGRN.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {createGRN.isPending || updateGRN.isPending ? 'Saving…' : grnToEdit ? 'Update GRN' : 'Create GRN'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function ViewGRNModal({ onClose, grn, vendors, pos }) {
  if (!grn) return null;

  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtMoney = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

  const po = pos.find(p => (p._id ?? p.id) === grn.poId);
  const vendorName = grn.vendorName ?? vendors.find(v => (v._id ?? v.id) === po?.vendorId)?.name ?? '—';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-850 text-white bg-orange-800">
            <div>
              <h2 className="text-base font-semibold text-white">Goods Receipt Details</h2>
              <p className="text-[10px] text-orange-200 font-medium uppercase tracking-wider mt-0.5">Invoice: {grn.invoiceNo}</p>
            </div>
            <button onClick={onClose} className="text-orange-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* General Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendor</span>
                <span className="text-sm font-semibold text-gray-800">{vendorName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchase Order</span>
                <span className="text-sm font-medium text-gray-800 font-mono">{po?.poNumber || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice Number</span>
                <span className="text-sm font-medium text-gray-800 font-mono">{grn.invoiceNo}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bill Date</span>
                <span className="text-sm font-medium text-gray-800">{fmtDate(grn.billDate)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Received Date</span>
                <span className="text-sm font-medium text-gray-800">{fmtDate(grn.receivedDate)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                <span className="mt-1 block">
                  <StatusBadge status={grn.status} />
                </span>
              </div>
            </div>

            {/* Financial Details */}
            {grn.financials && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GST Financials</h3>
                <div className="grid grid-cols-4 gap-3 border border-gray-100 rounded-lg p-3 bg-white">
                  <div>
                    <span className="block text-[10px] text-gray-400">Taxable Amount</span>
                    <span className="text-xs font-semibold text-gray-700">{fmtMoney(grn.financials.basicAmountRs)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">CGST</span>
                    <span className="text-xs font-semibold text-gray-700">{fmtMoney(grn.financials.cgstRs)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">SGST</span>
                    <span className="text-xs font-semibold text-gray-700">{fmtMoney(grn.financials.sgstRs)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">IGST</span>
                    <span className="text-xs font-semibold text-gray-700">{fmtMoney(grn.financials.igstRs)}</span>
                  </div>
                  <div className="col-span-4 border-t pt-2 mt-1 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Net Amount</span>
                    <span className="text-sm font-bold text-orange-800">{fmtMoney(grn.financials.netAmountRs)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Batch Lines */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Batch Lines</h3>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Bag Type', 'Capacity', 'Anticoagulant', 'Batch No', 'Mfg Date', 'Expiry Date', 'Qty Received'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(grn.batchLines ?? []).map((line, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-semibold text-gray-800">{line.bagType}</td>
                        <td className="px-3 py-2 text-gray-600">{line.capacityMl} mL</td>
                        <td className="px-3 py-2 text-gray-600">{ANTICOAGULANT_DISPLAY[line.anticoagulant] ?? line.anticoagulant ?? '—'}</td>
                        <td className="px-3 py-2 font-mono font-medium text-gray-800">{line.batchNumber}</td>
                        <td className="px-3 py-2 text-gray-600">{fmtDate(line.manufacturingDate)}</td>
                        <td className="px-3 py-2 text-gray-600">{fmtDate(line.expiryDate)}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-gray-800">{formatBloodBagQty(line.quantityReceived)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {grn.notes && (
              <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 text-xs text-gray-700">
                <span className="block font-bold text-yellow-800 uppercase tracking-wider text-[10px] mb-0.5">Notes</span>
                {grn.notes}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function GoodsReceipt() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editGrn, setEditGrn] = useState(null);
  const { data, isLoading } = useGRNList({});
  const { data: poData } = usePOList({});
  const { data: vendorData } = useVendorList({});

  const [viewGrn, setViewGrn] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const grns = data?.items ?? data?.goodsReceipts ?? (Array.isArray(data) ? data : []);
  const pos = poData?.items ?? poData?.purchaseOrders ?? (Array.isArray(poData) ? poData : []);
  const vendors = vendorData?.items ?? vendorData?.vendors ?? (Array.isArray(vendorData) ? vendorData : []);

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
          <button onClick={() => { setEditGrn(null); setShowDrawer(true); }}
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
                  {['Invoice No', 'Vendor', 'Received Date', 'Quantities (Boxes)', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : grns.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : grns.map((g) => {
                  const doubleBags = (g.batchLines ?? []).filter(b => b.bagType === 'DOUBLE').reduce((sum, b) => sum + b.quantityReceived, 0);
                  const tripleBags = (g.batchLines ?? []).filter(b => b.bagType === 'TRIPLE').reduce((sum, b) => sum + b.quantityReceived, 0);
                  const dbBoxes = Number((doubleBags / 45).toFixed(2));
                  const tbBoxes = Number((tripleBags / 45).toFixed(2));

                  return (
                    <tr key={g._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{g.invoiceNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{g.vendorName ?? vendors.find(v => (v._id ?? v.id) === g.purchaseOrder?.vendorId)?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(g.receivedDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[9px] bg-orange-50 text-orange-700 px-1 py-0.2 rounded border border-orange-200 min-w-[20px] text-center">DB</span>
                            <span className="font-medium text-gray-800 font-mono">{dbBoxes} Box{dbBoxes !== 1 ? 'es' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[9px] bg-red-55 text-red-700 px-1 py-0.2 rounded border border-red-200 bg-red-50 min-w-[20px] text-center">TB</span>
                            <span className="font-medium text-gray-800 font-mono">{tbBoxes} Box{tbBoxes !== 1 ? 'es' : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setViewGrn(g); setShowViewModal(true); }}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors">
                            View
                          </button>
                          <button onClick={() => { setEditGrn(g); setShowDrawer(true); }}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
                            Edit
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

      {showDrawer && <GRNDrawer onClose={() => { setShowDrawer(false); setEditGrn(null); }} pos={pos} vendors={vendors} grnToEdit={editGrn} />}
      {showViewModal && <ViewGRNModal onClose={() => { setShowViewModal(false); setViewGrn(null); }} grn={viewGrn} vendors={vendors} pos={pos} />}
    </div>
  );
}

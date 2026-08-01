import { useState } from 'react';
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { useCreateGRN, useUpdateGRN } from '../../queries';
import { formatBloodBagQty } from '../../utils/qtyHelper';
import { bagProcurementApi } from '../../api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';
import { ANTICOAGULANT_DISPLAY, EMPTY_BATCH } from './grn-constants';

const uploadFile = bagProcurementApi.upload.file;
const deleteFile = bagProcurementApi.upload.remove;

export default function GRNDrawer({ onClose, pos, vendors, grnToEdit }) {
  const [poId, setPoId] = useState(grnToEdit?.poId || '');
  const [invoiceNo, setInvoiceNo] = useState(grnToEdit?.invoiceNo || '');
  const [billDate, setBillDate] = useState(grnToEdit?.billDate ? new Date(grnToEdit.billDate).toISOString().split('T')[0] : '');
  const [receivedDate, setReceivedDate] = useState(grnToEdit?.receivedDate ? new Date(grnToEdit.receivedDate).toISOString().split('T')[0] : '');
  const [taxableAmount, setTaxableAmount] = useState(grnToEdit?.financials?.basicAmountRs || '');
  const [cgst, setCgst] = useState(grnToEdit?.financials?.cgstRs || '');
  const [sgst, setSgst] = useState(grnToEdit?.financials?.sgstRs || '');
  const [igst, setIgst] = useState(grnToEdit?.financials?.igstRs || '');
  const [invoiceImage, setInvoiceImage] = useState(grnToEdit?.invoiceImage || '');
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  const [batches, setBatches] = useState( grnToEdit?.batchLines?.length > 0
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
      invoiceImage: invoiceImage || null,
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
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">{grnToEdit ? 'Edit Goods Receipt (GRN)' : 'Create Goods Receipt (GRN)'}</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="flex-1 overflow-y-auto p-6 space-y-5">
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
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Invoice Upload</label>
              {uploading ? (
                <div className="text-xs text-gray-500 py-2">Uploading invoice...</div>
              ) : invoiceImage ? (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                  <div className="flex-1 flex items-center gap-2 truncate">
                    <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-600 truncate">{invoiceImage.split('/').pop()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete({
                        isOpen: true,
                        title: 'Delete Invoice Image?',
                        message: 'Are you sure you want to delete this invoice image? This will permanently remove the invoice attachment from storage.',
                        onConfirm: async () => {
                          try {
                            await deleteFile(invoiceImage);
                            toast.success('Invoice image deleted from S3');
                          } catch (err) {
                            console.error('S3 delete failed:', err);
                            toast.error('Failed to delete invoice image from S3');
                          }
                          setInvoiceImage('');
                        }
                      });
                    }}
                    className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-50 bg-white shadow-sm">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span>Upload Invoice Document</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const res = await uploadFile(file, 'bagorderinvoice');
                        setInvoiceImage(res.url);
                        toast.success('Invoice uploaded successfully');
                      } catch (err) {
                        toast.error(err.message || 'File upload failed');
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
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
      <ConfirmDeleteModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.title}
        message={confirmDelete.message}
        onConfirm={confirmDelete.onConfirm}
        onClose={() => setConfirmDelete({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />
    </>
  );
}

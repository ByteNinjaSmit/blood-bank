import { X } from 'lucide-react';
import { formatBloodBagQty } from '../../utils/qtyHelper';
import StatusBadge from './StatusBadge';
import { ANTICOAGULANT_DISPLAY } from './grn-constants';

export default function ViewGRNModal({ onClose, grn, vendors, pos, onViewInvoice }) {
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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-medium text-gray-850 text-gray-800 font-mono">{grn.invoiceNo}</span>
                  {grn.invoiceImage && (
                    <button
                      onClick={() => onViewInvoice(grn.invoiceImage, `Invoice: ${grn.invoiceNo}`)}
                      className="px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
                    >
                      View Document
                    </button>
                  )}
                </div>
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

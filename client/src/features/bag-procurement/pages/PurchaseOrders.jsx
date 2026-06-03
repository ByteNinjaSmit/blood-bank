import { useState } from 'react';
import { FileText, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  usePOList,
  useCreatePO,
  useSubmitPO,
  useApprovePO,
  useRejectPO,
} from '../queries';
import { useVendorList } from '../queries';

const STATUS_BADGE = {
  DRAFT:            'bg-gray-100 text-gray-600 border-gray-200',
  PENDING_APPROVAL: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APPROVED:         'bg-green-50 text-green-700 border-green-200',
  REJECTED:         'bg-red-50 text-red-700 border-red-200',
  FULFILLED:        'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED:        'bg-gray-100 text-gray-500 border-gray-200',
};

const BAG_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUADRUPLE'];
const ANTICOAGULANTS = ['CPDA-1', 'CPD', 'ACD', 'SAG-M'];

const EMPTY_LINE = { bagType: 'SINGLE', capacity: '', anticoagulant: 'CPDA-1', quantity: '', unitPrice: '', gstPercent: '' };

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status?.replace('_', ' ')}
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

function PODrawer({ onClose, vendors }) {
  const [vendorId, setVendorId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [terms, setTerms] = useState('');
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const createPO = useCreatePO();

  const updateLine = (i, k, v) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLine = () => setLines((ls) => [...ls, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const lineTotal = (l) => {
    const base = Number(l.quantity || 0) * Number(l.unitPrice || 0);
    const gst  = base * (Number(l.gstPercent || 0) / 100);
    return base + gst;
  };
  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    createPO.mutateAsync({
      vendorId,
      expectedDeliveryDate: expectedDelivery,
      termsAndConditions: terms,
      items: lines.map((l) => ({
        bagType: l.bagType,
        capacity: Number(l.capacity),
        anticoagulant: l.anticoagulant,
        quantityOrdered: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        gstPercent: Number(l.gstPercent),
      })),
    }).then(onClose).catch(() => {});
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">New Purchase Order</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Vendor *</label>
              <select required value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                <option value="">Select vendor...</option>
                {(vendors ?? []).map((v) => (
                  <option key={v._id} value={v._id}>{v.vendorName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Expected Delivery</label>
              <input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Terms &amp; Conditions</label>
              <input value={terms} onChange={(e) => setTerms(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Line Items</span>
              <button type="button" onClick={addLine}
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-900">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Bag Type', 'Cap (mL)', 'Anticoag.', 'Qty', 'Unit Price (₹)', 'GST %', 'Total', ''].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <select value={l.bagType} onChange={(e) => updateLine(i, 'bagType', e.target.value)}
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white w-24">
                          {BAG_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={l.capacity} onChange={(e) => updateLine(i, 'capacity', e.target.value)} type="number"
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs w-16" placeholder="450" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={l.anticoagulant} onChange={(e) => updateLine(i, 'anticoagulant', e.target.value)}
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white w-24">
                          {ANTICOAGULANTS.map((a) => <option key={a}>{a}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={l.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} type="number"
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs w-14" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={l.unitPrice} onChange={(e) => updateLine(i, 'unitPrice', e.target.value)} type="number"
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs w-20" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={l.gstPercent} onChange={(e) => updateLine(i, 'gstPercent', e.target.value)} type="number"
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs w-12" placeholder="18" />
                      </td>
                      <td className="px-2 py-1.5 font-medium text-gray-700">
                        ₹{lineTotal(l).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-1.5">
                        {lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2 text-sm font-semibold text-gray-800">
              Grand Total: ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createPO.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {createPO.isPending ? 'Creating…' : 'Create PO'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function PurchaseOrders() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const { data, isLoading } = usePOList({});
  const { data: vendorData } = useVendorList({});
  const submitPO   = useSubmitPO();
  const approvePO  = useApprovePO();
  const rejectPO   = useRejectPO();

  const orders  = data?.purchaseOrders ?? data ?? [];
  const vendors = vendorData?.vendors ?? vendorData ?? [];

  const stats = {
    total:    orders.length,
    draft:    orders.filter((o) => o.status === 'DRAFT').length,
    pending:  orders.filter((o) => o.status === 'PENDING_APPROVAL').length,
    approved: orders.filter((o) => o.status === 'APPROVED').length,
  };

  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtMoney = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Blood Bag Procurement</p>
            </div>
          </div>
          <button onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
            <Plus className="w-4 h-4" /> New PO
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total POs"        value={stats.total}    color="text-gray-900" />
          <StatCard label="Draft"            value={stats.draft}    color="text-gray-600" />
          <StatCard label="Pending Approval" value={stats.pending}  color="text-yellow-600" />
          <StatCard label="Approved"         value={stats.approved} color="text-green-700" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['', 'PO Number', 'PO Date', 'Vendor', 'Total Amount', 'Expected Delivery', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : orders.map((o) => (
                  <>
                    <tr key={o._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-3 py-3">
                        <button onClick={() => toggleExpand(o._id)} className="text-gray-400 hover:text-orange-700">
                          {expandedId === o._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{o.poNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(o.poDate ?? o.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{o.vendor?.vendorName ?? o.vendorId}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{fmtMoney(o.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(o.expectedDeliveryDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {o.status === 'DRAFT' && (
                            <button onClick={() => submitPO.mutate(o._id)}
                              className="px-2.5 py-1 text-xs font-medium text-yellow-700 border border-yellow-200 rounded-md hover:bg-yellow-50">
                              Submit
                            </button>
                          )}
                          {o.status === 'PENDING_APPROVAL' && (
                            <>
                              <button onClick={() => approvePO.mutate(o._id)}
                                className="px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200 rounded-md hover:bg-green-50">
                                Approve
                              </button>
                              <button onClick={() => rejectPO.mutate({ id: o._id, data: { reason: 'Rejected by manager' } })}
                                className="px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50">
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === o._id && (
                      <tr key={`${o._id}-expand`} className="bg-orange-50/20">
                        <td colSpan={8} className="px-8 py-4">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</div>
                          <table className="min-w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                              <tr>
                                {['Bag Type', 'Capacity', 'Anticoagulant', 'Qty Ordered', 'Unit Price', 'GST %', 'Line Total'].map((h) => (
                                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {(o.items ?? []).map((it, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-medium">{it.bagType}</td>
                                  <td className="px-3 py-2">{it.capacity} mL</td>
                                  <td className="px-3 py-2">{it.anticoagulant}</td>
                                  <td className="px-3 py-2">{it.quantityOrdered}</td>
                                  <td className="px-3 py-2">{fmtMoney(it.unitPrice)}</td>
                                  <td className="px-3 py-2">{it.gstPercent}%</td>
                                  <td className="px-3 py-2 font-semibold">{fmtMoney(it.lineTotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <PODrawer onClose={() => setShowDrawer(false)} vendors={vendors} />}
    </div>
  );
}

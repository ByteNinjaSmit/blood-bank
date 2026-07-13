import { useState, useEffect } from 'react';
import { FileText, Plus, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import {
  usePOList,
  useCreatePO,
  useUpdatePO,
  useDeletePO,
  useVendorList,
  useCreateVendor,
} from '../queries';
import { useAuth } from '@/store/auth';
import { formatBloodBagQty, calcTotalBags } from '../utils/qtyHelper';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportProcurementPO } from '@/utils/excelExportHelper';
import { useEditWithReason } from '@/hooks/useEditWithReason';
import { useDeleteWithReason } from '@/hooks/useDeleteWithReason';



const BAG_TYPES = ['DOUBLE', 'TRIPLE'];
const ANTICOAGULANTS = ['CPDA-1', 'CPD', 'ACD', 'SAG-M'];

const ANTICOAGULANT_MAP = {
  'CPDA-1': 'CPDA_1',
  'CPD': 'CPD',
  'ACD': 'ACD',
  'SAG-M': 'SAG_MANNITOL',
};

const EMPTY_LINE = { bagType: 'DOUBLE', capacity: '350', anticoagulant: 'SAG-M', boxes: '', packets: '', bags: '' };



function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function PODrawer({ onClose, vendors, poToEdit }) {
  const { user } = useAuth();
  const [vendorSearchText, setVendorSearchText] = useState('');
  const [manufacturer, setManufacturer] = useState(poToEdit?.manufacturer || '');
  const [billDate, setBillDate] = useState(poToEdit?.billDate ? new Date(poToEdit.billDate).toISOString().split('T')[0] : '');
  
  const [lines, setLines] = useState(poToEdit?.lineItems?.length > 0 ? poToEdit.lineItems.map(l => {
    const qty = l.quantityOrdered || 0;
    return {
      ...EMPTY_LINE,
      bagType: l.bagType,
      capacity: l.capacityMl,
      anticoagulant: Object.keys(ANTICOAGULANT_MAP).find(k => ANTICOAGULANT_MAP[k] === l.anticoagulant) || l.anticoagulant,
      boxes: qty ? String(Number((qty / 45).toFixed(2))) : '',
      packets: qty ? String(Number((qty / 5).toFixed(2))) : '',
      bags: qty ? String(qty) : ''
    };
  }) : [{ ...EMPTY_LINE }]);

  const createPO = useCreatePO();
  const updatePO = useUpdatePO();
  const createVendor = useCreateVendor();
  const { wrappedSave: wrappedSavePO, EditReasonDialog } = useEditWithReason({
    onSave: async (payload, editReason) => {
      await updatePO.mutateAsync({ id: poToEdit?.id ?? poToEdit?._id, data: payload, editReason });
      onClose();
    },
    title: 'Confirm Purchase Order Changes',
  });
  const [previousVendors, setPreviousVendors] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('previous_vendors') || '[]');
      setPreviousVendors(saved);
      if (saved.length > 0) {
        setVendorSearchText(saved[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateLine = (i, k, v) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  
  const handleQtyChange = (i, field, val) => {
    setLines((ls) =>
      ls.map((l, idx) => {
        if (idx !== i) return l;

        const numVal = val === '' ? '' : parseFloat(val);
        
        if (numVal === '' || isNaN(numVal)) {
          return { ...l, [field]: val, boxes: '', packets: '', bags: '' };
        }

        if (field === 'boxes') {
          return {
            ...l,
            boxes: val,
            packets: String(numVal * 9),
            bags: String(numVal * 45),
          };
        } else if (field === 'packets') {
          return {
            ...l,
            packets: val,
            boxes: String(Number((numVal / 9).toFixed(2))),
            bags: String(numVal * 5),
          };
        } else if (field === 'bags') {
          return {
            ...l,
            bags: val,
            packets: String(Number((numVal / 5).toFixed(2))),
            boxes: String(Number((numVal / 45).toFixed(2))),
          };
        }

        return { ...l, [field]: val };
      })
    );
  };

  const addLine = () => setLines((ls) => [...ls, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const text = vendorSearchText.trim();
      let matchedVendor = (vendors ?? []).find(
        (v) => (v.vendorName ?? v.name ?? '').trim().toLowerCase() === text.toLowerCase()
      );

      let finalVendorId = matchedVendor?._id;

      if (!finalVendorId && text) {
        const newVendor = await createVendor.mutateAsync({
          name: text,
          manufacturer: manufacturer || text,
          drugLicenseNo: `DL-AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          gstNo: `GST-AUTO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          address: 'Auto-generated for typed vendor',
          contactPerson: 'N/A',
          contactPhone: '0000000000',
          approvalStatus: 'APPROVED'
        });
        finalVendorId = newVendor._id ?? newVendor.id;
      }

      if (text) {
        const updatedPrev = [text, ...previousVendors.filter(v => v !== text)].slice(0, 10);
        localStorage.setItem('previous_vendors', JSON.stringify(updatedPrev));
      }

      const payload = {
        poDate: poToEdit ? poToEdit.poDate : new Date().toISOString(),
        vendorId: finalVendorId,
        manufacturer: manufacturer || undefined,
        billDate: billDate || undefined,
        lineItems: lines.map((l) => ({
          bagType: l.bagType,
          capacityMl: Number(l.capacity) || 350,
          anticoagulant: ANTICOAGULANT_MAP[l.anticoagulant] ?? l.anticoagulant,
          quantityOrdered: Number(l.bags) || 1,
        })),
      };

      if (poToEdit) {
        await wrappedSavePO(payload);
        // Dialog handles onClose itself once the reason is confirmed —
        // don't close prematurely while it's still open.
        return;
      }
      await createPO.mutateAsync(payload);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const allVendorNames = Array.from(new Set([
    ...(vendors ?? []).map(v => v.vendorName ?? v.name).filter(Boolean),
    ...previousVendors
  ]));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">{poToEdit ? "Edit Purchase Order" : "New Purchase Order"}</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Vendor *</label>
              <input required type="text" list="vendors-datalist" value={vendorSearchText} onChange={(e) => setVendorSearchText(e.target.value)}
                placeholder="Type or select vendor..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
              <datalist id="vendors-datalist">
                {allVendorNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {previousVendors.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Recommendations:</span>
                  {previousVendors.slice(0, 3).map((v) => (
                    <button key={v} type="button" onClick={() => setVendorSearchText(v)}
                      className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-800 text-[10px] rounded-full border border-orange-200 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Manufacturer</label>
              <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="e.g. Terumo Penpol" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bill Date</label>
              <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Line Items <span className="normal-case font-normal text-gray-400 text-[10px]">(1 Box = 9 Pkts = 45 bags, 1 Pkt = 5 bags)</span></span>
              <button type="button" onClick={addLine}
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-900">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Bag Type', 'Cap (mL)', 'Anticoag.', 'Boxes', 'Pkts', 'Bags', 'Total Bags', ''].map((h) => (
                      <th key={h} className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <select value={l.bagType} onChange={(e) => updateLine(i, 'bagType', e.target.value)}
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white w-20">
                          {BAG_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={l.capacity} onChange={(e) => updateLine(i, 'capacity', e.target.value)}
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white w-14">
                          <option value="350">350</option>
                          <option value="450">450</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={l.anticoagulant} onChange={(e) => updateLine(i, 'anticoagulant', e.target.value)}
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white w-20">
                          {ANTICOAGULANTS.map((a) => <option key={a}>{a}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1.5">
                        <input value={l.boxes} onChange={(e) => handleQtyChange(i, 'boxes', e.target.value)} type="number" min="0"
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs w-10 text-center font-medium" placeholder="0" />
                      </td>
                      <td className="px-1 py-1.5">
                        <input value={l.packets} onChange={(e) => handleQtyChange(i, 'packets', e.target.value)} type="number" min="0"
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs w-10 text-center font-medium" placeholder="0" />
                      </td>
                      <td className="px-1 py-1.5">
                        <input value={l.bags} onChange={(e) => handleQtyChange(i, 'bags', e.target.value)} type="number" min="0"
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs w-10 text-center font-medium" placeholder="0" />
                      </td>
                      <td className="px-2 py-1.5 font-bold text-gray-700 text-center bg-gray-50/50">
                        {Number(l.bags) || 0}
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
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createPO.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {poToEdit ? (updatePO.isPending ? 'Updating...' : 'Update PO') : (createPO.isPending ? 'Creating...' : 'Create PO')}
            </button>
          </div>
        </form>
      </div>
      {EditReasonDialog}
    </>
  );
}

export default function PurchaseOrders() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editPO, setEditPO] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading } = usePOList({
    search: search || undefined,
    vendorId: vendorFilter || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  });
  const { data: vendorData } = useVendorList({});
  const deletePO = useDeletePO();

  const mapPOForExport = (items, vendorsList) => {
    return items.map(o => {
      const vendorName = vendorsList.find(v => v._id === o.vendorId || v.id === o.vendorId)?.name ?? o.vendorId;
      return {
        poNumber: o.poNumber,
        poDate: o.poDate,
        vendorName: vendorName,
        manufacturer: o.manufacturer,
        billDate: o.billDate,
        lineItems: o.lineItems ?? [],
      };
    });
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      const dataToExport = mapPOForExport(orders, vendors);

      if (dataToExport.length === 0) {
        toast.info("No purchase orders to export");
        return;
      }

      await exportProcurementPO(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  const orders = data?.items ?? data?.purchaseOrders ?? (Array.isArray(data) ? data : []);
  const vendors = vendorData?.items ?? vendorData?.vendors ?? (Array.isArray(vendorData) ? vendorData : []);

  const stats = {
    total: orders.length,
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtMoney = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const { requestDelete, DeleteReasonDialog } = useDeleteWithReason({
    onDelete: async (po, reason) => {
      await deletePO.mutateAsync({ id: po._id || po.id, reason });
    },
    title: 'Delete Purchase Order',
    message: 'This purchase order and its goods receipts / unused stock will be moved to the Recycle Bin. Stock already issued for collection is preserved and marked affected, not deleted.',
  });
  const handleDelete = (po) => requestDelete(po);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-gray-500 text-sm">Blood Bag Procurement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
            <button onClick={() => { setEditPO(null); setShowDrawer(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
              <Plus className="w-4 h-4" /> New PO
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Total POs" value={stats.total} color="text-gray-900" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search PO Number</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="PO Number..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vendor</label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v._id ?? v.id} value={v._id ?? v.id}>{v.vendorName ?? v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">PO Date From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">PO Date To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {(search || vendorFilter || fromDate || toDate) && (
            <button
              onClick={() => { setSearch(''); setVendorFilter(''); setFromDate(''); setToDate(''); }}
              className="px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 rounded-lg font-medium"
            >
              Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['', 'PO Number', 'PO Date', 'Vendor', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : orders.map((o) => (
                  <>
                    <tr key={o._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-3 py-3">
                        <button onClick={() => toggleExpand(o._id)} className="text-gray-400 hover:text-orange-700">
                          {expandedId === o._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{o.poNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(o.poDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(vendors.find(v => v._id === o.vendorId || v.id === o.vendorId)?.name ?? o.vendorId)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditPO(o); setShowDrawer(true); }}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(o)} disabled={deletePO.isPending}
                            className="px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === o._id && (
                      <tr key={`${o._id}-expand`} className="bg-orange-50/20">
                        <td colSpan={5} className="px-8 py-4">
                          <div className="grid grid-cols-2 gap-4 mb-4 text-xs bg-white p-3 rounded-lg border border-gray-150 shadow-sm max-w-2xl">
                            <div><span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Manufacturer:</span> <span className="font-medium text-gray-800 ml-1">{o.manufacturer || '—'}</span></div>
                            <div><span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Bill Date:</span> <span className="font-medium text-gray-800 ml-1">{fmtDate(o.billDate)}</span></div>
                          </div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</div>
                          <table className="min-w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                              <tr>
                                {['Bag Type', 'Capacity', 'Anticoagulant', 'Qty Ordered'].map((h) => (
                                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {(o.lineItems ?? []).map((it, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-medium">{it.bagType}</td>
                                  <td className="px-3 py-2">{it.capacityMl} mL</td>
                                  <td className="px-3 py-2">{it.anticoagulant}</td>
                                  <td className="px-3 py-2 font-medium">{formatBloodBagQty((it.quantityOrdered))}</td>
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

      {showDrawer && <PODrawer onClose={() => { setShowDrawer(false); setEditPO(null); }} vendors={vendors} poToEdit={editPO} />}
      {DeleteReasonDialog}
    </div>
  );
}

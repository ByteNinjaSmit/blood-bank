import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import requisitionApi from '@/services/requisitionApi';
import hospitalApi from '@/services/hospitalApi';
import { toast } from 'sonner';
import CustomModal from '@/components/CustomModal';
import RequisitionPrintTemplate from './components/RequisitionPrintTemplate';
import RequisitionLabelTemplate from './components/RequisitionLabelTemplate';
import RequisitionPrintService from '@/services/requisitionPrintService';
import { RejectRequestModal } from '@/components/shared';

const STATUS = ['pending', 'matched', 'approved', 'issued', 'completed', 'rejected'];

export default function RequisitionList() {
  const navigate = useNavigate();
  const { authorizationToken } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    hospitalId: '',
    from: '',
    to: '',
    sortBy: 'updatedAt',
    order: 'desc',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [selected, setSelected] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [printDoc, setPrintDoc] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [printType, setPrintType] = useState('report');
  const [multiLabelModalOpen, setMultiLabelModalOpen] = useState(false);
  const [multiLabelDoc, setMultiLabelDoc] = useState(null);

  const [excelLoading, setExcelLoading] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectingDocReqId, setRejectingDocReqId] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');
  const statusClass = (s) => (
    s === 'pending' ? 'bg-gray-100 text-gray-700' :
    s === 'matched' ? 'bg-amber-100 text-amber-800' :
    s === 'approved' ? 'bg-blue-100 text-blue-800' :
    s === 'issued' ? 'bg-green-100 text-green-800' :
    s === 'completed' ? 'bg-purple-100 text-purple-800' :
    s === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
  );

  useEffect(() => {
    hospitalApi.initialize(authorizationToken);
    requisitionApi.initialize(authorizationToken);

    (async () => {
      const resp = await hospitalApi.getHospitals({ limit: 200 });
      const list = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
          ? resp.data
          : [];
      setHospitals(list);
    })();
  }, [authorizationToken]);

  const fetchList = async () => {
    setLoading(true);
    const params = { ...filters, page, limit };
    try {
      const res = await requisitionApi.listRequests(params);
      if (!res.success) {
        toast.error(res.error || 'Failed to load requisitions');
        setLoading(false);
        return;
      }
      const items = Array.isArray(res.data) ? res.data : [];
      setData(items);
      const pg = res.raw?.pagination || { total: items.length, page, limit };
      setTotal(pg.total || items.length);
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((p) => ({ ...p, search: searchInput }));
      setPage(1);
      fetchList();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const applyFilters = () => {
    setPage(1);
    fetchList();
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '', hospitalId: '', from: '', to: '', sortBy: 'updatedAt', order: 'desc' });
    setPage(1);
    fetchList();
  };

  const callAction = async (id, action) => {
    try {
      let res;
      if (action === 'match') res = await requisitionApi.match(id);
      if (action === 'approve') res = await requisitionApi.approve(id);
      if (action === 'issue') res = await requisitionApi.issue(id);
      if (action === 'complete') res = await requisitionApi.complete(id);
      if (action === 'reject') res = await requisitionApi.reject(id);
      if (!res?.success) return toast.error(res?.error || 'Action failed');
      toast.success(action.charAt(0).toUpperCase() + action.slice(1) + 'd');
      fetchList();
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const can = (row, act) => {
    const s = row.status;
    if (act === 'match') return s === 'pending';
    if (act === 'approve') return s === 'matched';
    if (act === 'issue') return s === 'approved' || s === 'matched';
    if (act === 'complete') return s === 'issued';
    if (act === 'reject') return ['pending', 'matched', 'approved'].includes(s);
    return false;
  };

  const toggle = (id) => setSelected((m) => ({ ...m, [id]: !m[id] }));
  const allSelectedIds = Object.keys(selected).filter((id) => selected[id]);
  const clearSelection = () => setSelected({});

  const bulkAction = async (action) => {
    if (allSelectedIds.length === 0) return;
    const rows = data.filter((r) => allSelectedIds.includes(r._id));
    const allowed = rows.filter((r) => can(r, action)).map((r) => r._id);
    if (allowed.length === 0) {
      toast.error('No selected rows are eligible for this action');
      return;
    }
    try {
      await Promise.allSettled(allowed.map(async (id) => {
        let res;
        if (action === 'match') res = await requisitionApi.match(id);
        if (action === 'approve') res = await requisitionApi.approve(id);
        if (action === 'issue') res = await requisitionApi.issue(id);
        if (action === 'complete') res = await requisitionApi.complete(id);
        if (action === 'reject') res = await requisitionApi.reject(id);
        return res;
      }));
      toast.success(`Bulk ${action} attempted for ${allowed.length} item(s)`);
      clearSelection();
      fetchList();
    } catch (e) {
      toast.error('Bulk action failed');
    }
  };

  const exportCsv = () => {
    const cols = ['Request ID','Hospital','Patient','Age','Sex','Requested At','Status'];
    const rows = data.map((r) => [
      r.requestId,
      r.hospitalId?.name || '',
      r.patient?.name || '',
      r.patient?.age ?? '',
      r.patient?.sex || '',
      r.requestedAt ? new Date(r.requestedAt).toISOString() : '',
      r.status
    ]);
    const csv = ['\uFEFF' + cols.join(','), ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'requisitions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      setExportDropdownOpen(false);
      toast.info(exportAll ? 'Generating Excel report for all records...' : 'Generating Excel report for filtered records...');

      const params = exportAll ? { exportAll: true } : {
        search: filters.search,
        status: filters.status,
        hospitalId: filters.hospitalId,
        from: filters.from,
        to: filters.to,
      };

      const res = await requisitionApi.exportExcel(params);
      if (res.error) {
        toast.error(res.error || 'Failed to generate Excel report');
        return;
      }

      // Trigger browser download of the blob
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `Sanjivani_Blood_Requests_Report_${exportAll ? 'All' : 'Filtered'}_${dateStr}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel report downloaded successfully!');
    } catch (e) {
      toast.error('Network error during excel generation');
    } finally {
      setExcelLoading(false);
    }
  };

  const setSort = (col) => {
    setFilters((p) => ({ ...p, sortBy: col, order: p.sortBy === col && p.order === 'desc' ? 'asc' : 'desc' }));
    setPage(1);
    fetchList();
  };

  const openView = async (row) => {
    try {
      setViewLoading(true);
      setViewOpen(true);
      const res = await requisitionApi.getRequest(row._id);
      if (!res.success) {
        toast.error(res.error || 'Failed to load requisition');
        setViewDoc(null);
        return;
      }
      setViewDoc(res.data);
    } catch (e) {
      toast.error('Network error');
    } finally {
      setViewLoading(false);
    }
  };
  const closeView = () => { setViewOpen(false); setViewDoc(null); };

  const handleOpenReject = (id, reqId) => {
    setRejectingDocId(id);
    setRejectingDocReqId(reqId);
    setViewOpen(false);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason) => {
    try {
      setRejectSubmitting(true);
      const res = await requisitionApi.reject(rejectingDocId, reason);
      if (!res.success) {
        toast.error(res.error || 'Rejection failed');
        return;
      }
      toast.success('Request rejected successfully');
      setRejectModalOpen(false);
      
      // If the viewed document is the one rejected, refresh it
      if (viewDoc && viewDoc._id === rejectingDocId) {
        const detailRes = await requisitionApi.getRequest(rejectingDocId);
        if (detailRes.success) {
          setViewDoc(detailRes.data);
        }
      }
      fetchList();
    } catch (e) {
      toast.error('Network error during rejection');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const printSingleLabel = (doc, matchedUnit) => {
    try {
      setPrintLoading(true);
      setPrintType('label');
      // Create a temporary clone with ONLY this single matched inventory unit
      const singleDoc = {
        ...doc,
        matchedInventory: [matchedUnit]
      };
      setPrintDoc(singleDoc);
      toast.info(`Preparing issue label sticker for ${matchedUnit?.inventoryId?.componentId?.componentType || 'component'}...`);
      // Wait for React to render the printable HTML to DOM
      setTimeout(() => {
        RequisitionPrintService.print('label');
      }, 100);
    } catch (e) {
      toast.error('Error while preparing print');
    } finally {
      setPrintLoading(false);
    }
  };

  const handlePrint = async (row, type = 'report') => {
    try {
      setPrintLoading(true);
      toast.info(`Preparing ${type === 'label' ? 'issue label sticker' : 'issue report'}...`);
      const res = await requisitionApi.getRequest(row._id);
      if (!res.success) {
        toast.error(res.error || 'Failed to load requisition');
        return;
      }

      // If it's a label print and has multiple matched inventory bags, open the pop-up selection modal
      if (type === 'label' && res.data?.matchedInventory?.length > 1) {
        setMultiLabelDoc(res.data);
        setMultiLabelModalOpen(true);
        return;
      }

      setPrintType(type);
      setPrintDoc(res.data);
      // Wait for React to render the printable HTML to DOM
      setTimeout(() => {
        RequisitionPrintService.print(type);
      }, 100);
    } catch (e) {
      toast.error('Network error while preparing print');
    } finally {
      setPrintLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Requisition List</h1>
          <p className="text-gray-600 text-sm">Filter, paginate, and manage requests</p>
        </div>
      <CustomModal open={viewOpen} onCancel={closeView} title="Requisition Details" size="lg" hideFooter>
        {!viewDoc || viewLoading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600">Request ID</div>
                <div className="font-medium">{viewDoc.requestId}</div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-medium capitalize">{viewDoc.status}</div>
              </div>
              <div>
                <div className="text-gray-600">Hospital</div>
                <div className="font-medium">{viewDoc.hospitalId?.name}</div>
              </div>
              <div>
                <div className="text-gray-600">Requested At</div>
                <div className="font-medium">{fmt(viewDoc.requestedAt)}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="text-gray-600">Patient</div>
                <div className="font-medium">{viewDoc.patient?.name} • {viewDoc.patient?.age}/{viewDoc.patient?.sex} • MRN: {viewDoc.patient?.mrn || '—'}</div>
              </div>
            </div>
            {viewDoc.status === 'rejected' && (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-950 text-sm space-y-2">
                <div className="font-semibold flex items-center gap-2 text-red-800">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  Requisition Request Rejected
                </div>
                <p className="text-red-750">
                  This request has been rejected. No further actions (match, approve, issue, complete) are allowed.
                </p>
                {viewDoc.rejectionReason && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-red-150 shadow-sm">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider block mb-1">Reason for Rejection</span>
                    <p className="font-medium text-red-950 font-serif leading-relaxed italic">
                      "{viewDoc.rejectionReason}"
                    </p>
                    {(viewDoc.rejectedAt || viewDoc.rejectedBy || viewDoc.medicalOfficerSignature) && (
                      <div className="mt-2 text-xs text-red-500/80 flex flex-wrap gap-x-3 gap-y-1 border-t border-red-100 pt-1.5 font-medium">
                        {(viewDoc.medicalOfficerSignature || viewDoc.rejectedBy) && (
                          <span>Rejected By: <strong className="text-red-700">{viewDoc.medicalOfficerSignature || viewDoc.rejectedBy?.name || viewDoc.rejectedBy?.username || viewDoc.rejectedBy}</strong></span>
                        )}
                        {viewDoc.rejectedAt && (
                          <span>Rejected At: <strong className="text-red-700">{fmt(viewDoc.rejectedAt)}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div>
              <h4 className="font-semibold mb-2">Requested Components</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-2">Component</th>
                      <th className="p-2">Units</th>
                      <th className="p-2">Group</th>
                      <th className="p-2">Rh</th>
                      <th className="p-2">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDoc.requestedComponents?.map((c, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{c.componentType}</td>
                        <td className="p-2">{c.units}</td>
                        <td className="p-2">{c.bloodGroup}</td>
                        <td className="p-2">{c.rh}</td>
                        <td className="p-2 capitalize">{c.urgency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Matched/Reserved Inventory</h4>
              {viewDoc?.status !== 'rejected' && viewDoc?.matchedInventory?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="p-2">Inventory ID</th>
                        <th className="p-2">Component</th>
                        <th className="p-2">Bag No</th>
                        <th className="p-2">Blood</th>
                        <th className="p-2">Donor Name</th>
                        <th className="p-2">Day of Donation</th>
                        <th className="p-2">Reserved At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDoc.matchedInventory.map((mi, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{typeof mi.inventoryId === 'object' ? mi.inventoryId?._id : mi.inventoryId}</td>
                          <td className="p-2">{mi?.inventoryId?.componentId?.componentType || '—'}</td>
                          <td className="p-2">{mi?.inventoryId?.bagNo?.bagNo || '—'}</td>
                          <td className="p-2">{mi?.inventoryId?.bagNo ? `${mi.inventoryId.bagNo.bloodGroup} ${mi.inventoryId.bagNo.rh}` : '—'}</td>
                          <td className="p-2">{mi?.inventoryId?.bagNo?.donorName || '—'}</td>
                          <td className="p-2">{mi?.inventoryId?.bagNo?.collectedAt ? new Date(mi.inventoryId.bagNo.collectedAt).toLocaleDateString() : '—'}</td>
                          <td className="p-2">{mi?.reservedAt ? fmt(mi.reservedAt) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">No matched inventory yet.</div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t mt-6">
              <div>
                {['pending', 'matched', 'approved'].includes(viewDoc.status) && (
                  <button
                    type="button"
                    onClick={() => handleOpenReject(viewDoc._id, viewDoc.requestId)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-750 active:bg-red-800 text-white font-semibold rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reject Requisition Request
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={closeView}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      <CustomModal 
        open={multiLabelModalOpen} 
        onCancel={() => { setMultiLabelModalOpen(false); setMultiLabelDoc(null); }} 
        title="Select Issue Label to Generate" 
        size="lg" 
        hideFooter
      >
        {!multiLabelDoc ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <div className="space-y-6 text-sm">
            {/* Patient Header Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">Patient Details</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {multiLabelDoc.patient?.name || '—'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {multiLabelDoc.patient?.age ? `${multiLabelDoc.patient.age} Yrs` : ''} • {multiLabelDoc.patient?.sex || ''} • MRN: {multiLabelDoc.patient?.mrn || '—'}
                </p>
              </div>
              <div className="md:text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">Requisition Info</span>
                <p className="text-sm font-bold text-slate-900">
                  ID: <span className="font-mono">{multiLabelDoc.requestId}</span>
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {multiLabelDoc.hospitalId?.name || '—'}
                </p>
              </div>
            </div>

            {/* List of components */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-65"></span>
                Issued Components ({multiLabelDoc.matchedInventory?.length || 0})
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                {multiLabelDoc.matchedInventory?.map((unit, index) => {
                  const inv = unit.inventoryId || {};
                  const bag = inv.bagNo || {};
                  const comp = inv.componentId || {};
                  
                  const expiryDateFormatted = comp.expiryDate 
                    ? new Date(comp.expiryDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                  const bloodGroupText = bag.bloodGroup 
                    ? `${bag.bloodGroup} Rh ${bag.rh || ''}`
                    : '—';

                  return (
                    <div 
                      key={index} 
                      className="border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-950 capitalize">
                            {comp.componentType || '—'}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                            {bloodGroupText}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 font-medium">Bag No:</span>{' '}
                            <span className="font-mono font-semibold text-slate-800">{bag.bagNo || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Expiry:</span>{' '}
                            <span className="font-semibold text-slate-800">{expiryDateFormatted}</span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-slate-400 font-medium">Status:</span>{' '}
                            <span className="font-semibold text-green-700 capitalize">Issued</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => printSingleLabel(multiLabelDoc, unit)}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Issue Label
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CustomModal>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Search</label>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Request ID or Patient name" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                <option value="">All</option>
                {STATUS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Hospital</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.hospitalId} onChange={(e) => setFilters((p) => ({ ...p, hospitalId: e.target.value }))}>
                <option value="">All</option>
                {Array.isArray(hospitals) && hospitals.map((h) => (<option key={h._id} value={h._id}>{h.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">From</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">To</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <button type="button" onClick={applyFilters} className="px-4 py-2 rounded-lg bg-orange-800 text-white hover:bg-orange-900" disabled={loading}>Apply</button>
              <button type="button" onClick={resetFilters} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" disabled={loading}>Reset</button>
              <button type="button" onClick={exportCsv} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" disabled={loading}>Export CSV</button>
              
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 font-medium transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  disabled={excelLoading}
                >
                  {excelLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Export Excel
                  <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {exportDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportDropdownOpen(false)}></div>
                    <div className="absolute left-0 mt-1.5 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-20 overflow-hidden divide-y divide-gray-100">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => handleExportExcel(false)}
                          className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                        >
                          <svg className="w-4 h-4 mr-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          Export Filtered View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportExcel(true)}
                          className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                        >
                          <svg className="w-4 h-4 mr-2.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                          </svg>
                          Export All Records
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Rows</label>
              <select className="px-2 py-1 border rounded" value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10) || 10)}>
                {[10, 20, 50, 100].map(n => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          {allSelectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 border-b bg-amber-50 text-sm">
              <div className="text-amber-900">Selected: {allSelectedIds.length}</div>
              <div className="flex gap-2">
                <button onClick={() => bulkAction('approve')} className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white">Approve</button>
                <button onClick={() => bulkAction('issue')} className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-white">Issue</button>
                <button onClick={() => bulkAction('complete')} className="px-3 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white">Complete</button>
                <button onClick={() => bulkAction('reject')} className="px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">Reject</button>
                <button onClick={clearSelection} className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Clear</button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-3 border-b w-10">
                    <input type="checkbox" aria-label="Select all" onChange={(e) => {
                      const checked = e.target.checked; const map = {};
                      if (checked) data.forEach((r) => { map[r._id] = true; });
                      setSelected(map);
                    }} />
                  </th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('requestId')}>Request ID</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('hospitalId')}>Hospital</th>
                  <th className="p-3 border-b">Patient</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('requestedAt')}>Requested At</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('status')}>Status</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">Loading…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">No requisitions found</td></tr>
                ) : (
                  data.map((row) => (
                    <tr key={row._id} className="border-t">
                      <td className="p-3"><input type="checkbox" checked={!!selected[row._id]} onChange={() => toggle(row._id)} /></td>
                      <td className="p-3 font-medium">{row.requestId}</td>
                      <td className="p-3">{row.hospitalId?.name || '—'}</td>
                      <td className="p-3">{row.patient?.name} ({row.patient?.age}/{row.patient?.sex})</td>
                      <td className="p-3">{row.requestedAt ? new Date(row.requestedAt).toLocaleString() : '—'}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(row.status)}`}>{row.status}</span></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openView(row)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">View</button>
                          {row.status === 'completed' && (
                            <>
                              <button 
                                onClick={() => handlePrint(row, 'report')} 
                                disabled={printLoading} 
                                className="px-3 py-1 rounded bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-sm transition-all flex items-center gap-1 text-xs"
                              >
                                Issue Report
                              </button>
                              <button 
                                onClick={() => handlePrint(row, 'label')} 
                                disabled={printLoading} 
                                className="px-3 py-1 rounded bg-indigo-700 hover:bg-indigo-800 text-white font-medium shadow-sm transition-all flex items-center gap-1 text-xs"
                              >
                                Issue Label
                              </button>
                            </>
                          )}
                          {row.status !== 'rejected' && (
                            <>
                              <button onClick={() => navigate(`/requisition/${row._id}`)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">Manage</button>
                              <button disabled={!can(row, 'match')} onClick={() => callAction(row._id, 'match')} className={`px-3 py-1 rounded ${can(row,'match') ? 'bg-orange-800 hover:bg-orange-900 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Match</button>
                              <button disabled={!can(row, 'approve')} onClick={() => callAction(row._id, 'approve')} className={`px-3 py-1 rounded ${can(row,'approve') ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Approve</button>
                              <button disabled={!can(row, 'issue')} onClick={() => callAction(row._id, 'issue')} className={`px-3 py-1 rounded ${can(row,'issue') ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Issue</button>
                              <button disabled={!can(row, 'complete')} onClick={() => callAction(row._id, 'complete')} className={`px-3 py-1 rounded ${can(row,'complete') ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Complete</button>
                              <button disabled={!can(row, 'reject')} onClick={() => handleOpenReject(row._id, row.requestId)} className={`px-3 py-1 rounded ${can(row,'reject') ? 'border border-red-200 text-red-700 hover:bg-red-50' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t bg-gray-50">
            <div className="text-sm text-gray-600">Page {page} of {totalPages} • Total {total}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Wrapper (rendered directly under body via React Portal) */}
      {printDoc && createPortal(
        <div id="requisition-receipt-print-wrapper" className="hidden print:block">
          {printType === 'label' ? (
            <RequisitionLabelTemplate doc={printDoc} />
          ) : (
            <RequisitionPrintTemplate doc={printDoc} />
          )}
        </div>,
        document.body
      )}

      <RejectRequestModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        requestId={rejectingDocReqId}
        submitting={rejectSubmitting}
      />
    </div>
  );
}

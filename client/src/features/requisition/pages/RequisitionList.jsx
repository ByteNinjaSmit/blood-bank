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
import { Loader2, X, ClipboardList, RefreshCw } from 'lucide-react';
import { exportRequisitionsExcel } from '@/features/requisition/requisitionExcelExport';
import { COMPONENT_TYPES } from '@/constants/component-types';

const STATUS = ['pending', 'matched', 'approved', 'issued', 'completed', 'rejected'];

const COMPATIBILITY_RESULT_LABELS = {
  MAJOR_COMPATIBLE: 'Major Compatible',
  MINOR_COMPATIBLE: 'Minor Compatible',
  UNIVERSAL: 'Universal',
};

export default function RequisitionList() {
  const navigate = useNavigate();
  const { authorizationToken, user } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    hospitalId: '',
    urgency: '',
    componentType: '',
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
  const [printReportPage, setPrintReportPage] = useState('both');
  const [multiLabelModalOpen, setMultiLabelModalOpen] = useState(false);
  const [multiLabelDoc, setMultiLabelDoc] = useState(null);
  const [selectedPrintLabelDoc, setSelectedPrintLabelDoc] = useState(null);
  const [selectedPrintReportDoc, setSelectedPrintReportDoc] = useState(null);

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueDoc, setIssueDoc] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issuingRowId, setIssuingRowId] = useState(null);

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

  // Returns the effective display status for a row.
  // If the backend says 'completed' but some matched units are still unissued,
  // we show 'approved' so the user knows issuance is still pending.
  const rowDisplayStatus = (row) => {
    if (row.status === 'completed') {
      const hasUnissued = Array.isArray(row.matchedInventory) && row.matchedInventory.some(
        (mi) => (typeof mi.inventoryId === 'object' ? mi.inventoryId?.status : '') !== 'ISSUED'
      );
      if (hasUnissued) return 'approved';
    }
    return row.status;
  };

  // Per-component fulfillment: a requested line can be short even when the
  // overall requisition is "completed" (the components that were in stock
  // got issued, the ones that weren't stay unavailable forever on this request).
  const componentFulfillment = (doc, c) => {
    const matches = Array.isArray(doc?.matchedInventory) ? doc.matchedInventory.filter((mi) => {
      const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
      const bag = inv?.bagNo || {};
      const comp = inv?.componentId || {};
      return comp.componentType === c.componentType && bag.bloodGroup === c.bloodGroup && bag.rh === c.rh;
    }) : [];

    if (matches.length === 0) {
      return { label: 'Unavailable', className: 'bg-gray-100 text-gray-600 border border-gray-200' };
    }

    const allIssued = matches.every((mi) => (typeof mi.inventoryId === 'object' ? mi.inventoryId?.status : '') === 'ISSUED');
    const short = matches.length < Number(c.units || 0);

    if (short) {
      return {
        label: allIssued ? 'Partially Issued' : 'Partially Reserved',
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
      };
    }
    if (allIssued) return { label: 'Issued', className: 'bg-green-50 text-green-700 border border-green-200' };
    return { label: 'Reserved', className: 'bg-blue-50 text-blue-700 border border-blue-200' };
  };

  // Human-readable identifier to reference a requisition in user-facing messages.
  const getReqLabel = (row) => row?.requestId || row?.requisitionId || row?._id || 'this requisition';

  // Components can only be issued once the requisition has been approved
  // (or is already mid-issuance) — a "matched" (crossmatched but not yet
  // approved) requisition must not be issuable.
  const isApprovedForIssue = (row) => {
    const status = rowDisplayStatus(row);
    return status === 'approved' || status === 'issued';
  };

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
    setFilters({ search: '', status: '', hospitalId: '', urgency: '', componentType: '', from: '', to: '', sortBy: 'updatedAt', order: 'desc' });
    setPage(1);
    fetchList();
  };

  const handleOpenIssueModal = async (row) => {
    setIssueLoading(true);
    setIssueDoc(row);
    setIssueModalOpen(true);
    try {
      const res = await requisitionApi.getRequest(row._id);
      if (res.success) {
        setIssueDoc(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIssueLoading(false);
    }
  };

  const callAction = async (id, action) => {
    try {
      let res;
      if (action === 'match') res = await requisitionApi.match(id);
      if (action === 'approve') res = await requisitionApi.approve(id);
      if (action === 'issue') {
        const row = data.find(r => r._id === id);
        if (row) {
          if (!isApprovedForIssue(row)) {
            toast.error(`Requisition ${getReqLabel(row)} is not approved yet. Please approve the request before issuing.`);
            return;
          }
          await handleOpenIssueModal(row);
        }
        return;
      }
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
    if (act === 'issue') {
      if (s === 'rejected' || s === 'pending') return false;
      const hasMatches = Array.isArray(row.matchedInventory) && row.matchedInventory.length > 0;
      if (!hasMatches) return false;
      const hasUnissued = row.matchedInventory.some(
        (mi) => {
          const status = typeof mi.inventoryId === 'object' ? mi.inventoryId?.status : '';
          return status !== 'ISSUED';
        }
      );
      return hasUnissued;
    }
    if (act === 'complete') {
      if (s === 'completed' || s === 'rejected' || s === 'pending') return false;
      const hasMatches = Array.isArray(row.matchedInventory) && row.matchedInventory.length > 0;
      if (!hasMatches) return false;
      const allIssued = row.matchedInventory.every(
        (mi) => {
          const status = typeof mi.inventoryId === 'object' ? mi.inventoryId?.status : '';
          return status === 'ISSUED';
        }
      );
      return allIssued;
    }
    if (act === 'reject') {
      if (s === 'rejected') return false;
      if (s === 'completed') {
        const hasUnissued = Array.isArray(row.matchedInventory) && row.matchedInventory.some(
          (mi) => {
            const status = typeof mi.inventoryId === 'object' ? mi.inventoryId?.status : '';
            return status !== 'ISSUED';
          }
        );
        // Enable reject if still has unissued units (partially or not yet issued)
        return hasUnissued;
      }
      return ['pending', 'matched', 'approved', 'issued'].includes(s);
    }
    return false;
  };

  const toggle = (id) => setSelected((m) => ({ ...m, [id]: !m[id] }));
  const allSelectedIds = Object.keys(selected).filter((id) => selected[id]);
  const clearSelection = () => setSelected({});

  const bulkAction = async (action) => {
    if (allSelectedIds.length === 0) return;
    const rows = data.filter((r) => allSelectedIds.includes(r._id));
    let eligibleRows = rows.filter((r) => can(r, action));

    if (action === 'issue') {
      const blocked = eligibleRows.filter((r) => !isApprovedForIssue(r));
      if (blocked.length > 0) {
        const labels = blocked.map(getReqLabel).join(', ');
        toast.error(`Please approve requisition${blocked.length > 1 ? 's' : ''} ${labels} before issuing.`);
      }
      eligibleRows = eligibleRows.filter((r) => isApprovedForIssue(r));
    }

    const allowed = eligibleRows.map((r) => r._id);
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

      const generatedBy = user?.name ? [user.name.first, user.name.last].filter(Boolean).join(' ') : (user?.username || 'System User');
      await exportRequisitionsExcel(params, generatedBy);
      toast.success('Excel report downloaded successfully!');
    } catch (e) {
      toast.error(e?.message || 'Failed to generate Excel report');
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
      // Create a temporary clone with ONLY this single matched inventory unit
      const singleDoc = {
        ...doc,
        matchedInventory: [matchedUnit]
      };
      setSelectedPrintLabelDoc(singleDoc);
      setMultiLabelModalOpen(false);
    } catch (e) {
      toast.error('Error while preparing preview');
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

      if (type === 'label') {
        // If it has multiple matched inventory bags, open the pop-up selection modal
        if (res.data?.matchedInventory?.length > 1) {
          setMultiLabelDoc(res.data);
          setMultiLabelModalOpen(true);
          return;
        }
        
        // Otherwise, open the print preview modal for the single label directly
        setSelectedPrintLabelDoc(res.data);
        return;
      }

      // Report/Issue register: open a two-page preview before printing
      setPrintReportPage('both');
      setSelectedPrintReportDoc(res.data);
    } catch (e) {
      toast.error('Network error while preparing print');
    } finally {
      setPrintLoading(false);
    }
  };

  // Prints the issue report; page can be 1, 2, or 'both' so either page can
  // be reprinted on its own (e.g. a fresh copy of just the reaction record).
  const printReport = (doc, page) => {
    setPrintType('report');
    setPrintReportPage(page);
    setPrintDoc(doc);
    setSelectedPrintReportDoc(null);
    setTimeout(() => {
      RequisitionPrintService.print('report');
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <ClipboardList className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requisition List</h1>
            <p className="text-gray-500 text-sm">Hospital requisitions</p>
          </div>
        </div>
      <CustomModal open={viewOpen} onCancel={closeView} title="Requisition Details" size="3xl" hideFooter>
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
                {viewDoc.patient?.address && (
                  <div className="text-xs text-gray-500 mt-0.5">{viewDoc.patient.address}</div>
                )}
              </div>
              <div>
                <div className="text-gray-600">Doctor</div>
                <div className="font-medium">{viewDoc.doctorName || '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Indication for Transfusion</div>
                <div className="font-medium">{viewDoc.patient?.indication || '—'}</div>
              </div>
            </div>
            {(() => {
              // One crossmatch card covers the whole requisition — pull the
              // single card number off whichever matched unit recorded it,
              // rather than repeating it per row in the inventory table.
              const cardNumber = viewDoc.matchedInventory?.find((mi) => mi?.cardNumber)?.cardNumber;
              return cardNumber ? (
                <div>
                  <div className="text-gray-600">Card No.</div>
                  <div className="font-medium font-mono">{cardNumber}</div>
                </div>
              ) : null;
            })()}
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
                    {(viewDoc.rejectedAt || viewDoc.rejectedBy) && (
                      <div className="mt-2 text-xs text-red-500/80 flex flex-wrap gap-x-3 gap-y-1 border-t border-red-100 pt-1.5 font-medium">
                        {viewDoc.rejectedBy && (
                          <span>Rejected By: <strong className="text-red-700">{viewDoc.rejectedBy?.name || viewDoc.rejectedBy?.username || viewDoc.rejectedBy}</strong></span>
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
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDoc.requestedComponents?.map((c, idx) => {
                      const fulfillment = viewDoc.status === 'rejected'
                        ? null
                        : componentFulfillment(viewDoc, c);
                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{c.componentType}</td>
                          <td className="p-2">{c.units}</td>
                          <td className="p-2">{c.bloodGroup}</td>
                          <td className="p-2">{c.rh}</td>
                          <td className="p-2 capitalize">{c.urgency}</td>
                          <td className="p-2">
                            {fulfillment && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${fulfillment.className}`}>
                                {fulfillment.label}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                        <th className="p-2">Component</th>
                        <th className="p-2">Bag No</th>
                        <th className="p-2">Segment No</th>
                        <th className="p-2">Blood</th>
                        <th className="p-2">Quantity (mL)</th>
                        <th className="p-2">Donor Name</th>
                        <th className="p-2">Day of Donation</th>
                        <th className="p-2">Reserved At</th>
                        <th className="p-2">Compatibility</th>
                        <th className="p-2">Crossmatch Done At</th>
                        <th className="p-2">Seen At</th>
                        <th className="p-2">Issue Date</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDoc.matchedInventory.map((mi, i) => {
                        const st = mi?.inventoryId?.status;
                        let badgeColor = 'bg-gray-50 border border-gray-200 text-gray-600';
                        let label = 'Unavailable';
                        if (st === 'ISSUED') {
                          badgeColor = 'bg-green-50 border border-green-200 text-green-700';
                          label = 'Issued';
                        } else if (st === 'RESERVED' || st === 'CROSSMATCHED') {
                          badgeColor = 'bg-blue-50 border border-blue-200 text-blue-700';
                          label = 'Reserved';
                        }

                        return (
                          <tr key={i} className="border-t">
                            <td className="p-2">{mi?.inventoryId?.componentId?.componentType || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo?.bagNo || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo?.segmentNo || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo ? `${mi.inventoryId.bagNo.bloodGroup} ${mi.inventoryId.bagNo.rh}` : '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.componentId?.volumeMl ?? '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo?.donorName || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo?.collectedAt ? new Date(mi.inventoryId.bagNo.collectedAt).toLocaleDateString() : '—'}</td>
                            <td className="p-2">{mi?.reservedAt ? fmt(mi.reservedAt) : '—'}</td>
                            <td className="p-2">{COMPATIBILITY_RESULT_LABELS[mi?.compatibilityResult] || '—'}</td>
                            <td className="p-2">{mi?.crossmatchDoneAt ? fmt(mi.crossmatchDoneAt) : '—'}</td>
                            <td className="p-2">{mi?.crossmatchSeenAt ? fmt(mi.crossmatchSeenAt) : '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.issuedAt ? fmt(mi.inventoryId.issuedAt) : '—'}</td>
                            <td className="p-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                                {label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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
        open={issueModalOpen}
        onCancel={() => { setIssueModalOpen(false); setIssueDoc(null); }}
        title="Issue Components separately"
        size="2xl"
        hideFooter
      >
        {!issueDoc || issueLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            <span className="ml-2 text-sm text-gray-500">Loading details…</span>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            {/* Patient Header Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">Patient Details</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {issueDoc.patient?.name || '—'}
                </h3>
                <span className="text-xs text-slate-500 mt-1 block font-medium">
                  MRN: {issueDoc.patient?.mrn || '—'} • Age/Sex: {issueDoc.patient?.age || '—'}Y/{issueDoc.patient?.sex || '—'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">Request ID</span>
                <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg font-mono">
                  {issueDoc.requestId || issueDoc.requisitionId || '—'}
                </span>
                <span className="text-xs text-slate-500 mt-1 block capitalize font-semibold">
                  Status: {issueDoc.status}
                </span>
              </div>
            </div>

            {/* Components list */}
            <div>
              <h4 className="font-semibold mb-2">Reserved Components to Issue</h4>
              {issueDoc.matchedInventory?.length ? (
                <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="p-3">Bag No</th>
                        <th className="p-3">Segment No</th>
                        <th className="p-3">Component</th>
                        <th className="p-3">Blood Group</th>
                        <th className="p-3">Donation Date</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3">Issued At</th>
                        <th className="p-3 text-right">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {issueDoc.matchedInventory.map((mi, idx) => {
                        const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                        const invId = inv?._id || mi.inventoryId || idx;
                        const bagNo = inv?.bagNo?.bagNo || '—';
                        const segmentNo = inv?.bagNo?.segmentNo || '—';
                        const compType = inv?.componentId?.componentType || '—';
                        const bloodGroup = inv?.bagNo?.bloodGroup ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh === 'Positive' ? '+' : inv.bagNo.rh === 'Negative' ? '-' : ''}` : '—';
                        const donationDate = inv?.bagNo?.collectedAt ? new Date(inv.bagNo.collectedAt).toLocaleDateString() : '—';
                        const expiryDate = inv?.componentId?.expiryDate ? new Date(inv.componentId.expiryDate).toLocaleDateString() : '—';
                        const unitStatus = inv?.status || '—';

                        const isIssued = unitStatus === 'ISSUED';
                        const isReserved = unitStatus === 'RESERVED' || unitStatus === 'CROSSMATCHED';
                        const issuedAtDisplay = isIssued && inv?.issuedAt ? fmt(inv.issuedAt) : '—';

                        return (
                          <tr key={invId} className="hover:bg-gray-50/50">
                            <td className="p-3 font-mono text-xs font-bold text-gray-800">{bagNo}</td>
                            <td className="p-3 font-mono text-xs font-bold text-gray-800">{segmentNo}</td>
                            <td className="p-3 font-semibold text-gray-700">{compType}</td>
                            <td className="p-3 font-bold text-gray-800">{bloodGroup}</td>
                            <td className="p-3 text-gray-600">{donationDate}</td>
                            <td className="p-3 text-gray-600">{expiryDate}</td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">{issuedAtDisplay}</td>
                            <td className="p-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                isIssued
                                  ? 'bg-green-50 border border-green-200 text-green-700'
                                  : isReserved
                                  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                  : 'bg-gray-50 border border-gray-200 text-gray-600'
                              }`}>
                                {isIssued ? 'ISSUED' : isReserved ? 'RESERVED' : unitStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {isReserved ? (
                                <button
                                  type="button"
                                  disabled={issuingRowId === invId}
                                  onClick={async () => {
                                    setIssuingRowId(invId);
                                    try {
                                      const res = await requisitionApi.issue(issueDoc._id, [invId]);
                                      if (!res.success) {
                                        toast.error(res.error || 'Failed to issue component');
                                      } else {
                                        toast.success('Component issued successfully');
                                        // Refresh the popup state
                                        const fresh = await requisitionApi.getRequest(issueDoc._id);
                                        if (fresh.success) {
                                          setIssueDoc(fresh.data);
                                          // Check if all units are issued to complete it automatically
                                          const allDone = fresh.data.matchedInventory.every(
                                            (m) => (typeof m.inventoryId === 'object' ? m.inventoryId?.status : '') === 'ISSUED'
                                          );
                                          if (allDone) {
                                            const completeRes = await requisitionApi.complete(issueDoc._id);
                                            if (completeRes.success) {
                                              toast.success('All components issued. Requisition completed.');
                                              setIssueModalOpen(false);
                                              setIssueDoc(null);
                                            }
                                          }
                                        }
                                        fetchList();
                                      }
                                    } catch (e) {
                                      toast.error('Network error during issue');
                                    } finally {
                                      setIssuingRowId(null);
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold transition active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {issuingRowId === invId ? 'Issuing…' : 'Issue'}
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">No matched inventory.</div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <button
                type="button"
                onClick={() => { setIssueModalOpen(false); setIssueDoc(null); }}
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
            <div>
              <label className="block text-sm text-gray-700 mb-1">Urgency</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.urgency} onChange={(e) => setFilters((p) => ({ ...p, urgency: e.target.value }))}>
                <option value="">All</option>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Component</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.componentType} onChange={(e) => setFilters((p) => ({ ...p, componentType: e.target.value }))}>
                <option value="">All</option>
                {COMPONENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.value}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchList()}
                disabled={loading}
                title="Refresh"
                aria-label="Refresh"
                className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
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
                      <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(rowDisplayStatus(row))}`}>{rowDisplayStatus(row)}</span></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openView(row)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">View</button>
                          {rowDisplayStatus(row) === 'completed' && (
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
                              {can(row, 'reject') && (
                                <button onClick={() => handleOpenReject(row._id, row.requestId)} className="px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">Reject</button>
                              )}
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
            <RequisitionPrintTemplate doc={printDoc} printPage={printReportPage} />
          )}
        </div>,
        document.body
      )}

      {/* Requisition Label Print Preview Modal */}
      {selectedPrintLabelDoc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-xs no-print select-none py-8">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col items-center my-auto">
            <button
              onClick={() => setSelectedPrintLabelDoc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              Requisition Label Print Preview
            </h3>

            {/* Wrapper to contain the CSS scaled label preview on screen */}
            <div
              className="flex items-center justify-center overflow-hidden my-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50"
              style={{
                width: '11.5cm',
                height: '14.5cm',
              }}
            >
              <RequisitionLabelTemplate doc={selectedPrintLabelDoc} isPreview={true} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6 w-full justify-end">
              <button 
                onClick={() => setSelectedPrintLabelDoc(null)}
                className="px-5 py-2 text-xs font-bold border border-gray-300 rounded-lg hover:bg-gray-50 bg-white text-gray-700 shadow-none transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setPrintType('label');
                  setPrintDoc(selectedPrintLabelDoc);
                  setSelectedPrintLabelDoc(null);
                  setTimeout(() => {
                    RequisitionPrintService.print('label');
                  }, 100);
                }}
                className="px-6 py-2 text-xs font-bold bg-red-800 hover:bg-red-900 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requisition Issue Report Print Preview Modal (shows both pages before printing) */}
      {selectedPrintReportDoc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-xs no-print select-none py-8">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative flex flex-col items-center my-auto">
            <button
              onClick={() => setSelectedPrintReportDoc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              Issue Report Print Preview
            </h3>

            {/* Scrollable preview of both pages, stacked with a visual gap between them */}
            <div className="w-full max-h-[65vh] overflow-y-auto border border-dashed border-gray-200 rounded-lg bg-gray-50/50 p-4">
              <RequisitionPrintTemplate doc={selectedPrintReportDoc} isPreview={true} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6 w-full justify-end flex-wrap">
              <button
                onClick={() => setSelectedPrintReportDoc(null)}
                className="px-5 py-2 text-xs font-bold border border-gray-300 rounded-lg hover:bg-gray-50 bg-white text-gray-700 shadow-none transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => printReport(selectedPrintReportDoc, 1)}
                className="px-5 py-2 text-xs font-bold border border-red-200 text-red-800 hover:bg-red-50 rounded-lg shadow-sm transition-colors"
              >
                Print Page 1 Only
              </button>
              <button
                onClick={() => printReport(selectedPrintReportDoc, 2)}
                className="px-5 py-2 text-xs font-bold border border-red-200 text-red-800 hover:bg-red-50 rounded-lg shadow-sm transition-colors"
              >
                Print Page 2 Only
              </button>
              <button
                onClick={() => printReport(selectedPrintReportDoc, 'both')}
                className="px-6 py-2 text-xs font-bold bg-red-800 hover:bg-red-900 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                Print Both Pages
              </button>
            </div>
          </div>
        </div>
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

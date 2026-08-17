import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import requisitionApi from '@/services/requisitionApi';
import hospitalApi from '@/services/hospitalApi';
import { toast } from 'sonner';
import RequisitionPrintService from '@/services/requisitionPrintService';
import { exportRequisitionsExcel } from '@/features/requisition/requisitionExcelExport';
import { requisitionApprovalBlockers } from '@/features/requisition/requisition-gating';
import { auditApi } from '@/features/audit/api';

const COMPATIBILITY_RESULT_LABELS = {
  MAJOR_COMPATIBLE: 'Major Compatible',
  MINOR_COMPATIBLE: 'Minor Compatible',
  UNIVERSAL: 'Universal',
};

export function useRequisitionList() {
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
  const [reportSelectOpen, setReportSelectOpen] = useState(false);
  const [reportSelectDoc, setReportSelectDoc] = useState(null);

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueDoc, setIssueDoc] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issuingRowId, setIssuingRowId] = useState(null);

  const [excelLoading, setExcelLoading] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRequisitionId, setEditRequisitionId] = useState(null);

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
    // 'completed' is included so the Issue modal stays reachable even once
    // every component has been issued — that's the only way to reopen it
    // and unissue a mistakenly-issued bag back to Reserved.
    return status === 'approved' || status === 'issued' || status === 'completed';
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
    // Reservation-origin requisitions have their own dedicated list at
    // /inventory/reserve — keep them out of the normal requisition worklist.
    const params = { ...filters, page, limit, purpose: 'REQUISITION' };
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

  // Editing (Manage) is only allowed before the request is approved — after
  // approval, units are reserved, so patient/component/bag details are locked.
  const canManage = (row) => !['approved', 'issued', 'completed', 'rejected'].includes(row.status);

  // The dedicated Edit modal (details-only correction, not the full
  // match/approve/issue wizard) is also allowed on issued/completed
  // requisitions — units are already reserved/issued by then, so the edit
  // modal skips re-matching for any status other than pending/matched
  // (see RequisitionEditModal).
  // Edit stays open on any non-rejected status — including approved/issued/
  // completed — since Step 2 (matched bags) locks only the individual bags
  // that are actually issued, and Step 1 can still add more units for a
  // not-yet-fully-satisfied component.
  const canEdit = (row) => row.status !== 'rejected';

  const can = (row, act) => {
    const s = row.status;
    if (act === 'match') return s === 'pending';
    // Approve is blocked until the recipient grouping, each proposed bag's
    // grouping and the crossmatch worksheet are recorded — mirrors the Manage
    // stepper's gate so approving straight from the list can't skip them.
    if (act === 'approve') return s === 'matched' && requisitionApprovalBlockers(row).length === 0;
    if (act === 'issue') {
      // Issue is only available once the requisition has been approved —
      // a matched-but-not-yet-approved request must not be issuable.
      if (s === 'rejected' || s === 'pending' || s === 'matched') return false;
      // Approved requests can be issued even before any components have
      // been matched/reserved yet — matching happens as part of issuing.
      if (s === 'approved') return true;
      const hasMatches = Array.isArray(row.matchedInventory) && row.matchedInventory.length > 0;
      if (!hasMatches) return false;
      // Stay enabled even once everything is issued — the Issue modal is
      // also where an accidental issue gets corrected (unissued back to
      // Reserved), so the button/modal must not disappear at full issuance.
      return true;
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

  const openEdit = (row) => {
    setEditRequisitionId(row._id);
    setEditModalOpen(true);
  };
  const closeEdit = () => { setEditModalOpen(false); setEditRequisitionId(null); };

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

  const [unreserveModalOpen, setUnreserveModalOpen] = useState(false);
  const [unreserveTargetUnitId, setUnreserveTargetUnitId] = useState(null);
  const [unreserveSubmitting, setUnreserveSubmitting] = useState(false);

  const openUnreserveModal = (unitId) => {
    setUnreserveTargetUnitId(unitId);
    setUnreserveModalOpen(true);
  };
  const closeUnreserveModal = () => {
    setUnreserveModalOpen(false);
    setUnreserveTargetUnitId(null);
  };

  const confirmUnreserve = async (reason) => {
    if (!viewDoc || !unreserveTargetUnitId) return;
    try {
      setUnreserveSubmitting(true);
      const res = await requisitionApi.unreserve(viewDoc._id, { unitId: unreserveTargetUnitId, reason });
      if (!res.success) {
        toast.error(res.error || 'Failed to unreserve component');
        return;
      }
      toast.success('Component manually unreserved and returned to stock');
      const fresh = await requisitionApi.getRequest(viewDoc._id);
      if (fresh.success) setViewDoc(fresh.data);
      fetchList();
      closeUnreserveModal();
    } catch (e) {
      toast.error('Network error while unreserving');
    } finally {
      setUnreserveSubmitting(false);
    }
  };

  const printSingleLabel = (doc, matchedUnit) => {
    try {
      const inv = typeof matchedUnit?.inventoryId === 'object' ? matchedUnit.inventoryId : null;
      if (inv?.status !== 'ISSUED') {
        toast.error('Issue this component before printing its label.');
        return;
      }
      // Create a temporary clone with ONLY this single matched inventory unit
      const singleDoc = {
        ...doc,
        matchedInventory: [matchedUnit]
      };
      setSelectedPrintLabelDoc(singleDoc);
      setMultiLabelModalOpen(false);
      auditApi.logPrintEvent({
        module: 'requisition',
        entityType: 'Requisition',
        entityId: doc.requisitionId || doc._id,
        entityLabel: matchedUnit?.unitId,
        docType: 'label',
      });
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

      auditApi.logPrintEvent({
        module: 'requisition',
        entityType: 'Requisition',
        entityId: res.data?.requisitionId || row._id,
        docType: type === 'label' ? 'label' : 'report',
      });

      if (type === 'label') {
        const units = res.data?.matchedInventory || [];
        const issuedUnits = units.filter((mi) => {
          const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
          return inv?.status === 'ISSUED';
        });
        if (units.length === 0) {
          toast.error('No matched components on this requisition yet.');
          return;
        }
        if (issuedUnits.length === 0) {
          toast.error('Issue at least one component before printing its label.');
          return;
        }
        // A single issued bag with nothing else to choose between — go
        // straight to the label preview. Otherwise let the operator pick
        // which (issued-only) component(s) to print via the selection modal.
        if (units.length === 1 && issuedUnits.length === 1) {
          setSelectedPrintLabelDoc(res.data);
          return;
        }
        setMultiLabelDoc(res.data);
        setMultiLabelModalOpen(true);
        return;
      }

      // Report/Issue register: show the component selection step first so
      // the operator can restrict the printed report to specific
      // (issued-only) components before previewing/printing.
      setReportSelectDoc(res.data);
      setReportSelectOpen(true);
    } catch (e) {
      toast.error('Network error while preparing print');
    } finally {
      setPrintLoading(false);
    }
  };

  // Confirms the operator's component selection from the report pre-print
  // step, restricts the requisition doc to just those matched units, and
  // opens the (existing) two-page report preview on that restricted doc.
  const confirmReportSelection = (selectedInvIds) => {
    if (!reportSelectDoc || !selectedInvIds?.length) return;
    const filtered = {
      ...reportSelectDoc,
      matchedInventory: (reportSelectDoc.matchedInventory || []).filter((mi) => {
        const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
        const id = inv?._id || mi.inventoryId;
        return selectedInvIds.includes(id);
      }),
    };
    setReportSelectOpen(false);
    setReportSelectDoc(null);
    setPrintReportPage('both');
    setSelectedPrintReportDoc(filtered);
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
  return { allSelectedIds,applyFilters,bulkAction,callAction,can,canEdit,canManage,clearSelection,closeEdit,closeView,componentFulfillment,confirmReportSelection,data,editModalOpen,editRequisitionId,excelLoading,exportDropdownOpen,fetchList,filters,fmt,getReqLabel,handleConfirmReject,handleExportExcel,handleOpenIssueModal,handleOpenReject,handlePrint,hospitals,isApprovedForIssue,issueDoc,issueLoading,issueModalOpen,issuingRowId,limit,loading,multiLabelDoc,multiLabelModalOpen,navigate,openEdit,openView,page,printDoc,printLoading,printReport,printReportPage,printSingleLabel,printType,rejectingDocId,rejectingDocReqId,rejectModalOpen,rejectSubmitting,reportSelectDoc,reportSelectOpen,resetFilters,rowDisplayStatus,searchInput,selected,selectedPrintLabelDoc,selectedPrintReportDoc,setData,setEditModalOpen,setExcelLoading,setExportDropdownOpen,setFilters,setHospitals,setIssueDoc,setIssueLoading,setIssueModalOpen,setIssuingRowId,setLimit,setLoading,setMultiLabelDoc,setMultiLabelModalOpen,setPage,setPrintDoc,setPrintLoading,setPrintReportPage,setPrintType,setRejectingDocId,setRejectingDocReqId,setRejectModalOpen,setRejectSubmitting,setReportSelectDoc,setReportSelectOpen,setSearchInput,setSelected,setSelectedPrintLabelDoc,setSelectedPrintReportDoc,setSort,setTotal,setViewDoc,setViewLoading,setViewOpen,statusClass,toggle,total,totalPages,openUnreserveModal,closeUnreserveModal,confirmUnreserve,unreserveModalOpen,unreserveSubmitting,viewDoc,viewLoading,viewOpen,user,authorizationToken };
}

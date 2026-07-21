import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { PackageCheck, Warehouse, MapPin, ArrowLeftRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import RegisterExportDropdown from "@/components/shared/RegisterExportDropdown";
import StorageTab from "./issue-tabs/StorageTab";
import DiseaseTab from "./issue-tabs/DiseaseTab";
import BulkTransferTab from "./issue-tabs/BulkTransferTab";
import IssueStockTab from "./issue-tabs/IssueStockTab";
import SendToStorageModal from "./issue-tabs/SendToStorageModal";
import BulkTransferFormModal from "./issue-tabs/BulkTransferFormModal";
import StorageEditModal from "./issue-tabs/StorageEditModal";
import IssueViewModals from "./issue-tabs/IssueViewModals";
import IssuePrintPrompts from "./issue-tabs/IssuePrintPrompts";
import { useBulkTransfer } from "./hooks/useBulkTransfer";
import { useIssueExport } from "./hooks/useIssueExport";
import { formatDate as formatDateBase, formatDateTime as formatDateTimeBase } from "@/lib/format-date";

// Day/month/year with month as a number (e.g. 19/07/2026), used across
// every tab on this page and their view modals — not the shared helper's
// default abbreviated month.
const formatDate = (v) => formatDateBase(v, { day: "2-digit", month: "2-digit", year: "numeric" });
const formatDateTime = (v) => formatDateTimeBase(v, { day: "2-digit", month: "2-digit", year: "numeric" });
import { useEditWithReason } from "@/hooks/useEditWithReason";
import { useDeleteWithReason } from "@/hooks/useDeleteWithReason";
import { useUpdateStorageBag, useReturnFromStorage } from "@/features/inventory/queries";
import { useUpdateBulkTransfer, useDeleteBulkTransfer } from "@/features/bulk-transfer/queries";

const ISSUE_REGISTERS = [
  { key: 'issue', label: 'Issue Stock Register' },
  { key: 'storage', label: 'Storage Register', filteredLabel: 'Current Location', allLabel: 'All Locations' },
  { key: 'disease', label: 'Clinical Indication / Disease Register' },
  { key: 'bulkTransfer', label: 'Bulk Transfer Register', filteredLabel: 'Current Page', allLabel: 'All Records' },
];

const Issue = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [storageOpen, setStorageOpen] = useState(false);
  const [storageLocation, setStorageLocation] = useState("SJS [Kopargaon]");
  const [otherLocationName, setOtherLocationName] = useState("");
  const [dispatchType, setDispatchType] = useState("STORAGE"); // STORAGE | CLINICAL_INDICATION
  const [sentDate, setSentDate] = useState(new Date().toISOString().split('T')[0]);
  const [patientDetails, setPatientDetails] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    age: "",
    sex: "M",
    bloodGroup: "A+",
    disease: "THALASSEMIA",
    otherDiseaseName: "",
  });
  const [storageBags, setStorageBags] = useState([{ componentType: "PRBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  // filters
  const [componentType, setComponentType] = useState("");
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");
  const [order, setOrder] = useState("desc");

  const [status, setStatus] = useState('issued');
  // Sort by actual issue recency when viewing issued stock (most recently
  // issued first); reserved stock has no issuedAt yet, so fall back to
  // createdAt there. No UI control changes this.
  const sortBy = status === 'issued' ? 'issuedAt' : 'createdAt';
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  // ── Storage tabs state ──────────────────────────────
  const [mainTab, setMainTab] = useState('issue'); // 'issue' | 'storage' | 'disease'
  const [storageSubTab, setStorageSubTab] = useState('SJS'); // 'SJS' | 'Anand'
  const [storageBagRows, setStorageBagRows] = useState([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageViewOpen, setStorageViewOpen] = useState(false);
  const [storageViewItem, setStorageViewItem] = useState(null);
  const [expandedDates, setExpandedDates] = useState(new Set()); // dates open in accordion

  // ── Storage bag edit / delete ─────────────────────────
  const [storageEditOpen, setStorageEditOpen] = useState(false);
  const [storageEditTarget, setStorageEditTarget] = useState(null);
  const updateStorageBagMutation = useUpdateStorageBag();
  const returnFromStorageMutation = useReturnFromStorage();

  const openStorageEdit = (bag) => { setStorageEditTarget(bag); setStorageEditOpen(true); };
  const closeStorageEdit = () => { setStorageEditOpen(false); setStorageEditTarget(null); };

  const { wrappedSave: saveStorageEdit, EditReasonDialog: StorageEditReasonDialog } = useEditWithReason({
    onSave: async (payload, reason) => {
      try {
        await updateStorageBagMutation.mutateAsync({ id: storageEditTarget._id, data: { ...payload, reason } });
        toast.success('Storage location updated');
        closeStorageEdit();
        fetchStorageBags(storageSubTab);
      } catch (e) {
        toast.error(e?.message || 'Failed to update storage location');
        throw e;
      }
    },
    title: 'Confirm Storage Location Change',
    message: "Please provide a reason for changing this bag's storage location. It will be recorded in the audit trail.",
  });

  const { requestDelete: requestStorageDelete, DeleteReasonDialog: StorageDeleteReasonDialog } = useDeleteWithReason({
    onDelete: async (bag, reason) => {
      try {
        await returnFromStorageMutation.mutateAsync({ id: bag._id, reason });
        toast.success('Bag removed from storage — returned to stock');
        fetchStorageBags(storageSubTab);
      } catch (e) {
        toast.error(e?.message || 'Failed to remove bag from storage');
        throw e;
      }
    },
    title: 'Remove Bag From Storage',
    message: 'This bag will be returned to available stock and removed from the storage register.',
    fieldLabel: 'Reason for Removal',
  });

  // ── Thalassemia tab state ────────────────────────────
  const [thalRows, setThalRows] = useState([]);
  const [thalLoading, setThalLoading] = useState(false);
  const [thalViewOpen, setThalViewOpen] = useState(false);
  const [thalViewItem, setThalViewItem] = useState(null);
  const [thalPagination, setThalPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });


  const fetchRows = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/inventory`, {
        params: {
          page,
          limit,
          status,
          componentType: componentType || undefined,
          search: search || undefined,
          bloodGroup: bloodGroup || undefined,
          expiryFrom: expiryFrom || undefined,
          expiryTo: expiryTo || undefined,
          sortBy,
          order,
        },
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setPagination((p) => ({ ...p, ...(res.data?.pagination || {}) }));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch inventory");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableUnits = async () => {
    setLoadingAvailable(true);
    try {
      const res = await apiClient.get(`/api/inventory`, {
        params: {
          page: 1,
          limit: 5000,
          status: 'in-stock', // gets RELEASED units
        },
      });
      setAvailableUnits(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error("Failed to fetch available blood units for storage");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleSendToStorage = async () => {
    const isClinicalIndication = dispatchType === "CLINICAL_INDICATION";
    let locationVal = null;
    if (!isClinicalIndication) {
      locationVal = storageLocation === 'Others' ? otherLocationName.trim() : storageLocation;
      if (!locationVal) {
        return toast.warning("Please specify a storage location");
      }
    } else {
      if (!patientDetails.firstName.trim() || !patientDetails.lastName.trim()) {
        return toast.warning("Please enter the patient's first name and last name");
      }
      if (!patientDetails.age || isNaN(Number(patientDetails.age))) {
        return toast.warning("Please enter a valid age");
      }
      if (!patientDetails.disease) {
        return toast.warning("Please select a disease");
      }
      if (patientDetails.disease === "OTHER" && !patientDetails.otherDiseaseName.trim()) {
        return toast.warning("Please specify the disease name");
      }
    }

    const bagsPayload = [];
    storageBags.forEach(comp => {
      comp.groups.forEach(group => {
        if (group.selectedBags && group.selectedBags.length > 0) {
          bagsPayload.push({
            bloodGroup: group.bloodGroup,
            bagIds: group.selectedBags,
          });
        }
      });
    });

    if (bagsPayload.length === 0) {
      return toast.warning("Please select at least one blood bag to send to storage");
    }

    try {
      setIsLoading(true);
      await apiClient.post(`/api/inventory/send-to-storage`, {
        location: storageLocation,
        otherLocationName: otherLocationName.trim(),
        bags: bagsPayload,
        userId: user?._id || user?.id,
        dispatchType,
        sentDate: isClinicalIndication ? null : sentDate,
        clinicalIndicationPatient: isClinicalIndication ? {
          ...patientDetails,
          firstName: patientDetails.firstName.trim(),
          middleName: patientDetails.middleName.trim(),
          lastName: patientDetails.lastName.trim(),
          address: patientDetails.address.trim(),
          age: Number(patientDetails.age),
          otherDiseaseName: patientDetails.disease === "OTHER" ? patientDetails.otherDiseaseName.trim() : "",
        } : null,
      });

      toast.success(isClinicalIndication ? "Issued for the clinical indication successfully" : "Blood bags sent to storage successfully");
      setStorageOpen(false);
      setStorageLocation("SJS [Kopargaon]");
      setOtherLocationName("");
      setDispatchType("STORAGE");
      setSentDate(new Date().toISOString().split('T')[0]);
      setPatientDetails({
        firstName: "",
        middleName: "",
        lastName: "",
        address: "",
        age: "",
        sex: "M",
        bloodGroup: "A+",
        disease: "THALASSEMIA",
        otherDiseaseName: "",
      });
      setStorageBags([{ componentType: "PRBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
      fetchRows(pagination.page);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to issue blood units");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, componentType, search, bloodGroup, expiryFrom, expiryTo, order, sortBy]);

  const openView = (item) => { setViewItem(item); setViewOpen(true); };
  const closeView = () => { setViewOpen(false); setViewItem(null); };

  const fetchStorageBags = async (location = storageSubTab) => {
    setStorageLoading(true);
    setExpandedDates(new Set()); // reset expanded on location change
    try {
      const res = await apiClient.get(`/api/inventory`, {
        params: { page: 1, limit: 500, status: 'issued', storageLocation: location, sortBy: 'issuedAt', order: 'desc' },
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setStorageBagRows(data);
      // Auto-expand the most recent date group
      if (data.length > 0) {
        const latestDate = formatDate(data[0].issuedAt);
        setExpandedDates(new Set([latestDate]));
      }
    } catch {
      toast.error('Failed to fetch storage bags');
      setStorageBagRows([]);
    } finally {
      setStorageLoading(false);
    }
  };

  const toggleDateGroup = (dateKey) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  // Group storage bags by sent date
  const storageBagsByDate = React.useMemo(() => {
    const groups = {};
    storageBagRows.forEach(r => {
      const dateKey = r.issuedAt ? formatDate(r.issuedAt) : 'Unknown Date';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(r);
    });
    // Return as sorted array (most recent first)
    return Object.entries(groups).sort((a, b) => {
      const da = a[1][0]?.issuedAt ? new Date(a[1][0].issuedAt) : 0;
      const db = b[1][0]?.issuedAt ? new Date(b[1][0].issuedAt) : 0;
      return db - da;
    });
  }, [storageBagRows]);

  useEffect(() => {
    if (mainTab === 'storage') fetchStorageBags(storageSubTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab, storageSubTab]);

  const fetchThalassemia = async (page = thalPagination.page, limit = thalPagination.limit) => {
    setThalLoading(true);
    try {
      const res = await apiClient.get(`/api/inventory`, {
        params: { page, limit, status: 'issued', dispatchType: 'CLINICAL_INDICATION', sortBy: 'issuedAt', order: 'desc' },
      });
      setThalRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setThalPagination(p => ({ ...p, ...(res.data?.pagination || {}), page }));
    } catch {
      toast.error('Failed to fetch clinical indication / disease records');
      setThalRows([]);
    } finally {
      setThalLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'disease') fetchThalassemia(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab]);

  const diseaseLabel = (p) => {
    if (!p) return '—';
    if (p.disease === 'THALASSEMIA') return 'Thalassemia';
    if (p.disease === 'SICKLE_CELL_ANAEMIA') return 'Sickle Cell Anaemia';
    return p.otherDiseaseName || 'Other';
  };

  // Bulk Transfer register (list/create/edit/delete + cover-letter/certificate/invoice prints)
  const bulk = useBulkTransfer({ mainTab, availableUnits, fetchAvailableUnits });

  // Per-register Excel export
  const { excelLoading, handleExportRegister } = useIssueExport({
    storageSubTab, thalPagination, bulkPagination: bulk.bulkPagination, pagination,
    status, componentType, search, bloodGroup, expiryFrom, expiryTo, sortBy, order,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <PackageCheck className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Issue Stock</h1>
              <p className="text-gray-500 text-sm">Issue previously reserved components</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (mainTab === 'storage') fetchStorageBags(storageSubTab);
                else if (mainTab === 'disease') fetchThalassemia(thalPagination.page);
                else if (mainTab === 'bulkTransfer') bulk.fetchBulkTransfers(bulk.bulkPagination.page);
                else fetchRows(pagination.page);
              }}
              disabled={mainTab === 'storage' ? storageLoading : mainTab === 'disease' ? thalLoading : mainTab === 'bulkTransfer' ? bulk.bulkLoading : isLoading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${(mainTab === 'storage' ? storageLoading : mainTab === 'disease' ? thalLoading : mainTab === 'bulkTransfer' ? bulk.bulkLoading : isLoading) ? 'animate-spin' : ''}`} />
            </button>
            <Button onClick={() => { setStorageOpen(true); fetchAvailableUnits(); }} className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-sm flex items-center gap-1.5 h-10 px-4 rounded-lg">
              <Warehouse className="w-4 h-4" /> Send to Storage
            </Button>
            <RegisterExportDropdown onExport={handleExportRegister} isLoading={excelLoading} registers={ISSUE_REGISTERS} />
          </div>
        </div>

        {/* ── Main tab bar ─────────────────────────────────── */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {[
              { key: 'issue', label: 'Issue Stock', icon: <PackageCheck className="w-4 h-4" /> },
              { key: 'storage', label: 'Storage', icon: <Warehouse className="w-4 h-4" /> },
              { key: 'disease', label: 'Clinical Indication / Disease Patients', icon: <MapPin className="w-4 h-4" /> },
              { key: 'bulkTransfer', label: 'Bulk Transfer', icon: <ArrowLeftRight className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  mainTab === tab.key
                    ? 'border-red-700 text-red-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Storage tab ──────────────────────────────────── */}
        {mainTab === 'storage' && (
          <StorageTab
            storageSubTab={storageSubTab}
            setStorageSubTab={setStorageSubTab}
            storageLoading={storageLoading}
            storageBagRows={storageBagRows}
            storageBagsByDate={storageBagsByDate}
            expandedDates={expandedDates}
            toggleDateGroup={toggleDateGroup}
            fetchStorageBags={fetchStorageBags}
            onViewBag={(r) => { setStorageViewItem(r); setStorageViewOpen(true); }}
            onEditBag={openStorageEdit}
            onDeleteBag={requestStorageDelete}
          />
        )}

        {/* ── Clinical Indication / Disease Patients tab ──── */}
        {mainTab === 'disease' && (
          <DiseaseTab
            thalRows={thalRows}
            thalLoading={thalLoading}
            thalPagination={thalPagination}
            fetchThalassemia={fetchThalassemia}
            diseaseLabel={diseaseLabel}
            onViewBag={(r) => { setThalViewItem(r); setThalViewOpen(true); }}
          />
        )}

        {/* ── Bulk Transfer tab ────────────────────────────── */}
        {mainTab === 'bulkTransfer' && (
          <BulkTransferTab
            bulkRows={bulk.bulkRows}
            bulkLoading={bulk.bulkLoading}
            bulkPagination={bulk.bulkPagination}
            fetchBulkTransfers={bulk.fetchBulkTransfers}
            onSendBulk={() => { bulk.setBulkEditTarget(null); bulk.setBulkEditExtraUnits([]); bulk.resetBulkForm(); bulk.setBulkFormOpen(true); fetchAvailableUnits(); }}
            onViewTransfer={(r) => { bulk.setBulkViewItem(r); bulk.setBulkViewOpen(true); }}
            onEditTransfer={bulk.openEditBulkTransfer}
            onDeleteTransfer={bulk.openDeleteBulkTransferConfirm}
          />
        )}

        {/* ── Issue Stock tab ──────────────────────────────── */}
        {mainTab === 'issue' && (
          <IssueStockTab
            status={status} setStatus={setStatus}
            componentType={componentType} setComponentType={setComponentType}
            bloodGroup={bloodGroup} setBloodGroup={setBloodGroup}
            search={search} setSearch={setSearch}
            expiryFrom={expiryFrom} setExpiryFrom={setExpiryFrom}
            expiryTo={expiryTo} setExpiryTo={setExpiryTo}
            order={order} setOrder={setOrder}
            pagination={pagination} setPagination={setPagination}
            rows={rows}
            isLoading={isLoading}
            fetchRows={fetchRows}
            onView={openView}
          />
        )}
      </div>

      <SendToStorageModal
        open={storageOpen}
        onClose={() => setStorageOpen(false)}
        dispatchType={dispatchType}
        setDispatchType={setDispatchType}
        storageLocation={storageLocation}
        setStorageLocation={setStorageLocation}
        otherLocationName={otherLocationName}
        setOtherLocationName={setOtherLocationName}
        sentDate={sentDate}
        setSentDate={setSentDate}
        patientDetails={patientDetails}
        setPatientDetails={setPatientDetails}
        storageBags={storageBags}
        setStorageBags={setStorageBags}
        availableUnits={availableUnits}
        handleSendToStorage={handleSendToStorage}
        isLoading={isLoading}
        loadingAvailable={loadingAvailable}
      />


      {/* ── Send Bulk (Give/Take Loan) Form Modal ─────────── */}
      <BulkTransferFormModal
        open={bulk.bulkFormOpen}
        onClose={() => { bulk.setBulkFormOpen(false); bulk.setBulkEditTarget(null); bulk.setBulkEditExtraUnits([]); }}
        mode={bulk.bulkEditTarget ? 'edit' : 'create'}
        bulkTransferType={bulk.bulkTransferType}
        setBulkTransferType={bulk.setBulkTransferType}
        bulkBloodBankName={bulk.bulkBloodBankName}
        setBulkBloodBankName={bulk.setBulkBloodBankName}
        bulkBloodBankAddress={bulk.bulkBloodBankAddress}
        setBulkBloodBankAddress={bulk.setBulkBloodBankAddress}
        bulkTransferDate={bulk.bulkTransferDate}
        setBulkTransferDate={bulk.setBulkTransferDate}
        bulkGiveBags={bulk.bulkGiveBags}
        setBulkGiveBags={bulk.setBulkGiveBags}
        bulkTakeGroups={bulk.bulkTakeGroups}
        setBulkTakeGroups={bulk.setBulkTakeGroups}
        availableUnits={bulk.bulkEditTarget ? [...availableUnits, ...bulk.bulkEditExtraUnits] : availableUnits}
        handleBulkTransferSubmit={bulk.handleBulkTransferSubmit}
        bulkSubmitting={bulk.bulkSubmitting}
        loadingAvailable={loadingAvailable}
      />

      {/* ── View modals (issue / storage / disease / bulk) + delete confirm ── */}
      <IssueViewModals
        viewOpen={viewOpen}
        closeView={closeView}
        viewItem={viewItem}
        status={status}
        storageViewOpen={storageViewOpen}
        setStorageViewOpen={setStorageViewOpen}
        storageViewItem={storageViewItem}
        setStorageViewItem={setStorageViewItem}
        thalViewOpen={thalViewOpen}
        setThalViewOpen={setThalViewOpen}
        thalViewItem={thalViewItem}
        setThalViewItem={setThalViewItem}
        diseaseLabel={diseaseLabel}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        bulk={bulk}
      />

      {/* ── Bulk transfer print prompts (cover letter / testing cert / invoice) ── */}
      <IssuePrintPrompts bulk={bulk} />

      {/* ── Storage bag edit (location) + reason dialogs ──── */}
      <StorageEditModal
        open={storageEditOpen}
        onClose={closeStorageEdit}
        bag={storageEditTarget}
        submitting={updateStorageBagMutation.isPending}
        onSubmit={(payload) => { setStorageEditOpen(false); saveStorageEdit(payload); }}
      />
      {StorageEditReasonDialog}
      {StorageDeleteReasonDialog}

      {/* ── Bulk transfer edit reason dialog ──────────────── */}
      {bulk.BulkEditReasonDialog}
    </div>
  );
};

export default Issue;

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { PackageCheck, Warehouse, MapPin, ArrowLeftRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import RegisterExportDropdown from "@/components/shared/RegisterExportDropdown";
import StorageTab from "./issue-tabs/StorageTab";
import DiseaseTab from "./issue-tabs/DiseaseTab";
import BulkTransferTab from "./issue-tabs/BulkTransferTab";
import IssueStockTab from "./issue-tabs/IssueStockTab";
import SendToStorageModal from "./issue-tabs/SendToStorageModal";
import IssueClinicalIndicationModal from "./issue-tabs/IssueClinicalIndicationModal";
import BulkTransferFormModal from "./issue-tabs/BulkTransferFormModal";
import IssueViewModals from "./issue-tabs/IssueViewModals";
import IssuePrintPrompts from "./issue-tabs/IssuePrintPrompts";
import { useBulkTransfer } from "./hooks/useBulkTransfer";
import { useStorageTransfer } from "./hooks/useStorageTransfer";
import { useClinicalIndication } from "./hooks/useClinicalIndication";
import { useIssueExport } from "./hooks/useIssueExport";
import { formatDate as formatDateBase, formatDateTime as formatDateTimeBase } from "@/lib/format-date";

// Day/month/year with month as a number (e.g. 19/07/2026), used across
// every tab on this page and their view modals — not the shared helper's
// default abbreviated month.
const formatDate = (v) => formatDateBase(v, { day: "2-digit", month: "2-digit", year: "numeric" });
const formatDateTime = (v) => formatDateTimeBase(v, { day: "2-digit", month: "2-digit", year: "numeric" });

const ISSUE_REGISTERS = [
  { key: 'issue', label: 'Issue Stock Register' },
  { key: 'storage', label: 'Storage Register', filteredLabel: 'Current Page', allLabel: 'All Records' },
  { key: 'disease', label: 'Clinical Indication / Disease Register' },
  { key: 'bulkTransfer', label: 'Bulk Transfer Register', filteredLabel: 'Current Page', allLabel: 'All Records' },
];

const Issue = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
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

  // ── Main tab bar ─────────────────────────────────────
  const [mainTab, setMainTab] = useState('issue'); // 'issue' | 'storage' | 'disease' | 'bulkTransfer'

  // ── Thalassemia (Clinical Indication) tab state ──────
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
      toast.error(e?.message || "Failed to fetch inventory");
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

  useEffect(() => {
    fetchRows(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, componentType, search, bloodGroup, expiryFrom, expiryTo, order, sortBy]);

  const openView = (item) => { setViewItem(item); setViewOpen(true); };
  const closeView = () => { setViewOpen(false); setViewItem(null); };

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

  // Storage register (Send to Storage batches — list/create/edit/delete)
  const storage = useStorageTransfer({ mainTab, availableUnits, fetchAvailableUnits });

  // Clinical Indication / Disease issuance (separate one-off dispatch flow)
  const clinical = useClinicalIndication({
    user,
    fetchAvailableUnits,
    onIssued: () => fetchThalassemia(1),
  });

  // Bulk Transfer register (list/create/edit/delete + cover-letter/certificate/invoice prints)
  const bulk = useBulkTransfer({ mainTab, availableUnits, fetchAvailableUnits });

  // Per-register Excel export
  const { excelLoading, handleExportRegister } = useIssueExport({
    thalPagination, bulkPagination: bulk.bulkPagination, pagination,
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
                if (mainTab === 'storage') storage.fetchStorageTransfers(storage.storagePagination.page);
                else if (mainTab === 'disease') fetchThalassemia(thalPagination.page);
                else if (mainTab === 'bulkTransfer') bulk.fetchBulkTransfers(bulk.bulkPagination.page);
                else fetchRows(pagination.page);
              }}
              disabled={mainTab === 'storage' ? storage.storageLoading : mainTab === 'disease' ? thalLoading : mainTab === 'bulkTransfer' ? bulk.bulkLoading : isLoading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${(mainTab === 'storage' ? storage.storageLoading : mainTab === 'disease' ? thalLoading : mainTab === 'bulkTransfer' ? bulk.bulkLoading : isLoading) ? 'animate-spin' : ''}`} />
            </button>
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
            storageRows={storage.storageRows}
            storageLoading={storage.storageLoading}
            storagePagination={storage.storagePagination}
            fetchStorageTransfers={storage.fetchStorageTransfers}
            storageLocationTab={storage.storageLocationTab}
            changeStorageLocationTab={storage.changeStorageLocationTab}
            onSendToStorage={storage.openCreateStorage}
            onViewTransfer={(r) => { storage.setStorageViewItem(r); storage.setStorageViewOpen(true); }}
            onEditTransfer={storage.openEditStorage}
            onDeleteTransfer={storage.requestDeleteStorage}
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
            onIssueClinicalIndication={clinical.openCreate}
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

      {/* ── Send to Storage / Edit Storage Batch ──────────── */}
      <SendToStorageModal
        open={storage.storageFormOpen}
        onClose={storage.closeStorageForm}
        isEdit={Boolean(storage.storageEditTarget)}
        storageLocation={storage.storageLocation}
        setStorageLocation={storage.setStorageLocation}
        otherLocationName={storage.otherLocationName}
        setOtherLocationName={storage.setOtherLocationName}
        sentDate={storage.sentDate}
        setSentDate={storage.setSentDate}
        storageBags={storage.storageBags}
        setStorageBags={storage.setStorageBags}
        availableUnits={availableUnits}
        handleSendToStorage={storage.handleStorageSubmit}
        isLoading={storage.storageSubmitting}
        loadingAvailable={loadingAvailable}
      />

      {/* ── Issue for Clinical Indication / Disease ───────── */}
      <IssueClinicalIndicationModal
        open={clinical.formOpen}
        onClose={clinical.closeForm}
        patientDetails={clinical.patientDetails}
        setPatientDetails={clinical.setPatientDetails}
        clinicalBags={clinical.clinicalBags}
        setClinicalBags={clinical.setClinicalBags}
        availableUnits={availableUnits}
        handleSubmit={clinical.handleSubmit}
        isLoading={clinical.submitting}
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
        storageViewOpen={storage.storageViewOpen}
        setStorageViewOpen={storage.setStorageViewOpen}
        storageViewItem={storage.storageViewItem}
        setStorageViewItem={storage.setStorageViewItem}
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

      {/* ── Storage batch edit / delete reason dialogs ────── */}
      {storage.StorageEditReasonDialog}
      {storage.StorageDeleteReasonDialog}

      {/* ── Bulk transfer edit reason dialog ──────────────── */}
      {bulk.BulkEditReasonDialog}
    </div>
  );
};

export default Issue;

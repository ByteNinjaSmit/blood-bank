import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, PackageCheck, Plus, Trash2, Warehouse, MapPin, Eye, ArrowLeftRight, Printer } from "lucide-react";
import { toast } from "sonner";
import CustomModal from "@/components/CustomModal";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportIssues, exportStorageBags, exportClinicalIndicationIssues, exportBulkTransfers } from "@/utils/excelExportHelper";
import BulkTransferCoverLetter from "@/features/inventory/components/BulkTransferCoverLetter";
import TestingCertificate from "@/features/inventory/components/TestingCertificate";
import BulkTransferInvoice from "@/features/inventory/components/BulkTransferInvoice";
import StorageTab from "./issue-tabs/StorageTab";
import DiseaseTab from "./issue-tabs/DiseaseTab";
import BulkTransferTab from "./issue-tabs/BulkTransferTab";
import IssueStockTab from "./issue-tabs/IssueStockTab";

const MultiBagSelect = ({ availableBags, selectedBags, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleBag = (bagId) => {
    const isSelected = selectedBags.includes(bagId);
    let newSelected;
    if (isSelected) {
      newSelected = selectedBags.filter(id => id !== bagId);
    } else {
      newSelected = [...selectedBags, bagId];
    }
    onChange(newSelected);
  };

  const selectedVolumeMl = availableBags
    .filter((bag) => selectedBags.includes(bag._id))
    .reduce((sum, bag) => sum + (Number(bag.component?.volumeMl) || 0), 0);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 text-left border rounded-md text-sm bg-white flex items-center justify-between shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 border-gray-300"
      >
        <span className="truncate">
          {selectedBags.length === 0 ? "Select blood bags..." : `${selectedBags.length} bag(s) selected · ${selectedVolumeMl} mL`}
        </span>
        <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="mt-2 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md p-2 space-y-1 shadow-inner">
          {availableBags.length === 0 ? (
            <div className="text-xs text-gray-500 p-2 text-center">No bags available in stock</div>
          ) : (
            availableBags.map((bag) => {
              const isChecked = selectedBags.includes(bag._id);
              return (
                <label
                  key={bag._id}
                  className={`flex items-center gap-2 p-2 rounded hover:bg-red-50 cursor-pointer text-sm transition-colors duration-150 ${
                    isChecked ? "bg-red-50 text-red-900 font-bold" : "text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBag(bag._id)}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <div className="flex flex-col">
                    <span>Bag: {bag.bagNo} ({bag.component?.componentType || '—'}) — {bag.component?.volumeMl ? `${bag.component.volumeMl} mL` : 'Vol: —'}</span>
                    <span className="text-xs text-gray-400">Exp: {bag.component?.expiryDate ? new Date(bag.component.expiryDate).toLocaleDateString() : '—'}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

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
  const [storageBags, setStorageBags] = useState([{ componentType: "RBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [excelLoading, setExcelLoading] = useState(false);

  const mapIssuesForExport = (data) => {
    return data.map(r => ({
      bagNo: r?.bag?.bagNo || r.bagNo,
      componentType: r?.component?.componentType,
      bloodGroup: r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh === 'Positive' ? '+' : r.bag.rh === 'Negative' ? '-' : ''}`.trim() : '—',
      volumeMl: r?.component?.volumeMl,
      expiryDate: r?.component?.expiryDate,
      issuedToHospital: r?.hospital?.name || '—',
      issuedBy: r?.issuedBy || '—',
      issuedAt: r?.issuedAt || r?.updatedAt,
    }));
  };

  // Exports whichever tab is currently active (Issue Stock / Storage /
  // Clinical Indication / Bulk Transfer) — each tab has its own data shape
  // and its own export mapper, but they share this one button.
  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);

      if (mainTab === 'storage') {
        const dataToExport = storageBagRows;
        if (dataToExport.length === 0) return toast.info("No storage records to export");
        await exportStorageBags(dataToExport);
        return;
      }

      if (mainTab === 'disease') {
        let dataToExport = thalRows;
        if (exportAll) {
          const res = await apiClient.get(`/api/inventory`, {
            params: { page: 1, limit: 5000, status: 'issued', dispatchType: 'CLINICAL_INDICATION' },
          });
          dataToExport = Array.isArray(res.data?.data) ? res.data.data : thalRows;
        }
        if (dataToExport.length === 0) return toast.info("No clinical indication records to export");
        await exportClinicalIndicationIssues(dataToExport);
        return;
      }

      if (mainTab === 'bulkTransfer') {
        const dataToExport = bulkRows;
        if (dataToExport.length === 0) return toast.info("No bulk transfer records to export");
        await exportBulkTransfers(dataToExport);
        return;
      }

      // 'issue' tab (default)
      let dataToExport = [];
      if (exportAll) {
        // Fetch all issued/matching items without limit (up to 5000)
        const res = await apiClient.get(`/api/inventory`, {
          params: {
            page: 1,
            limit: 5000,
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
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        dataToExport = mapIssuesForExport(data);
      } else {
        dataToExport = mapIssuesForExport(rows);
      }

      if (dataToExport.length === 0) {
        toast.info("No items to export");
        return;
      }

      await exportIssues(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  // filters
  const [componentType, setComponentType] = useState("");
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");
  const [order, setOrder] = useState("desc");
  // sortBy is fixed (used in fetch params); no UI control changes it.
  const [sortBy] = useState("createdAt");

  const [status, setStatus] = useState('issued');
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

  // ── Thalassemia tab state ────────────────────────────
  const [thalRows, setThalRows] = useState([]);
  const [thalLoading, setThalLoading] = useState(false);
  const [thalViewOpen, setThalViewOpen] = useState(false);
  const [thalViewItem, setThalViewItem] = useState(null);
  const [thalPagination, setThalPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // ── Bulk Transfer tab state ──────────────────────────
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkViewOpen, setBulkViewOpen] = useState(false);
  const [bulkViewItem, setBulkViewItem] = useState(null);
  const [bulkPagination, setBulkPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [bulkFormOpen, setBulkFormOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkTransferType, setBulkTransferType] = useState("GIVE_LOAN"); // GIVE_LOAN | TAKE_LOAN
  const [bulkBloodBankName, setBulkBloodBankName] = useState("");
  const [bulkBloodBankAddress, setBulkBloodBankAddress] = useState("");
  const [bulkTransferDate, setBulkTransferDate] = useState(new Date().toISOString().split('T')[0]);
  // GIVE_LOAN: pick from our own stock, same shape as the "Send to Storage" bag picker
  const [bulkGiveBags, setBulkGiveBags] = useState([{ componentType: "RBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
  // TAKE_LOAN: bags coming in from the other bank — manually entered, not yet in our stock
  const [bulkTakeGroups, setBulkTakeGroups] = useState([{ componentType: "RBC", bloodGroup: "A+", bags: [{ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" }] }]);

  const resetBulkForm = () => {
    setBulkTransferType("GIVE_LOAN");
    setBulkBloodBankName("");
    setBulkBloodBankAddress("");
    setBulkTransferDate(new Date().toISOString().split('T')[0]);
    setBulkGiveBags([{ componentType: "RBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
    setBulkTakeGroups([{ componentType: "RBC", bloodGroup: "A+", bags: [{ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" }] }]);
  };

  const fetchBulkTransfers = async (page = 1, limit = bulkPagination.limit) => {
    setBulkLoading(true);
    try {
      const res = await apiClient.get(`/api/v2/bulk-transfer`, {
        params: { page, limit },
      });
      setBulkRows(Array.isArray(res.data?.data) ? res.data.data : []);
      const p = res.data?.pagination || {};
      setBulkPagination({ page: p.page || page, limit: p.limit || limit, total: p.total || 0, totalPages: Math.ceil((p.total || 0) / (p.limit || limit)) });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch bulk transfers");
      setBulkRows([]);
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'bulkTransfer') fetchBulkTransfers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab]);

  // ── Delete a bulk transfer ────────────────────────────
  // Deleting a GIVE_LOAN transfer puts its bags back into stock (server
  // restores each linked BloodUnit to RELEASED); deleting a TAKE_LOAN
  // transfer simply removes those bags from the stock listing, since they
  // only ever existed as line items on the transfer itself.
  const [deleteBulkConfirmOpen, setDeleteBulkConfirmOpen] = useState(false);
  const [deleteBulkTarget, setDeleteBulkTarget] = useState(null);
  const [deleteBulkSubmitting, setDeleteBulkSubmitting] = useState(false);

  const openDeleteBulkTransferConfirm = (row) => {
    setDeleteBulkTarget(row);
    setDeleteBulkConfirmOpen(true);
  };

  const handleDeleteBulkTransfer = async () => {
    if (!deleteBulkTarget) return;
    try {
      setDeleteBulkSubmitting(true);
      await apiClient.delete(`/api/v2/bulk-transfer/${deleteBulkTarget.id}`);
      toast.success(
        deleteBulkTarget.transferType === 'GIVE_LOAN'
          ? "Bulk transfer deleted — bags returned to stock"
          : "Bulk transfer deleted"
      );
      setDeleteBulkConfirmOpen(false);
      setDeleteBulkTarget(null);
      fetchBulkTransfers(bulkPagination.page || 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete bulk transfer");
    } finally {
      setDeleteBulkSubmitting(false);
    }
  };

  const handleBulkTransferSubmit = async () => {
    if (!bulkBloodBankName.trim() || !bulkBloodBankAddress.trim()) {
      return toast.warning("Please enter the blood bank name and address");
    }
    if (!bulkTransferDate) {
      return toast.warning("Please select a transfer date");
    }

    let items = [];
    if (bulkTransferType === "GIVE_LOAN") {
      bulkGiveBags.forEach(comp => {
        comp.groups.forEach(group => {
          group.selectedBags.forEach(bagId => {
            const unit = availableUnits.find(u => u._id === bagId);
            if (unit) {
              items.push({
                componentType: comp.componentType,
                bloodGroup: group.bloodGroup,
                bagNo: unit.bag?.bagNo || unit.bagNo || '',
                segmentNo: unit.segmentNo || unit.bag?.segmentNo || undefined,
                volumeMl: unit.component?.volumeMl || undefined,
                collectedAt: unit.bag?.donationDate || undefined,
                expiresAt: unit.component?.expiryDate || undefined,
                unitId: unit._id || undefined,
              });
            }
          });
        });
      });
    } else {
      bulkTakeGroups.forEach(group => {
        group.bags.forEach(b => {
          if (b.bagNo.trim()) {
            items.push({
              componentType: group.componentType,
              bloodGroup: group.bloodGroup,
              bagNo: b.bagNo.trim(),
              segmentNo: b.segmentNo.trim() || undefined,
              volumeMl: b.volumeMl ? Number(b.volumeMl) : undefined,
              collectedAt: b.collectedAt || undefined,
              expiresAt: b.expiresAt || undefined,
            });
          }
        });
      });
    }

    if (items.length === 0) {
      return toast.warning("Please add at least one blood bag");
    }

    try {
      setBulkSubmitting(true);
      await apiClient.post(`/api/v2/bulk-transfer`, {
        transferType: bulkTransferType,
        bloodBankName: bulkBloodBankName.trim(),
        bloodBankAddress: bulkBloodBankAddress.trim(),
        transferDate: bulkTransferDate,
        items,
      });

      toast.success(bulkTransferType === "GIVE_LOAN" ? "Loan given successfully — bags removed from stock" : "Loan taken in successfully — bags added to stock");
      setBulkFormOpen(false);
      resetBulkForm();
      fetchBulkTransfers(1);
      if (bulkTransferType === "GIVE_LOAN") fetchAvailableUnits();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to record bulk transfer");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // ── Bulk Transfer cover letter (Give Loan) ───────────
  const [coverLetterPromptOpen, setCoverLetterPromptOpen] = useState(false);
  const [coverLetterBoxCount, setCoverLetterBoxCount] = useState("");
  const [coverLetterPrintDoc, setCoverLetterPrintDoc] = useState(null);

  // Per-component litres, computed from each bag's volumeMl — used both in
  // the View modal summary and inside the printed cover letter.
  const bulkTransferComponentTotals = (items) => {
    const totals = {};
    let totalMl = 0;
    (items || []).forEach((it) => {
      const ml = Number(it.volumeMl) || 0;
      totals[it.componentType] = (totals[it.componentType] || 0) + ml;
      totalMl += ml;
    });
    return { byComponent: totals, totalLitres: totalMl / 1000 };
  };

  const openCoverLetterPrompt = () => {
    setCoverLetterBoxCount("");
    setCoverLetterPromptOpen(true);
  };

  // Shared print trigger: injects a @media print stylesheet scoped to the
  // given hidden wrapper id, fires window.print(), then cleans up and
  // clears whichever print-doc state the caller is driving.
  const triggerPrint = (wrapperId, styleId, onDone) => {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = `
      @media print {
        #root { display: none !important; }
        html, body { background: white !important; }
        #${wrapperId} { display: block !important; position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-scheme: light !important; }
      }
    `;
    document.head.appendChild(styleEl);

    setTimeout(() => {
      window.print();
      const cleanup = () => {
        const style = document.getElementById(styleId);
        if (style) style.remove();
        onDone();
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      setTimeout(cleanup, 1500);
    }, 150);
  };

  const handleConfirmCoverLetter = () => {
    const n = Number(coverLetterBoxCount);
    if (!coverLetterBoxCount || !Number.isInteger(n) || n <= 0) {
      return toast.warning("Please enter a valid number of boxes");
    }
    setCoverLetterPromptOpen(false);
    setCoverLetterPrintDoc({ ...bulkViewItem, boxCount: n });
    triggerPrint('bulk-transfer-cover-letter-print-wrapper', 'bulk-transfer-cover-letter-print-style', () => setCoverLetterPrintDoc(null));
  };

  // ── Testing Certificate (Give Loan) ───────────────────
  const [testingCertPromptOpen, setTestingCertPromptOpen] = useState(false);
  const [testingCertBleedDate, setTestingCertBleedDate] = useState("");
  const [testingCertBoxCount, setTestingCertBoxCount] = useState("");
  const [testingCertPrintDoc, setTestingCertPrintDoc] = useState(null);

  const openTestingCertPrompt = () => {
    setTestingCertBleedDate("");
    setTestingCertBoxCount("");
    setTestingCertPromptOpen(true);
  };

  const handleConfirmTestingCert = () => {
    const n = Number(testingCertBoxCount);
    if (!testingCertBleedDate) {
      return toast.warning("Please enter the bleed date");
    }
    if (!testingCertBoxCount || !Number.isInteger(n) || n <= 0) {
      return toast.warning("Please enter a valid number of boxes");
    }
    setTestingCertPromptOpen(false);
    setTestingCertPrintDoc({ ...bulkViewItem, bleedDate: testingCertBleedDate, boxCount: n });
    triggerPrint('testing-certificate-print-wrapper', 'testing-certificate-print-style', () => setTestingCertPrintDoc(null));
  };

  // ── Invoice (Give Loan) ────────────────────────────────
  const [invoicePromptOpen, setInvoicePromptOpen] = useState(false);
  const [invoiceRate, setInvoiceRate] = useState("");
  const [invoicePrintDoc, setInvoicePrintDoc] = useState(null);

  const openInvoicePrompt = () => {
    setInvoiceRate("");
    setInvoicePromptOpen(true);
  };

  const handleConfirmInvoice = () => {
    const rate = Number(invoiceRate);
    if (!invoiceRate || rate <= 0) {
      return toast.warning("Please enter a valid rate per litre");
    }
    setInvoicePromptOpen(false);
    setInvoicePrintDoc({ ...bulkViewItem, ratePerLitre: rate });
    triggerPrint('bulk-transfer-invoice-print-wrapper', 'bulk-transfer-invoice-print-style', () => setInvoicePrintDoc(null));
  };

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
      setStorageBags([{ componentType: "RBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
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
        const latestDate = new Date(data[0].issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
      const dateKey = r.issuedAt
        ? new Date(r.issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Unknown Date';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
              <PackageCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Issue Stock</h1>
              <p className="text-gray-500 text-sm">Issue previously reserved components</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setStorageOpen(true); fetchAvailableUnits(); }} className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-sm flex items-center gap-1.5 h-10 px-4 rounded-lg">
              <Warehouse className="w-4 h-4" /> Send to Storage
            </Button>
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
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
            bulkRows={bulkRows}
            bulkLoading={bulkLoading}
            bulkPagination={bulkPagination}
            fetchBulkTransfers={fetchBulkTransfers}
            onSendBulk={() => { resetBulkForm(); setBulkFormOpen(true); fetchAvailableUnits(); }}
            onViewTransfer={(r) => { setBulkViewItem(r); setBulkViewOpen(true); }}
            onDeleteTransfer={openDeleteBulkTransferConfirm}
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
      <CustomModal open={viewOpen} onCancel={closeView} title={status === 'issued' ? 'Issued Component Details' : 'Reserved Component Details'} size="lg" hideFooter>
        {viewItem && (
          <div className="space-y-5 text-sm">
            {/* Donor & Collection Section */}
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3">Donor & Collection Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Donor Name</div>
                  <div className="font-bold text-gray-800">{viewItem?.bag?.donorName || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Donation Date</div>
                  <div className="font-semibold text-gray-850">
                    {viewItem?.bag?.donationDate ? new Date(viewItem.bag.donationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Segment No</div>
                  <div className="font-mono text-gray-700">{viewItem?.bag?.segmentNo || viewItem?.segmentNo || '—'}</div>
                </div>
              </div>
            </div>

            {/* Component & Bag Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">Component & Bag Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Bag No</div>
                  <div className="font-bold text-gray-800 font-mono">{viewItem?.bag?.bagNo || viewItem?.bagNo || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Component Type</div>
                  <div className="font-bold text-gray-800">
                    {viewItem?.component?.componentType || '—'} {viewItem?.component?.volumeMl ? `• ${viewItem.component.volumeMl} mL` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                  <div className="font-bold text-red-700 text-base">
                    {viewItem?.bag ? `${viewItem.bag.bloodGroup} ${viewItem.bag.rh === 'Positive' ? '+' : viewItem.bag.rh === 'Negative' ? '-' : viewItem.bag.rh}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Expiry Date</div>
                  <div className="font-semibold text-gray-800">
                    {viewItem?.component?.expiryDate ? new Date(viewItem.component.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Requisition & Issuance Section */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Requisition & Issuance Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Current Status</div>
                  <div className="font-bold text-gray-800 uppercase">{viewItem?.status || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Issue / Dispatch Date</div>
                  <div className="font-bold text-gray-800">
                    {viewItem?.issuedAt ? new Date(viewItem.issuedAt).toLocaleString() : '—'}
                  </div>
                </div>
                {viewItem?.storageLocation ? (
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Storage Location</div>
                    <div className="font-bold text-red-800 flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5" /> {viewItem.storageLocation}
                    </div>
                  </div>
                ) : viewItem?.clinicalIndicationPatient ? (
                  <div className="md:col-span-2">
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Clinical Indication / Disease Patient Recipient</div>
                    <div className="bg-white border border-red-100 rounded-lg p-3 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-gray-400">Name</div>
                        <div className="font-bold text-gray-800">
                          {viewItem.clinicalIndicationPatient.firstName} {viewItem.clinicalIndicationPatient.middleName} {viewItem.clinicalIndicationPatient.lastName}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Disease</div>
                        <div className="font-bold text-gray-800">{diseaseLabel(viewItem.clinicalIndicationPatient)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Age / Sex</div>
                        <div className="font-bold text-gray-850">
                          {viewItem.clinicalIndicationPatient.age} Yrs / {viewItem.clinicalIndicationPatient.sex}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {viewItem?.hospital?.name && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Hospital / Facility</div>
                        <div className="font-semibold text-gray-800">{viewItem.hospital.name}</div>
                      </div>
                    )}
                    {((viewItem?.request && viewItem.request.patient) || viewItem?.reservedPatientName) && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Patient</div>
                        <div className="font-semibold text-gray-800">
                          {viewItem?.request?.patient
                            ? `${viewItem.request.patient.name} (${viewItem.request.patient.age}/${viewItem.request.patient.sex})`
                            : `${viewItem.reservedPatientName} (${viewItem.reservedPatientAge}/${viewItem.reservedPatientSex})`}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {viewItem?.reservedAt && (
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Reserved At</div>
                    <div className="text-gray-700">{new Date(viewItem.reservedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      <CustomModal open={storageOpen} onCancel={() => setStorageOpen(false)} title={dispatchType === "CLINICAL_INDICATION" ? "Issue for Clinical Indication / Disease" : "Send to Storage Form"} size="xl" hideFooter>
        <div className="space-y-6 text-sm p-2">

          <div className="flex flex-col md:w-1/2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              Select Dispatch / Issue Type
            </label>
            <select
              value={dispatchType}
              onChange={(e) => setDispatchType(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
            >
              <option value="STORAGE">Send to Storage</option>
              <option value="CLINICAL_INDICATION">Issue for Clinical Indication / Disease</option>
            </select>
          </div>

          {dispatchType === "STORAGE" ? (
            <>
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex gap-3 items-start animate-fadeIn">
                <Warehouse className="w-5 h-5 text-red-800 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm">Direct Storage Dispatch</h3>
                  <p className="text-gray-600 text-xs mt-0.5">Select available blood units to transfer directly to external storage locations.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    Target Storage Location
                  </label>
                  <select
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                  >
                    <option value="SJS [Kopargaon]">SJS [Kopargaon]</option>
                    <option value="Anand [Vaijapur]">Anand [Vaijapur]</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Sent Date
                  </label>
                  <input
                    type="date"
                    value={sentDate}
                    onChange={(e) => setSentDate(e.target.value)}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                  />
                </div>

                {storageLocation === "Others" && (
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Other Location Name
                    </label>
                    <input
                      type="text"
                      value={otherLocationName}
                      onChange={(e) => setOtherLocationName(e.target.value)}
                      className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                      placeholder="Enter custom storage location name"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200 animate-fadeIn">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Clinical Indication / Disease Patient Recipient Details</h3>

              <div className="flex flex-col md:w-1/2">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Disease</label>
                <select
                  value={patientDetails.disease}
                  onChange={(e) => setPatientDetails({ ...patientDetails, disease: e.target.value })}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                >
                  <option value="THALASSEMIA">Thalassemia</option>
                  <option value="SICKLE_CELL_ANAEMIA">Sickle Cell Anaemia</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {patientDetails.disease === "OTHER" && (
                <div className="flex flex-col md:w-1/2">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Specify Disease</label>
                  <input
                    type="text"
                    value={patientDetails.otherDiseaseName}
                    onChange={(e) => setPatientDetails({ ...patientDetails, otherDiseaseName: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter the disease name"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">First Name</label>
                  <input
                    type="text"
                    value={patientDetails.firstName}
                    onChange={(e) => setPatientDetails({ ...patientDetails, firstName: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Middle Name</label>
                  <input
                    type="text"
                    value={patientDetails.middleName}
                    onChange={(e) => setPatientDetails({ ...patientDetails, middleName: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter middle name"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Last Name</label>
                  <input
                    type="text"
                    value={patientDetails.lastName}
                    onChange={(e) => setPatientDetails({ ...patientDetails, lastName: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Age (Years)</label>
                  <input
                    type="number"
                    value={patientDetails.age}
                    onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="e.g. 24"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Sex</label>
                  <select
                    value={patientDetails.sex}
                    onChange={(e) => setPatientDetails({ ...patientDetails, sex: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="O">Other (O)</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Patient Blood Group</label>
                  <select
                    value={patientDetails.bloodGroup}
                    onChange={(e) => {
                      const bg = e.target.value;
                      setPatientDetails({ ...patientDetails, bloodGroup: bg });
                      // Set default group for the first selection row to match patient's group!
                      if (storageBags.length === 1 && storageBags[0].groups.length === 1 && storageBags[0].groups[0].selectedBags.length === 0) {
                        const newBags = [...storageBags];
                        newBags[0].groups[0].bloodGroup = bg;
                        setStorageBags(newBags);
                      }
                    }}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Address</label>
                  <input
                    type="text"
                    value={patientDetails.address}
                    onChange={(e) => setPatientDetails({ ...patientDetails, address: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter patient address"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Blood Bag Selection By Component</h4>
              <Button
                type="button"
                onClick={() => setStorageBags([...storageBags, { componentType: "RBC", groups: [{ bloodGroup: "A+", selectedBags: [] }] }])}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Component Section
              </Button>
            </div>

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
              {storageBags.map((comp, compIndex) => (
                <div key={compIndex} className="p-5 border rounded-xl bg-white shadow-sm border-gray-200 flex flex-col gap-4 relative">
                  
                  {/* Component Row Header */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Component Type</span>
                      <select
                        value={comp.componentType}
                        onChange={(e) => {
                          const newBags = [...storageBags];
                          newBags[compIndex].componentType = e.target.value;
                          // Reset bags in nested groups since component type changed
                          newBags[compIndex].groups = newBags[compIndex].groups.map(g => ({ ...g, selectedBags: [] }));
                          setStorageBags(newBags);
                        }}
                        className="h-9 px-3 border rounded-md text-xs bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
                      >
                        <option value="RBC">RBC (PRBC)</option>
                        <option value="FFP">FFP</option>
                        <option value="Platelet">Platelet (PLATELET_CONCENTRATE)</option>
                        <option value="Cryo">Cryo (CRYOPRECIPITATE)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          const newBags = [...storageBags];
                          newBags[compIndex].groups.push({ bloodGroup: "A+", bagType: "All", selectedBags: [] });
                          setStorageBags(newBags);
                        }}
                        variant="outline"
                        size="xs"
                        className="text-xs text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1 py-1 px-2.5 h-8 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Blood Group
                      </Button>

                      {storageBags.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setStorageBags(storageBags.filter((_, idx) => idx !== compIndex))}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                          title="Remove Component Section"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Groups List */}
                  <div className="space-y-4 pl-2 border-l-2 border-red-100">
                    {comp.groups.map((group, groupIndex) => {
                      // Filter available units to match this blood group AND component type AND bag type
                      const matchingAvailableBags = availableUnits.filter(u => {
                        const unitBg = `${u.bag?.bloodGroup}${u.bag?.rh === 'Positive' ? '+' : '-'}`;
                        
                        let unitComp = u.component?.componentType;
                        // Map database componentType names
                        if (unitComp === 'PRBC' || unitComp === 'RBC') unitComp = 'RBC';
                        else if (unitComp === 'FFP') unitComp = 'FFP';
                        else if (unitComp === 'PLATELET_CONCENTRATE' || unitComp === 'Platelet') unitComp = 'Platelet';
                        else if (unitComp === 'CRYOPRECIPITATE' || unitComp === 'Cryo') unitComp = 'Cryo';

                        const matchesBgAndComp = unitBg === group.bloodGroup && unitComp === comp.componentType;
                        if (!matchesBgAndComp) return false;

                        if (group.bagType && group.bagType !== "All") {
                          return u.typeOfBag === group.bagType;
                        }
                        return true;
                      });

                      // Get segment numbers for selected bags in this group
                      const selectedDetails = group.selectedBags.map(id => availableUnits.find(u => u._id === id)).filter(Boolean);

                      return (
                        <div key={groupIndex} className="p-3 border rounded-lg bg-slate-50/50 flex flex-col gap-2 relative">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-2 flex flex-col">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Blood Group</label>
                              <select
                                value={group.bloodGroup}
                                onChange={(e) => {
                                  const newBags = [...storageBags];
                                  newBags[compIndex].groups[groupIndex].bloodGroup = e.target.value;
                                  newBags[compIndex].groups[groupIndex].selectedBags = []; // reset bags when group changes
                                  setStorageBags(newBags);
                                }}
                                className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                              >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                  <option key={bg} value={bg}>{bg}</option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2 flex flex-col">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Bag Type</label>
                              <select
                                value={group.bagType || "All"}
                                onChange={(e) => {
                                  const newBags = [...storageBags];
                                  newBags[compIndex].groups[groupIndex].bagType = e.target.value;
                                  newBags[compIndex].groups[groupIndex].selectedBags = []; // reset bags when type changes
                                  setStorageBags(newBags);
                                }}
                                className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                              >
                                <option value="All">All Types</option>
                                <option value="DB">Double (DB)</option>
                                <option value="TB">Triple (TB)</option>
                              </select>
                            </div>

                            <div className="md:col-span-7 flex flex-col">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Select Bags</label>
                              <MultiBagSelect
                                availableBags={matchingAvailableBags}
                                selectedBags={group.selectedBags}
                                onChange={(selectedIds) => {
                                  const newBags = [...storageBags];
                                  newBags[compIndex].groups[groupIndex].selectedBags = selectedIds;
                                  setStorageBags(newBags);
                                }}
                              />
                            </div>

                            <div className="md:col-span-1 flex justify-end">
                              {comp.groups.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newBags = [...storageBags];
                                    newBags[compIndex].groups = newBags[compIndex].groups.filter((_, idx) => idx !== groupIndex);
                                    setStorageBags(newBags);
                                  }}
                                  variant="outline"
                                  size="xs"
                                  className="h-9 w-9 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                                  title="Remove Blood Group"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {selectedDetails.length > 0 && (
                            <div className="mt-1 p-2 bg-white rounded-lg border border-slate-100 shadow-inner">
                              <div className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Loaded Segment Numbers:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedDetails.map(bag => (
                                  <span key={bag._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-805 text-xs border border-red-100 font-medium">
                                    <span className="font-extrabold">{bag.bagNo}</span>
                                    <span className="text-red-200">|</span>
                                    <span>Seg: <strong className="font-extrabold">{bag.segmentNo}</strong></span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-6">
            <Button onClick={() => setStorageOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button
              onClick={handleSendToStorage}
              disabled={isLoading || loadingAvailable}
              className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-6 shadow-md transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Dispatching...
                </>
              ) : (
                "Send to Storage"
              )}
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* ── Storage Bag View Modal ──────────────────────── */}
      <CustomModal open={storageViewOpen} onCancel={() => { setStorageViewOpen(false); setStorageViewItem(null); }} title="Storage Bag Details" size="lg" hideFooter>
        {storageViewItem && (() => {
          const r = storageViewItem;
          const rh = r?.bag?.rh === 'Positive' ? '+' : r?.bag?.rh === 'Negative' ? '-' : r?.bag?.rh || '';
          return (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Bag No</div>
                  <div className="font-bold text-gray-800">{r?.bag?.bagNo || r.bagNo || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Segment No</div>
                  <div className="font-mono text-gray-700">{r.segmentNo || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Component</div>
                  <div className="font-semibold text-gray-800">{r?.component?.componentType || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                  <div className="font-bold text-gray-800">{r?.bag?.bloodGroup}{rh}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Volume</div>
                  <div className="text-gray-700">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Expiry Date</div>
                  <div className="text-gray-700">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Storage Location</div>
                  <div className="font-semibold text-gray-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-600" />{r.storageLocation || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Sent At</div>
                  <div className="text-gray-700">{r.issuedAt ? new Date(r.issuedAt).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Type of Bag</div>
                  <div className="text-gray-700">{r.typeOfBag || '—'}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* ── Thalassemia Patient View Modal ──────────────── */}
      <CustomModal open={thalViewOpen} onCancel={() => { setThalViewOpen(false); setThalViewItem(null); }} title="Clinical Indication / Disease Patient Details" size="lg" hideFooter>
        {thalViewItem && (() => {
          const r = thalViewItem;
          const p = r.clinicalIndicationPatient || {};
          const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || '—';
          const rh = r?.bag?.rh === 'Positive' ? '+' : r?.bag?.rh === 'Negative' ? '-' : r?.bag?.rh || '';
          const req = r.requisition;
          return (
            <div className="space-y-5 text-sm">
              {/* Patient details section */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Patient Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Full Name</div>
                    <div className="font-bold text-gray-800 text-base">{fullName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                    <div className="font-bold text-red-700 text-base">{p.bloodGroup || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Disease</div>
                    <div className="font-semibold text-gray-800">{diseaseLabel(p)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Age</div>
                    <div className="font-semibold text-gray-800">{p.age ? `${p.age} years` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Sex</div>
                    <div className="font-semibold text-gray-800">{p.sex || '—'}</div>
                  </div>
                  {p.address && (
                    <div className="md:col-span-2">
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Address</div>
                      <div className="text-gray-700">{p.address}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Blood bag details section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">Blood Bag Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Bag No</div>
                    <div className="font-bold text-gray-800 font-mono">{r?.bag?.bagNo || r.bagNo || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Segment No</div>
                    <div className="font-mono text-gray-700">{r.segmentNo || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Component</div>
                    <div className="font-semibold text-gray-800">{r?.component?.componentType || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                    <div className="font-bold text-gray-800">{r?.bag?.bloodGroup}{rh}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Volume</div>
                    <div className="text-gray-700">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Expiry Date</div>
                    <div className="text-gray-700">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Type of Bag</div>
                    <div className="text-gray-700">{r.typeOfBag || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Issued At</div>
                    <div className="text-gray-700">{r.issuedAt ? new Date(r.issuedAt).toLocaleString() : '—'}</div>
                  </div>
                </div>
              </div>

              {/* Requisition details if present */}
              {req && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Requisition Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Requisition ID</div>
                      <div className="font-mono font-bold text-gray-800">{req.requisitionId || '—'}</div>
                    </div>
                    {req.doctorName && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Doctor / Clinician</div>
                        <div className="text-gray-700">{req.doctorName}</div>
                      </div>
                    )}
                    {req.requiredAt && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Required At</div>
                        <div className="text-gray-700">{new Date(req.requiredAt).toLocaleString()}</div>
                      </div>
                    )}
                    {req.patient && (
                      <div className="md:col-span-2">
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Requisition Patient</div>
                        <div className="text-gray-700">{req.patient.name || '—'} · {req.patient.age ? `${req.patient.age} yrs` : ''} {req.patient.sex || ''}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </CustomModal>

      {/* ── Delete Bulk Transfer Confirmation ─────────────── */}
      <CustomModal
        open={deleteBulkConfirmOpen}
        onCancel={() => { setDeleteBulkConfirmOpen(false); setDeleteBulkTarget(null); }}
        title="Delete Bulk Transfer"
        size="sm"
        hideFooter
      >
        <div className="space-y-4 text-sm p-1">
          <p className="text-gray-700">
            Delete transfer <strong className="font-mono">{deleteBulkTarget?.transferId}</strong>
            {deleteBulkTarget?.transferType === 'GIVE_LOAN' ? (
              <> — its {deleteBulkTarget?.items?.length || 0} bag(s) will be <strong>returned to stock</strong>.</>
            ) : (
              <> — its {deleteBulkTarget?.items?.length || 0} bag(s) will be removed from the stock listing.</>
            )}
          </p>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button onClick={() => { setDeleteBulkConfirmOpen(false); setDeleteBulkTarget(null); }} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteBulkTransfer}
              disabled={deleteBulkSubmitting}
              className="bg-red-700 hover:bg-red-800 text-white font-medium h-10 px-5"
            >
              {deleteBulkSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* ── Bulk Transfer View Modal ──────────────────────── */}
      <CustomModal open={bulkViewOpen} onCancel={() => { setBulkViewOpen(false); setBulkViewItem(null); }} title="Bulk Transfer Details" size="lg" hideFooter>
        {bulkViewItem && (() => {
          const { byComponent, totalLitres } = bulkTransferComponentTotals(bulkViewItem.items);
          const componentEntries = Object.entries(byComponent);
          return (
          <div className="space-y-5 text-sm">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Transfer ID</div>
                  <div className="font-bold text-gray-800 font-mono">{bulkViewItem.transferId}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Type</div>
                  <div className="font-bold text-red-700">{bulkViewItem.transferType === 'GIVE_LOAN' ? 'Give Loan' : 'Take Loan'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Bank Name</div>
                  <div className="font-semibold text-gray-800">{bulkViewItem.bloodBankName}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Transfer Date</div>
                  <div className="text-gray-700">{bulkViewItem.transferDate ? new Date(bulkViewItem.transferDate).toLocaleDateString() : '—'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Bank Address</div>
                  <div className="text-gray-700">{bulkViewItem.bloodBankAddress}</div>
                </div>
                {bulkViewItem.notes && (
                  <div className="md:col-span-2">
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Notes</div>
                    <div className="text-gray-700">{bulkViewItem.notes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider p-4 pb-0">Blood Bags ({bulkViewItem.items?.length || 0})</h4>
              <div className="overflow-x-auto p-4 pt-3">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase font-semibold">
                      <th className="px-3 py-2">Component</th>
                      <th className="px-3 py-2">Blood Group</th>
                      <th className="px-3 py-2">Bag No</th>
                      <th className="px-3 py-2">Segment No</th>
                      <th className="px-3 py-2">Volume</th>
                      <th className="px-3 py-2">Collected</th>
                      <th className="px-3 py-2">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(bulkViewItem.items || []).map((it, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2.5 text-gray-700 font-medium">{it.componentType}</td>
                        <td className="px-3 py-2.5 font-bold text-gray-800">{it.bloodGroup}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-gray-800">{it.bagNo}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-600">{it.segmentNo || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{it.volumeMl ? `${it.volumeMl} mL` : '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{it.collectedAt ? new Date(it.collectedAt).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{it.expiresAt ? new Date(it.expiresAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Component totals in litres */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-3">Component Totals (Litres)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {componentEntries.length === 0 ? (
                  <div className="col-span-full text-gray-500 text-xs">No volume data recorded for these bags.</div>
                ) : componentEntries.map(([comp, ml]) => (
                  <div key={comp} className="bg-white border border-amber-100 rounded-lg px-3 py-2">
                    <div className="text-gray-500 text-[10px] uppercase font-semibold">{comp}</div>
                    <div className="font-bold text-gray-800">{(ml / 1000).toFixed(2)} L</div>
                  </div>
                ))}
                <div className="bg-white border border-amber-200 rounded-lg px-3 py-2">
                  <div className="text-amber-700 text-[10px] uppercase font-semibold">Total</div>
                  <div className="font-bold text-amber-900">{totalLitres.toFixed(2)} L</div>
                </div>
              </div>
            </div>

            {bulkViewItem.transferType === 'GIVE_LOAN' && (
              <div className="flex justify-end gap-2 pt-2 border-t flex-wrap">
                <Button
                  onClick={openTestingCertPrompt}
                  variant="outline"
                  className="border-red-200 text-red-800 hover:bg-red-50 font-medium h-10 px-5 shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Testing Certificate
                </Button>
                <Button
                  onClick={openInvoicePrompt}
                  variant="outline"
                  className="border-red-200 text-red-800 hover:bg-red-50 font-medium h-10 px-5 shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Invoice
                </Button>
                <Button
                  onClick={openCoverLetterPrompt}
                  className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5 shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Cover Letter
                </Button>
              </div>
            )}
          </div>
          );
        })()}
      </CustomModal>

      {/* ── Cover Letter: Box Count Prompt ────────────────── */}
      <CustomModal
        open={coverLetterPromptOpen}
        onCancel={() => setCoverLetterPromptOpen(false)}
        title="Enter Box Count"
        size="sm"
        hideFooter
      >
        <div className="space-y-4 text-sm p-1">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Total No. of Boxes</label>
            <input
              type="number"
              min="1"
              autoFocus
              value={coverLetterBoxCount}
              onChange={(e) => setCoverLetterBoxCount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCoverLetter(); }}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              placeholder="e.g. 5"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button onClick={() => setCoverLetterPromptOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button onClick={handleConfirmCoverLetter} className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5">
              Print
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* Hidden print wrapper for the cover letter */}
      {coverLetterPrintDoc && createPortal(
        <div id="bulk-transfer-cover-letter-print-wrapper" className="hidden print:block">
          <BulkTransferCoverLetter transfer={coverLetterPrintDoc} boxCount={coverLetterPrintDoc.boxCount} />
        </div>,
        document.body
      )}

      {/* ── Testing Certificate: Bleed Date & Box Count Prompt ──── */}
      <CustomModal
        open={testingCertPromptOpen}
        onCancel={() => setTestingCertPromptOpen(false)}
        title="Testing Certificate Details"
        size="sm"
        hideFooter
      >
        <div className="space-y-4 text-sm p-1">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Bleed Date</label>
            <input
              type="date"
              autoFocus
              value={testingCertBleedDate}
              onChange={(e) => setTestingCertBleedDate(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Total No. of Boxes</label>
            <input
              type="number"
              min="1"
              value={testingCertBoxCount}
              onChange={(e) => setTestingCertBoxCount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmTestingCert(); }}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              placeholder="e.g. 6"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button onClick={() => setTestingCertPromptOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button onClick={handleConfirmTestingCert} className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5">
              Print
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* Hidden print wrapper for the testing certificate */}
      {testingCertPrintDoc && createPortal(
        <div id="testing-certificate-print-wrapper" className="hidden print:block">
          <TestingCertificate transfer={testingCertPrintDoc} bleedDate={testingCertPrintDoc.bleedDate} boxCount={testingCertPrintDoc.boxCount} />
        </div>,
        document.body
      )}

      {/* ── Invoice: Rate Per Litre Prompt ─────────────────── */}
      <CustomModal
        open={invoicePromptOpen}
        onCancel={() => setInvoicePromptOpen(false)}
        title="Invoice Details"
        size="sm"
        hideFooter
      >
        <div className="space-y-4 text-sm p-1">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Rate per Litre (₹)</label>
            <input
              type="number"
              min="0"
              autoFocus
              value={invoiceRate}
              onChange={(e) => setInvoiceRate(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmInvoice(); }}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              placeholder="e.g. 1600"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button onClick={() => setInvoicePromptOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button onClick={handleConfirmInvoice} className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5">
              Print
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* Hidden print wrapper for the invoice */}
      {invoicePrintDoc && createPortal(
        <div id="bulk-transfer-invoice-print-wrapper" className="hidden print:block">
          <BulkTransferInvoice transfer={invoicePrintDoc} ratePerLitre={invoicePrintDoc.ratePerLitre} />
        </div>,
        document.body
      )}

      {/* ── Send Bulk (Give/Take Loan) Form Modal ─────────── */}
      <CustomModal open={bulkFormOpen} onCancel={() => setBulkFormOpen(false)} title="Bulk Transfer — Give / Take Loan" size="xl" hideFooter>
        <div className="space-y-6 text-sm p-2">
          {/* Give Loan / Take Loan selector */}
          <div className="flex gap-3">
            {[
              { key: 'GIVE_LOAN', label: 'Give Loan' },
              { key: 'TAKE_LOAN', label: 'Take Loan' },
            ].map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setBulkTransferType(opt.key)}
                className={`flex-1 h-11 rounded-lg text-sm font-bold border-2 transition-colors ${
                  bulkTransferType === opt.key
                    ? 'border-red-700 bg-red-50 text-red-800'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Blood Bank Name</label>
              <input
                type="text"
                value={bulkBloodBankName}
                onChange={(e) => setBulkBloodBankName(e.target.value)}
                className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                placeholder="e.g. Red Cross Blood Bank"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={bulkTransferDate}
                onChange={(e) => setBulkTransferDate(e.target.value)}
                className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              />
            </div>
            <div className="flex flex-col md:col-span-3">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Blood Bank Address</label>
              <input
                type="text"
                value={bulkBloodBankAddress}
                onChange={(e) => setBulkBloodBankAddress(e.target.value)}
                className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                placeholder="Full address"
              />
            </div>
          </div>

          {bulkTransferType === 'GIVE_LOAN' ? (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Blood Bag Selection By Component (From Our Stock)</h4>
                <Button
                  type="button"
                  onClick={() => setBulkGiveBags([...bulkGiveBags, { componentType: "RBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }])}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Component Section
                </Button>
              </div>

              <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
                {bulkGiveBags.map((comp, compIndex) => (
                  <div key={compIndex} className="p-5 border rounded-xl bg-white shadow-sm border-gray-200 flex flex-col gap-4 relative">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Component Type</span>
                        <select
                          value={comp.componentType}
                          onChange={(e) => {
                            const next = [...bulkGiveBags];
                            next[compIndex].componentType = e.target.value;
                            next[compIndex].groups = next[compIndex].groups.map(g => ({ ...g, selectedBags: [] }));
                            setBulkGiveBags(next);
                          }}
                          className="h-9 px-3 border rounded-md text-xs bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
                        >
                          <option value="RBC">RBC (PRBC)</option>
                          <option value="FFP">FFP</option>
                          <option value="Platelet">Platelet (PLATELET_CONCENTRATE)</option>
                          <option value="Cryo">Cryo (CRYOPRECIPITATE)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            const next = [...bulkGiveBags];
                            next[compIndex].groups.push({ bloodGroup: "A+", bagType: "All", selectedBags: [] });
                            setBulkGiveBags(next);
                          }}
                          variant="outline"
                          size="xs"
                          className="text-xs text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1 py-1 px-2.5 h-8 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Blood Group
                        </Button>

                        {bulkGiveBags.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => setBulkGiveBags(bulkGiveBags.filter((_, idx) => idx !== compIndex))}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                            title="Remove Component Section"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pl-2 border-l-2 border-red-100">
                      {comp.groups.map((group, groupIndex) => {
                        const matchingAvailableBags = availableUnits.filter(u => {
                          const unitBg = `${u.bag?.bloodGroup}${u.bag?.rh === 'Positive' ? '+' : '-'}`;
                          let unitComp = u.component?.componentType;
                          if (unitComp === 'PRBC' || unitComp === 'RBC') unitComp = 'RBC';
                          else if (unitComp === 'FFP') unitComp = 'FFP';
                          else if (unitComp === 'PLATELET_CONCENTRATE' || unitComp === 'Platelet') unitComp = 'Platelet';
                          else if (unitComp === 'CRYOPRECIPITATE' || unitComp === 'Cryo') unitComp = 'Cryo';

                          const matchesBgAndComp = unitBg === group.bloodGroup && unitComp === comp.componentType;
                          if (!matchesBgAndComp) return false;
                          if (group.bagType && group.bagType !== "All") return u.typeOfBag === group.bagType;
                          return true;
                        });

                        const selectedDetails = group.selectedBags.map(id => availableUnits.find(u => u._id === id)).filter(Boolean);

                        return (
                          <div key={groupIndex} className="p-3 border rounded-lg bg-slate-50/50 flex flex-col gap-2 relative">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                              <div className="md:col-span-2 flex flex-col">
                                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Blood Group</label>
                                <select
                                  value={group.bloodGroup}
                                  onChange={(e) => {
                                    const next = [...bulkGiveBags];
                                    next[compIndex].groups[groupIndex].bloodGroup = e.target.value;
                                    next[compIndex].groups[groupIndex].selectedBags = [];
                                    setBulkGiveBags(next);
                                  }}
                                  className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                                >
                                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="md:col-span-2 flex flex-col">
                                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Bag Type</label>
                                <select
                                  value={group.bagType || "All"}
                                  onChange={(e) => {
                                    const next = [...bulkGiveBags];
                                    next[compIndex].groups[groupIndex].bagType = e.target.value;
                                    next[compIndex].groups[groupIndex].selectedBags = [];
                                    setBulkGiveBags(next);
                                  }}
                                  className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                                >
                                  <option value="All">All Types</option>
                                  <option value="DB">Double (DB)</option>
                                  <option value="TB">Triple (TB)</option>
                                </select>
                              </div>

                              <div className="md:col-span-7 flex flex-col">
                                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Select Bags</label>
                                <MultiBagSelect
                                  availableBags={matchingAvailableBags}
                                  selectedBags={group.selectedBags}
                                  onChange={(selectedIds) => {
                                    const next = [...bulkGiveBags];
                                    next[compIndex].groups[groupIndex].selectedBags = selectedIds;
                                    setBulkGiveBags(next);
                                  }}
                                />
                              </div>

                              <div className="md:col-span-1 flex justify-end">
                                {comp.groups.length > 1 && (
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      const next = [...bulkGiveBags];
                                      next[compIndex].groups = next[compIndex].groups.filter((_, idx) => idx !== groupIndex);
                                      setBulkGiveBags(next);
                                    }}
                                    variant="outline"
                                    size="xs"
                                    className="h-9 w-9 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                                    title="Remove Blood Group"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {selectedDetails.length > 0 && (() => {
                              const groupVolumeMl = selectedDetails.reduce((sum, bag) => sum + (Number(bag.component?.volumeMl) || 0), 0);
                              return (
                                <div className="mt-1 p-2 bg-white rounded-lg border border-slate-100 shadow-inner">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Loaded Segment Numbers:</div>
                                    <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide">Group Volume: {(groupVolumeMl / 1000).toFixed(2)} L ({groupVolumeMl} mL)</div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedDetails.map(bag => (
                                      <span key={bag._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-805 text-xs border border-red-100 font-medium">
                                        <span className="font-extrabold">{bag.bagNo}</span>
                                        <span className="text-red-200">|</span>
                                        <span>Seg: <strong className="font-extrabold">{bag.segmentNo}</strong></span>
                                        <span className="text-red-200">|</span>
                                        <span>{bag.component?.volumeMl ? `${bag.component.volumeMl} mL` : 'Vol: —'}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {(() => {
                const totalMl = bulkGiveBags.reduce((sum, comp) => sum + comp.groups.reduce((gsum, group) => (
                  gsum + group.selectedBags.reduce((bsum, bagId) => {
                    const unit = availableUnits.find(u => u._id === bagId);
                    return bsum + (Number(unit?.component?.volumeMl) || 0);
                  }, 0)
                ), 0), 0);
                const totalBags = bulkGiveBags.reduce((sum, comp) => sum + comp.groups.reduce((gsum, group) => gsum + group.selectedBags.length, 0), 0);
                return (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Total Selected: {totalBags} bag{totalBags !== 1 ? 's' : ''}</span>
                    <span className="text-sm font-black text-amber-900">{(totalMl / 1000).toFixed(2)} L ({totalMl} mL)</span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Blood Bags Being Taken In (Enter Manually)</h4>
                <Button
                  type="button"
                  onClick={() => setBulkTakeGroups([...bulkTakeGroups, { componentType: "RBC", bloodGroup: "A+", bags: [{ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" }] }])}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Component / Group
                </Button>
              </div>

              <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
                {bulkTakeGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="p-5 border rounded-xl bg-white shadow-sm border-gray-200 flex flex-col gap-4 relative">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Component</label>
                          <select
                            value={group.componentType}
                            onChange={(e) => {
                              const next = [...bulkTakeGroups];
                              next[groupIndex].componentType = e.target.value;
                              setBulkTakeGroups(next);
                            }}
                            className="h-9 px-3 border rounded-md text-xs bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
                          >
                            <option value="RBC">RBC (PRBC)</option>
                            <option value="FFP">FFP</option>
                            <option value="Platelet">Platelet (PLATELET_CONCENTRATE)</option>
                            <option value="Cryo">Cryo (CRYOPRECIPITATE)</option>
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Blood Group</label>
                          <select
                            value={group.bloodGroup}
                            onChange={(e) => {
                              const next = [...bulkTakeGroups];
                              next[groupIndex].bloodGroup = e.target.value;
                              setBulkTakeGroups(next);
                            }}
                            className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                          >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            const next = [...bulkTakeGroups];
                            next[groupIndex].bags.push({ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" });
                            setBulkTakeGroups(next);
                          }}
                          variant="outline"
                          size="xs"
                          className="text-xs text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1 py-1 px-2.5 h-8 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Bag
                        </Button>

                        {bulkTakeGroups.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => setBulkTakeGroups(bulkTakeGroups.filter((_, idx) => idx !== groupIndex))}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                            title="Remove Component / Group"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pl-2 border-l-2 border-red-100">
                      {group.bags.map((bag, bagIndex) => (
                        <div key={bagIndex} className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                          <div className="md:col-span-2 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Bag No</label>
                            <input
                              type="text"
                              value={bag.bagNo}
                              onChange={(e) => {
                                const next = [...bulkTakeGroups];
                                next[groupIndex].bags[bagIndex].bagNo = e.target.value;
                                setBulkTakeGroups(next);
                              }}
                              className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                              placeholder="Bag No"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Segment No</label>
                            <input
                              type="text"
                              value={bag.segmentNo}
                              onChange={(e) => {
                                const next = [...bulkTakeGroups];
                                next[groupIndex].bags[bagIndex].segmentNo = e.target.value;
                                setBulkTakeGroups(next);
                              }}
                              className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                              placeholder="Segment No"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Volume (mL)</label>
                            <input
                              type="number"
                              min="0"
                              value={bag.volumeMl}
                              onChange={(e) => {
                                const next = [...bulkTakeGroups];
                                next[groupIndex].bags[bagIndex].volumeMl = e.target.value;
                                setBulkTakeGroups(next);
                              }}
                              className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                              placeholder="e.g. 350"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Collection Date</label>
                            <input
                              type="date"
                              value={bag.collectedAt}
                              onChange={(e) => {
                                const next = [...bulkTakeGroups];
                                next[groupIndex].bags[bagIndex].collectedAt = e.target.value;
                                setBulkTakeGroups(next);
                              }}
                              className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                          <div className="md:col-span-3 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Expiry Date</label>
                            <input
                              type="date"
                              value={bag.expiresAt}
                              onChange={(e) => {
                                const next = [...bulkTakeGroups];
                                next[groupIndex].bags[bagIndex].expiresAt = e.target.value;
                                setBulkTakeGroups(next);
                              }}
                              className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                          <div className="md:col-span-1 flex justify-end">
                            {group.bags.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => {
                                  const next = [...bulkTakeGroups];
                                  next[groupIndex].bags = next[groupIndex].bags.filter((_, idx) => idx !== bagIndex);
                                  setBulkTakeGroups(next);
                                }}
                                variant="outline"
                                size="xs"
                                className="h-9 w-9 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                                title="Remove Bag"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {(() => {
                      const groupVolumeMl = group.bags.reduce((sum, b) => sum + (Number(b.volumeMl) || 0), 0);
                      return (
                        <div className="text-right text-[10px] font-bold text-red-700 uppercase tracking-wide pt-1">
                          Group Volume: {(groupVolumeMl / 1000).toFixed(2)} L ({groupVolumeMl} mL)
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {(() => {
                const totalMl = bulkTakeGroups.reduce((sum, group) => sum + group.bags.reduce((bsum, b) => bsum + (Number(b.volumeMl) || 0), 0), 0);
                const totalBags = bulkTakeGroups.reduce((sum, group) => sum + group.bags.filter(b => b.bagNo.trim()).length, 0);
                return (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Total Entered: {totalBags} bag{totalBags !== 1 ? 's' : ''}</span>
                    <span className="text-sm font-black text-amber-900">{(totalMl / 1000).toFixed(2)} L ({totalMl} mL)</span>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-6">
            <Button onClick={() => setBulkFormOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button
              onClick={handleBulkTransferSubmit}
              disabled={bulkSubmitting || (bulkTransferType === 'GIVE_LOAN' && loadingAvailable)}
              className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-6 shadow-md transition-colors duration-200"
            >
              {bulkSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                bulkTransferType === 'GIVE_LOAN' ? "Give Loan" : "Take Loan"
              )}
            </Button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default Issue;

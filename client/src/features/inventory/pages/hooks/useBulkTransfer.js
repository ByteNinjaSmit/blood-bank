import { useEffect, useState } from "react";
import { apiClient } from "@/core/api-client";
import { toast } from "sonner";
import { useEditWithReason } from "@/hooks/useEditWithReason";
import { useUpdateBulkTransfer, useDeleteBulkTransfer } from "@/features/bulk-transfer/queries";

// Owns the entire Bulk Transfer register: list/fetch, create/edit/delete,
// and the three print documents (cover letter / testing certificate /
// invoice). Depends on the shared available-units list from the parent
// (also used by "Send to Storage").
export function useBulkTransfer({ mainTab, availableUnits, fetchAvailableUnits }) {
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
  const [bulkGiveBags, setBulkGiveBags] = useState([{ componentType: "PRBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
  const [bulkTakeGroups, setBulkTakeGroups] = useState([{ componentType: "PRBC", bloodGroup: "A+", bags: [{ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" }] }]);

  const resetBulkForm = () => {
    setBulkTransferType("GIVE_LOAN");
    setBulkBloodBankName("");
    setBulkBloodBankAddress("");
    setBulkTransferDate(new Date().toISOString().split('T')[0]);
    setBulkGiveBags([{ componentType: "PRBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
    setBulkTakeGroups([{ componentType: "PRBC", bloodGroup: "A+", bags: [{ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" }] }]);
  };

  const [bulkEditTarget, setBulkEditTarget] = useState(null);
  const [bulkEditExtraUnits, setBulkEditExtraUnits] = useState([]);
  const updateBulkTransferMutation = useUpdateBulkTransfer();

  const openEditBulkTransfer = (row) => {
    setBulkEditTarget(row);
    setBulkTransferType(row.transferType);
    setBulkBloodBankName(row.bloodBankName || "");
    setBulkBloodBankAddress(row.bloodBankAddress || "");
    setBulkTransferDate(row.transferDate ? row.transferDate.split('T')[0] : new Date().toISOString().split('T')[0]);

    if (row.transferType === 'GIVE_LOAN') {
      const extraUnits = (row.items || []).filter(it => it.unitId).map(it => ({
        _id: it.unitId,
        bagNo: it.bagNo,
        segmentNo: it.segmentNo,
        typeOfBag: undefined,
        bag: {
          bagNo: it.bagNo,
          bloodGroup: (it.bloodGroup || '').replace(/[+-]$/, ''),
          rh: (it.bloodGroup || '').endsWith('-') ? 'Negative' : 'Positive',
          donationDate: it.collectedAt,
        },
        component: { componentType: it.componentType, volumeMl: it.volumeMl, expiryDate: it.expiresAt },
      }));
      setBulkEditExtraUnits(extraUnits);

      const byComp = {};
      (row.items || []).forEach(it => {
        byComp[it.componentType] = byComp[it.componentType] || {};
        byComp[it.componentType][it.bloodGroup] = byComp[it.componentType][it.bloodGroup] || [];
        if (it.unitId) byComp[it.componentType][it.bloodGroup].push(it.unitId);
      });
      const groups = Object.entries(byComp).map(([componentType, byBg]) => ({
        componentType,
        groups: Object.entries(byBg).map(([bloodGroup, selectedBags]) => ({ bloodGroup, bagType: 'All', selectedBags })),
      }));
      setBulkGiveBags(groups.length ? groups : [{ componentType: "PRBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
      fetchAvailableUnits();
    } else {
      setBulkEditExtraUnits([]);
      const byKey = {};
      (row.items || []).forEach(it => {
        const key = `${it.componentType}|${it.bloodGroup}`;
        byKey[key] = byKey[key] || { componentType: it.componentType, bloodGroup: it.bloodGroup, bags: [] };
        byKey[key].bags.push({
          bagNo: it.bagNo || '',
          segmentNo: it.segmentNo || '',
          volumeMl: it.volumeMl != null ? String(it.volumeMl) : '',
          collectedAt: it.collectedAt ? it.collectedAt.split('T')[0] : '',
          expiresAt: it.expiresAt ? it.expiresAt.split('T')[0] : '',
        });
      });
      const groups = Object.values(byKey);
      setBulkTakeGroups(groups.length ? groups : [{ componentType: "PRBC", bloodGroup: "A+", bags: [{ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" }] }]);
    }

    setBulkFormOpen(true);
  };

  const { wrappedSave: saveBulkEdit, EditReasonDialog: BulkEditReasonDialog } = useEditWithReason({
    onSave: async (payload, reason) => {
      try {
        setBulkSubmitting(true);
        await updateBulkTransferMutation.mutateAsync({ id: bulkEditTarget.id, data: payload, editReason: reason });
        toast.success("Bulk transfer updated");
        setBulkFormOpen(false);
        setBulkEditTarget(null);
        setBulkEditExtraUnits([]);
        resetBulkForm();
        fetchBulkTransfers(bulkPagination.page || 1);
        fetchAvailableUnits();
      } catch (e) {
        toast.error(e?.message || "Failed to update bulk transfer");
        throw e;
      } finally {
        setBulkSubmitting(false);
      }
    },
    title: 'Confirm Bulk Transfer Changes',
    message: 'Please provide a reason for editing this bulk transfer. It will be recorded in the audit trail.',
  });

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

  const [deleteBulkConfirmOpen, setDeleteBulkConfirmOpen] = useState(false);
  const [deleteBulkTarget, setDeleteBulkTarget] = useState(null);
  const [deleteBulkReason, setDeleteBulkReason] = useState("");
  const deleteBulkTransferMutation = useDeleteBulkTransfer();
  const deleteBulkSubmitting = deleteBulkTransferMutation.isPending;

  const openDeleteBulkTransferConfirm = (row) => {
    setDeleteBulkTarget(row);
    setDeleteBulkReason("");
    setDeleteBulkConfirmOpen(true);
  };

  const handleDeleteBulkTransfer = async () => {
    if (!deleteBulkTarget) return;
    if (!deleteBulkReason.trim()) {
      return toast.warning("Please provide a reason for deleting this bulk transfer");
    }
    try {
      await deleteBulkTransferMutation.mutateAsync({ id: deleteBulkTarget.id, reason: deleteBulkReason.trim() });
      toast.success(
        deleteBulkTarget.transferType === 'GIVE_LOAN'
          ? "Bulk transfer deleted — bags returned to stock"
          : "Bulk transfer deleted"
      );
      setDeleteBulkConfirmOpen(false);
      setDeleteBulkTarget(null);
      setDeleteBulkReason("");
      fetchBulkTransfers(bulkPagination.page || 1);
    } catch (e) {
      toast.error(e?.message || "Failed to delete bulk transfer");
    }
  };

  const handleBulkTransferSubmit = async () => {
    if (!bulkBloodBankName.trim() || !bulkBloodBankAddress.trim()) {
      return toast.warning("Please enter the company name and address");
    }
    if (!bulkTransferDate) {
      return toast.warning("Please select a transfer date");
    }

    const unitsForLookup = bulkEditTarget ? [...availableUnits, ...bulkEditExtraUnits] : availableUnits;

    let items = [];
    if (bulkTransferType === "GIVE_LOAN") {
      bulkGiveBags.forEach(comp => {
        comp.groups.forEach(group => {
          group.selectedBags.forEach(bagId => {
            const unit = unitsForLookup.find(u => u._id === bagId);
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

    if (bulkEditTarget) {
      saveBulkEdit({
        bloodBankName: bulkBloodBankName.trim(),
        bloodBankAddress: bulkBloodBankAddress.trim(),
        transferDate: bulkTransferDate,
        items,
      });
      return;
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

  // ── Print documents (cover letter / testing certificate / invoice) ──
  const [coverLetterPromptOpen, setCoverLetterPromptOpen] = useState(false);
  const [coverLetterBoxCount, setCoverLetterBoxCount] = useState("");
  const [coverLetterPrintDoc, setCoverLetterPrintDoc] = useState(null);

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
      @page {
        size: auto;
        margin: 0;
      }
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

  return {
    // list
    bulkRows, bulkLoading, bulkPagination, fetchBulkTransfers,
    // view
    bulkViewOpen, setBulkViewOpen, bulkViewItem, setBulkViewItem,
    // form
    bulkFormOpen, setBulkFormOpen, bulkSubmitting,
    bulkTransferType, setBulkTransferType,
    bulkBloodBankName, setBulkBloodBankName,
    bulkBloodBankAddress, setBulkBloodBankAddress,
    bulkTransferDate, setBulkTransferDate,
    bulkGiveBags, setBulkGiveBags,
    bulkTakeGroups, setBulkTakeGroups,
    bulkEditTarget, setBulkEditTarget,
    bulkEditExtraUnits, setBulkEditExtraUnits,
    resetBulkForm, openEditBulkTransfer, handleBulkTransferSubmit,
    // delete
    deleteBulkConfirmOpen, setDeleteBulkConfirmOpen,
    deleteBulkTarget, setDeleteBulkTarget,
    deleteBulkReason, setDeleteBulkReason,
    deleteBulkSubmitting, openDeleteBulkTransferConfirm, handleDeleteBulkTransfer,
    // print
    bulkTransferComponentTotals,
    coverLetterPromptOpen, setCoverLetterPromptOpen, coverLetterBoxCount, setCoverLetterBoxCount, coverLetterPrintDoc, openCoverLetterPrompt, handleConfirmCoverLetter,
    testingCertPromptOpen, setTestingCertPromptOpen, testingCertBleedDate, setTestingCertBleedDate, testingCertBoxCount, setTestingCertBoxCount, testingCertPrintDoc, openTestingCertPrompt, handleConfirmTestingCert,
    invoicePromptOpen, setInvoicePromptOpen, invoiceRate, setInvoiceRate, invoicePrintDoc, openInvoicePrompt, handleConfirmInvoice,
    // dialogs
    BulkEditReasonDialog,
  };
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEditWithReason } from "@/hooks/useEditWithReason";
import { useDeleteWithReason } from "@/hooks/useDeleteWithReason";
import {
  useStorageTransferList,
  useCreateStorageTransfer,
  useUpdateStorageTransfer,
  useDeleteStorageTransfer,
} from "@/features/storage-transfer/queries";

// A factory, not a shared constant: form handlers mutate the nested
// group/bag objects in place (e.g. newBags[i].groups[j].selectedBags = ...),
// so reusing one module-level array would leak a user's picks into every
// later "reset" — the modal would look like it never cleared.
const defaultBags = () => [{ componentType: "PRBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }];
const todayIso = () => new Date().toISOString().split('T')[0];

function splitBloodGroup(bg) {
  return { letter: (bg || '').replace(/[+-]$/, ''), rhFactor: (bg || '').endsWith('-') ? 'NEGATIVE' : 'POSITIVE' };
}

// Owns the Storage register: list/fetch, create/edit/delete of
// StorageTransfer batches (the "Send to Storage" flow). Clinical
// Indication / Disease issuance is a separate, dedicated flow — see
// useClinicalIndication.js — even though it shares the same bag-picker
// UI shape. Mirrors useBulkTransfer's shape so both tabs feel and behave
// the same way.
export const STORAGE_LOCATION_TABS = [
  { key: 'SJS [Kopargaon]', label: 'SJS' },
  { key: 'Anand [Vaijapur]', label: 'Anand' },
];

export function useStorageTransfer({ mainTab, availableUnits, fetchAvailableUnits }) {
  const [storagePagination, setStoragePagination] = useState({ page: 1, limit: 10 });
  const [storageLocationTab, setStorageLocationTab] = useState(STORAGE_LOCATION_TABS[0].key);
  const listQuery = useStorageTransferList({
    page: storagePagination.page,
    limit: storagePagination.limit,
    location: storageLocationTab,
  });
  const storageRows = listQuery.data?.data ?? [];
  const storageTotal = listQuery.data?.pagination?.total ?? 0;
  const storagePaginationView = {
    page: storagePagination.page,
    limit: storagePagination.limit,
    total: storageTotal,
    totalPages: Math.max(1, Math.ceil(storageTotal / (storagePagination.limit || 10))),
  };
  const storageLoading = listQuery.isLoading || listQuery.isFetching;
  const fetchStorageTransfers = (page = 1) => setStoragePagination((p) => ({ ...p, page }));
  const changeStorageLocationTab = (location) => {
    setStorageLocationTab(location);
    setStoragePagination((p) => ({ ...p, page: 1 }));
  };

  useEffect(() => {
    if (mainTab === 'storage') listQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab]);

  // ── View ──
  const [storageViewOpen, setStorageViewOpen] = useState(false);
  const [storageViewItem, setStorageViewItem] = useState(null);

  // ── Create / Edit form ──
  const [storageFormOpen, setStorageFormOpen] = useState(false);
  const [storageSubmitting, setStorageSubmitting] = useState(false);
  const [storageLocation, setStorageLocation] = useState("SJS [Kopargaon]");
  const [otherLocationName, setOtherLocationName] = useState("");
  const [sentDate, setSentDate] = useState(todayIso());
  const [storageBags, setStorageBags] = useState(defaultBags);
  const [storageEditTarget, setStorageEditTarget] = useState(null);
  const [storageEditExtraUnits, setStorageEditExtraUnits] = useState([]);

  const resetStorageForm = () => {
    setStorageLocation("SJS [Kopargaon]");
    setOtherLocationName("");
    setSentDate(todayIso());
    setStorageBags(defaultBags());
  };

  const openCreateStorage = () => {
    setStorageEditTarget(null);
    setStorageEditExtraUnits([]);
    resetStorageForm();
    setStorageFormOpen(true);
    fetchAvailableUnits();
  };

  const openEditStorage = (row) => {
    setStorageEditTarget(row);
    const isKnown = row.location === 'SJS [Kopargaon]' || row.location === 'Anand [Vaijapur]';
    setStorageLocation(isKnown ? row.location : 'Others');
    setOtherLocationName(isKnown ? '' : (row.otherLocationName || row.location || ''));
    setSentDate(row.sentDate ? row.sentDate.split('T')[0] : todayIso());

    const extraUnits = (row.items || []).map((it) => ({
      _id: it.unitId,
      bagNo: it.bagNo,
      segmentNo: it.segmentNo,
      bag: { bagNo: it.bagNo, bloodGroup: it.bloodGroup, rh: it.rhFactor === 'NEGATIVE' ? 'Negative' : 'Positive' },
      component: { componentType: it.componentType, volumeMl: it.volumeMl, expiryDate: it.expiresAt },
    }));
    setStorageEditExtraUnits(extraUnits);

    const byComp = {};
    (row.items || []).forEach((it) => {
      const bg = `${it.bloodGroup}${it.rhFactor === 'NEGATIVE' ? '-' : '+'}`;
      byComp[it.componentType] = byComp[it.componentType] || {};
      byComp[it.componentType][bg] = byComp[it.componentType][bg] || [];
      byComp[it.componentType][bg].push(it.unitId);
    });
    const groups = Object.entries(byComp).map(([componentType, byBg]) => ({
      componentType,
      groups: Object.entries(byBg).map(([bloodGroup, selectedBags]) => ({ bloodGroup, bagType: 'All', selectedBags })),
    }));
    setStorageBags(groups.length ? groups : defaultBags());

    setStorageFormOpen(true);
    fetchAvailableUnits();
  };

  const closeStorageForm = () => {
    setStorageFormOpen(false);
    setStorageEditTarget(null);
    setStorageEditExtraUnits([]);
    resetStorageForm();
  };

  const createStorageTransferMutation = useCreateStorageTransfer();
  const updateStorageTransferMutation = useUpdateStorageTransfer();

  const { wrappedSave: saveStorageEdit, EditReasonDialog: StorageEditReasonDialog } = useEditWithReason({
    onSave: async (payload, reason) => {
      try {
        setStorageSubmitting(true);
        await updateStorageTransferMutation.mutateAsync({ id: storageEditTarget.id, data: payload, editReason: reason });
        toast.success("Storage batch updated");
        closeStorageForm();
        fetchAvailableUnits();
      } catch (e) {
        toast.error(e?.message || "Failed to update storage batch");
        throw e;
      } finally {
        setStorageSubmitting(false);
      }
    },
    title: 'Confirm Storage Batch Changes',
    message: 'Please provide a reason for editing this storage batch. It will be recorded in the audit trail.',
  });

  const handleStorageSubmit = async () => {
    const locationVal = storageLocation === 'Others' ? otherLocationName.trim() : storageLocation;
    if (!locationVal) return toast.warning("Please specify a storage location");

    const unitsForLookup = storageEditTarget ? [...availableUnits, ...storageEditExtraUnits] : availableUnits;
    const items = [];
    storageBags.forEach((comp) => comp.groups.forEach((group) => {
      group.selectedBags.forEach((bagId) => {
        const unit = unitsForLookup.find((u) => u._id === bagId);
        if (!unit) return;
        const { letter, rhFactor } = splitBloodGroup(`${unit.bag?.bloodGroup || ''}${unit.bag?.rh === 'Negative' ? '-' : '+'}`);
        items.push({
          unitId: unit._id,
          bagNo: unit.bag?.bagNo || unit.bagNo || '',
          componentType: comp.componentType,
          bloodGroup: unit.bag?.bloodGroup || letter,
          rhFactor,
          segmentNo: unit.segmentNo || unit.bag?.segmentNo || undefined,
          volumeMl: unit.component?.volumeMl || undefined,
          expiresAt: unit.component?.expiryDate || undefined,
        });
      });
    }));
    if (items.length === 0) return toast.warning("Please select at least one blood bag to send to storage");

    const payload = { location: storageLocation, otherLocationName: otherLocationName.trim(), sentDate, items };

    if (storageEditTarget) {
      saveStorageEdit(payload);
      return;
    }

    try {
      setStorageSubmitting(true);
      await createStorageTransferMutation.mutateAsync(payload);
      toast.success("Blood bags sent to storage successfully");
      closeStorageForm();
      fetchAvailableUnits();
    } catch (e) {
      toast.error(e?.message || "Failed to send blood bags to storage");
    } finally {
      setStorageSubmitting(false);
    }
  };

  // ── Delete (whole batch — every bag in it returns to stock) ──
  const deleteStorageTransferMutation = useDeleteStorageTransfer();
  const { requestDelete: requestDeleteStorage, DeleteReasonDialog: StorageDeleteReasonDialog } = useDeleteWithReason({
    onDelete: async (row, reason) => {
      try {
        await deleteStorageTransferMutation.mutateAsync({ id: row.id, reason });
        toast.success(`Storage batch deleted — ${row.items?.length || 0} bag(s) returned to stock`);
      } catch (e) {
        toast.error(e?.message || 'Failed to delete storage batch');
        throw e;
      }
    },
    title: 'Delete Storage Batch',
    message: 'Every bag in this batch will be returned to available stock. This cannot be undone from here.',
    fieldLabel: 'Reason for Deletion',
  });

  return {
    // list
    storageRows, storageLoading, storagePagination: storagePaginationView, fetchStorageTransfers,
    storageLocationTab, changeStorageLocationTab,
    // view
    storageViewOpen, setStorageViewOpen, storageViewItem, setStorageViewItem,
    // form
    storageFormOpen, setStorageFormOpen, storageSubmitting,
    storageLocation, setStorageLocation,
    otherLocationName, setOtherLocationName,
    sentDate, setSentDate,
    storageBags, setStorageBags,
    storageEditTarget,
    openCreateStorage, openEditStorage, closeStorageForm, handleStorageSubmit,
    // delete
    requestDeleteStorage,
    // dialogs
    StorageEditReasonDialog, StorageDeleteReasonDialog,
  };
}

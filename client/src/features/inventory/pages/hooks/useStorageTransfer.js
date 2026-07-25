import { useEffect, useState } from "react";
import { apiClient } from "@/core/api-client";
import { toast } from "sonner";
import { useEditWithReason } from "@/hooks/useEditWithReason";
import { useDeleteWithReason } from "@/hooks/useDeleteWithReason";
import {
  useStorageTransferList,
  useCreateStorageTransfer,
  useUpdateStorageTransfer,
  useDeleteStorageTransfer,
} from "@/features/storage-transfer/queries";

const DEFAULT_PATIENT = {
  firstName: "", middleName: "", lastName: "", address: "",
  age: "", sex: "M", bloodGroup: "A+", disease: "THALASSEMIA", otherDiseaseName: "",
};
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
// StorageTransfer batches (the "Send to Storage" flow), plus the legacy
// one-off Clinical Indication / Disease issuance that shares the same
// form but isn't tracked as an editable batch. Mirrors useBulkTransfer's
// shape so both tabs feel and behave the same way.
export const STORAGE_LOCATION_TABS = [
  { key: 'SJS [Kopargaon]', label: 'SJS' },
  { key: 'Anand [Vaijapur]', label: 'Anand' },
];

export function useStorageTransfer({ mainTab, user, availableUnits, fetchAvailableUnits }) {
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
  const [dispatchType, setDispatchType] = useState("STORAGE"); // STORAGE | CLINICAL_INDICATION
  const [storageLocation, setStorageLocation] = useState("SJS [Kopargaon]");
  const [otherLocationName, setOtherLocationName] = useState("");
  const [sentDate, setSentDate] = useState(todayIso());
  const [patientDetails, setPatientDetails] = useState(DEFAULT_PATIENT);
  const [storageBags, setStorageBags] = useState(defaultBags);
  const [storageEditTarget, setStorageEditTarget] = useState(null);
  const [storageEditExtraUnits, setStorageEditExtraUnits] = useState([]);

  const resetStorageForm = () => {
    setDispatchType("STORAGE");
    setStorageLocation("SJS [Kopargaon]");
    setOtherLocationName("");
    setSentDate(todayIso());
    setPatientDetails(DEFAULT_PATIENT);
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
    setDispatchType("STORAGE");
    const isKnown = row.location === 'SJS [Kopargaon]' || row.location === 'Anand [Vaijapur]';
    setStorageLocation(isKnown ? row.location : 'Others');
    setOtherLocationName(isKnown ? '' : (row.otherLocationName || row.location || ''));
    setSentDate(row.sentDate ? row.sentDate.split('T')[0] : todayIso());
    setPatientDetails(DEFAULT_PATIENT);

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
    const isClinicalIndication = dispatchType === "CLINICAL_INDICATION";

    if (!isClinicalIndication) {
      const locationVal = storageLocation === 'Others' ? otherLocationName.trim() : storageLocation;
      if (!locationVal) return toast.warning("Please specify a storage location");
    } else {
      if (!patientDetails.firstName.trim() || !patientDetails.lastName.trim()) {
        return toast.warning("Please enter the patient's first name and last name");
      }
      if (!patientDetails.age || isNaN(Number(patientDetails.age))) return toast.warning("Please enter a valid age");
      if (!patientDetails.disease) return toast.warning("Please select a disease");
      if (patientDetails.disease === "OTHER" && !patientDetails.otherDiseaseName.trim()) {
        return toast.warning("Please specify the disease name");
      }
    }

    // Clinical Indication issuance is a one-off legacy dispatch — not
    // tracked as an editable/deletable batch entity, unlike STORAGE.
    if (isClinicalIndication) {
      const bagsPayload = [];
      storageBags.forEach((comp) => comp.groups.forEach((group) => {
        if (group.selectedBags?.length) bagsPayload.push({ bloodGroup: group.bloodGroup, bagIds: group.selectedBags });
      }));
      if (bagsPayload.length === 0) return toast.warning("Please select at least one blood bag to send to storage");

      try {
        setStorageSubmitting(true);
        await apiClient.post(`/api/inventory/send-to-storage`, {
          location: storageLocation,
          otherLocationName: otherLocationName.trim(),
          bags: bagsPayload,
          userId: user?._id || user?.id,
          dispatchType,
          sentDate: null,
          clinicalIndicationPatient: {
            ...patientDetails,
            firstName: patientDetails.firstName.trim(),
            middleName: patientDetails.middleName.trim(),
            lastName: patientDetails.lastName.trim(),
            address: patientDetails.address.trim(),
            age: Number(patientDetails.age),
            otherDiseaseName: patientDetails.disease === "OTHER" ? patientDetails.otherDiseaseName.trim() : "",
          },
        });
        toast.success("Issued for the clinical indication successfully");
        closeStorageForm();
      } catch (e) {
        toast.error(e?.message || "Failed to issue blood units");
      } finally {
        setStorageSubmitting(false);
      }
      return;
    }

    // STORAGE dispatch — build the StorageTransfer batch's item list.
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
    dispatchType, setDispatchType,
    storageLocation, setStorageLocation,
    otherLocationName, setOtherLocationName,
    sentDate, setSentDate,
    patientDetails, setPatientDetails,
    storageBags, setStorageBags,
    storageEditTarget,
    openCreateStorage, openEditStorage, closeStorageForm, handleStorageSubmit,
    // delete
    requestDeleteStorage,
    // dialogs
    StorageEditReasonDialog, StorageDeleteReasonDialog,
  };
}

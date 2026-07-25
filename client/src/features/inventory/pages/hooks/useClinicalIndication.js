import { useState } from "react";
import { apiClient } from "@/core/api-client";
import { toast } from "sonner";

const DEFAULT_PATIENT = {
  firstName: "", middleName: "", lastName: "", address: "",
  age: "", sex: "M", bloodGroup: "A+", disease: "THALASSEMIA", otherDiseaseName: "",
};
// A factory, not a shared constant — see useStorageTransfer.js for why:
// form handlers mutate the nested group/bag objects in place, so a
// module-level array would leak selections into every later "reset".
const defaultBags = () => [{ componentType: "PRBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }];

// Owns the Clinical Indication / Disease issuance flow — a one-off legacy
// dispatch (not a tracked/editable batch entity like StorageTransfer).
// Same bag-picker shape as useStorageTransfer, but its own form state so
// the two flows don't share a modal or leak fields into each other.
export function useClinicalIndication({ user, fetchAvailableUnits, onIssued }) {
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientDetails, setPatientDetails] = useState(DEFAULT_PATIENT);
  const [clinicalBags, setClinicalBags] = useState(defaultBags);

  const resetForm = () => {
    setPatientDetails(DEFAULT_PATIENT);
    setClinicalBags(defaultBags());
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
    fetchAvailableUnits();
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!patientDetails.firstName.trim() || !patientDetails.lastName.trim()) {
      return toast.warning("Please enter the patient's first name and last name");
    }
    if (!patientDetails.age || isNaN(Number(patientDetails.age))) return toast.warning("Please enter a valid age");
    if (!patientDetails.disease) return toast.warning("Please select a disease");
    if (patientDetails.disease === "OTHER" && !patientDetails.otherDiseaseName.trim()) {
      return toast.warning("Please specify the disease name");
    }

    const bagsPayload = [];
    clinicalBags.forEach((comp) => comp.groups.forEach((group) => {
      if (group.selectedBags?.length) bagsPayload.push({ bloodGroup: group.bloodGroup, bagIds: group.selectedBags });
    }));
    if (bagsPayload.length === 0) return toast.warning("Please select at least one blood bag to issue");

    try {
      setSubmitting(true);
      await apiClient.post(`/api/inventory/send-to-storage`, {
        bags: bagsPayload,
        userId: user?._id || user?.id,
        dispatchType: "CLINICAL_INDICATION",
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
      closeForm();
      fetchAvailableUnits();
      onIssued?.();
    } catch (e) {
      toast.error(e?.message || "Failed to issue blood units");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formOpen, submitting,
    patientDetails, setPatientDetails,
    clinicalBags, setClinicalBags,
    openCreate, closeForm, handleSubmit,
  };
}

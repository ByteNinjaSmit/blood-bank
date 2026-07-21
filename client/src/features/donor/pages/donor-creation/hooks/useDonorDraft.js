import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Loads a saved donor-creation draft (by draftId) on mount and provides
// handleSaveDraft to persist the current wizard state to localStorage.
export function useDonorDraft({
  form,
  currentStep,
  setCurrentStep,
  campId,
  draftId,
}) {
  const navigate = useNavigate();
  const {
    formData, setFormData,
    repeatedDonation, setRepeatedDonation,
    selectedDonor, setSelectedDonor,
  } = form;

  useEffect(() => {
    if (draftId) {
      const rawDrafts = localStorage.getItem("blood_bank_donor_creation_drafts");
      try {
        const drafts = rawDrafts ? JSON.parse(rawDrafts) : [];
        const draft = drafts.find((d) => d.id === draftId);
        if (draft) {
          setFormData(draft.formData);
          setCurrentStep(draft.currentStep);
          setRepeatedDonation(draft.repeatedDonation);
          setSelectedDonor(draft.selectedDonor);
          toast.success("Draft donation form loaded successfully.");
        }
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const handleSaveDraft = () => {
    const id = draftId || `draft-${Date.now()}`;
    let donorName = "Anonymous / New Donor";
    if (repeatedDonation === "Yes" && selectedDonor) {
      donorName = `${selectedDonor.name?.firstName || ''} ${selectedDonor.name?.lastName || ''}`.trim() || selectedDonor.fullName || selectedDonor.donorId;
    } else if (formData.firstName || formData.lastName) {
      donorName = `${formData.firstName} ${formData.lastName}`.trim();
    }

    const newDraft = {
      id,
      campId: campId || null,
      donorName,
      lastSaved: new Date().toISOString(),
      currentStep,
      repeatedDonation,
      selectedDonor,
      formData,
    };

    const rawDrafts = localStorage.getItem("blood_bank_donor_creation_drafts");
    let drafts = [];
    try {
      drafts = rawDrafts ? JSON.parse(rawDrafts) : [];
      if (!Array.isArray(drafts)) drafts = [];
    } catch (e) {
      drafts = [];
    }

    const index = drafts.findIndex((d) => d.id === id);
    if (index > -1) {
      drafts[index] = newDraft;
    } else {
      drafts.push(newDraft);
    }

    localStorage.setItem("blood_bank_donor_creation_drafts", JSON.stringify(drafts));
    toast.success("Draft saved successfully!");

    if (campId) {
      navigate(`/camp-details?id=${campId}`);
    } else {
      if (!draftId) {
        navigate(`/master-register/donor-creation?draftId=${id}`, { replace: true });
      }
    }
  };

  return { handleSaveDraft };
}

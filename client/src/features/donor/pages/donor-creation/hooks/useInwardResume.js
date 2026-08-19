import { useState } from "react";
import { toast } from "sonner";
import { donationApi } from "@/features/donation/api";
import { donorApi } from "@/features/donor/api";
import { INITIAL_FORM_DATA } from "@/features/donor/donor-constants";
import { stepKeyForCompletionStatus } from "../donor-creation-steps";

const STEP_LABEL = { profile: "Donor Profile", medical: "Medical History", exam: "Exam & Fitness" };

// provisionalBloodGroup.rhFactor is "POSITIVE"/"NEGATIVE" (server-side
// RH_FACTOR enum); formData.rh is "Positive"/"Negative" (the form's/donor
// registration's legacy display enum — see BagInfoStep/DonorProfileStep).
function rhFactorToFormRh(rhFactor) {
  if (rhFactor === "POSITIVE") return "Positive";
  if (rhFactor === "NEGATIVE") return "Negative";
  return undefined;
}

// Loads an existing incomplete inward donation's data into the wizard and
// jumps to whichever step follows its completionStatus. Two entry points:
//  - resumeFromRow(row): row came from GET /incomplete (search box or list
//    page), so completionStatus is already known — no extra fetch needed.
//  - resumeFromId(id): only the Mongo _id is known (a ?resumeId= deep
//    link) — GET /:id.
// Both start with a hard resetForm() — see its comment below — before
// hydrating. GET /:id and GET /incomplete both include
// provisionalBloodGroup, which is hydrated below into formData.bloodGroup/
// rh — required because a new donor gets linked (from Review & Save) using
// this value, and the Bag Info step that originally captured it always
// resets the form after submit (see DonorCreation.jsx handleInwardNext).
// Everything the operator was mid-way through typing for Donor
// Profile/Medical History/Exam & Fitness (name, medical answers, vitals) is
// never persisted server-side until Review & Save's final submit, so none
// of it is recoverable here — the operator re-enters it from a blank slate
// every time they resume, by design (not a bug).
export function useInwardResume({ form, setInwardDonation, setCurrentStep, stepOrder }) {
  const [isResuming, setIsResuming] = useState(false);

  const goToStepForStatus = (completionStatus) => {
    const stepKey = stepKeyForCompletionStatus(completionStatus);
    const idx = stepOrder.indexOf(stepKey);
    setCurrentStep(idx === -1 ? 1 : idx + 1);
    return stepKey;
  };

  const hydrateBagFields = (row) => {
    form.setFormData((prev) => ({
      ...prev,
      bagNo: row.bagNo || prev.bagNo,
      lotNo: row.lotNo || prev.lotNo,
      segmentNo: row.segmentNo || prev.segmentNo,
      collectionDate: row.collectedAt ? row.collectedAt.split("T")[0] : prev.collectionDate,
      // The Bag Info step is a standalone action that resets the form after
      // submit (see DonorCreation.jsx handleInwardNext), so this provisional
      // blood group — captured there — only ever makes it back into
      // formData.bloodGroup/rh via a resume. Without it, a new donor
      // created later at the Exam & Fitness step gets linked with an empty
      // bloodGroup, which donor registration rejects.
      bloodGroup: row.provisionalBloodGroup?.aboGroup || prev.bloodGroup,
      rh: rhFactorToFormRh(row.provisionalBloodGroup?.rhFactor) || prev.rh,
    }));
  };

  const hydrateFromDetail = (detail) => {
    form.setFormData((prev) => ({
      ...prev,
      bagNo: detail.bagNo || prev.bagNo,
      lotNo: detail.lotNo || prev.lotNo,
      segmentNo: detail.segmentNo || prev.segmentNo,
      typeOfBag: detail.typeOfBag || prev.typeOfBag,
      donationType: detail.donationType || prev.donationType,
      collectionDate: detail.collectedAt ? detail.collectedAt.split("T")[0] : prev.collectionDate,
      collectionTime: detail.collectedAt ? detail.collectedAt.slice(11, 16) : prev.collectionTime,
      // See hydrateBagFields above — same "form reset after Bag Info"
      // reason this has to be re-populated on resume.
      bloodGroup: detail.provisionalBloodGroup?.aboGroup || prev.bloodGroup,
      rh: rhFactorToFormRh(detail.provisionalBloodGroup?.rhFactor) || prev.rh,
      hb: detail.medicalExam?.hbGdl ?? prev.hb,
      tempC: detail.medicalExam?.temperatureCelsius ?? prev.tempC,
      pulse: detail.medicalExam?.pulseBpm ?? prev.pulse,
      weightKg: detail.medicalExam?.weightKg ?? prev.weightKg,
      o2Level: detail.medicalExam?.oxygenSaturationPercent ?? prev.o2Level,
      bp: detail.medicalExam?.bloodPressure
        ? `${detail.medicalExam.bloodPressure.systolic}/${detail.medicalExam.bloodPressure.diastolic}`
        : prev.bp,
    }));
  };

  const hydrateDonorIfLinked = async (donorId) => {
    if (!donorId) return;
    try {
      const donor = await donorApi.detail(donorId);
      form.setSelectedDonor(donor?.donor || donor);
      form.setRepeatedDonation("Yes");
      form.loadDonorIntoForm(donor?.donor || donor);
    } catch {
      // Non-fatal — operator can re-search the donor on the Profile step.
    }
  };

  // Donor Profile/Medical History/Exam & Fitness are never persisted
  // server-side until Review & Save's final submit, so any of that data
  // typed for a donation the operator walked away from is gone the moment
  // they navigate off — there is nothing to actually resume. Worse, without
  // resetting first, whatever's still sitting in formData/selectedDonor
  // from that abandoned attempt (or from a previously resumed donation, in
  // the same SPA session) would silently leak onto the next donation
  // resumed here. So every resume starts from a hard, full reset — bag
  // fields (this donation's real data) get hydrated back on top right
  // after, everything else starts blank.
  const resetForm = () => {
    form.setFormData({ ...INITIAL_FORM_DATA });
    form.setSelectedDonor(null);
    form.setRepeatedDonation("No");
  };

  const resumeFromRow = async (row) => {
    setInwardDonation({
      id: row.id,
      donationId: row.donationId,
      completionStatus: row.completionStatus,
      donorLinked: Boolean(row.donorName),
    });
    resetForm();
    hydrateBagFields(row);
    const stepKey = goToStepForStatus(row.completionStatus);
    toast.success(`Resumed donation ${row.donationId} at ${STEP_LABEL[stepKey] || stepKey}.`);
    return stepKey;
  };

  const resumeFromId = async (id) => {
    setIsResuming(true);
    try {
      const detail = await donationApi.detail(id);
      resetForm();
      hydrateFromDetail(detail);
      await hydrateDonorIfLinked(detail.donor);

      const completionStatus = detail.completionStatus || (detail.donor ? "DONOR_PENDING" : "BAG_ONLY");

      setInwardDonation({
        id,
        donationId: detail.donationId,
        completionStatus,
        donorLinked: Boolean(detail.donor),
      });
      const stepKey = goToStepForStatus(completionStatus);
      toast.success(`Resumed donation ${detail.donationId} at ${STEP_LABEL[stepKey] || stepKey}.`);
      return stepKey;
    } catch (err) {
      toast.error(err?.message || "Failed to load donation to resume");
      return null;
    } finally {
      setIsResuming(false);
    }
  };

  return { resumeFromRow, resumeFromId, isResuming };
}

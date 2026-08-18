import { useState } from "react";
import { toast } from "sonner";
import { donationApi } from "@/features/donation/api";
import { donorApi } from "@/features/donor/api";
import { stepKeyForCompletionStatus } from "../donor-creation-steps";

const STEP_LABEL = { profile: "Donor Profile", medical: "Medical History", exam: "Exam & Fitness" };

// Loads an existing incomplete inward donation's data into the wizard and
// jumps to whichever step follows its completionStatus. Two entry points:
//  - resumeFromRow(row): row came from GET /incomplete (search box or list
//    page), so completionStatus is already known — no extra fetch needed.
//  - resumeFromId(id): only the Mongo _id is known (a ?resumeId= deep
//    link) — GET /:id doesn't expose completionStatus/registrationMode, so
//    this looks the row up via GET /incomplete afterwards to find it.
// GET /:id and GET /incomplete both include provisionalBloodGroup, which
// is hydrated below. Medical-history questionnaire answers (the 36 Yes/No
// flags) aren't re-exposed by either read endpoint though, so those are
// left for the operator to re-confirm on the Medical History step when
// resuming a donation that's already past that step.
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

  const resumeFromRow = async (row) => {
    setInwardDonation({ id: row.id, donationId: row.donationId, completionStatus: row.completionStatus });
    hydrateBagFields(row);
    const stepKey = goToStepForStatus(row.completionStatus);
    toast.success(`Resumed donation ${row.donationId} at ${STEP_LABEL[stepKey] || stepKey}.`);
    return stepKey;
  };

  const resumeFromId = async (id) => {
    setIsResuming(true);
    try {
      const detail = await donationApi.detail(id);
      hydrateFromDetail(detail);
      await hydrateDonorIfLinked(detail.donor);

      const incomplete = await donationApi.listIncomplete({ q: detail.donationId, pageSize: 10 });
      const row = (incomplete?.items || []).find((r) => r.id === id);
      const completionStatus = row?.completionStatus || (detail.donor ? "DONOR_PENDING" : "BAG_ONLY");

      setInwardDonation({ id, donationId: detail.donationId, completionStatus });
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

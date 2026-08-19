import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateInwardDonation,
  useLinkDonor,
  useSaveMedicalHistory,
  useFinalizeInward,
} from "@/features/donation/queries";
import { QUESTIONS } from "@/features/donor/donor-constants";

// Owns all persistence for inward-mode (bag-first) donation creation: one
// API call per wizard step instead of the standard flow's single final
// POST /donation (see useDonorSubmit.js for that). Mirrors its payload
// shaping so the two stay easy to compare.
export function useInwardSubmit({ form, campId }) {
  const navigate = useNavigate();
  const { formData, repeatedDonation, selectedDonor } = form;

  // { id, donationId, completionStatus } for the inward donation created by
  // the Bag Info step; null until that step has been submitted (or a resume
  // flow has hydrated it — see useInwardResume.js).
  const [inwardDonation, setInwardDonation] = useState(null);

  const createInwardMut = useCreateInwardDonation();
  const linkDonorMut = useLinkDonor();
  const medicalHistoryMut = useSaveMedicalHistory();
  const finalizeMut = useFinalizeInward();

  const isSubmitting =
    createInwardMut.isPending ||
    linkDonorMut.isPending ||
    medicalHistoryMut.isPending ||
    finalizeMut.isPending;

  const submitBagInfo = async () => {
    try {
      const payload = {
        bagNo: formData.bagNo,
        lotNo: formData.lotNo || undefined,
        segmentNo: formData.segmentNo || undefined,
        collectionDate: formData.collectionDate,
        collectionTime: formData.collectionTime || undefined,
        provisionalBloodGroup: {
          aboGroup: formData.bloodGroup,
          rhFactor: formData.rh === "Positive" ? "POSITIVE" : "NEGATIVE",
        },
        donationType: formData.donationType || undefined,
        typeOfBag: formData.typeOfBag || undefined,
        source: campId ? "camp" : "inhouse",
        campId: campId || undefined,
      };
      const created = await createInwardMut.mutateAsync(payload);
      setInwardDonation({ id: created.id, donationId: created.donationId, completionStatus: "BAG_ONLY" });
      toast.success(`Donation ${created.donationId} created — you can continue now or finish later.`);
      return created;
    } catch (err) {
      toast.error(err?.message || "Failed to create inward donation");
      return null;
    }
  };

  const submitDonorLink = async () => {
    if (!inwardDonation) {
      toast.error("No active inward donation — start from Bag Info first.");
      return null;
    }
    try {
      const body =
        repeatedDonation === "Yes" && selectedDonor
          ? { existingDonorId: selectedDonor._id }
          : {
              name: {
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
              },
              dob: formData.dob,
              sex: formData.sex,
              phone: formData.phone,
              email: formData.email || undefined,
              weightKg: Number(formData.weightKg),
              bloodGroup: formData.bloodGroup,
              rh: formData.rh,
              address: {
                line1: formData.addressLine1 || "",
                line2: formData.addressLine2 || "",
                city: formData.city,
                district: formData.district,
                state: formData.state,
                pincode: formData.pincode || "",
              },
              occupation: formData.occupation || undefined,
              lastDonationDate: formData.lastDonationDate || undefined,
              lastDonationPlace: formData.lastDonationDate ? formData.lastDonationPlace : undefined,
              emergencyDonationWillingness: formData.emergencyDonationWillingness || undefined,
              campId: campId || undefined,
            };
      const result = await linkDonorMut.mutateAsync({ id: inwardDonation.id, data: body });
      setInwardDonation((prev) => ({ ...prev, completionStatus: "DONOR_PENDING" }));
      toast.success("Donor linked to this donation.");
      return result;
    } catch (err) {
      toast.error(err?.message || "Failed to link donor to donation");
      return null;
    }
  };

  const submitMedicalHistory = async () => {
    if (!inwardDonation) return null;
    try {
      const questionnaireFlags = {};
      QUESTIONS.forEach((q) => {
        questionnaireFlags[q.key] = formData[q.key] === "Yes";
      });
      const result = await medicalHistoryMut.mutateAsync({
        id: inwardDonation.id,
        data: { questionnaireFlags },
      });
      setInwardDonation((prev) => ({ ...prev, completionStatus: "MEDICAL_PENDING" }));
      toast.success("Medical history saved.");
      return result;
    } catch (err) {
      toast.error(err?.message || "Failed to save medical history");
      return null;
    }
  };

  const buildMedicalExam = () => ({
    weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
    hbGdl: formData.hb ? Number(formData.hb) : undefined,
    pulseBpm: formData.pulse ? Number(formData.pulse) : undefined,
    temperatureCelsius: formData.tempC ? Number(formData.tempC) : undefined,
    bloodPressure:
      formData.bp?.trim() && formData.bp.includes("/")
        ? {
            systolic: Number(formData.bp.split("/")[0]),
            diastolic: Number(formData.bp.split("/")[1]),
          }
        : undefined,
    hasPedalOedema: formData.pedalOedema ? formData.pedalOedema === "Yes" : undefined,
    oxygenSaturationPercent: formData.o2Level ? Number(formData.o2Level) : undefined,
    hasLymphadenopathy: formData.lymphadenopathy ? formData.lymphadenopathy === "Yes" : undefined,
    hasCyanosis: formData.cyanosis ? formData.cyanosis === "Yes" : undefined,
    systemicExamNotes: formData.systematicExam || undefined,
    skinClearAtPhlebotomy: formData.skinDiseaseFreeAtPhlebotomy
      ? formData.skinDiseaseFreeAtPhlebotomy === "Yes"
      : undefined,
    armsFreeOfPunctureScars: formData.armsFreeFromPunctureScars
      ? formData.armsFreeFromPunctureScars === "Yes"
      : undefined,
    volumeMl: formData.volumeGmMl ? Number(formData.volumeGmMl) : undefined,
  });

  const submitFinalize = async () => {
    if (!inwardDonation) return null;
    try {
      const donorFitness = formData.donorIsFit
        ? { isFit: true }
        : {
            isFit: false,
            rejectionReason: formData.deferralReasonObj?.reason || "Unfit / Deferred",
            rejectedAtStep: "VITALS",
          };
      const result = await finalizeMut.mutateAsync({
        id: inwardDonation.id,
        data: { donorFitness, medicalExam: buildMedicalExam() },
      });
      setInwardDonation((prev) => ({ ...prev, completionStatus: "COMPLETE" }));
      toast.success(
        formData.donorIsFit
          ? "Inward donation completed and sent for TTI testing."
          : "Donor deferred; inward donation record closed.",
      );
      // Land back on the Incomplete Inward Donations list — on the Camp
      // Inward tab with this camp's section expanded when applicable — so
      // the operator can pick up the next remaining bag for the same camp.
      navigate(
        campId
          ? `/master-register/inward-donations?tab=camp&campId=${campId}`
          : "/master-register/inward-donations",
      );
      return result;
    } catch (err) {
      toast.error(err?.message || "Failed to finalize inward donation");
      return null;
    }
  };

  return {
    inwardDonation,
    setInwardDonation,
    isSubmitting,
    submitBagInfo,
    submitDonorLink,
    submitMedicalHistory,
    submitFinalize,
  };
}

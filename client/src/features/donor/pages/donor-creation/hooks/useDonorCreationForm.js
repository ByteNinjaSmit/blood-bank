import { useState } from "react";
import { useBagStockList } from "@/features/bag-procurement/queries";
import { DEFERRAL_REASONS, QUESTIONS, INITIAL_FORM_DATA, getBagNoPrefix } from "@/features/donor/donor-constants";
import {
  getDaysDifference,
  calculateAgeFromDob,
  validateDate,
  validateMonthYear,
  getFitnessExamReason,
  getUnhealthyQuestionReason,
} from "../donor-creation-utils";

// Owns the donor-creation form state, all field handlers, step-completion
// validators, and derived fitness flags. No data access (see useDonorSubmit).
export function useDonorCreationForm() {
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });
  const [repeatedDonation, setRepeatedDonation] = useState("No");
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [reasonSearch, setReasonSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deferralModalOpen, setDeferralModalOpen] = useState(false);
  const [deferralModalData, setDeferralModalData] = useState(null);

  const { data: stockData } = useBagStockList({});
  const stocks = stockData?.items ?? stockData?.bagStocks ?? (Array.isArray(stockData) ? stockData : []);

  const selectedBagType = formData.typeOfBag === 'DB' ? 'DOUBLE' : formData.typeOfBag === 'TB' ? 'TRIPLE' : null;
  const activeBatches = stocks.filter((s) => {
    const closing = (s.openingStock ?? 0) + (s.receivedQty ?? 0) - (s.issuedQty ?? 0) - (s.damagedQty ?? 0) - (s.discardedQty ?? 0);
    return s.bagType === selectedBagType &&
           s.status === 'AVAILABLE' &&
           closing > (s.unopenedBoxes ?? 0) * 45;
  });

  const loadDonorIntoForm = (donor) => {
    const dobDate = donor.dob ? new Date(donor.dob) : null;
    const dobDisplay = dobDate
      ? `${String(dobDate.getDate()).padStart(2, '0')}/${String(dobDate.getMonth() + 1).padStart(2, '0')}/${dobDate.getFullYear()}`
      : "";
    const dobISO = dobDate ? dobDate.toISOString().split("T")[0] : "";

    const lddDate = donor.lastDonationDate ? new Date(donor.lastDonationDate) : null;
    // Last Donation Date is captured as Month/Year only.
    const lddDisplay = lddDate
      ? `${String(lddDate.getMonth() + 1).padStart(2, '0')}/${lddDate.getFullYear()}`
      : "";
    const lddISO = lddDate ? lddDate.toISOString().split("T")[0] : "";

    setFormData((prev) => ({
      ...prev,
      firstName: donor.name?.firstName || donor.firstName || "",
      middleName: donor.name?.middleName || donor.middleName || "",
      lastName: donor.name?.lastName || donor.lastName || "",
      dob: dobISO,
      dobDisplay: dobDisplay,
      age: calculateAgeFromDob(dobISO),
      sex: donor.sex || "",
      phone: donor.phone || "",
      email: donor.email || "",
      weightKg: donor.weightKg ? String(donor.weightKg) : "",
      bloodGroup: donor.bloodGroup || "",
      rh: donor.rh === "POSITIVE" ? "Positive" : donor.rh === "NEGATIVE" ? "Negative" : (donor.rh || ""),
      addressLine1: donor.address?.line1 || "",
      addressLine2: donor.address?.line2 || "",
      city: donor.address?.city || "",
      district: donor.address?.district || "",
      state: donor.address?.state || "",
      pincode: donor.address?.pincode || "",
      occupation: donor.occupation || "",
      lastDonationDate: lddISO,
      lastDonationDateDisplay: lddDisplay,
      lastDonationPlace: donor.lastDonationPlace || "SANJIVANI_BLOOD_BANK",
      emergencyDonationWillingness: donor.emergencyDonationWillingness || "",
    }));
  };

  const handleFormFieldChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // 0. Bag type changes should recompute the bag-number prefix, but only
      // rewrite it if the operator hasn't already typed a fully custom value.
      if (field === "typeOfBag") {
        const oldPrefix = getBagNoPrefix(prev.typeOfBag);
        const newPrefix = getBagNoPrefix(value);
        if (!prev.bagNo || prev.bagNo.startsWith(oldPrefix)) {
          updated.bagNo = newPrefix + prev.bagNo.slice(oldPrefix.length);
        }
      }

      // 1. Determine if any medical history question is unhealthy
      const questionReason = getUnhealthyQuestionReason(updated);

      // 1.5 Determine if the exam & fitness questions (skin disease /
      // puncture marks) rule the donor unfit.
      const fitnessExamReason = getFitnessExamReason(updated);

      // 2. Determine if Hb is invalid (< 12.5)
      let isHbInvalid = false;
      let hbReason = null;
      if (updated.hb !== "") {
        const hbVal = parseFloat(updated.hb);
        if (!isNaN(hbVal) && hbVal < 12.5) {
          isHbInvalid = true;
          hbReason = DEFERRAL_REASONS.find((r) => r.reason.toLowerCase().includes("haemoglobin"))
            || { reason: "Low Haemoglobin (< 12.5 gm/dL)", days: 30, type: "TEMPORARY" };
        }
      }

      // 2.5 Determine if Last Donation Date is within waiting period
      let isIntervalInvalid = false;
      let intervalReason = null;
      if (updated.lastDonationDate && updated.sex) {
        const collectionDateStr = updated.collectionDate || new Date().toISOString().split("T")[0];
        const diffDays = getDaysDifference(updated.lastDonationDate, collectionDateStr);
        if (diffDays !== null) {
          const isFemale = (updated.sex || "").toUpperCase().startsWith('F');
          const requiredInterval = isFemale ? 120 : 90;
          if (diffDays < requiredInterval) {
            isIntervalInvalid = true;
            intervalReason = {
              reason: `Unfit due to Last Donation Date: only ${diffDays} day(s) passed since last donation (need ${requiredInterval === 120 ? '120 days for female' : '90 days for male/other'})`,
              days: requiredInterval - diffDays,
              type: "TEMPORARY"
            };
          }
        }
      }

      // 3. Set fit status and reason based on these checks
      if (questionReason) {
        updated.donorIsFit = false;
        updated.deferralReasonObj = questionReason;
      } else if (fitnessExamReason) {
        updated.donorIsFit = false;
        updated.deferralReasonObj = fitnessExamReason;
      } else if (isHbInvalid) {
        updated.donorIsFit = false;
        updated.deferralReasonObj = hbReason;
      } else if (isIntervalInvalid) {
        updated.donorIsFit = false;
        updated.deferralReasonObj = intervalReason;
      } else {
        // If none of these checks are active, see if we need to auto-recover from a previous forced unfit status
        const wasForced = prev.deferralReasonObj && (
          prev.deferralReasonObj.reason.startsWith("Unfit due to Medical Question") ||
          prev.deferralReasonObj.reason.startsWith("Unfit due to Fitness Exam") ||
          prev.deferralReasonObj.reason.toLowerCase().includes("haemoglobin") ||
          prev.deferralReasonObj.reason.startsWith("Unfit due to Last Donation Date")
        );
        if (wasForced) {
          updated.donorIsFit = true;
          updated.deferralReasonObj = null;
        }
      }

      return updated;
    });
  };

  const handleDobDisplayChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 8);
    let display = val;
    if (val.length > 4) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
    } else if (val.length > 2) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }

    handleFormFieldChange("dobDisplay", display);

    if (val.length === 8) {
      const d = val.slice(0, 2);
      const m = val.slice(2, 4);
      const y = val.slice(4, 8);
      const isoDob = `${y}-${m}-${d}`;
      const calculatedAge = calculateAgeFromDob(isoDob);
      setFormData((prev) => ({
        ...prev,
        dobDisplay: display,
        dob: isoDob,
        age: calculatedAge,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        dobDisplay: display,
        dob: "",
        age: "",
      }));
    }
  };

  const handleLastDonationDateDisplayChange = (e) => {
    // Only month + year are captured (MM/YYYY). Internally we normalise to the
    // 1st of that month so the waiting-period math still works on a real date.
    let val = e.target.value.replace(/\D/g, "").slice(0, 6);
    let display = val;
    if (val.length > 2) {
      display = `${val.slice(0, 2)}/${val.slice(2, 6)}`;
    }

    handleFormFieldChange("lastDonationDateDisplay", display);

    if (val.length === 6) {
      const m = val.slice(0, 2);
      const y = val.slice(2, 6);
      handleFormFieldChange("lastDonationDate", `${y}-${m}-01`);
    } else {
      handleFormFieldChange("lastDonationDate", "");
    }
  };

  const isStep1Complete = (skipBloodGroupCheck = false, requireWeight = false) => {
    if (repeatedDonation === "Yes" && !selectedDonor) return false;

    // In inward mode, blood group is captured on the (earlier) Bag Info
    // step; skipBloodGroupCheck is set there so a resumed donation that
    // hasn't re-populated it client-side doesn't get wrongly blocked here.
    const isBaseComplete =
      formData.firstName.trim() &&
      formData.middleName.trim() &&
      formData.lastName.trim() &&
      validateDate(formData.dobDisplay) &&
      formData.sex &&
      formData.phone.trim().length === 10 &&
      formData.city.trim() &&
      formData.district.trim() &&
      formData.state &&
      (skipBloodGroupCheck || (formData.bloodGroup && formData.rh));

    if (!isBaseComplete) return false;

    // Inward mode, new donor only: the donor record is created right after
    // this step (before Exam & Fitness, where weight is normally captured),
    // so weight has to be collected here instead. An existing donor already
    // has a weight on file, so the repeat-donor path skips this.
    if (requireWeight && repeatedDonation !== "Yes" && !(parseFloat(formData.weightKg) > 0)) {
      return false;
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) return false;
    if (formData.lastDonationDateDisplay && !validateMonthYear(formData.lastDonationDateDisplay)) return false;

    // Check last donation interval!
    if (formData.lastDonationDate) {
      const collectionDateStr = formData.collectionDate || new Date().toISOString().split("T")[0];
      const diffDays = getDaysDifference(formData.lastDonationDate, collectionDateStr);
      if (diffDays !== null) {
        const isFemale = (formData.sex || "").toUpperCase().startsWith('F');
        const requiredInterval = isFemale ? 120 : 90;
        if (diffDays < requiredInterval) return false;
      }
    }

    return true;
  };

  const isStep2Complete = () => true;

  const isStep3Complete = () => {
    return (
      parseFloat(formData.weightKg) > 0 &&
      formData.hb.toString().trim() !== "" &&
      formData.tempC.toString().trim() !== "" &&
      formData.pulse.toString().trim() !== "" &&
      formData.bp.trim() !== "" &&
      formData.pedalOedema !== "" &&
      formData.o2Level.toString().trim() !== "" &&
      formData.lymphadenopathy !== "" &&
      formData.cyanosis !== ""
    );
  };

  const isStep4Complete = (requireProvisionalBloodGroup = false) => {
    const base =
      formData.bagNo.trim() &&
      formData.segmentNo.trim() &&
      formData.lotNo.trim() &&
      formData.typeOfBag &&
      formData.donationType &&
      formData.collectionDate &&
      formData.collectionTime;
    if (!base) return false;
    // Inward mode: Bag Info runs before Donor Profile, so the provisional
    // blood group fields live here instead and are required for the bag
    // step to be considered complete.
    if (requireProvisionalBloodGroup) return Boolean(formData.bloodGroup && formData.rh);
    return true;
  };

  // Keyed by step key ("profile" | "medical" | "exam" | "bag" | "review")
  // rather than a step number so the same completion rules apply whichever
  // order the wizard renders them in (see donor-creation-steps.js).
  // `isInward` is set by DonorCreation.jsx only in inward mode — it moves
  // the blood-group requirement from the Donor Profile step to the (now
  // earlier) Bag Info step.
  const isStepComplete = (stepKey, isInward = false) => {
    if (stepKey === "profile") return isStep1Complete(isInward, isInward);
    if (stepKey === "medical") return isStep2Complete();
    if (stepKey === "exam") return isStep3Complete();
    if (stepKey === "bag") return isStep4Complete(isInward);
    return true;
  };

  const filteredReasons = DEFERRAL_REASONS.filter((r) =>
    r.reason.toLowerCase().includes(reasonSearch.toLowerCase())
  );

  const answeredCount = Array.from({ length: 36 }, (_, i) => `q${i + 1}`).filter(
    (k) => formData[k] === "Yes" || formData[k] === "No"
  ).length;

  const isHbTooLow = formData.hb && parseFloat(formData.hb) < 12.5;
  const isQuestionUnfit = formData.deferralReasonObj && (
    formData.deferralReasonObj.reason.startsWith("Unfit due to Medical Question") ||
    formData.deferralReasonObj.reason.startsWith("Unfit due to Fitness Exam")
  );
  const isFitnessForcedUnfit = isHbTooLow || isQuestionUnfit;

  return {
    formData, setFormData,
    repeatedDonation, setRepeatedDonation,
    selectedDonor, setSelectedDonor,
    reasonSearch, setReasonSearch,
    dropdownOpen, setDropdownOpen,
    deferralModalOpen, setDeferralModalOpen,
    deferralModalData, setDeferralModalData,
    activeBatches,
    loadDonorIntoForm,
    handleFormFieldChange,
    handleDobDisplayChange,
    handleLastDonationDateDisplayChange,
    isStep1Complete,
    isStepComplete,
    filteredReasons,
    answeredCount,
    isHbTooLow,
    isQuestionUnfit,
    isFitnessForcedUnfit,
  };
}

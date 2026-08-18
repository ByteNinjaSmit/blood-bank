// Step ordering for the donor-creation wizard, keyed rather than numbered so
// the same step components can be reused in a different order per mode
// (see DonorCreation.jsx). Standard mode's order/behavior is unchanged from
// before this file existed — it is just expressed as keys now instead of
// magic step numbers 1-5.
import DonorProfileStep from "./steps/DonorProfileStep";
import MedicalHistoryStep from "./steps/MedicalHistoryStep";
import ExamFitnessStep from "./steps/ExamFitnessStep";
import BagInfoStep from "./steps/BagInfoStep";
import ReviewStep from "./steps/ReviewStep";

export const STEP_DEFS = {
  bag: { key: "bag", label: "Bag Info", Component: BagInfoStep },
  profile: { key: "profile", label: "Donor Profile", Component: DonorProfileStep },
  medical: { key: "medical", label: "Medical History", Component: MedicalHistoryStep },
  exam: { key: "exam", label: "Exam & Fitness", Component: ExamFitnessStep },
  review: { key: "review", label: "Review & Save", Component: ReviewStep },
};

// Standard mode: Donor Profile -> Medical History -> Exam & Fitness -> Bag
// Info -> Review & Save. Identical to the pre-existing 5-step flow.
export const STANDARD_STEP_ORDER = ["profile", "medical", "exam", "bag", "review"];

// Inward mode: Bag Info comes first (bag-only donation created immediately),
// then Donor Profile, Medical History, Exam & Fitness — no separate Review
// step; Exam & Fitness's submit finalizes the donation.
export const INWARD_STEP_ORDER = ["bag", "profile", "medical", "exam"];

export function getStepOrder(mode) {
  return mode === "inward" ? INWARD_STEP_ORDER : STANDARD_STEP_ORDER;
}

// Maps an in-progress inward donation's completionStatus to the step key an
// operator resuming it should land on.
export function stepKeyForCompletionStatus(status) {
  if (status === "BAG_ONLY") return "profile";
  if (status === "DONOR_PENDING") return "medical";
  if (status === "MEDICAL_PENDING") return "exam";
  return "exam";
}

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
// then Donor Profile, Medical History, Exam & Fitness, and finally the same
// Review & Save summary as standard mode — its submit is what actually
// links the donor and finalizes the donation (see DonorCreation.jsx
// handleInwardNext).
export const INWARD_STEP_ORDER = ["bag", "profile", "medical", "exam", "review"];

export function getStepOrder(mode) {
  return mode === "inward" ? INWARD_STEP_ORDER : STANDARD_STEP_ORDER;
}

// Maps an in-progress inward donation's completionStatus to the step key an
// operator resuming it should land on. Weight/vitals (Exam & Fitness) and
// the donor link + finalize (Review & Save) aren't persisted to the
// donation until Review & Save's submit succeeds, so both "medical history
// saved, donor not yet linked" (DONOR_PENDING) and "donor linked, not yet
// finalized" (MEDICAL_PENDING) resume at "exam" so those values get
// re-entered/confirmed before moving on — Bag Info and Donor Profile are
// the only steps that precede it.
export function stepKeyForCompletionStatus(status) {
  if (status === "BAG_ONLY") return "profile";
  return "exam";
}

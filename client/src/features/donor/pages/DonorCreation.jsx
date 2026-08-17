import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, ArrowLeft, Save, Loader2, UserPlus, CheckCircle, AlertTriangle } from "lucide-react";
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav";
import { validateDate, validateMonthYear, getUnhealthyQuestionReason } from "./donor-creation/donor-creation-utils";
import { useDonorCreationForm } from "./donor-creation/hooks/useDonorCreationForm";
import { useDonorSubmit } from "./donor-creation/hooks/useDonorSubmit";
import { useDonorDraft } from "./donor-creation/hooks/useDonorDraft";
import DonorProfileStep from "./donor-creation/steps/DonorProfileStep";
import MedicalHistoryStep from "./donor-creation/steps/MedicalHistoryStep";
import ExamFitnessStep from "./donor-creation/steps/ExamFitnessStep";
import BagInfoStep from "./donor-creation/steps/BagInfoStep";
import QaChecklistStep from "./donor-creation/steps/QaChecklistStep";
import ReviewStep from "./donor-creation/steps/ReviewStep";

export default function DonorCreation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campId = searchParams.get("campId");
  const draftId = searchParams.get("draftId");

  const [currentStep, setCurrentStep] = useState(1);

  const form = useDonorCreationForm();
  const submit = useDonorSubmit({ form, campId, draftId });
  const { handleSaveDraft } = useDonorDraft({ form, currentStep, setCurrentStep, campId, draftId });

  const { formData } = form;
  const { isSubmitting, handleSubmit } = submit;

  // Field-level validation run before Enter is allowed to advance focus —
  // shared navigation mechanics (including native-select showPicker()
  // handling) live in the reusable useFormEnterNav hook.
  const validateEnterNavField = (target) => {
    const isCompulsory = target.hasAttribute("required");
    const val = target.value ? target.value.trim() : "";

    let isValid = true;
    let errorMsg = "";
    const labelText = target.previousElementSibling?.textContent || "";
    const fieldLabel = labelText.replace("*", "").trim() || "This field";

    if (isCompulsory && !val) {
      isValid = false;
      errorMsg = `${fieldLabel} is required`;
    } else if (val) {
      if (target.type === "tel" && val.length !== 10) {
        isValid = false;
        errorMsg = "Phone number must be exactly 10 digits";
      } else if (target.placeholder === "DD/MM/YYYY" && !validateDate(val)) {
        isValid = false;
        errorMsg = `Enter a valid date for ${fieldLabel} (DD/MM/YYYY)`;
      } else if (target.placeholder === "MM/YYYY" && !validateMonthYear(val)) {
        isValid = false;
        errorMsg = `Enter a valid month for ${fieldLabel} (MM/YYYY)`;
      } else if (labelText.includes("Weight") && parseFloat(val) <= 0) {
        isValid = false;
        errorMsg = "Weight must be greater than 0 kg";
      } else if (labelText.includes("Pincode") && val.length !== 6) {
        isValid = false;
        errorMsg = "Pincode must be exactly 6 digits";
      }
    }

    if (!isValid) {
      toast.error(errorMsg);
      return false;
    }
    return true;
  };

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers({
    validateField: validateEnterNavField,
    onComplete: () => {
      if (form.isStepComplete(currentStep)) {
        handleNext();
      } else {
        toast.warning("Please complete all required fields on this step before continuing.");
      }
    },
  });

  const handleNext = () => {
    if (currentStep === 2) {
      const questionReason = getUnhealthyQuestionReason(formData);
      if (questionReason) {
        form.setFormData((prev) => ({
          ...prev,
          donorIsFit: false,
          deferralReasonObj: questionReason
        }));
      } else {
        if (formData.deferralReasonObj && formData.deferralReasonObj.reason.startsWith("Unfit due to Medical Question")) {
          form.setFormData((prev) => ({
            ...prev,
            donorIsFit: true,
            deferralReasonObj: null
          }));
        }
      }
      setCurrentStep(3);
    } else if (currentStep === 3 && !formData.donorIsFit) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {campId && (
              <button
                type="button"
                onClick={() => navigate('/camp-listing')}
                title="Back to camp list"
                aria-label="Back to camp list"
                className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <UserPlus className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {campId ? "New Camp Donation" : "Donor Creation & Register"}
              </h1>
              <p className="text-gray-500 text-sm">
                {campId
                  ? "Unified camp donor registration and donation form"
                  : "Register a new donor"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Status Indicator Bar (6 Steps) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white p-6 rounded-3xl border border-red-200 flex justify-between items-center shadow-md">
          {[
            { step: 1, label: "Donor Profile" },
            { step: 2, label: "Medical History" },
            { step: 3, label: "Exam & Fitness" },
            { step: 4, label: "Bag Info" },
            { step: 5, label: "QA Checklist" },
            { step: 6, label: "Review & Save" }
          ].map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isActive = currentStep === s.step;
            return (
              <React.Fragment key={s.step}>
                <div className="flex flex-col items-center gap-1.5 flex-1 relative animate-fadeIn">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                      isCompleted
                        ? "bg-red-800 text-white shadow"
                        : isActive
                        ? "bg-red-800 text-white shadow-lg scale-110"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.step
                    )}
                  </div>
                  <span
                    className={`text-2xs font-semibold uppercase tracking-wider hidden sm:block ${
                      isActive ? "text-red-800 font-bold" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 5 && (
                  <div className="relative mx-2 h-1 flex-1 overflow-hidden rounded bg-gray-200">
                    <div
                      className="absolute left-0 top-0 h-full bg-red-800 transition-all duration-500"
                      style={{ width: currentStep > s.step ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content Form Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="bg-white rounded-2xl border border-gray-200 shadow overflow-hidden">

          {currentStep === 1 && <DonorProfileStep form={form} submit={submit} />}

          {currentStep === 2 && <MedicalHistoryStep form={form} />}

          {currentStep === 3 && <ExamFitnessStep form={form} />}

          {/* Deferral Reason Picker Modal (always mounted; opened from Step 3) */}
          <Dialog
            open={form.dropdownOpen && !form.isFitnessForcedUnfit}
            onOpenChange={(o) => {
              if (!o) {
                form.setDropdownOpen(false);
                form.setReasonSearch("");
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Deferral Reason</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Type to filter reasons..."
                value={form.reasonSearch}
                onChange={(e) => form.setReasonSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1">
                {form.filteredReasons.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      form.handleFormFieldChange("deferralReasonObj", r);
                      form.setDropdownOpen(false);
                      form.setReasonSearch("");
                    }}
                    className={`p-2.5 rounded-lg text-sm cursor-pointer hover:bg-red-55 hover:text-red-900 flex justify-between items-center transition-colors ${
                      formData.deferralReasonObj?.reason === r.reason
                        ? "bg-red-50 text-red-900 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    <span>{r.reason}</span>
                    <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                      r.days === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-755"
                    }`}>
                      {r.days === 0 ? "Permanent" : `${r.days} d`}
                    </span>
                  </div>
                ))}
                {form.filteredReasons.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No matching reasons found.</p>
                )}
              </div>
            </div>
            </DialogContent>
          </Dialog>

          {currentStep === 4 && <BagInfoStep form={form} />}

          {currentStep === 5 && <QaChecklistStep form={form} />}

          {currentStep === 6 && <ReviewStep form={form} />}

          {/* Stepper Footer Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1 || isSubmitting}
              className="px-5 py-2 border border-gray-305 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-1 bg-white select-none shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {currentStep < 6 && campId && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="px-5 py-2 border border-orange-250 rounded-full text-sm font-semibold text-orange-800 hover:bg-orange-50 disabled:opacity-40 transition-colors flex items-center gap-1.5 bg-white select-none shadow-sm"
              >
                <Save className="w-4 h-4 text-orange-800" />
                Save Draft
              </button>
            )}
            <button
              onClick={currentStep === 6 ? handleSubmit : handleNext}
              disabled={!form.isStepComplete(currentStep) || isSubmitting}
              className={`px-6 py-2 rounded-full text-sm font-semibold text-white transition-all shadow flex items-center gap-1.5 select-none ${
                !form.isStepComplete(currentStep) || isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  : currentStep === 3 && !formData.donorIsFit
                  ? "bg-red-800 hover:bg-red-900 active:bg-red-950"
                  : currentStep === 6
                  ? "bg-green-700 hover:bg-green-800 active:bg-green-900"
                  : "bg-red-800 hover:bg-red-900 active:bg-red-950"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === 3 && !formData.donorIsFit ? (
                <>
                  Complete (Defer)
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : currentStep === 6 ? (
                <>
                  Complete
                  <Save className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Deferral Warning Modal */}
      <Dialog
        open={form.deferralModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            form.setDeferralModalOpen(false);
            form.setDeferralModalData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Donor Deferral Warning</DialogTitle>
        </DialogHeader>
        {form.deferralModalData && (
          <div className="space-y-4 p-2 text-sm">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-700 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 text-sm">Deferred Donor Profile Selected</h3>
                <p className="text-gray-600 text-xs mt-1">
                  The selected donor <strong>{form.deferralModalData.fullName}</strong> is currently deferred and is ineligible to donate.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-gray-500 text-xs uppercase font-semibold">Eligibility Status</div>
                <div className="font-bold text-red-700 capitalize mt-0.5">
                  {form.deferralModalData.eligibilityStatus === 'temp-deferred' ? 'Temporarily Deferred' : 'Permanently Deferred'}
                </div>
              </div>

              <div>
                <div className="text-gray-500 text-xs uppercase font-semibold">Reason for Deferral</div>
                <div className="font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 leading-relaxed">
                  {form.deferralModalData.deferralReason}
                </div>
              </div>

              {form.deferralModalData.deferralUntil && (
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold">Deferred Until</div>
                  <div className="font-semibold text-gray-800 mt-0.5">
                    {new Date(form.deferralModalData.deferralUntil).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  form.setDeferralModalOpen(false);
                  form.setDeferralModalData(null);
                }}
                className="px-4 py-2 bg-red-800 hover:bg-red-900 active:bg-red-950 text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

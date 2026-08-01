import React from 'react';
import { BookmarkCheck } from 'lucide-react';
import Stepper, { Step } from '@/components/Stepper';
import AddHospitalModal from '@/features/requisition/pages/components/AddHospitalModal';
import MatchReviewStep from '@/features/requisition/pages/steps/MatchReviewStep';
import { requisitionApprovalBlockers } from '@/features/requisition/requisition-gating';
import useReservationWizard from '@/features/inventory/pages/hooks/useReservationWizard';
import ReservationRequestStep from './steps/ReservationRequestStep';
import ReservationSummaryStep from './steps/ReservationSummaryStep';

// Reservation = the Requisition pipeline (create -> match -> grouping ->
// crossmatch -> approve), presented as a 3-step wizard that stops at
// "Create Reservation" — no issue/complete step, no Hospital Seal /
// Medical Officer Signature, no transfusion UI.
export default function ReserveWizard() {
  const wizard = useReservationWizard();
  const {
    currentStep, setCurrentStep,
    hospitals, hospitalsLoading,
    addHospitalOpen, setAddHospitalOpen, addHospitalForm, setAddHospitalForm, addingHospital, handleCreateHospital,
    form, setForm, addRequestLine, removeRequestLine, maxReservedUntil,
    requestDoc, matching, matchedResult, shortages, approving,
    crossmatchUpdating, swapping, groupingSaving, hasChanges,
    handleCreate, handleMatch, handleApprove, handleReject,
    fetchAvailableUnits, handleSwapBag,
    handleSaveRecipientGrouping, handleSaveBagGrouping,
    handleConfirmCompatibility, handleCrossmatchUpdate, handleResetCrossmatch, handleRejectComponent,
  } = wizard;

  // Step 2 → Next is gated on completeness (recipient/per-bag grouping +
  // crossmatch), exactly like the Requisition flow's Match Review → Approve
  // gate — NOT on already being approved, since approval is the Step 3
  // action itself ("Create Reservation").
  const step2Reasons = React.useMemo(() => requisitionApprovalBlockers(requestDoc), [requestDoc]);
  const canProceedFromStep2 = React.useMemo(() => {
    const okStatus = ['matched', 'approved'];
    if (!requestDoc?._id || !okStatus.includes(requestDoc?.status)) return false;
    if (requestDoc.status !== 'matched') return true;
    return step2Reasons.length === 0;
  }, [requestDoc, step2Reasons]);

  const isPartialMatch = React.useMemo(
    () => (requestDoc?.requestedComponents || []).some((c) => c.status === 'UNAVAILABLE'),
    [requestDoc],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <BookmarkCheck className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reserve Stock</h1>
            <p className="text-gray-500 text-sm">Reserve blood units for a patient — with full compatibility &amp; crossmatch worksheets.</p>
          </div>
        </div>

        <Stepper
          activeStep={currentStep}
          onStepChange={(s) => setCurrentStep(s)}
          nextButtonProps={{ disabled: (currentStep === 1 && !requestDoc?._id) || (currentStep === 2 && !canProceedFromStep2) }}
          disableStepIndicators={currentStep === 1 && !requestDoc}
          stepCircleContainerClassName="bg-white"
          contentClassName="bg-white rounded-xl shadow border border-gray-100"
          footerClassName="bg-white rounded-b-xl"
        >
          <Step>
            <ReservationRequestStep
              hospitals={hospitals}
              hospitalsLoading={hospitalsLoading}
              form={form}
              setForm={setForm}
              addRequestLine={addRequestLine}
              removeRequestLine={removeRequestLine}
              maxReservedUntil={maxReservedUntil}
              handleCreate={handleCreate}
              requestDoc={requestDoc}
              hasChanges={hasChanges}
              openAddHospital={() => setAddHospitalOpen(true)}
              shortages={shortages}
            />
          </Step>

          <Step>
            <MatchReviewStep
              requestDoc={requestDoc}
              matchedResult={matchedResult}
              matching={matching}
              onMatch={() => handleMatch()}
              onReject={handleReject}
              shortages={shortages}
              onCrossmatchUpdate={handleCrossmatchUpdate}
              crossmatchUpdating={crossmatchUpdating}
              fetchAvailableUnits={fetchAvailableUnits}
              onSwapBag={handleSwapBag}
              swapping={swapping}
              onSaveRecipientGrouping={handleSaveRecipientGrouping}
              onSaveBagGrouping={handleSaveBagGrouping}
              groupingSaving={groupingSaving}
              onConfirmCompatibility={handleConfirmCompatibility}
              onResetCrossmatch={handleResetCrossmatch}
              onRejectComponent={handleRejectComponent}
              step2Reasons={step2Reasons}
              isPartialMatch={isPartialMatch}
              variant="reservation"
            />
          </Step>

          <Step>
            <ReservationSummaryStep
              requestDoc={requestDoc}
              approving={approving}
              onCreateReservation={handleApprove}
            />
          </Step>
        </Stepper>
      </div>

      <AddHospitalModal
        isOpen={addHospitalOpen}
        onClose={() => setAddHospitalOpen(false)}
        form={addHospitalForm}
        onChange={(patch) => setAddHospitalForm((p) => ({ ...p, ...patch }))}
        saving={addingHospital}
        onSave={handleCreateHospital}
      />
    </div>
  );
}

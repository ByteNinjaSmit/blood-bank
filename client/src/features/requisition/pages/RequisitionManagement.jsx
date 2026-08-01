import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Stepper, { Step } from '@/components/Stepper';
import { useAuth } from '@/store/auth';
import { toast } from 'sonner';
import RequisitionHeader from './components/RequisitionHeader';
import useRequisition from './hooks/useRequisition';
import RequestCreationStep from './steps/RequestCreationStep';
import MatchReviewStep from './steps/MatchReviewStep';
import ApproveIssueStep from './steps/ApproveIssueStep';
import CompleteStep from './steps/CompleteStep';
import { requisitionApprovalBlockers } from '../requisition-gating';

const RequisitionManagement = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { authorizationToken } = useAuth();

  const {
    currentStep,
    setCurrentStep,
    hospitals,
    hospitalsLoading,
    form,
    setForm,
    requestDoc,
    matching,
    matchedResult,
    shortages,
    issuing,
    approving,
    completing,
    crossmatchUpdating,
    swapping,
    groupingSaving,
    hasChanges,
    addRequestLine,
    removeRequestLine,
    handleCreate,
    handleMatch,
    handleApprove,
    handleIssue,
    handleComplete,
    handleReject,
    handleCreateAndReject,
    handleCrossmatchUpdate,
    fetchAvailableUnits,
    handleSwapBag,
    handleSaveRecipientGrouping,
    handleSaveBagGrouping,
    handleConfirmCompatibility,
    handleResetCrossmatch,
    handleRejectComponent,
    loadRequest,
    refreshRequest,
  } = useRequisition(authorizationToken);

  React.useEffect(() => {
    if (params?.id) {
      // Load existing request and jump to appropriate step
      loadRequest(params.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  React.useEffect(() => {
    if (params?.id && currentStep) {
      refreshRequest(params.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, params?.id]);

  const nextLabel = React.useMemo(() => {
    if (currentStep === 1) return 'Continue to Match Review';
    if (currentStep === 2) return 'Continue to Approve & Issue';
    if (currentStep === 3) return 'Continue to Complete';
    return 'Finish';
  }, [currentStep]);

  const canProceedFromStep1 = React.useMemo(() => {
    // Real-world: once a request is created (any non-null status),
    // we should allow moving from Request Details to Match Review
    // to see matching results, shortages, etc.
    return !!requestDoc?._id;
  }, [requestDoc]);

  // Step 2 → Next is gated on completeness: every proposed bag crossmatched +
  // compatibility-confirmed + grouped, and the recipient grouping saved.
  const step2Reasons = React.useMemo(() => requisitionApprovalBlockers(requestDoc), [requestDoc]);

  // A partial match (some requested components unavailable in stock) lets the
  // operator advance with the available components — they explicitly accepted
  // proceeding. Crossmatch safety is still enforced downstream at Approve &
  // Issue (PRBC with pending/incompatible crossmatch cannot be issued). Read
  // off the persisted component statuses so it survives a page reload, unlike
  // the transient `shortages` state.
  const isPartialMatch = React.useMemo(
    () => (requestDoc?.requestedComponents || []).some((c) => c.status === 'UNAVAILABLE'),
    [requestDoc],
  );

  const canProceedFromStep2 = React.useMemo(() => {
    const okStatus = ['matched', 'approved', 'issued', 'completed'];
    if (!requestDoc?._id || !okStatus.includes(requestDoc?.status)) return false;
    // Once past matching (approved/issued/completed) the gate already cleared.
    if (requestDoc.status !== 'matched') return true;
    // Recipient grouping, each proposed bag's grouping and crossmatch worksheet
    // must be filled before advancing — even on a partial match. The blockers
    // only cover the available (proposed) bags, so partial fulfilment still
    // gates on exactly the components being carried forward.
    return step2Reasons.length === 0;
  }, [requestDoc, step2Reasons]);

  const canProceedFromStep3 = React.useMemo(() => {
    const okStatus = ['approved', 'issued', 'completed'];
    return !!requestDoc?._id && okStatus.includes(requestDoc?.status);
  }, [requestDoc]);

  const canProceedFromStep4 = React.useMemo(() => {
    return requestDoc?.status === 'completed';
  }, [requestDoc]);

  const handleRejectAndExit = async (rejectionReason) => {
    let ok;
    if (requestDoc?._id) {
      ok = await handleReject(rejectionReason);
    } else {
      ok = await handleCreateAndReject(rejectionReason);
    }
    if (!ok) return;
    navigate('/requisition/list');
  };

  const nextDisabled =
    (currentStep === 1 && !canProceedFromStep1) ||
    (currentStep === 2 && !canProceedFromStep2) ||
    (currentStep === 3 && !canProceedFromStep3) ||
    (currentStep === 4 && !canProceedFromStep4);

  return (
      <div className="min-h-screen bg-gray-50">
        <RequisitionHeader />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <Stepper
            activeStep={currentStep}
            onStepChange={(s) => setCurrentStep(s)}
            onFinalStepCompleted={async () => {
              if (!requestDoc?._id) {
                toast.error('No requisition loaded');
                return;
              }
              if (requestDoc?.status !== 'completed') {
                const ok = await handleComplete();
                if (!ok) return;
              }
              toast.success('Requisition flow completed');
              navigate('/requisition/list');
            }}
            nextButtonProps={{
              disabled: nextDisabled,
              className: nextDisabled
                ? 'duration-350 flex items-center justify-center rounded-full bg-gray-300 py-1.5 px-3.5 font-medium tracking-tight text-gray-500 cursor-not-allowed'
                : 'duration-350 flex items-center justify-center rounded-full bg-red-800 py-1.5 px-3.5 font-medium tracking-tight text-white transition hover:bg-red-900 active:bg-red-950',
            }}
            disableStepIndicators={nextDisabled}
            nextButtonText={nextLabel}
            stepCircleContainerClassName="bg-white"
            contentClassName="bg-white rounded-xl shadow border border-gray-100"
            footerClassName="bg-white rounded-b-xl"
          >
            <Step>
              <RequestCreationStep
                hospitals={hospitals}
                hospitalsLoading={hospitalsLoading}
                form={form}
                setForm={setForm}
                addRequestLine={addRequestLine}
                removeRequestLine={removeRequestLine}
                handleCreate={handleCreate}
                requestDoc={requestDoc}
                hasChanges={hasChanges}
                openAddHospital={() => navigate('/hospital/add')}
                onReject={handleRejectAndExit}
              />
            </Step>

            <Step>
              <MatchReviewStep
                requestDoc={requestDoc}
                matchedResult={matchedResult}
                matching={matching}
                onMatch={() => handleMatch()}
                onReject={handleRejectAndExit}
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
              />
            </Step>

            <Step>
              <ApproveIssueStep
                requestDoc={requestDoc}
                approving={approving}
                issuing={issuing}
                onApprove={handleApprove}
                onIssue={handleIssue}
                shortages={shortages}
                step2Reasons={step2Reasons}
              />
            </Step>

            <Step>
              <CompleteStep
                requestDoc={requestDoc}
                completing={completing}
                onComplete={handleComplete}
                shortages={shortages}
              />
            </Step>
          </Stepper>
        </div>
      </div>
  );
};

export default RequisitionManagement;


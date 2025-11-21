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
import AddHospitalModal from './components/AddHospitalModal';

const RequisitionManagement = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { authorizationToken } = useAuth();

  const {
    currentStep,
    setCurrentStep,
    hospitals,
    hospitalsLoading,
    addHospitalOpen,
    setAddHospitalOpen,
    addHospitalForm,
    setAddHospitalForm,
    addingHospital,
    form,
    setForm,
    requestDoc,
    matching,
    matchedResult,
    shortages,
    issuing,
    approving,
    completing,
    handleCreateHospital,
    addRequestLine,
    removeRequestLine,
    handleCreate,
    handleMatch,
    handleApprove,
    handleIssue,
    handleComplete,
    handleReject,
    loadRequest,
  } = useRequisition(authorizationToken);

  React.useEffect(() => {
    if (params?.id) {
      // Load existing request and jump to appropriate step
      loadRequest(params.id);
    }
  }, [params?.id]);

  const canProceedFromStep1 = React.useMemo(() => {
    const okStatus = ['matched', 'approved', 'issued', 'completed'];
    return !!requestDoc?._id && okStatus.includes(requestDoc?.status);
  }, [requestDoc]);

  const canProceedFromStep2 = React.useMemo(() => {
    const okStatus = ['approved', 'issued', 'completed'];
    return !!requestDoc?._id && okStatus.includes(requestDoc?.status);
  }, [requestDoc]);

  const canProceedFromStep3 = React.useMemo(() => {
    const okStatus = ['issued', 'completed'];
    return !!requestDoc?._id && okStatus.includes(requestDoc?.status);
  }, [requestDoc]);

  const canProceedFromStep4 = React.useMemo(() => {
    return requestDoc?.status === 'completed';
  }, [requestDoc]);

  const nextDisabled =
    (currentStep === 1 && !canProceedFromStep1) ||
    (currentStep === 2 && !canProceedFromStep2) ||
    (currentStep === 3 && !canProceedFromStep3) ||
    (currentStep === 4 && !canProceedFromStep4);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <RequisitionHeader onBack={() => navigate(-1)} />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <Stepper
            onStepChange={(s) => setCurrentStep(s)}
            onFinalStepCompleted={() => {
              if (requestDoc?.status !== 'completed') {
                toast.error('Please complete the request before finishing');
                return;
              }
              toast.success('Requisition flow completed');
              navigate('/requisition/list');
            }}
            nextButtonProps={{ disabled: nextDisabled }}
            disableStepIndicators={nextDisabled}
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
                openAddHospital={() => setAddHospitalOpen(true)}
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
              />
            </Step>

            <Step>
              <ApproveIssueStep
                requestDoc={requestDoc}
                approving={approving}
                issuing={issuing}
                onApprove={handleApprove}
                onIssue={handleIssue}
              />
            </Step>

            <Step>
              <CompleteStep
                requestDoc={requestDoc}
                completing={completing}
                onComplete={async () => {
                  const ok = await handleComplete();
                  if (ok) {
                    toast.success('Requisition completed');
                    navigate('/requisition/list');
                  }
                }}
              />
            </Step>
          </Stepper>
        </div>
      </div>
      <AddHospitalModal
        isOpen={addHospitalOpen}
        onClose={() => setAddHospitalOpen(false)}
        form={addHospitalForm}
        onChange={(patch) => setAddHospitalForm((p) => ({ ...p, ...patch }))}
        saving={addingHospital}
        onSave={handleCreateHospital}
      />
    </>
  );
};

export default RequisitionManagement;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper, { Step } from '@/components/Stepper';
import { useAuth } from '@/store/auth';
import RequisitionHeader from './components/RequisitionHeader';
import useRequisition from './hooks/useRequisition';
import RequestCreationStep from './steps/RequestCreationStep';
import MatchReviewStep from './steps/MatchReviewStep';
import ApproveIssueStep from './steps/ApproveIssueStep';
import CompleteStep from './steps/CompleteStep';
import AddHospitalModal from './components/AddHospitalModal';

const RequisitionManagement = () => {
  const navigate = useNavigate();
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
  } = useRequisition(authorizationToken);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <RequisitionHeader onBack={() => navigate(-1)} />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <Stepper
            onStepChange={(s) => setCurrentStep(s)}
            nextButtonProps={{ disabled: currentStep === 1 && !requestDoc?._id }}
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
                onComplete={handleComplete}
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

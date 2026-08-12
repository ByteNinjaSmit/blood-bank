import React, { useState } from 'react';
import { User, CreditCard } from 'lucide-react';
import HospitalDoctorDetailsCard from '../components/HospitalDoctorDetailsCard';
import PatientForm from '../components/PatientForm';
import TransfusionHistoryCard from '../components/TransfusionHistoryCard';
import PregnancyHistoryCard from '../components/PregnancyHistoryCard';
import RequestedComponentsList from '../components/RequestedComponentsList';
import { RejectRequestModal } from '@/components/shared';
import { toast } from 'sonner';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';

export default function RequestCreationStep({
  hospitals,
  hospitalsLoading,
  form,
  setForm,
  addRequestLine,
  removeRequestLine,
  handleCreate,
  requestDoc,
  hasChanges,
  onReject,
}) {
  const readOnly = false;
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  const handleOpenRejectClick = () => {
    if (!readOnly) {
      if (!form.hospitalId) {
        toast.error('Select a hospital before rejecting this requisition.');
        return;
      }
      if (!form.doctorName?.trim()) {
        toast.error("Enter the doctor's name before rejecting this requisition.");
        return;
      }
      if (!form.patient?.name?.trim()) {
        toast.error('Enter the patient name before rejecting this requisition.');
        return;
      }
      if (!form.patient?.age) {
        toast.error('Enter the patient age before rejecting this requisition.');
        return;
      }
      if (!form.requestedComponents || form.requestedComponents.length === 0) {
        toast.error('Add at least one requested component before rejecting.');
        return;
      }
      const hasIncompleteComponent = form.requestedComponents.some(
        (c) => !c.componentType || !c.units || !c.bloodGroup || !c.rh
      );
      if (hasIncompleteComponent) {
        toast.error('Fill out all fields for the requested components before rejecting.');
        return;
      }
    }
    setRejectConfirmOpen(true);
  };

  // Fallback strategy: If we are in read-only mode, render data from requestDoc.
  // Otherwise, render and write to form state.
  const displayForm = React.useMemo(() => {
    if (readOnly && requestDoc) {
      return {
        hospitalId: requestDoc.hospitalId?._id || requestDoc.hospitalId || '',
        doctorName: requestDoc.doctorName || '',
        requiredAt: requestDoc.requiredAt ? new Date(requestDoc.requiredAt).toISOString().slice(0, 10) : '',
        patient: {
          name: requestDoc.patient?.name || '',
          address: requestDoc.patient?.address || '',
          age: requestDoc.patient?.age || '',
          sex: requestDoc.patient?.sex || 'M',
          mrn: requestDoc.patient?.mrn || '',
          diagnosis: requestDoc.patient?.diagnosis || '',
          hb: requestDoc.patient?.hb || '',
          indication: requestDoc.patient?.indication || '',
          indicationCategory: requestDoc.patient?.indicationCategory || null,
          otherDiseaseName: requestDoc.patient?.otherDiseaseName || '',
          history: {
            previousTransfusions: requestDoc.patient?.history?.previousTransfusions || 0,
            approximateDate: requestDoc.patient?.history?.approximateDate || '',
            presenceOfReaction: requestDoc.patient?.history?.presenceOfReaction || 'None',
          },
          pregnancy: {
            numPregnancies: requestDoc.patient?.pregnancy?.numPregnancies || 0,
            numMiscarriages: requestDoc.patient?.pregnancy?.numMiscarriages || 0,
            numChildrenWithHemolyticDisease: requestDoc.patient?.pregnancy?.numChildrenWithHemolyticDisease || 0,
          },
        },
        requestedComponents: requestDoc.requestedComponents || [],
        donorCard: form.donorCard,
      };
    }
    return form;
  }, [readOnly, requestDoc, form]);

  const updatePatientField = (patch) => {
    if (readOnly) return;
    setForm((p) => ({
      ...p,
      patient: { ...p.patient, ...patch },
    }));
  };

  const updateHistoryField = (patch) => {
    if (readOnly) return;
    setForm((p) => ({
      ...p,
      patient: {
        ...p.patient,
        history: { ...(p.patient.history || {}), ...patch },
      },
    }));
  };

  const updatePregnancyField = (patch) => {
    if (readOnly) return;
    setForm((p) => ({
      ...p,
      patient: {
        ...p.patient,
        pregnancy: { ...(p.patient.pregnancy || {}), ...patch },
      },
    }));
  };

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 rounded-xl" onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange}>
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blood Requisition Sheet</h2>
          <p className="text-sm text-gray-500">Capture complete clinical history, transfusion demands, and verification metrics.</p>
        </div>
        {requestDoc && (
          <div className="mt-2 md:mt-0 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-900 flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
            Requisition: {requestDoc.requestId} ({requestDoc.status})
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: General Request Details */}
        <HospitalDoctorDetailsCard
          hospitals={hospitals}
          hospitalsLoading={hospitalsLoading}
          hospitalId={displayForm.hospitalId}
          onHospitalIdChange={(v) => setForm((p) => ({ ...p, hospitalId: v }))}
          doctorName={displayForm.doctorName}
          onDoctorNameChange={(v) => setForm((p) => ({ ...p, doctorName: v }))}
          dateFieldLabel="Reserved Until (optional — default 3 days)"
          dateValue={displayForm.requiredAt}
          onDateChange={(v) => setForm((p) => ({ ...p, requiredAt: v }))}
          dateOnly
          readOnly={readOnly}
        />

        {/* Card 2: Patient Demographics & Indication */}
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
            <User className="w-5 h-5" />
            <h3 className="font-semibold text-gray-800">Patient Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PatientForm
              patient={displayForm.patient}
              onChange={updatePatientField}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Card 3: Clinical / Transfusion History */}
        <TransfusionHistoryCard
          history={displayForm.patient.history}
          onChange={updateHistoryField}
          readOnly={readOnly}
        />

        {/* Card 4: Pregnancy / Obstetric History (Conditional for Females) */}
        <PregnancyHistoryCard
          sex={displayForm.patient.sex}
          pregnancy={displayForm.patient.pregnancy}
          onChange={updatePregnancyField}
          readOnly={readOnly}
        />
      </div>

      {/* Card 5: Requested Components Table */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
        <RequestedComponentsList
          items={displayForm.requestedComponents}
          onItemChange={(idx, patch) => {
            if (readOnly) return;
            setForm((p) => {
              const arr = [...p.requestedComponents];
              arr[idx] = { ...arr[idx], ...patch };
              return { ...p, requestedComponents: arr };
            });
          }}
          onAdd={readOnly ? undefined : addRequestLine}
          onRemove={readOnly ? undefined : removeRequestLine}
          readOnly={readOnly}
        />
      </div>

      {/* Card 6: Donor Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
          <CreditCard className="w-5 h-5" />
          <h3 className="font-semibold text-gray-800">Donor Card</h3>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-2">
            Did the person bring a donor card while collecting this blood?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="donorCardBrought"
                checked={displayForm.donorCard?.brought === true}
                onChange={() => !readOnly && setForm((p) => ({ ...p, donorCard: { ...p.donorCard, brought: true } }))}
                disabled={readOnly}
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="donorCardBrought"
                checked={!displayForm.donorCard?.brought}
                onChange={() => !readOnly && setForm((p) => ({ ...p, donorCard: { ...p.donorCard, brought: false } }))}
                disabled={readOnly}
              />
              No
            </label>
          </div>
        </div>

        {displayForm.donorCard?.brought && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.donorCard?.name || ''}
                onChange={(e) => !readOnly && setForm((p) => ({ ...p, donorCard: { ...p.donorCard, name: e.target.value } }))}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Address</label>
              <input
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.donorCard?.address || ''}
                onChange={(e) => !readOnly && setForm((p) => ({ ...p, donorCard: { ...p.donorCard, address: e.target.value } }))}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Blood Group</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.donorCard?.bloodGroup || 'A+'}
                onChange={(e) => !readOnly && setForm((p) => ({ ...p, donorCard: { ...p.donorCard, bloodGroup: e.target.value } }))}
                disabled={readOnly}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Blood Donation Card Number</label>
              <input
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.donorCard?.donationCardNumber || ''}
                onChange={(e) => !readOnly && setForm((p) => ({ ...p, donorCard: { ...p.donorCard, donationCardNumber: e.target.value } }))}
                disabled={readOnly}
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200 mt-6 flex justify-between items-center">
        <div>
          {(!readOnly || ['pending', 'matched', 'approved'].includes(requestDoc?.status)) && (
            <button
              type="button"
              onClick={handleOpenRejectClick}
              className="px-5 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 font-semibold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reject Request
            </button>
          )}
        </div>

        {/* Update Changes Button */}
        {hasChanges && (
          <button
            type="button"
            onClick={handleCreate}
            className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition active:scale-95 shadow cursor-pointer flex items-center gap-1.5"
          >
            Update Changes
          </button>
        )}

        <div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={!!requestDoc}
              className={`px-6 py-2.5 rounded-lg font-medium shadow transition ${
                requestDoc
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                  : 'bg-orange-800 text-white hover:bg-orange-900 active:scale-95 cursor-pointer'
              }`}
            >
              Create Request & Auto-Match FIFO
            </button>
          )}
        </div>
      </div>

      <RejectRequestModal
        isOpen={rejectConfirmOpen}
        onClose={() => setRejectConfirmOpen(false)}
        onConfirm={(reason) => {
          onReject?.(reason);
          setRejectConfirmOpen(false);
        }}
        requestId={requestDoc?.requestId || 'New Requisition'}
      />
    </div>
  );
}

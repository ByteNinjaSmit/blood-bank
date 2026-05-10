import React from 'react';
import { FileText, User, HeartHandshake, History, FileCheck, ShieldAlert } from 'lucide-react';
import HospitalSelect from '../components/HospitalSelect';
import PatientForm from '../components/PatientForm';
import RequestedComponentsList from '../components/RequestedComponentsList';

export default function RequestCreationStep({
  hospitals,
  hospitalsLoading,
  form,
  setForm,
  addRequestLine,
  removeRequestLine,
  handleCreate,
  requestDoc,
  openAddHospital,
}) {
  const readOnly = !!requestDoc?._id;

  // Fallback strategy: If we are in read-only mode, render data from requestDoc.
  // Otherwise, render and write to form state.
  const displayForm = React.useMemo(() => {
    if (readOnly && requestDoc) {
      return {
        hospitalId: requestDoc.hospitalId?._id || requestDoc.hospitalId || '',
        doctorName: requestDoc.doctorName || '',
        requiredAt: requestDoc.requiredAt ? new Date(requestDoc.requiredAt).toISOString().slice(0, 16) : '',
        medicalOfficerSignature: requestDoc.medicalOfficerSignature || '',
        hospitalSeal: requestDoc.hospitalSeal || '',
        patient: {
          name: requestDoc.patient?.name || '',
          age: requestDoc.patient?.age || '',
          sex: requestDoc.patient?.sex || 'M',
          mrn: requestDoc.patient?.mrn || '',
          diagnosis: requestDoc.patient?.diagnosis || '',
          hb: requestDoc.patient?.hb || '',
          indication: requestDoc.patient?.indication || '',
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

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 rounded-xl">
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
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
            <FileText className="w-5 h-5" />
            <h3 className="font-semibold text-gray-800">Hospital & Doctor Details</h3>
          </div>
          <div className="space-y-4">
            <HospitalSelect
              hospitals={hospitals}
              loading={hospitalsLoading}
              value={displayForm.hospitalId}
              onChange={(v) => {
                if (readOnly) return;
                setForm((p) => ({ ...p, hospitalId: v }));
              }}
              onAdd={readOnly ? undefined : openAddHospital}
              disabled={readOnly}
            />

            <div>
              <label className="block text-sm text-gray-700 mb-1">Doctor’s Name</label>
              <input
                placeholder="Dr. Full Name"
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.doctorName}
                onChange={(e) => !readOnly && setForm((p) => ({ ...p, doctorName: e.target.value }))}
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Date & Time of Requirement</label>
              <input
                type="datetime-local"
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.requiredAt}
                onChange={(e) => !readOnly && setForm((p) => ({ ...p, requiredAt: e.target.value }))}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

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
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
            <History className="w-5 h-5" />
            <h3 className="font-semibold text-gray-800">History of Previous Transfusions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">No. of Transfusions Given</label>
              <input
                type="number"
                min={0}
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.patient.history?.previousTransfusions ?? 0}
                onChange={(e) => updateHistoryField({ previousTransfusions: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Approximate Date of Last</label>
              <input
                placeholder="e.g. June 2025 or MM/YYYY"
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.patient.history?.approximateDate || ''}
                onChange={(e) => updateHistoryField({ approximateDate: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Presence / Absence of Reaction</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={displayForm.patient.history?.presenceOfReaction || 'None'}
                onChange={(e) => updateHistoryField({ presenceOfReaction: e.target.value })}
                disabled={readOnly}
              >
                <option value="None">None (No Previous Transfusion)</option>
                <option value="Absence">Absence (No Reactions Recorded)</option>
                <option value="Presence">Presence (Transfusion Reactions Present)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 4: Pregnancy / Obstetric History (Conditional for Females) */}
        {displayForm.patient.sex === 'F' ? (
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
              <HeartHandshake className="w-5 h-5" />
              <h3 className="font-semibold text-gray-800">Pregnancy History</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">No. of Pregnancies</label>
                <input
                  type="number"
                  min={0}
                  className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  value={displayForm.patient.pregnancy?.numPregnancies ?? 0}
                  onChange={(e) => updatePregnancyField({ numPregnancies: e.target.value })}
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">No. of Miscarriages</label>
                <input
                  type="number"
                  min={0}
                  className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  value={displayForm.patient.pregnancy?.numMiscarriages ?? 0}
                  onChange={(e) => updatePregnancyField({ numMiscarriages: e.target.value })}
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Haemolytic Newborns</label>
                <input
                  type="number"
                  min={0}
                  className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  value={displayForm.patient.pregnancy?.numChildrenWithHemolyticDisease ?? 0}
                  onChange={(e) => updatePregnancyField({ numChildrenWithHemolyticDisease: e.target.value })}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Pregnancy History Blocked</span>
            <span className="text-xs text-gray-400">Only enabled for patients with Sex set to Female.</span>
          </div>
        )}
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

      {/* Card 6: Authorization */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
          <FileCheck className="w-5 h-5" />
          <h3 className="font-semibold text-gray-800">Authorization & Hospital Seal</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Signature of Medical Officer (Typed Name)</label>
            <input
              placeholder="Full M.O. Name / Digital Stamp"
              className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
              value={displayForm.medicalOfficerSignature}
              onChange={(e) => !readOnly && setForm((p) => ({ ...p, medicalOfficerSignature: e.target.value }))}
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Hospital Seal Verification Code / Text</label>
            <input
              placeholder="Seal reference number or stamp text"
              className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
              value={displayForm.hospitalSeal}
              onChange={(e) => !readOnly && setForm((p) => ({ ...p, hospitalSeal: e.target.value }))}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleCreate}
            className="px-6 py-2.5 rounded-lg bg-orange-800 text-white font-medium hover:bg-orange-900 transition active:scale-95 shadow cursor-pointer"
          >
            Create Request & Auto-Match FIFO
          </button>
        </div>
      )}
    </div>
  );
}

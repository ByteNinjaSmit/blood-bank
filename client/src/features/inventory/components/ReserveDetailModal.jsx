import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReserveDetailModal({ reserve, onClose, formatDateDMY, formatDateTimeDMY }) {
  if (!reserve) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-orange-100 bg-orange-50/20">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Reservation & Requisition Details</h3>
            <p className="text-xs text-orange-850 font-semibold uppercase tracking-wider mt-0.5">
              Requisition ID: {reserve.requisition?.requisitionId || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Card 1: Requisition Metadata */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-orange-900 border-b pb-1.5 uppercase tracking-wide">
              Hospital & Clinician Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-gray-500">Hospital:</span>
                <div className="text-slate-800 mt-0.5 font-medium">{reserve.hospital?.name || '—'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Doctor / Clinician Name:</span>
                <div className="text-slate-800 mt-0.5 font-medium">{reserve.requisition?.doctorName || '—'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Required By:</span>
                <div className="text-slate-800 mt-0.5 font-medium">
                  {reserve.requisition?.requiredAt ? formatDateTimeDMY(reserve.requisition.requiredAt) : '—'}
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Reserved Until:</span>
                <div className="text-slate-800 mt-0.5 font-medium">
                  {formatDateTimeDMY(reserve.reservedUntil)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Patient Information */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-orange-900 border-b pb-1.5 uppercase tracking-wide">
              Patient Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-gray-500">Patient Name:</span>
                <div className="text-slate-800 mt-0.5 font-semibold">{reserve.requisition?.patient?.name || reserve.reservedPatientName || '—'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Age & Sex:</span>
                <div className="text-slate-800 mt-0.5 font-semibold">
                  {reserve.requisition?.patient?.age || reserve.reservedPatientAge || '—'} yrs / {(() => {
                    const sex = reserve.requisition?.patient?.sex || reserve.reservedPatientSex;
                    return sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : sex === 'O' ? 'Other' : '—';
                  })()}
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Medical Record Number (MRN):</span>
                <div className="text-slate-800 mt-0.5 font-medium">{reserve.requisition?.patient?.mrn || '—'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Haemoglobin (Hb):</span>
                <div className="text-slate-800 mt-0.5 font-medium">
                  {reserve.requisition?.patient?.hb ? `${reserve.requisition.patient.hb} g/dL` : '—'}
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="font-semibold text-gray-500">Diagnosis / Indication:</span>
                <div className="text-slate-800 mt-0.5 font-medium">
                  {reserve.requisition?.patient?.diagnosis || '—'}
                  {reserve.requisition?.patient?.indication ? ` (${reserve.requisition.patient.indication})` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Clinical / Obstetric History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* History of Previous Transfusions */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-orange-900 border-b pb-1.5 uppercase tracking-wide">
                Transfusion History
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-gray-500">Previous Transfusions:</span>
                  <div className="text-slate-800 font-medium">
                    {reserve.requisition?.patient?.history?.previousTransfusions ?? 0}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Approximate Date:</span>
                  <div className="text-slate-800 font-medium">
                    {reserve.requisition?.patient?.history?.approximateDate || '—'}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Presence of Reaction:</span>
                  <div className="text-slate-800 font-semibold text-orange-700">
                    {reserve.requisition?.patient?.history?.presenceOfReaction || 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Pregnancy History */}
            {reserve.requisition?.patient?.sex === 'F' ? (
              <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
                <h4 className="font-bold text-xs text-orange-900 border-b pb-1.5 uppercase tracking-wide">
                  Pregnancy History
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500">No. of Pregnancies:</span>
                    <div className="text-slate-800 font-medium">
                      {reserve.requisition?.patient?.pregnancy?.numPregnancies ?? 0}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">No. of Miscarriages:</span>
                    <div className="text-slate-800 font-medium">
                      {reserve.requisition?.patient?.pregnancy?.numMiscarriages ?? 0}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Haemolytic Newborns:</span>
                    <div className="text-slate-800 font-medium">
                      {reserve.requisition?.patient?.pregnancy?.numChildrenWithHemolyticDisease ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center text-xs">
                <span className="font-semibold text-gray-400">Pregnancy History Blocked</span>
                <p className="text-[10px] text-gray-400 mt-1">Not applicable for male/other sex patients.</p>
              </div>
            )}
          </div>

          {/* Card 4: Reserved Component Details */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-orange-900 border-b pb-1.5 uppercase tracking-wide">
              Reserved Component Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-gray-500">Bag Number:</span>
                <div className="text-slate-800 mt-0.5 font-bold">{reserve.bagNo}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Segment Number:</span>
                <div className="text-slate-800 mt-0.5 font-bold">{reserve.segmentNo || '—'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Component Type:</span>
                <div className="text-slate-800 mt-0.5 font-bold">{reserve.component?.componentType}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Component ID:</span>
                <div className="text-slate-800 mt-0.5 font-bold font-mono">{reserve.component?.componentId || reserve.unitId || '—'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Blood Group / Rh:</span>
                <div className="text-slate-800 mt-0.5 font-bold">
                  {reserve.bag?.bloodGroup} {reserve.bag?.rh}
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Volume:</span>
                <div className="text-slate-800 mt-0.5 font-medium">{reserve.component?.volumeMl ? `${reserve.component.volumeMl} mL` : '—'}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Expiry Date:</span>
                <div className="text-slate-800 mt-0.5 font-semibold text-red-700">
                  {formatDateDMY(reserve.component?.expiryDate)}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-150 bg-gray-50 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

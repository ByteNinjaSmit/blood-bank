import { X, Image as ImageIcon } from "lucide-react";
import DecisionBadge from "./DecisionBadge";
import { TESTING_TYPE_LABELS, PHYSICAL_CHECKS } from "./discard-constants";

export default function ViewInspectionModal({ onClose, inspection, onViewReportImage }) {
  if (!inspection) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-red-800 text-white">
            <div>
              <h2 className="text-base font-semibold text-white">Inspection & QC Report Details</h2>
              <p className="text-[10px] text-red-200 font-medium uppercase tracking-wider mt-0.5">
                Batch No: {inspection.batchNumber}
              </p>
            </div>
            <button onClick={onClose} className="text-red-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* General Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inspection ID</span>
                <span className="text-sm font-semibold text-gray-800 font-mono">
                  {inspection.inspectionId ?? inspection.id?.slice(-8).toUpperCase() ?? inspection._id?.slice(-8).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">GRN Reference</span>
                <span className="text-sm font-semibold text-gray-800 font-mono">
                  {inspection.grn?.grnNumber ?? inspection.grnId}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Decision</span>
                <span className="mt-1 block">
                  <DecisionBadge decision={inspection.decision} />
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Testing Status</span>
                <span className="text-sm font-semibold text-gray-800">
                  {inspection.testingStatus === 'SENT' ? 'Under Testing' : 'Report Received'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Sent</span>
                <span className="text-sm font-semibold text-gray-800">{fmtDate(inspection.sentDate ?? inspection.createdAt)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Received</span>
                <span className="text-sm font-semibold text-gray-800">{fmtDate(inspection.reportDate)}</span>
              </div>
            </div>

            {/* Test Specifications & Coagulation/Blood Group Details */}
            {inspection.testingStatus === 'REPORT_RECEIVED' && (
              <div>
                <h3 className="text-xs font-bold text-gray-505 text-gray-500 uppercase tracking-wider mb-2">QC Test Results</h3>
                <div className="grid grid-cols-2 gap-4 border border-gray-100 rounded-lg p-4 bg-white">
                  <div>
                    <span className="block text-[10px] text-gray-400">Testing Lab</span>
                    <span className="text-xs font-semibold text-gray-700">{inspection.testingLab || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">Testing Type</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {TESTING_TYPE_LABELS[inspection.testingType] ?? inspection.testingType}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">Bag & Segment No</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {inspection.bagNo || '—'} / {inspection.segmentNo || '—'}
                    </span>
                  </div>

                  {inspection.testingType === 'EMPTY' ? (
                    <>
                      <div>
                        <span className="block text-[10px] text-gray-400">Factor VIII</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.factorVIII ?? '—'} Unit/mL</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">Fibrinogen</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.fibrinogen ?? '—'} mg</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] text-gray-400">Sterility Check / Test Result</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.testResult || '—'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="block text-[10px] text-gray-400">Blood Group</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.bloodGroup || '—'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] text-gray-400">Test Result</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.testResult || '—'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Document Image section */}
            {inspection.reportImage ? (
              <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-0.5">Laboratory Report Document</span>
                  <span className="text-xs text-gray-600">Attached image of lab report is available.</span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onViewReportImage(inspection.reportImage)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> View Report Document
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Laboratory Report Document</span>
                  <span className="text-xs text-gray-500">No report document image uploaded.</span>
                </div>
              </div>
            )}

            {/* Physical Checks Summary */}
            <div>
              <h3 className="text-xs font-bold text-gray-505 text-gray-500 uppercase tracking-wider mb-2">Initial Physical Checks</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-gray-100 rounded-lg p-4 bg-white text-xs">
                {PHYSICAL_CHECKS.map((chk) => {
                  const passed = inspection.physicalChecks?.[chk.key];
                  return (
                    <div key={chk.key} className="flex justify-between items-center py-0.5">
                      <span className="text-gray-600">{chk.label}</span>
                      <span className={`font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                        {passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-600">Anticoagulant Volume OK</span>
                  <span className={`font-semibold ${inspection.anticoagulantVolumeOk ? 'text-green-600' : 'text-red-600'}`}>
                    {inspection.anticoagulantVolumeOk ? 'Passed' : 'Failed'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-600">Tube Patency</span>
                  <span className={`font-semibold ${inspection.tubePatency ? 'text-green-600' : 'text-red-600'}`}>
                    {inspection.tubePatency ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Observation Notes */}
            {inspection.observation && (
              <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 text-xs text-gray-700">
                <span className="block font-bold text-yellow-800 uppercase tracking-wider text-[10px] mb-0.5">Observation Notes</span>
                {inspection.observation}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

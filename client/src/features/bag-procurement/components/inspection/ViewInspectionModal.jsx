import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateBagInspectionReport } from '../../queries';
import { bagProcurementApi } from '../../api';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import DecisionBadge from './DecisionBadge';
import { TESTING_TYPE_LABELS, PHYSICAL_CHECKS } from './inspection-constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const uploadFile = bagProcurementApi.upload.file;
const deleteFile = bagProcurementApi.upload.remove;

export default function ViewInspectionModal({ onClose, inspection, onViewReportImage, onEdit }) {
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  const updateReport = useUpdateBagInspectionReport();

  if (!inspection) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const handleImageDelete = () => {
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Report Image?',
      message: 'Are you sure you want to delete this laboratory report image? This action will permanently remove the document from storage.',
      onConfirm: async () => {
        try {
          try {
            await deleteFile(inspection.reportImage);
          } catch (err) {
            console.error('S3 delete failed:', err);
          }
          await updateReport.mutateAsync({
            id: inspection.id || inspection._id,
            data: {
              reportDate: inspection.reportDate || new Date().toISOString(),
              bagNo: inspection.bagNo || '—',
              segmentNo: inspection.segmentNo || '—',
              bloodGroup: inspection.bloodGroup || undefined,
              testResult: inspection.testResult || undefined,
              factorVIII: inspection.factorVIII != null ? Number(inspection.factorVIII) : undefined,
              fibrinogen: inspection.fibrinogen != null ? Number(inspection.fibrinogen) : undefined,
              reportImage: null,
            },
          });
          toast.success('Report image deleted successfully');
        } catch (err) {
          toast.error(err.message || 'Failed to delete report image');
        }
      }
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, 'bagtestingreport');
      await updateReport.mutateAsync({
        id: inspection.id || inspection._id,
        data: {
          reportDate: inspection.reportDate || new Date().toISOString(),
          bagNo: inspection.bagNo || '—',
          segmentNo: inspection.segmentNo || '—',
          bloodGroup: inspection.bloodGroup || undefined,
          testResult: inspection.testResult || undefined,
          factorVIII: inspection.factorVIII != null ? Number(inspection.factorVIII) : undefined,
          fibrinogen: inspection.fibrinogen != null ? Number(inspection.fibrinogen) : undefined,
          reportImage: res.url,
        },
      });
      toast.success('Report image uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-orange-800">
            <DialogTitle className="text-base font-semibold text-white">Inspection & QC Report Details</DialogTitle>
            <p className="text-[10px] text-orange-200 font-medium uppercase tracking-wider mt-0.5">
              Batch No: {inspection.batchNumber}
            </p>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* General Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inspection ID</span>
                <span className="text-sm font-semibold text-gray-800 font-mono">
                  {inspection.inspectionId ?? inspection._id?.slice(-8).toUpperCase()}
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
                    <span className="text-xs font-semibold text-gray-707 text-gray-700">
                      {TESTING_TYPE_LABELS[inspection.testingType] ?? inspection.testingType}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">Bag & Segment No</span>
                    <span className="text-xs font-semibold text-gray-707 text-gray-700">
                      {inspection.bagNo || '—'} / {inspection.segmentNo || '—'}
                    </span>
                  </div>

                  {inspection.testingType === 'EMPTY' ? (
                    <>
                      <div>
                        <span className="block text-[10px] text-gray-400">Factor VIII</span>
                        <span className="text-xs font-semibold text-gray-707 text-gray-700">{inspection.factorVIII ?? '—'} Unit/mL</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">Fibrinogen</span>
                        <span className="text-xs font-semibold text-gray-707 text-gray-700">{inspection.fibrinogen ?? '—'} mg</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] text-gray-400">Sterility Check / Test Result</span>
                        <span className="text-xs font-semibold text-gray-707 text-gray-700">{inspection.testResult || '—'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="block text-[10px] text-gray-400">Blood Group</span>
                        <span className="text-xs font-semibold text-gray-707 text-gray-700">{inspection.bloodGroup || '—'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] text-gray-400">Test Result</span>
                        <span className="text-xs font-semibold text-gray-707 text-gray-700">{inspection.testResult || '—'}</span>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewReportImage(inspection.reportImage)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-800 hover:bg-orange-900 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> View Report Document
                  </button>
                  <button
                    onClick={handleImageDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-105 text-xs font-bold rounded-lg border border-red-200 transition-colors shadow-sm bg-red-50"
                    title="Delete report image"
                  >
                    <X className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-gray-505 text-gray-500 uppercase tracking-wider mb-0.5">Laboratory Report Document</span>
                  <span className="text-xs text-gray-500">No report document image uploaded.</span>
                </div>
                <div>
                  {uploading ? (
                    <div className="text-xs text-gray-500 py-1.5">Uploading...</div>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" /> Upload Report Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Physical Checks Summary */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Physical Checks</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-gray-100 rounded-lg p-4 bg-white text-xs">
                {PHYSICAL_CHECKS.map((chk) => {
                  const passed = inspection.physicalChecks?.[chk.key];
                  return (
                    <div key={chk.key} className="flex justify-between items-center py-0.5">
                      <span className="text-gray-600">{chk.label}</span>
                      <span className={`font-semibold ${passed === true ? 'text-green-600' : passed === false ? 'text-red-600' : 'text-gray-400'}`}>
                        {passed === true ? 'Passed' : passed === false ? 'Failed' : '—'}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-600">Anticoagulant Volume OK</span>
                  <span className={`font-semibold ${inspection.anticoagulantVolumeOk === true ? 'text-green-600' : inspection.anticoagulantVolumeOk === false ? 'text-red-600' : 'text-gray-400'}`}>
                    {inspection.anticoagulantVolumeOk === true ? 'Passed' : inspection.anticoagulantVolumeOk === false ? 'Failed' : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-600">Tube Patency</span>
                  <span className={`font-semibold ${inspection.tubePatency === true ? 'text-green-600' : inspection.tubePatency === false ? 'text-red-600' : 'text-gray-400'}`}>
                    {inspection.tubePatency === true ? 'Passed' : inspection.tubePatency === false ? 'Failed' : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection Reason */}
            {inspection.decision === 'REJECTED' && inspection.rejectionReason && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700">
                <span className="block font-bold text-red-800 uppercase tracking-wider text-[10px] mb-0.5">Rejection Reason</span>
                {inspection.rejectionReason}
              </div>
            )}

            {/* Observation Notes */}
            {inspection.observation && (
              <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 text-xs text-gray-700">
                <span className="block font-bold text-yellow-800 uppercase tracking-wider text-[10px] mb-0.5">Observation Notes</span>
                {inspection.observation}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-55 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-sm font-semibold text-blue-700 transition-colors"
              >
                Edit Report
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.title}
        message={confirmDelete.message}
        onConfirm={confirmDelete.onConfirm}
        onClose={() => setConfirmDelete({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />
    </>
  );
}

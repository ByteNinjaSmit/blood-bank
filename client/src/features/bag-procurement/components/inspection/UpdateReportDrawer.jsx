import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateBagInspectionReport } from '../../queries';
import { bagProcurementApi } from '../../api';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';
import { TESTING_TYPE_LABELS } from './inspection-constants';

const uploadFile = bagProcurementApi.upload.file;
const deleteFile = bagProcurementApi.upload.remove;

export default function UpdateReportDrawer({ onClose, inspection, mode }) {
  const [reportDate, setReportDate] = useState(
    inspection.reportDate
      ? new Date(inspection.reportDate).toISOString().split('T')[0]
      : (mode === 'edit' ? '' : new Date().toISOString().split('T')[0])
  );
  const [bagNo, setBagNo] = useState(inspection.bagNo || '');
  const [segmentNo, setSegmentNo] = useState(inspection.segmentNo || '');
  const [bloodGroup, setBloodGroup] = useState(inspection.bloodGroup || 'A+');
  const [testResult, setTestResult] = useState(inspection.testResult || '');
  const [factorVIII, setFactorVIII] = useState(inspection.factorVIII !== undefined ? String(inspection.factorVIII) : '');
  const [fibrinogen, setFibrinogen] = useState(inspection.fibrinogen !== undefined ? String(inspection.fibrinogen) : '');
  const [reportImage, setReportImage] = useState(inspection.reportImage || '');
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  const [testingLab, setTestingLab] = useState(inspection.testingLab || '');
  const [sentDate, setSentDate] = useState(
    inspection.sentDate
      ? new Date(inspection.sentDate).toISOString().split('T')[0]
      : ''
  );

  // Physical checks state (empty string represents the "Select..." state)
  const [sealIntact, setSealIntact] = useState(
    inspection.physicalChecks?.sealIntact !== undefined ? String(inspection.physicalChecks.sealIntact) : ''
  );
  const [noLeakage, setNoLeakage] = useState(
    inspection.physicalChecks?.noLeakage !== undefined ? String(inspection.physicalChecks.noLeakage) : ''
  );
  const [tubeIntegrity, setTubeIntegrity] = useState(
    inspection.physicalChecks?.tubeIntegrity !== undefined ? String(inspection.physicalChecks.tubeIntegrity) : ''
  );
  const [needleCondition, setNeedleCondition] = useState(
    inspection.physicalChecks?.needleCondition !== undefined ? String(inspection.physicalChecks.needleCondition) : ''
  );
  const [labelPresence, setLabelPresence] = useState(
    inspection.physicalChecks?.labelPresence !== undefined ? String(inspection.physicalChecks.labelPresence) : ''
  );
  const [sterilityCheck, setSterilityCheck] = useState(
    inspection.physicalChecks?.sterilityCheck !== undefined ? String(inspection.physicalChecks.sterilityCheck) : ''
  );
  const [packagingCondition, setPackagingCondition] = useState(
    inspection.physicalChecks?.packagingCondition !== undefined ? String(inspection.physicalChecks.packagingCondition) : ''
  );
  const [anticoagulantVolumeOk, setAnticoagulantVolumeOk] = useState(
    inspection.anticoagulantVolumeOk !== undefined ? String(inspection.anticoagulantVolumeOk) : ''
  );
  const [tubePatency, setTubePatency] = useState(
    inspection.tubePatency !== undefined ? String(inspection.tubePatency) : ''
  );
  const [rejectionReason, setRejectionReason] = useState(inspection.rejectionReason || '');

  const isAnyFailed = [
    sealIntact, noLeakage, tubeIntegrity, needleCondition,
    labelPresence, sterilityCheck, packagingCondition,
    anticoagulantVolumeOk, tubePatency
  ].some(val => val === 'false');

  const updateReport = useUpdateBagInspectionReport();

  const handleSubmit = (e) => {
    e.preventDefault();
    updateReport.mutateAsync({
      id: inspection.id || inspection._id,
      data: {
        reportDate: reportDate || undefined,
        bagNo: bagNo || undefined,
        segmentNo: segmentNo || undefined,
        bloodGroup: inspection.testingType !== 'EMPTY' ? (bloodGroup || undefined) : undefined,
        testResult: testResult || undefined,
        factorVIII: inspection.testingType !== 'EMPTY' && factorVIII ? Number(factorVIII) : undefined,
        fibrinogen: inspection.testingType !== 'EMPTY' && fibrinogen ? Number(fibrinogen) : undefined,
        reportImage: reportImage || null,
        physicalChecks: {
          sealIntact: sealIntact === '' ? undefined : sealIntact === 'true',
          noLeakage: noLeakage === '' ? undefined : noLeakage === 'true',
          tubeIntegrity: tubeIntegrity === '' ? undefined : tubeIntegrity === 'true',
          needleCondition: needleCondition === '' ? undefined : needleCondition === 'true',
          labelPresence: labelPresence === '' ? undefined : labelPresence === 'true',
          sterilityCheck: sterilityCheck === '' ? undefined : sterilityCheck === 'true',
          packagingCondition: packagingCondition === '' ? undefined : packagingCondition === 'true',
        },
        anticoagulantVolumeOk: anticoagulantVolumeOk === '' ? undefined : anticoagulantVolumeOk === 'true',
        tubePatency: tubePatency === '' ? undefined : tubePatency === 'true',
        testingLab: testingLab || undefined,
        sentDate: sentDate || undefined,
        testingStatus: mode === 'update' ? 'REPORT_RECEIVED' : inspection.testingStatus,
        decision: isAnyFailed ? 'REJECTED' : 'ACCEPTED',
        rejectionReason: isAnyFailed ? rejectionReason : undefined,
      }
    }).then(onClose).catch(() => { });
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';
  const selectClass = 'w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white';
  const { onKeyDown: handleFormKeyDown2, onChange: handleFormEnterNavChange2 } = createFormEnterNavHandlers();

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <div>
            <h2 className="text-base font-semibold text-white">Update Quality Report ({TESTING_TYPE_LABELS[inspection.testingType] ?? inspection.testingType})</h2>
            <p className="text-xs text-orange-200 mt-0.5">Batch No: {inspection.batchNumber}</p>
          </div>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown2} onChange={handleFormEnterNavChange2} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Testing Lab {mode !== 'edit' && '*'}</label>
                <input required={mode !== 'edit'} value={testingLab} onChange={(e) => setTestingLab(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Sent Date {mode !== 'edit' && '*'}</label>
                <input required={mode !== 'edit'} type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} className={fieldClass} />
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Date Report Received {mode !== 'edit' && '*'}</label>
              <input required={mode !== 'edit'} type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={fieldClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bag No {mode !== 'edit' && '*'}</label>
                <input required={mode !== 'edit'} value={bagNo} onChange={(e) => setBagNo(e.target.value.toUpperCase())} className={fieldClass} placeholder="e.g. BAG-001" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Segment No {mode !== 'edit' && '*'}</label>
                <input required={mode !== 'edit'} value={segmentNo} onChange={(e) => setSegmentNo(e.target.value.toUpperCase())} className={fieldClass} placeholder="e.g. SEG-99" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Initial Physical Quality Checks</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 border border-gray-100 rounded-lg p-4 bg-gray-50/50 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Seal Intact {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={sealIntact} onChange={(e) => setSealIntact(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">No Leakage {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={noLeakage} onChange={(e) => setNoLeakage(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Tube Integrity {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={tubeIntegrity} onChange={(e) => setTubeIntegrity(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Needle Condition OK {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={needleCondition} onChange={(e) => setNeedleCondition(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Label Present {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={labelPresence} onChange={(e) => setLabelPresence(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Sterility Check {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={sterilityCheck} onChange={(e) => setSterilityCheck(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Packaging Condition {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={packagingCondition} onChange={(e) => setPackagingCondition(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Anticoagulant Volume OK {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={anticoagulantVolumeOk} onChange={(e) => setAnticoagulantVolumeOk(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">Tube Patency {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={tubePatency} onChange={(e) => setTubePatency(e.target.value)} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            {isAnyFailed && (
              <div>
                <label className="block text-xs font-semibold text-red-600 mb-1 uppercase tracking-wide">Rejection Reason {mode !== 'edit' && '*'}</label>
                <textarea
                  required={mode !== 'edit'}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className={`${fieldClass} border-red-200 focus:ring-red-400`}
                  placeholder="Please enter the reason for rejecting this batch..."
                  rows={2}
                />
              </div>
            )}

            {inspection.testingType !== 'EMPTY' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Blood Group {mode !== 'edit' && '*'}</label>
                  <select required={mode !== 'edit'} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={`${fieldClass} bg-white`}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mt-2">Coagulation Work Up Results</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Factor VIII (Unit/mL)</label>
                    <input type="number" step="any" value={factorVIII} onChange={(e) => setFactorVIII(e.target.value)} className={fieldClass} placeholder="e.g. 0.92" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Fibrinogen (mg)</label>
                    <input type="number" step="any" value={fibrinogen} onChange={(e) => setFibrinogen(e.target.value)} className={fieldClass} placeholder="e.g. 250" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Test Result {mode !== 'edit' && '*'}</label>
                  <input required={mode !== 'edit'} value={testResult} onChange={(e) => setTestResult(e.target.value)} className={fieldClass} placeholder="e.g. bag and segment is sterile" />
                </div>
              </>
            )}

            {inspection.testingType === 'EMPTY' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Test Result / Sterile Check</label>
                <input value={testResult} onChange={(e) => setTestResult(e.target.value)} className={fieldClass} placeholder="e.g. bag and segment is sterile" />
              </div>
            )}

            {/* Report Image Upload */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Lab Testing Report Image</label>
              {uploading ? (
                <div className="text-xs text-gray-500 py-2">Uploading image...</div>
              ) : reportImage ? (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                  <div className="flex-1 flex items-center gap-2 truncate">
                    <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-600 truncate">{reportImage.split('/').pop()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete({
                        isOpen: true,
                        title: 'Delete Report Image?',
                        message: 'Are you sure you want to delete this quality testing report image? This action will permanently remove the report attachment.',
                        onConfirm: async () => {
                          try {
                            await deleteFile(reportImage);
                            toast.success('Report image deleted from S3');
                          } catch (err) {
                            console.error('S3 delete failed:', err);
                            toast.error('Failed to delete report image from S3');
                          }
                          setReportImage('');
                        }
                      });
                    }}
                    className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-50 bg-white shadow-sm">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span>Upload Report Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const res = await uploadFile(file, 'bagtestingreport');
                        setReportImage(res.url);
                        toast.success('Report image uploaded successfully');
                      } catch (err) {
                        toast.error(err.message || 'File upload failed');
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={updateReport.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {updateReport.isPending ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Save Report'}
            </button>
          </div>
        </form>
      </div>
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

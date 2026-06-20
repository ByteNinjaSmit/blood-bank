import { useState } from 'react';
import { ClipboardCheck, Plus, X, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { useBagInspectionList, useCreateBagInspection, useUpdateBagInspectionReport } from '../queries';
import { useGRNList } from '../queries';
import { useAuth } from '@/store/auth';
import { apiClient, unwrap } from '@/core/api-client';
import { toast } from 'sonner';

const uploadFile = (file, folder) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/api/v2/upload${folder ? `?folder=${folder}` : ''}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(unwrap);
};

function IframePreviewModal({ isOpen, url, title, onClose }) {
  if (!isOpen || !url) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900">{title || 'Document Viewer'}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 bg-gray-100 p-2">
          <iframe
            src={url}
            title={title}
            className="w-full h-full border-0 rounded-lg bg-white"
          />
        </div>
      </div>
    </div>
  );
}

const DECISION_BADGE = {
  ACCEPTED:   'bg-green-50 text-green-700 border-green-200',
  REJECTED:   'bg-red-50 text-red-700 border-red-200',
  QUARANTINE: 'bg-orange-50 text-orange-700 border-orange-200',
};

const TESTING_TYPE_LABELS = {
  EMPTY: 'Empty Blood Bag',
  WB: 'Whole Blood (WB)',
  PRBC: 'Packed Red Blood Cells (PRBC / PCV)',
  FFP: 'Fresh Frozen Plasma (FFP)',
  PC: 'Platelet Concentrate (PC / RDP)',
  CRYO: 'Cryoprecipitate',
  OTHER: 'Other Blood Bag',
};

const PHYSICAL_CHECKS = [
  { key: 'sealIntact',           label: 'Seal Intact' },
  { key: 'noLeakage',            label: 'No Leakage' },
  { key: 'tubeIntegrity',        label: 'Tube Integrity' },
  { key: 'needleCondition',      label: 'Needle Condition OK' },
  { key: 'labelPresence',        label: 'Label Present' },
  { key: 'sterilityCheck',       label: 'Sterility Check' },
  { key: 'packagingCondition',   label: 'Packaging Condition' },
];

const EMPTY_FORM = {
  grnId: '', batchNumber: '', sampleSize: '',
  sealIntact: false, noLeakage: false, tubeIntegrity: false,
  needleCondition: false, labelPresence: false, sterilityCheck: false,
  packagingCondition: false, anticoagulantVolumeOk: false, tubePatency: false,
  observation: '', decision: 'ACCEPTED', rejectionReason: '',
  sendForTesting: false,
  testingType: 'EMPTY',
  sentDate: new Date().toISOString().split('T')[0],
  testingLab: 'Arpan Blood Center, Nashik',
  customTestingLab: '',
};

function DecisionBadge({ decision }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${DECISION_BADGE[decision] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {decision}
    </span>
  );
}

function InspectionDrawer({ onClose, grns }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    grnId: '',
    batchNumber: '',
    sampleSize: 1,
    testingType: 'EMPTY',
    sentDate: new Date().toISOString().split('T')[0],
    testingLab: 'Arpan Blood Center, Nashik',
    customTestingLab: '',
    bagNo: '',
    segmentNo: '',
  });
  const createInspection = useCreateBagInspection();

  const selectedGrn = (grns ?? []).find((g) => g._id === form.grnId);
  const batches = selectedGrn?.batchLines ?? [];
  const selectedBatch = batches.find((b) => b.batchNumber === form.batchNumber);

  // Recommended quantity calculation: 1 bag per batch / per 100 bags
  const recommendedQty = selectedBatch ? Math.ceil(selectedBatch.quantityReceived / 100) : 1;

  const handleGrnChange = (e) => {
    const grnId = e.target.value;
    const grn = (grns ?? []).find((g) => g._id === grnId);
    const firstBatch = grn?.batchLines?.[0];
    const firstBatchNo = firstBatch?.batchNumber ?? '';
    const recQty = firstBatch ? Math.ceil(firstBatch.quantityReceived / 100) : 1;
    
    setForm((f) => ({
      ...f,
      grnId,
      batchNumber: firstBatchNo,
      sampleSize: recQty,
    }));
  };

  const handleBatchChange = (e) => {
    const batchNumber = e.target.value;
    const batch = batches.find((b) => b.batchNumber === batchNumber);
    const recQty = batch ? Math.ceil(batch.quantityReceived / 100) : 1;
    setForm((f) => ({
      ...f,
      batchNumber,
      sampleSize: recQty,
    }));
  };

  const setField = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { grnId, batchNumber, sampleSize, testingType, sentDate, testingLab, customTestingLab, bagNo, segmentNo } = form;
    const labName = testingLab === 'Others' ? customTestingLab : testingLab;

    createInspection.mutateAsync({
      grnId,
      batchNumber,
      sampleSize: Number(sampleSize),
      inspectionDate: new Date(),
      inspectedById: user?.id ?? user?._id ?? '000000000000000000000000',
      decision: 'ACCEPTED',
      physicalChecks: {
        sealIntact: true,
        noLeakage: true,
        tubeIntegrity: true,
        needleCondition: true,
        labelPresence: true,
        sterilityCheck: true,
        packagingCondition: true,
      },
      anticoagulantVolumeOk: true,
      tubePatency: true,
      testingType,
      sentDate,
      testingLab: labName,
      bagNo,
      segmentNo,
    }).then(onClose).catch(() => {});
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">Send Bag for Lab Testing</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">GRN *</label>
              <select required value={form.grnId} onChange={handleGrnChange} className={`${fieldClass} bg-white`}>
                <option value="">Select GRN...</option>
                {(grns ?? []).map((g) => (
                  <option key={g._id} value={g._id}>{g.grnNumber} — {g.invoiceNo || 'No Invoice'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Batch Number *</label>
              <select required value={form.batchNumber} onChange={handleBatchChange} className={`${fieldClass} bg-white`} disabled={!form.grnId}>
                <option value="">Select Batch...</option>
                {batches.map((b) => (
                  <option key={b.batchNumber} value={b.batchNumber}>{b.batchNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Sample Size (Bags to Test) *</label>
              <input required type="number" min="1" value={form.sampleSize} onChange={setField('sampleSize')} className={fieldClass} />
            </div>
            {selectedBatch && (
              <div className="col-span-2 text-xs text-orange-800 bg-orange-50 p-2.5 rounded border border-orange-100">
                <span className="font-bold">Batch info:</span> {selectedBatch.bagType} ({selectedBatch.capacityMl} mL), 
                <span className="font-bold ml-2">Qty Received:</span> {selectedBatch.quantityReceived} units. 
                <span className="font-bold ml-2">Recommended test sample:</span> {recommendedQty} {recommendedQty === 1 ? 'bag' : 'bags'}.
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 border-t">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Laboratory Testing Configuration</div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Testing Type *</label>
              <select required value={form.testingType} onChange={setField('testingType')} className={`${fieldClass} bg-white`}>
                <option value="EMPTY">Empty Blood Bag</option>
                <option value="WB">Whole Blood (WB)</option>
                <option value="PRBC">Packed Red Blood Cells (PRBC / PCV)</option>
                <option value="FFP">Fresh Frozen Plasma (FFP)</option>
                <option value="PC">Platelet Concentrate (PC / RDP)</option>
                <option value="CRYO">Cryoprecipitate</option>
                <option value="OTHER">Other Blood Bag</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bag No *</label>
                <input required value={form.bagNo} onChange={setField('bagNo')} className={fieldClass} placeholder="e.g. BAG-001" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Segment No *</label>
                <input required value={form.segmentNo} onChange={setField('segmentNo')} className={fieldClass} placeholder="e.g. SEG-99" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Date Sent for Testing *</label>
              <input required type="date" value={form.sentDate} onChange={setField('sentDate')} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Testing Lab *</label>
              <select required value={form.testingLab} onChange={setField('testingLab')} className={`${fieldClass} bg-white`}>
                <option value="Arpan Blood Center, Nashik">Arpan Blood Center, Nashik</option>
                <option value="Metropolis The Pathology Specialist">Metropolis The Pathology Specialist</option>
                <option value="Others">Others (Enter manually)</option>
              </select>
            </div>
            {form.testingLab === 'Others' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Enter Lab Name *</label>
                <input required value={form.customTestingLab} onChange={setField('customTestingLab')} className={fieldClass} placeholder="Enter name of laboratory" />
              </div>
            )}
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createInspection.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {createInspection.isPending ? 'Sending…' : 'Send for Testing'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function UpdateReportDrawer({ onClose, inspection }) {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [bagNo, setBagNo] = useState(inspection.bagNo || '');
  const [segmentNo, setSegmentNo] = useState(inspection.segmentNo || '');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [testResult, setTestResult] = useState(inspection.testResult || '');
  const [factorVIII, setFactorVIII] = useState('');
  const [fibrinogen, setFibrinogen] = useState('');
  const [reportImage, setReportImage] = useState(inspection.reportImage || '');
  const [uploading, setUploading] = useState(false);
  
  const updateReport = useUpdateBagInspectionReport();

  const handleSubmit = (e) => {
    e.preventDefault();
    updateReport.mutateAsync({
      id: inspection.id || inspection._id,
      data: {
        reportDate,
        bagNo,
        segmentNo,
        bloodGroup: inspection.testingType !== 'EMPTY' ? bloodGroup : undefined,
        testResult: testResult || undefined,
        factorVIII: inspection.testingType === 'EMPTY' && factorVIII ? Number(factorVIII) : undefined,
        fibrinogen: inspection.testingType === 'EMPTY' && fibrinogen ? Number(fibrinogen) : undefined,
        reportImage: reportImage || null,
      }
    }).then(onClose).catch(() => {});
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-500 uppercase font-semibold">Testing Lab:</span>
              <span className="text-sm font-medium text-gray-800 ml-2">{inspection.testingLab}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase font-semibold">Sent Date:</span>
              <span className="text-sm font-medium text-gray-800 ml-2">
                {inspection.sentDate ? new Date(inspection.sentDate).toLocaleDateString('en-IN') : '—'}
              </span>
            </div>

            <hr className="border-gray-100" />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Date Report Received *</label>
              <input required type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={fieldClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bag No *</label>
                <input required disabled value={bagNo} onChange={(e) => setBagNo(e.target.value)} className={`${fieldClass} bg-gray-50 cursor-not-allowed`} placeholder="e.g. BAG-001" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Segment No *</label>
                <input required disabled value={segmentNo} onChange={(e) => setSegmentNo(e.target.value)} className={`${fieldClass} bg-gray-50 cursor-not-allowed`} placeholder="e.g. SEG-99" />
              </div>
            </div>

            {inspection.testingType !== 'EMPTY' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Blood Group *</label>
                  <select required value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={`${fieldClass} bg-white`}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Test Result *</label>
                  <input required value={testResult} onChange={(e) => setTestResult(e.target.value)} className={fieldClass} placeholder="e.g. bag and segment is sterile" />
                </div>
              </>
            )}

            {inspection.testingType === 'EMPTY' && (
              <>
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Test Result / Sterile Check</label>
                  <input value={testResult} onChange={(e) => setTestResult(e.target.value)} className={fieldClass} placeholder="e.g. bag and segment is sterile" />
                </div>
              </>
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
                    onClick={() => setReportImage('')}
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
              {updateReport.isPending ? 'Saving…' : 'Save Report'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function ViewInspectionModal({ onClose, inspection, onViewReportImage }) {
  if (!inspection) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800 text-white">
            <div>
              <h2 className="text-base font-semibold text-white">Inspection & QC Report Details</h2>
              <p className="text-[10px] text-orange-200 font-medium uppercase tracking-wider mt-0.5">
                Batch No: {inspection.batchNumber}
              </p>
            </div>
            <button onClick={onClose} className="text-orange-200 hover:text-white">
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
            {inspection.reportImage && (
              <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-0.5">Laboratory Report Document</span>
                  <span className="text-xs text-gray-600">Attached image of lab report is available.</span>
                </div>
                <button
                  onClick={() => onViewReportImage(inspection.reportImage)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-800 hover:bg-orange-900 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> View Report Document
                </button>
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

export default function BagInspection() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  const { data, isLoading } = useBagInspectionList({});
  const { data: grnData } = useGRNList({});

  const inspections = data?.items ?? data?.bagInspections ?? (Array.isArray(data) ? data : []);
  const grns        = grnData?.items ?? grnData?.goodsReceipts ?? (Array.isArray(grnData) ? grnData : []);

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bag Quality Inspection</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Incoming Batch QC</p>
            </div>
          </div>
          <button onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
            <Plus className="w-4 h-4" /> New Inspection
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Batch No', 'GRN Ref', 'Inspection Date', 'Decision', 'Testing Status', 'Results', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : inspections.map((ins) => (
                  <tr key={ins._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{ins.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ins.grn?.grnNumber ?? ins.grnId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(ins.inspectionDate ?? ins.createdAt)}</td>
                    <td className="px-4 py-3"><DecisionBadge decision={ins.decision} /></td>
                    <td className="px-4 py-3">
                      {ins.testingType ? (
                        ins.testingStatus === 'SENT' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                            Under Testing ({TESTING_TYPE_LABELS[ins.testingType] ?? ins.testingType})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            Report Received
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                      {ins.testingStatus === 'REPORT_RECEIVED' ? (
                        <div className="space-y-0.5">
                          <div><span className="font-semibold text-gray-500">Lab:</span> {ins.testingLab}</div>
                          <div><span className="font-semibold text-gray-500">Bag/Seg:</span> {ins.bagNo || '—'} / {ins.segmentNo || '—'}</div>
                          {ins.testingType === 'EMPTY' ? (
                            <div>
                              <span className="font-semibold text-gray-500">Factor VIII:</span> {ins.factorVIII ?? '—'} Unit/mL, 
                              <span className="font-semibold text-gray-500 ml-1">Fibrinogen:</span> {ins.fibrinogen ?? '—'} mg
                            </div>
                          ) : (
                            <div><span className="font-semibold text-gray-500">BG / Result:</span> {ins.bloodGroup || '—'} / {ins.testResult || '—'}</div>
                          )}
                        </div>
                      ) : ins.testingStatus === 'SENT' ? (
                        <span className="text-gray-400">Sent to: {ins.testingLab}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        {ins.testingStatus === 'SENT' && (
                          <button
                            onClick={() => {
                              setSelectedInspection(ins);
                              setShowReportDrawer(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                          >
                            Update Report
                          </button>
                        )}
                        {ins.testingStatus === 'REPORT_RECEIVED' && (
                          <button
                            onClick={() => {
                              setSelectedInspection(ins);
                              setShowViewModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            View Report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <InspectionDrawer onClose={() => setShowDrawer(false)} grns={grns} />}
      {showReportDrawer && selectedInspection && (
        <UpdateReportDrawer
          onClose={() => {
            setShowReportDrawer(false);
            setSelectedInspection(null);
          }}
          inspection={selectedInspection}
        />
      )}
      {showViewModal && selectedInspection && (
        <ViewInspectionModal
          onClose={() => {
            setShowViewModal(false);
            setSelectedInspection(null);
          }}
          inspection={selectedInspection}
          onViewReportImage={(url) => {
            setPreviewUrl(url);
            setPreviewTitle(`Lab Report Document: Batch ${selectedInspection.batchNumber}`);
          }}
        />
      )}
      <IframePreviewModal
        isOpen={!!previewUrl}
        url={previewUrl}
        title={previewTitle}
        onClose={() => setPreviewUrl('')}
      />
    </div>
  );
}

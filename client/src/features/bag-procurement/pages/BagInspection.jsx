import { useState } from 'react';
import { ClipboardCheck, Plus, X, Upload, FileText, Image as ImageIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { useBagInspectionList, useCreateBagInspection, useUpdateBagInspectionReport } from '../queries';
import { useGRNList } from '../queries';
import { useDonationList } from '@/features/donation/queries';
import { useAuth } from '@/store/auth';
import { bagProcurementApi } from '../api';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import IframePreviewModal from '@/components/shared/IframePreviewModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { exportProcurementInspection } from '@/utils/excelExportHelper';

const uploadFile = bagProcurementApi.upload.file;
const deleteFile = bagProcurementApi.upload.remove;

const DECISION_BADGE = {
  ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  QUARANTINE: 'bg-orange-50 text-orange-700 border-orange-200',
};

const TESTING_TYPE_LABELS = {
  EMPTY: 'Empty Blood Bag',
  WB: 'Whole Blood (WB)',
  PRBC: 'Packed Red Blood Cells (PRBC / PCV)',
  FFP: 'Fresh Frozen Plasma (FFP)',
  RDP: 'Random Donor Platelets (RDP)',
  CRYO: 'Cryoprecipitate',
  OTHER: 'Other Blood Bag',
};

const PHYSICAL_CHECKS = [
  { key: 'sealIntact', label: 'Seal Intact' },
  { key: 'noLeakage', label: 'No Leakage' },
  { key: 'tubeIntegrity', label: 'Tube Integrity' },
  { key: 'needleCondition', label: 'Needle Condition OK' },
  { key: 'labelPresence', label: 'Label Present' },
  { key: 'sterilityCheck', label: 'Sterility Check' },
  { key: 'packagingCondition', label: 'Packaging Condition' },
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
  const { data: donationData } = useDonationList({ pageSize: 1000 });
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
    bloodGroup: 'A+',
    sealIntact: '',
    noLeakage: '',
    tubeIntegrity: '',
    needleCondition: '',
    labelPresence: '',
    sterilityCheck: '',
    packagingCondition: '',
    anticoagulantVolumeOk: '',
    tubePatency: '',
    rejectionReason: '',
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

  const donationsList = donationData?.items ?? donationData?.donations ?? (Array.isArray(donationData) ? donationData : []);
  const filteredDonations = donationsList.filter(
    (d) => d.bloodGroup === form.bloodGroup && d.bagNo
  );
  const uniqueDonations = [];
  const seenBags = new Set();
  for (const d of filteredDonations) {
    if (!seenBags.has(d.bagNo)) {
      seenBags.add(d.bagNo);
      uniqueDonations.push(d);
    }
  }

  const isAnyFailed = [
    form.sealIntact, form.noLeakage, form.tubeIntegrity, form.needleCondition,
    form.labelPresence, form.sterilityCheck, form.packagingCondition,
    form.anticoagulantVolumeOk, form.tubePatency
  ].some(val => val === 'false');

  const handleSubmit = (e) => {
    e.preventDefault();
    const { grnId, batchNumber, sampleSize, testingType, sentDate, testingLab, customTestingLab, bagNo, segmentNo, bloodGroup } = form;
    const labName = testingLab === 'Others' ? customTestingLab : testingLab;
    const decision = isAnyFailed ? 'REJECTED' : 'ACCEPTED';

    createInspection.mutateAsync({
      grnId,
      batchNumber,
      sampleSize: Number(sampleSize),
      inspectionDate: new Date(),
      inspectedById: user?.id ?? user?._id ?? '000000000000000000000000',
      decision,
      physicalChecks: {
        sealIntact: form.sealIntact === 'true',
        noLeakage: form.noLeakage === 'true',
        tubeIntegrity: form.tubeIntegrity === 'true',
        needleCondition: form.needleCondition === 'true',
        labelPresence: form.labelPresence === 'true',
        sterilityCheck: form.sterilityCheck === 'true',
        packagingCondition: form.packagingCondition === 'true',
      },
      anticoagulantVolumeOk: form.anticoagulantVolumeOk === 'true',
      tubePatency: form.tubePatency === 'true',
      testingType,
      sentDate,
      testingLab: labName,
      bagNo,
      segmentNo,
      bloodGroup: testingType !== 'EMPTY' ? bloodGroup : undefined,
      rejectionReason: isAnyFailed ? form.rejectionReason : undefined,
    }).then(onClose).catch(() => { });
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
                <option value="RDP">Random Donor Platelets (RDP)</option>
                <option value="CRYO">Cryoprecipitate</option>
                <option value="OTHER">Other Blood Bag</option>
              </select>
            </div>
            {form.testingType !== 'EMPTY' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Blood Group *</label>
                <select 
                  required 
                  value={form.bloodGroup || 'A+'} 
                  onChange={(e) => {
                    const bg = e.target.value;
                    setForm(f => ({ ...f, bloodGroup: bg, bagNo: '', segmentNo: '' }));
                  }} 
                  className={`${fieldClass} bg-white`}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bag No *</label>
                {form.testingType === 'EMPTY' ? (
                  <input required value={form.bagNo} onChange={setField('bagNo')} className={fieldClass} placeholder="e.g. BAG-001" />
                ) : (
                  <select
                    required
                    value={form.bagNo}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = uniqueDonations.find(d => d.bagNo === val);
                      setForm(f => ({
                        ...f,
                        bagNo: val,
                        segmentNo: matched ? matched.segmentNo || '' : f.segmentNo
                      }));
                    }}
                    className={`${fieldClass} bg-white`}
                  >
                    <option value="">Select Bag...</option>
                    {uniqueDonations.map(d => (
                      <option key={d.bagNo} value={d.bagNo}>
                        {d.bagNo}
                      </option>
                    ))}
                  </select>
                )}
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

            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Initial Physical Quality Checks</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 border border-gray-100 rounded-lg p-4 bg-gray-50/50 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Seal Intact *</label>
                  <select required value={form.sealIntact} onChange={setField('sealIntact')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">No Leakage *</label>
                  <select required value={form.noLeakage} onChange={setField('noLeakage')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Tube Integrity *</label>
                  <select required value={form.tubeIntegrity} onChange={setField('tubeIntegrity')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Needle Condition OK *</label>
                  <select required value={form.needleCondition} onChange={setField('needleCondition')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Label Present *</label>
                  <select required value={form.labelPresence} onChange={setField('labelPresence')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Sterility Check *</label>
                  <select required value={form.sterilityCheck} onChange={setField('sterilityCheck')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Packaging Condition *</label>
                  <select required value={form.packagingCondition} onChange={setField('packagingCondition')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Anticoagulant Volume OK *</label>
                  <select required value={form.anticoagulantVolumeOk} onChange={setField('anticoagulantVolumeOk')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">Tube Patency *</label>
                  <select required value={form.tubePatency} onChange={setField('tubePatency')} className={fieldClass}>
                    <option value="">Select...</option>
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            {isAnyFailed && (
              <div>
                <label className="block text-xs font-semibold text-red-600 mb-1 uppercase tracking-wide">Rejection Reason *</label>
                <textarea
                  required
                  value={form.rejectionReason}
                  onChange={setField('rejectionReason')}
                  className={`${fieldClass} border-red-200 focus:ring-red-400`}
                  placeholder="Please enter the reason for rejecting this batch..."
                  rows={2}
                />
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

function UpdateReportDrawer({ onClose, inspection, mode }) {
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
                <input required={mode !== 'edit'} value={bagNo} onChange={(e) => setBagNo(e.target.value)} className={fieldClass} placeholder="e.g. BAG-001" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Segment No {mode !== 'edit' && '*'}</label>
                <input required={mode !== 'edit'} value={segmentNo} onChange={(e) => setSegmentNo(e.target.value)} className={fieldClass} placeholder="e.g. SEG-99" />
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

function ViewInspectionModal({ onClose, inspection, onViewReportImage, onEdit }) {
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
        </div>
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

export default function BagInspection() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [drawerMode, setDrawerMode] = useState('update'); // 'update' or 'edit'

  // Preview state
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [excelLoading, setExcelLoading] = useState(false);

  const mapInspectionForExport = (items) => {
    return items.map(ins => ({
      inspectionId: ins.inspectionId || ins._id,
      batchNo: ins.batchNumber,
      poNumber: ins.grn?.poNumber || ins.poNumber || '—',
      bagNo: ins.bagNo,
      segmentNo: ins.segmentNo,
      bloodGroup: ins.bloodGroup,
      sampleSize: ins.sampleSize,
      testingType: ins.testingType,
      testingLab: ins.testingLab === 'Other' ? (ins.customTestingLab || 'Other') : ins.testingLab,
      inspectionDate: ins.inspectionDate || ins.createdAt,
      inspectorName: ins.inspectedBy?.name || ins.inspectorName || '—',
      status: ins.decision || ins.status || '—',
      physicalChecks: ins.physicalChecks || {},
    }));
  };

  const handleExportExcel = async (_exportAll = false) => {
    try {
      setExcelLoading(true);
      const dataToExport = mapInspectionForExport(inspections);

      if (dataToExport.length === 0) {
        toast.info("No inspections to export");
        return;
      }

      await exportProcurementInspection(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  const [decisionFilter, setDecisionFilter] = useState('');
  const [batchNumberFilter, setBatchNumberFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { data, isLoading, refetch, isFetching } = useBagInspectionList({
    decision: decisionFilter || undefined,
    batchNumber: batchNumberFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const { data: grnData } = useGRNList({});

  const inspections = data?.items ?? data?.bagInspections ?? (Array.isArray(data) ? data : []);
  const grns = grnData?.items ?? grnData?.goodsReceipts ?? (Array.isArray(grnData) ? grnData : []);

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <ClipboardCheck className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bag Quality Inspection</h1>
              <p className="text-gray-500 text-sm">Incoming Batch QC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
            <button onClick={() => setShowDrawer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
              <Plus className="w-4 h-4" /> New Inspection
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Batch No</label>
            <input value={batchNumberFilter} onChange={(e) => setBatchNumberFilter(e.target.value)} placeholder="Search batch..."
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Decision</label>
            <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">All Decisions</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="QUARANTINE">Quarantine</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Inspection From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Inspection To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {(decisionFilter || batchNumberFilter || fromDate || toDate) && (
            <button onClick={() => { setDecisionFilter(''); setBatchNumberFilter(''); setFromDate(''); setToDate(''); }}
              className="px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 rounded-lg font-medium">
              Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Batch No', 'Inspection Date', 'Decision', 'Testing Status', 'Results', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : inspections.map((ins) => (
                  <tr key={ins._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{ins.batchNumber}</td>
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
                          <>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins);
                                setDrawerMode('update');
                                setShowReportDrawer(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                            >
                              Update Report
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins);
                                setDrawerMode('edit');
                                setShowReportDrawer(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              Edit Report
                            </button>
                          </>
                        )}
                        {ins.testingStatus === 'REPORT_RECEIVED' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins);
                                setShowViewModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              View Report
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins);
                                setDrawerMode('edit');
                                setShowReportDrawer(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              Edit Report
                            </button>
                          </>
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
          mode={drawerMode}
        />
      )}
      {showViewModal && selectedInspection && (
        <ViewInspectionModal
          onClose={() => {
            setShowViewModal(false);
            setSelectedInspection(null);
          }}
          inspection={inspections.find(ins => (ins._id ?? ins.id) === (selectedInspection?._id ?? selectedInspection?.id)) || selectedInspection}
          onViewReportImage={(url) => {
            setPreviewUrl(url);
            setPreviewTitle(`Lab Report Document: Batch ${selectedInspection.batchNumber}`);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setDrawerMode('edit');
            setShowReportDrawer(true);
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

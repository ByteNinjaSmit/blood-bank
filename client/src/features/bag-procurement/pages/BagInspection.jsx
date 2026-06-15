import { useState } from 'react';
import { ClipboardCheck, Plus, X } from 'lucide-react';
import { useBagInspectionList, useCreateBagInspection, useUpdateBagInspectionReport } from '../queries';
import { useGRNList } from '../queries';
import { useAuth } from '@/store/auth';

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
  const [testResult, setTestResult] = useState('bag and segment is sterile');
  const [factorVIII, setFactorVIII] = useState('');
  const [fibrinogen, setFibrinogen] = useState('');
  
  const updateReport = useUpdateBagInspectionReport();

  const handleSubmit = (e) => {
    e.preventDefault();
    updateReport.mutateAsync({
      id: inspection._id,
      data: {
        reportDate,
        bagNo,
        segmentNo,
        bloodGroup: inspection.testingType !== 'EMPTY' ? bloodGroup : undefined,
        testResult: testResult || undefined,
        factorVIII: inspection.testingType === 'EMPTY' && factorVIII ? Number(factorVIII) : undefined,
        fibrinogen: inspection.testingType === 'EMPTY' && fibrinogen ? Number(fibrinogen) : undefined,
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

export default function BagInspection() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  
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
                  {['Inspection ID', 'Batch No', 'GRN Ref', 'Inspection Date', 'Inspector', 'Decision', 'Testing Status', 'Results', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : inspections.map((ins) => (
                  <tr key={ins._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{ins.inspectionId ?? ins._id?.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{ins.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ins.grn?.grnNumber ?? ins.grnId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(ins.inspectionDate ?? ins.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{ins.inspector?.name ?? ins.inspectedBy ?? '—'}</td>
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
    </div>
  );
}

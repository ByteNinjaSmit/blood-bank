import { useState } from 'react';
import { ClipboardCheck, Plus, X } from 'lucide-react';
import { useBagInspectionList, useCreateBagInspection } from '../queries';
import { useGRNList } from '../queries';

const DECISION_BADGE = {
  ACCEPTED:   'bg-green-50 text-green-700 border-green-200',
  REJECTED:   'bg-red-50 text-red-700 border-red-200',
  QUARANTINE: 'bg-orange-50 text-orange-700 border-orange-200',
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
};

function DecisionBadge({ decision }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${DECISION_BADGE[decision] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {decision}
    </span>
  );
}

function InspectionDrawer({ onClose, grns }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const createInspection = useCreateBagInspection();

  const setField = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { grnId, batchNumber, sampleSize, observation, decision, rejectionReason, ...checks } = form;
    createInspection.mutateAsync({
      grnId,
      batchNumber,
      sampleSize: Number(sampleSize),
      physicalChecks: {
        sealIntact:          checks.sealIntact,
        noLeakage:           checks.noLeakage,
        tubeIntegrity:       checks.tubeIntegrity,
        needleCondition:     checks.needleCondition,
        labelPresence:       checks.labelPresence,
        sterilityCheck:      checks.sterilityCheck,
        packagingCondition:  checks.packagingCondition,
      },
      anticoagulantVolumeOk: checks.anticoagulantVolumeOk,
      tubePatency:           checks.tubePatency,
      observation,
      decision,
      rejectionReason: decision !== 'ACCEPTED' ? rejectionReason : undefined,
    }).then(onClose).catch(() => {});
  };

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">New Bag Inspection</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">GRN *</label>
              <select required value={form.grnId} onChange={setField('grnId')} className={`${fieldClass} bg-white`}>
                <option value="">Select GRN...</option>
                {(grns ?? []).map((g) => (
                  <option key={g._id} value={g._id}>{g.grnNumber} — {g.invoiceNo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Batch Number *</label>
              <input required value={form.batchNumber} onChange={setField('batchNumber')} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Sample Size *</label>
              <input required type="number" value={form.sampleSize} onChange={setField('sampleSize')} className={fieldClass} />
            </div>
          </div>

          {/* Physical Checks */}
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Physical Checks</div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              {PHYSICAL_CHECKS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={form[key]} onChange={setField(key)}
                    className="w-4 h-4 rounded text-orange-700 border-gray-300 focus:ring-orange-400" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={form.anticoagulantVolumeOk} onChange={setField('anticoagulantVolumeOk')}
                  className="w-4 h-4 rounded text-orange-700 border-gray-300 focus:ring-orange-400" />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Anticoagulant Volume OK</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={form.tubePatency} onChange={setField('tubePatency')}
                  className="w-4 h-4 rounded text-orange-700 border-gray-300 focus:ring-orange-400" />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Tube Patency</span>
              </label>
            </div>
          </div>

          {/* Observation & Decision */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Observation</label>
            <textarea value={form.observation} onChange={setField('observation')} rows={2}
              className={`${fieldClass} resize-none`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Decision *</label>
            <select required value={form.decision} onChange={setField('decision')} className={`${fieldClass} bg-white`}>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="QUARANTINE">QUARANTINE</option>
            </select>
          </div>
          {form.decision !== 'ACCEPTED' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Rejection Reason</label>
              <input value={form.rejectionReason} onChange={setField('rejectionReason')} className={fieldClass} />
            </div>
          )}

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createInspection.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {createInspection.isPending ? 'Saving…' : 'Submit Inspection'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function BagInspection() {
  const [showDrawer, setShowDrawer] = useState(false);
  const { data, isLoading } = useBagInspectionList({});
  const { data: grnData } = useGRNList({});

  const inspections = data?.bagInspections ?? data ?? [];
  const grns        = grnData?.goodsReceipts ?? grnData ?? [];

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
                  {['Inspection ID', 'Batch No', 'GRN Ref', 'Inspection Date', 'Inspector', 'Sample Size', 'Decision'].map((h) => (
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
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{ins.inspectionId ?? ins._id?.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{ins.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ins.grn?.grnNumber ?? ins.grnId}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(ins.inspectionDate ?? ins.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{ins.inspector?.name ?? ins.inspectedBy ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{ins.sampleSize}</td>
                    <td className="px-4 py-3"><DecisionBadge decision={ins.decision} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <InspectionDrawer onClose={() => setShowDrawer(false)} grns={grns} />}
    </div>
  );
}

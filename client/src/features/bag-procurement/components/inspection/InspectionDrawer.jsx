import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateBagInspection } from '../../queries';
import { useDonationList } from '@/features/donation/queries';
import { useAuth } from '@/store/auth';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';

export default function InspectionDrawer({ onClose, grns }) {
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
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">Send Bag for Lab Testing</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="flex-1 overflow-y-auto p-6 space-y-5">
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

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import requisitionApi from '@/services/requisitionApi';
import CustomModal from '@/components/CustomModal';

const COMPATIBILITY_RESULT_LABELS = {
  MAJOR_COMPATIBLE: 'Major Compatible',
  MINOR_COMPATIBLE: 'Minor Compatible',
  UNIVERSAL: 'Universal',
};

export default function RequisitionModals({
  viewOpen, closeView, viewDoc, viewLoading, fmt, componentFulfillment, handleOpenReject,
  issueModalOpen, setIssueModalOpen, issueDoc, setIssueDoc, issueLoading, issuingRowId, setIssuingRowId, fetchList,
  multiLabelModalOpen, setMultiLabelModalOpen, multiLabelDoc, setMultiLabelDoc, printSingleLabel,
}) {
  return (
    <>
      <CustomModal open={viewOpen} onCancel={closeView} title="Requisition Details" size="3xl" hideFooter>
        {!viewDoc || viewLoading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600">Request ID</div>
                <div className="font-medium">{viewDoc.requestId}</div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-medium capitalize">{viewDoc.status}</div>
              </div>
              <div>
                <div className="text-gray-600">Hospital</div>
                <div className="font-medium">{viewDoc.hospitalId?.name}</div>
              </div>
              <div>
                <div className="text-gray-600">Requested At</div>
                <div className="font-medium">{fmt(viewDoc.requestedAt)}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="text-gray-600">Patient</div>
                <div className="font-medium">{viewDoc.patient?.name} • {viewDoc.patient?.age}/{viewDoc.patient?.sex} • Patient ID: {viewDoc.patient?.patientPublicId || '—'} • MRN: {viewDoc.patient?.mrn || '—'}</div>
                {viewDoc.patient?.address && (
                  <div className="text-xs text-gray-500 mt-0.5">{viewDoc.patient.address}</div>
                )}
              </div>
              <div>
                <div className="text-gray-600">Doctor</div>
                <div className="font-medium">{viewDoc.doctorName || '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Indication for Transfusion</div>
                <div className="font-medium">{viewDoc.patient?.indication || '—'}</div>
              </div>
            </div>
            {(() => {
              // One crossmatch card covers the whole requisition — pull the
              // single card number off whichever matched unit recorded it,
              // rather than repeating it per row in the inventory table.
              const cardNumber = viewDoc.matchedInventory?.find((mi) => mi?.cardNumber)?.cardNumber;
              return cardNumber ? (
                <div>
                  <div className="text-gray-600">Card No.</div>
                  <div className="font-medium font-mono">{cardNumber}</div>
                </div>
              ) : null;
            })()}
            {viewDoc.status === 'rejected' && (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-950 text-sm space-y-2">
                <div className="font-semibold flex items-center gap-2 text-red-800">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  Requisition Request Rejected
                </div>
                <p className="text-red-750">
                  This request has been rejected. No further actions (match, approve, issue, complete) are allowed.
                </p>
                {viewDoc.rejectionReason && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-red-150 shadow-sm">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider block mb-1">Reason for Rejection</span>
                    <p className="font-medium text-red-950 font-serif leading-relaxed italic">
                      "{viewDoc.rejectionReason}"
                    </p>
                    {(viewDoc.rejectedAt || viewDoc.rejectedBy) && (
                      <div className="mt-2 text-xs text-red-500/80 flex flex-wrap gap-x-3 gap-y-1 border-t border-red-100 pt-1.5 font-medium">
                        {viewDoc.rejectedBy && (
                          <span>Rejected By: <strong className="text-red-700">{viewDoc.rejectedBy?.name || viewDoc.rejectedBy?.username || viewDoc.rejectedBy}</strong></span>
                        )}
                        {viewDoc.rejectedAt && (
                          <span>Rejected At: <strong className="text-red-700">{fmt(viewDoc.rejectedAt)}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div>
              <h4 className="font-semibold mb-2">Requested Components</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-2">Component</th>
                      <th className="p-2">Units</th>
                      <th className="p-2">Group</th>
                      <th className="p-2">Rh</th>
                      <th className="p-2">Urgency</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDoc.requestedComponents?.map((c, idx) => {
                      const fulfillment = viewDoc.status === 'rejected'
                        ? null
                        : componentFulfillment(viewDoc, c);
                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{c.componentType}</td>
                          <td className="p-2">{c.units}</td>
                          <td className="p-2">{c.bloodGroup}</td>
                          <td className="p-2">{c.rh}</td>
                          <td className="p-2 capitalize">{c.urgency}</td>
                          <td className="p-2">
                            {fulfillment && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${fulfillment.className}`}>
                                {fulfillment.label}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Matched/Reserved Inventory</h4>
              {viewDoc?.status !== 'rejected' && viewDoc?.matchedInventory?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="p-2">Component</th>
                        <th className="p-2">Bag No</th>
                        <th className="p-2">Segment No</th>
                        <th className="p-2">Blood</th>
                        <th className="p-2">Quantity (mL)</th>
                        <th className="p-2">Donor Name</th>
                        <th className="p-2">Day of Donation</th>
                        <th className="p-2">Reserved At</th>
                        <th className="p-2">Compatibility</th>
                        <th className="p-2">Crossmatch Done At</th>
                        <th className="p-2">Seen At</th>
                        <th className="p-2">Issue ID</th>
                        <th className="p-2">Issue Date</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDoc.matchedInventory.map((mi, i) => {
                        const st = mi?.inventoryId?.status;
                        let badgeColor = 'bg-gray-50 border border-gray-200 text-gray-600';
                        let label = 'Unavailable';
                        if (st === 'ISSUED') {
                          badgeColor = 'bg-green-50 border border-green-200 text-green-700';
                          label = 'Issued';
                        } else if (st === 'RESERVED' || st === 'CROSSMATCHED') {
                          badgeColor = 'bg-blue-50 border border-blue-200 text-blue-700';
                          label = 'Reserved';
                        }

                        return (
                          <tr key={i} className="border-t">
                            <td className="p-2">{mi?.inventoryId?.componentId?.componentType || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo?.bagNo || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo?.segmentNo || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo ? `${mi.inventoryId.bagNo.bloodGroup} ${mi.inventoryId.bagNo.rh}` : '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.componentId?.volumeMl ?? '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo?.donorName || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.bagNo?.collectedAt ? new Date(mi.inventoryId.bagNo.collectedAt).toLocaleDateString() : '—'}</td>
                            <td className="p-2">{mi?.reservedAt ? fmt(mi.reservedAt) : '—'}</td>
                            <td className="p-2">{COMPATIBILITY_RESULT_LABELS[mi?.compatibilityResult] || '—'}</td>
                            <td className="p-2">{mi?.crossmatchDoneAt ? fmt(mi.crossmatchDoneAt) : '—'}</td>
                            <td className="p-2">{mi?.crossmatchSeenAt ? fmt(mi.crossmatchSeenAt) : '—'}</td>
                            <td className="p-2 font-mono text-xs font-semibold">{mi?.issueId || '—'}</td>
                            <td className="p-2">{mi?.inventoryId?.issuedAt ? fmt(mi.inventoryId.issuedAt) : '—'}</td>
                            <td className="p-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                                {label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">No matched inventory yet.</div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t mt-6">
              <div>
                {['pending', 'matched', 'approved'].includes(viewDoc.status) && (
                  <button
                    type="button"
                    onClick={() => handleOpenReject(viewDoc._id, viewDoc.requestId)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-750 active:bg-red-800 text-white font-semibold rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reject Requisition Request
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={closeView}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      <CustomModal
        open={issueModalOpen}
        onCancel={() => { setIssueModalOpen(false); setIssueDoc(null); }}
        title="Issue Components separately"
        size="2xl"
        hideFooter
      >
        {!issueDoc || issueLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            <span className="ml-2 text-sm text-gray-500">Loading details…</span>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            {/* Patient Header Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">Patient Details</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {issueDoc.patient?.name || '—'}
                </h3>
                <span className="text-xs text-slate-500 mt-1 block font-medium">
                  Patient ID: {issueDoc.patient?.patientPublicId || '—'} • MRN: {issueDoc.patient?.mrn || '—'} • Age/Sex: {issueDoc.patient?.age || '—'}Y/{issueDoc.patient?.sex || '—'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">Request ID</span>
                <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg font-mono">
                  {issueDoc.requestId || issueDoc.requisitionId || '—'}
                </span>
                <span className="text-xs text-slate-500 mt-1 block capitalize font-semibold">
                  Status: {issueDoc.status}
                </span>
              </div>
            </div>

            {/* Components list */}
            <div>
              <h4 className="font-semibold mb-2">Reserved Components to Issue</h4>
              {issueDoc.matchedInventory?.length ? (
                <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="p-3">Bag No</th>
                        <th className="p-3">Segment No</th>
                        <th className="p-3">Component</th>
                        <th className="p-3">Blood Group</th>
                        <th className="p-3">Donation Date</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3">Issue ID</th>
                        <th className="p-3">Issued At</th>
                        <th className="p-3 text-right">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {issueDoc.matchedInventory.map((mi, idx) => {
                        const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                        const invId = inv?._id || mi.inventoryId || idx;
                        const bagNo = inv?.bagNo?.bagNo || '—';
                        const segmentNo = inv?.bagNo?.segmentNo || '—';
                        const compType = inv?.componentId?.componentType || '—';
                        const bloodGroup = inv?.bagNo?.bloodGroup ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh === 'Positive' ? '+' : inv.bagNo.rh === 'Negative' ? '-' : ''}` : '—';
                        const donationDate = inv?.bagNo?.collectedAt ? new Date(inv.bagNo.collectedAt).toLocaleDateString() : '—';
                        const expiryDate = inv?.componentId?.expiryDate ? new Date(inv.componentId.expiryDate).toLocaleDateString() : '—';
                        const unitStatus = inv?.status || '—';

                        const isIssued = unitStatus === 'ISSUED';
                        const isReserved = unitStatus === 'RESERVED' || unitStatus === 'CROSSMATCHED';
                        const issuedAtDisplay = isIssued && inv?.issuedAt ? fmt(inv.issuedAt) : '—';

                        return (
                          <tr key={invId} className="hover:bg-gray-50/50">
                            <td className="p-3 font-mono text-xs font-bold text-gray-800">{bagNo}</td>
                            <td className="p-3 font-mono text-xs font-bold text-gray-800">{segmentNo}</td>
                            <td className="p-3 font-semibold text-gray-700">{compType}</td>
                            <td className="p-3 font-bold text-gray-800">{bloodGroup}</td>
                            <td className="p-3 text-gray-600">{donationDate}</td>
                            <td className="p-3 text-gray-600">{expiryDate}</td>
                            <td className="p-3 font-mono text-xs font-semibold">{mi.issueId || '—'}</td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">{issuedAtDisplay}</td>
                            <td className="p-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                isIssued
                                  ? 'bg-green-50 border border-green-200 text-green-700'
                                  : isReserved
                                  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                  : 'bg-gray-50 border border-gray-200 text-gray-600'
                              }`}>
                                {isIssued ? 'ISSUED' : isReserved ? 'RESERVED' : unitStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {isReserved ? (
                                <button
                                  type="button"
                                  disabled={issuingRowId === invId}
                                  onClick={async () => {
                                    setIssuingRowId(invId);
                                    try {
                                      const res = await requisitionApi.issue(issueDoc._id, [invId]);
                                      if (!res.success) {
                                        toast.error(res.error || 'Failed to issue component');
                                      } else {
                                        toast.success('Component issued successfully');
                                        // Refresh the popup state
                                        const fresh = await requisitionApi.getRequest(issueDoc._id);
                                        if (fresh.success) {
                                          setIssueDoc(fresh.data);
                                          // Check if all units are issued to complete it automatically
                                          const allDone = fresh.data.matchedInventory.every(
                                            (m) => (typeof m.inventoryId === 'object' ? m.inventoryId?.status : '') === 'ISSUED'
                                          );
                                          if (allDone) {
                                            const completeRes = await requisitionApi.complete(issueDoc._id);
                                            if (completeRes.success) {
                                              toast.success('All components issued. Requisition completed.');
                                              setIssueModalOpen(false);
                                              setIssueDoc(null);
                                            }
                                          }
                                        }
                                        fetchList();
                                      }
                                    } catch (e) {
                                      toast.error('Network error during issue');
                                    } finally {
                                      setIssuingRowId(null);
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold transition active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {issuingRowId === invId ? 'Issuing…' : 'Issue'}
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">No matched inventory.</div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <button
                type="button"
                onClick={() => { setIssueModalOpen(false); setIssueDoc(null); }}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      <CustomModal 
        open={multiLabelModalOpen} 
        onCancel={() => { setMultiLabelModalOpen(false); setMultiLabelDoc(null); }} 
        title="Select Issue Label to Generate" 
        size="lg" 
        hideFooter
      >
        {!multiLabelDoc ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <div className="space-y-6 text-sm">
            {/* Patient Header Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">Patient Details</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {multiLabelDoc.patient?.name || '—'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {multiLabelDoc.patient?.age ? `${multiLabelDoc.patient.age} Yrs` : ''} • {multiLabelDoc.patient?.sex || ''} • MRN: {multiLabelDoc.patient?.mrn || '—'}
                </p>
              </div>
              <div className="md:text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">Requisition Info</span>
                <p className="text-sm font-bold text-slate-900">
                  ID: <span className="font-mono">{multiLabelDoc.requestId}</span>
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {multiLabelDoc.hospitalId?.name || '—'}
                </p>
              </div>
            </div>

            {/* List of components */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-65"></span>
                Issued Components ({multiLabelDoc.matchedInventory?.length || 0})
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                {multiLabelDoc.matchedInventory?.map((unit, index) => {
                  const inv = unit.inventoryId || {};
                  const bag = inv.bagNo || {};
                  const comp = inv.componentId || {};
                  
                  const expiryDateFormatted = comp.expiryDate 
                    ? new Date(comp.expiryDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                  const bloodGroupText = bag.bloodGroup 
                    ? `${bag.bloodGroup} Rh ${bag.rh || ''}`
                    : '—';

                  return (
                    <div 
                      key={index} 
                      className="border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-950 capitalize">
                            {comp.componentType || '—'}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                            {bloodGroupText}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 font-medium">Bag No:</span>{' '}
                            <span className="font-mono font-semibold text-slate-800">{bag.bagNo || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Issue ID:</span>{' '}
                            <span className="font-mono font-semibold text-slate-800">{unit.issueId || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Expiry:</span>{' '}
                            <span className="font-semibold text-slate-800">{expiryDateFormatted}</span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-slate-400 font-medium">Status:</span>{' '}
                            <span className="font-semibold text-green-700 capitalize">Issued</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => printSingleLabel(multiLabelDoc, unit)}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-lg text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Issue Label
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CustomModal>
    </>
  );
}

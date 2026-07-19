import React from 'react';

export default function CompleteStep({ requestDoc, completing, onComplete, shortages }) {
  const unavailableComponents = React.useMemo(() => {
    if (!Array.isArray(shortages) || !shortages.length) return [];
    return shortages.filter(s => s.available === 0);
  }, [shortages]);
  const canComplete = !!requestDoc?._id && ['approved', 'issued'].includes(requestDoc.status) && !completing;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Complete Requisition Request</h3>
          <p className="text-sm text-gray-500 mt-1">Mark the requisition as completed after confirmation of receipt/transfusion.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={!canComplete}
            onClick={onComplete}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold text-white transition active:scale-95 flex items-center gap-2 shadow-sm ${
              canComplete
                ? 'bg-purple-700 hover:bg-purple-800 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {completing ? 'Completing…' : 'Complete Request'}
          </button>
        </div>
      </div>

      {requestDoc && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 text-sm">Patient & Requisition Summary</h4>
            <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg uppercase tracking-wider font-mono">
              ID: {requestDoc.requestId || requestDoc.requisitionId || '—'}
            </span>
          </div>
          
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Patient Info Card */}
            <div className="space-y-3 lg:border-r lg:border-gray-100 lg:pr-8">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="w-1.5 h-3.5 bg-purple-700 rounded-full"></span>
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Patient Details</h5>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Name</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{requestDoc.patient?.name || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Patient ID</span>
                  <p className="font-mono text-gray-800 text-xs font-semibold mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/50 w-fit">{requestDoc.patient?.patientPublicId || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">MRN</span>
                  <p className="font-mono text-gray-800 text-xs font-semibold mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/50 w-fit">{requestDoc.patient?.mrn || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Age / Sex</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{requestDoc.patient?.age || '—'} Y / {requestDoc.patient?.sex || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Clinician</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{requestDoc.doctorName || '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Hospital / Site</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{requestDoc.hospitalId?.name || requestDoc.hospital?.name || '—'}</p>
                </div>
              </div>
            </div>

            {/* Requested Summary Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="w-1.5 h-3.5 bg-purple-700 rounded-full"></span>
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Requisition Status</h5>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Current Status</span>
                  <p className="font-bold text-gray-800 mt-1.5 capitalize inline-block px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                    {requestDoc.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {requestDoc?.matchedInventory?.length ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="w-1.5 h-3.5 bg-purple-700 rounded-full"></span>
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Matched / Issued Components</h5>
          </div>

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
                  <th className="p-3 text-right">Unit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {requestDoc.matchedInventory.map((mi, idx) => {
                  const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                  const invId = inv?._id || mi.inventoryId || idx;
                  const bagNo = inv?.bagNo?.bagNo || '—';
                  const segmentNo = inv?.bagNo?.segmentNo || '—';
                  const compType = inv?.componentId?.componentType || '—';
                  const bloodGroup = inv?.bagNo?.bloodGroup ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh === 'Positive' ? '+' : inv.bagNo.rh === 'Negative' ? '-' : ''}` : '—';
                  const donationDate = inv?.bagNo?.collectedAt ? new Date(inv.bagNo.collectedAt).toLocaleDateString() : '—';
                  const expiryDate = inv?.componentId?.expiryDate ? new Date(inv.componentId.expiryDate).toLocaleDateString() : '—';
                  const unitStatus = inv?.status || '—';

                  return (
                    <tr key={invId} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono text-xs font-bold text-gray-800">{bagNo}</td>
                      <td className="p-3 font-mono text-xs font-bold text-gray-800">{segmentNo}</td>
                      <td className="p-3 font-semibold text-gray-700">{compType}</td>
                      <td className="p-3 font-bold text-gray-800">{bloodGroup}</td>
                      <td className="p-3 text-gray-600">{donationDate}</td>
                      <td className="p-3 text-gray-600">{expiryDate}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          unitStatus === 'ISSUED'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : unitStatus === 'RESERVED' || unitStatus === 'CROSSMATCHED'
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-gray-50 border border-gray-200 text-gray-600'
                        }`}>
                          {unitStatus === 'CROSSMATCHED' ? 'RESERVED' : unitStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {unavailableComponents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="w-1.5 h-3.5 bg-gray-400 rounded-full" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Unavailable Components</h5>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-gray-50 shadow-sm opacity-70">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Component</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Units Requested</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-gray-50">
                {unavailableComponents.map((s, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-gray-500">{s.componentType}</td>
                    <td className="p-3 text-gray-500">{s.bloodGroup} {s.rh}</td>
                    <td className="p-3 text-gray-500">{s.required} unit{s.required > 1 ? 's' : ''}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 border border-gray-300 text-gray-500">
                        Unavailable
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

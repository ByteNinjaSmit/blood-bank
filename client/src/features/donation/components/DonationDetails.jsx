import React from 'react';

const DonationDetails = ({ donation }) => {
  if (!donation) return null;

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  const bagNo = donation.bagNo || donation.donationId || 'N/A';
  const collectionDate = donation.collectedAt || donation.collectionDate;
  const bloodGroup = donation.bloodGroup || 'N/A';
  const rhSymbol = donation.rhFactor 
    ? (donation.rhFactor === 'POSITIVE' ? '+' : '-') 
    : (donation.rh === 'Positive' ? '+' : donation.rh === 'Negative' ? '-' : '');
  const status = donation.status || 
                 (donation.ttiReleaseDecision === 'released' ? 'passed' : donation.ttiReleaseDecision === 'reactive' ? 'failed' : 'pending');
  const isFit = donation.isFit !== undefined 
    ? donation.isFit 
    : (donation.donorFitness?.isFit !== undefined ? donation.donorFitness.isFit : true);
  const donorName = donation.donorName || 
                    (donation.donor?.name 
                      ? [donation.donor.name.firstName, donation.donor.name.middleName, donation.donor.name.lastName].filter(Boolean).join(' ') 
                      : (typeof donation.donor === 'string' ? donation.donor : ''));
  const vitals = donation.initialVitals || (donation.medicalExam ? {
    hb: donation.medicalExam.hbGdl,
    weightKg: donation.medicalExam.weightKg,
    pulse: donation.medicalExam.pulseBpm,
    tempC: donation.medicalExam.temperatureCelsius,
    bp: donation.medicalExam.bloodPressure 
      ? `${donation.medicalExam.bloodPressure.systolic}/${donation.medicalExam.bloodPressure.diastolic}`
      : undefined
  } : undefined);
  const components = donation.components || donation.units || [];

  return (
    <div className="space-y-6 text-sm text-slate-800">
      {/* Summary */}
      <div className="relative rounded-lg bg-white/70 border border-slate-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-6 sm:pt-4">
        <div className="absolute top-3 right-4 text-right hidden sm:block">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Donation ID</span>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shadow-sm">{donation.donationId}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
            Donation overview
          </p>
          <div className="sm:hidden mb-2 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Donation ID:</span>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shadow-sm">{donation.donationId}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Bag {bagNo}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Collected on {formatDateTime(collectionDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
            {bloodGroup} {rhSymbol}
          </span>
          {status && (
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              Status: {status}
            </span>
          )}
          <span
            className={`px-2 py-1 rounded-full font-medium ${
              isFit
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            Fitness: {isFit ? 'Fit' : 'Unfit'}
          </span>
        </div>
      </div>

      {/* Bag & Donor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
          <p className="font-semibold text-slate-700 mb-2">Bag Information</p>
          <div className="space-y-1.5 text-slate-600">
            <p>
              <span className="font-medium">Bag No:</span> {bagNo}
            </p>
            <p>
              <span className="font-medium">Segment No:</span> {donation.segmentNo || components[0]?.unitId || '-'}
            </p>
            {donation.lotNo && (
              <p>
                <span className="font-medium">Batch No:</span> {donation.lotNo}
              </p>
            )}
            <p>
              <span className="font-medium">Type of Bag:</span> {donation.typeOfBag || '-'}
            </p>
            <p>
              <span className="font-medium">Collection Date & Time:</span>{' '}
              {formatDateTime(collectionDate)}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
          <p className="font-semibold text-slate-700 mb-2">Donor & Site</p>
          <div className="space-y-1.5 text-slate-600">
            {(donorName || donation.donor) && (
              <p>
                <span className="font-medium">Donor:</span> {donorName}
              </p>
            )}
            {(donation.donor || bloodGroup) && (
              <p>
                <span className="font-medium">Donor Blood Group:</span>{' '}
                {donation.donor?.bloodGroup 
                  ? `${donation.donor.bloodGroup} ${donation.donor.rh === 'Positive' ? '+' : '-'}`
                  : `${bloodGroup} ${rhSymbol}`}
              </p>
            )}
            {donation.siteId && (
              <p>
                <span className="font-medium">Site:</span> {donation.siteId.name}
              </p>
            )}
            {donation.siteId && donation.siteId.address && (
              <p className="text-xs text-slate-500">{donation.siteId.address}</p>
            )}
          </div>
        </div>
      </div>

      {vitals && (
        <div className="rounded-lg border border-slate-100 bg-white/70 p-4">
          <p className="font-semibold text-slate-700 mb-2">Initial Vitals</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-600">
            {vitals.hb !== undefined && (
              <p>
                <span className="font-medium">Hb:</span> {vitals.hb} g/dL
              </p>
            )}
            {vitals.weightKg !== undefined && (
              <p>
                <span className="font-medium">Weight:</span> {vitals.weightKg} kg
              </p>
            )}
            {vitals.pulse !== undefined && (
              <p>
                <span className="font-medium">Pulse:</span> {vitals.pulse} bpm
              </p>
            )}
            {vitals.tempC !== undefined && (
              <p>
                <span className="font-medium">Temp:</span> {vitals.tempC} °C
              </p>
            )}
            {vitals.bp && (
              <p className="md:col-span-2">
                <span className="font-medium">BP:</span> {vitals.bp}
              </p>
            )}
          </div>
        </div>
      )}

      {Array.isArray(components) && components.length > 0 && (
        <div className="rounded-lg border border-slate-100 bg-white/70 p-4">
          <p className="font-semibold text-slate-700 mb-2">Components</p>
          <div className="border rounded-lg divide-y">
            {components.map((comp) => (
              <div
                key={comp._id || comp.componentId || comp.unitId}
                className="px-3 py-2 text-xs flex justify-between"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-800">{comp.componentType}</p>
                </div>
                <div className="text-right space-y-0.5">
                  {comp.volumeMl && (
                    <p className="text-slate-600">Volume: {comp.volumeMl} mL</p>
                  )}
                  {comp.status && (() => {
                    const raw = comp.status === 'RELEASED' ? 'INSTOCK' : comp.status;
                    const cls =
                      raw === 'ISSUED'                    ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      raw === 'INSTOCK'                   ? 'bg-green-50 text-green-700 border-green-200' :
                      raw === 'COLLECTED'                 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      raw === 'QUARANTINE'                ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      raw === 'DISCARDED' || raw === 'EXPIRED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-600 border-gray-200';
                    return (
                      <p className="flex items-center justify-end gap-1">
                        <span className="text-slate-500">Status:</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${cls}`}>{raw}</span>
                      </p>
                    );
                  })()}
                  {(comp.expiryDate || comp.expiresAt) && (
                    <p className="text-slate-500">
                      Exp: {formatDate(comp.expiryDate || comp.expiresAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {donation.componentSeparationComplete && (
        <div className="rounded-lg border border-slate-100 bg-white/70 p-4">
          <p className="font-semibold text-slate-700 mb-2">Component Separation Verification</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
            <p>
              <span className="font-medium">Verification Status:</span> <span className="text-green-700 font-semibold">Verified & Completed</span>
            </p>
            {donation.separationVerifiedBy && (
              <p>
                <span className="font-medium">Verified By:</span> {donation.separationVerifiedBy.name ? `${donation.separationVerifiedBy.name.first} ${donation.separationVerifiedBy.name.last}` : donation.separationVerifiedBy}
              </p>
            )}
            {donation.separationVerifiedAt && (
              <p>
                <span className="font-medium">Verified At:</span> {formatDateTime(donation.separationVerifiedAt)}
              </p>
            )}
            {donation.separationVerifiedSignature && (
              <div className="md:col-span-2">
                <span className="font-medium text-slate-500 block mb-1">Technician Signature:</span>
                <div className="border border-dashed border-slate-200 rounded-lg p-2.5 bg-white inline-flex items-center justify-center min-w-[200px] min-h-[40px] shadow-sm">
                  <span 
                    className="text-lg text-slate-800 select-none font-medium antialiased"
                    style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
                  >
                    {donation.separationVerifiedSignature}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {donation.requisitions && donation.requisitions.filter(r => r.requisitionId).length > 0 && (
        <div className="rounded-lg border border-slate-100 bg-white/70 p-4 space-y-3">
          <p className="font-semibold text-slate-700 mb-2">Requisition & Delivery Details</p>
          <div className="space-y-4">
            {donation.requisitions
              .filter(r => r.requisitionId)
              .map((req) => (
                <div key={req.unitId} className="bg-blue-50/20 border border-blue-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {req.unitId.split('-').slice(-2).join(' ')} ({req.componentType})
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      Blood Group: <span className="text-red-700 font-bold">{req.aboGroup} {req.rhFactor}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-slate-500 font-medium">Requisition No:</span> <span className="font-mono text-slate-900 font-semibold">{req.requisitionId}</span></div>
                    <div><span className="text-slate-500 font-medium">Status:</span> <span className="capitalize text-blue-850 font-bold">{req.requisitionStatus}</span></div>
                    <div><span className="text-slate-500 font-medium">Hospital:</span> <span className="text-slate-800 font-semibold">{req.hospitalName}</span></div>
                    <div><span className="text-slate-500 font-medium">Patient:</span> <span className="text-slate-800 font-semibold">{req.patientName}</span></div>
                    <div><span className="text-slate-500 font-medium">Clinician:</span> <span className="text-slate-800">{req.clinicianName}</span></div>
                    <div><span className="text-slate-500 font-medium">Required At:</span> <span className="text-slate-800">{req.requiredAt ? new Date(req.requiredAt).toLocaleString('en-IN') : '—'}</span></div>
                  </div>

                  {req.issue ? (
                    <div className="mt-2 pt-2 border-t border-dashed border-blue-100 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700 bg-blue-50/10 rounded-lg p-2">
                      <div className="col-span-2 font-bold text-blue-800 text-[10px] uppercase tracking-wider">Delivery Pass Details</div>
                      <div><span className="text-slate-500 font-medium">Issued At:</span> <span className="text-gray-800">{new Date(req.issue.issuedAt).toLocaleString('en-IN')}</span></div>
                      <div className="col-span-2"><span className="text-slate-500 font-medium">Collected By:</span> <span className="text-gray-800 font-semibold">{req.issue.collectedByName || '—'}</span></div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50/50 border border-amber-100 rounded-lg p-2 text-center font-medium">
                      Component is matched/reserved but not issued from the blood bank yet.
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationDetails;

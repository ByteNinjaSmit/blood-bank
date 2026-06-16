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
                      ? `${donation.donor.name.firstName || ''} ${donation.donor.name.lastName || ''}`.trim() 
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
      <div className="rounded-lg bg-white/70 border border-slate-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
            Donation overview
          </p>
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
                <span className="font-medium">Lot No:</span> {donation.lotNo}
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
                  {(comp.componentId || comp.unitId) && (
                    <p className="text-slate-500">ID: {comp.componentId || comp.unitId}</p>
                  )}
                </div>
                <div className="text-right space-y-0.5">
                  {comp.volumeMl && (
                    <p className="text-slate-600">Volume: {comp.volumeMl} mL</p>
                  )}
                  {comp.status && (
                    <p className="text-slate-600">Status: {comp.status}</p>
                  )}
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
    </div>
  );
};

export default DonationDetails;

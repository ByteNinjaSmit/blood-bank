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

  return (
    <div className="space-y-4 text-sm text-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-slate-700 mb-1">Bag Information</p>
          <div className="space-y-1 text-slate-600">
            <p>
              <span className="font-medium">Bag No:</span> {donation.bagNo}
            </p>
            <p>
              <span className="font-medium">Segment No:</span> {donation.segmentNo}
            </p>
            {donation.batchNo && (
              <p>
                <span className="font-medium">Batch No:</span> {donation.batchNo}
              </p>
            )}
            <p>
              <span className="font-medium">Type of Bag:</span> {donation.typeOfBag}
            </p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                {donation.status}
              </span>
            </p>
            <p>
              <span className="font-medium">Collection Date:</span>{' '}
              {formatDateTime(donation.collectionDate)}
            </p>
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-700 mb-1">Donor & Site</p>
          <div className="space-y-1 text-slate-600">
            {donation.donor && (
              <p>
                <span className="font-medium">Donor:</span>{' '}
                {donation.donor.name?.firstName} {donation.donor.name?.lastName}
              </p>
            )}
            {donation.donor && (
              <p>
                <span className="font-medium">Donor Blood Group:</span>{' '}
                {donation.donor.bloodGroup} {donation.donor.rh === 'Positive' ? '+' : '-'}
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

      {donation.initialVitals && (
        <div>
          <p className="font-semibold text-slate-700 mb-1">Initial Vitals</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-600">
            <p>
              <span className="font-medium">Hb:</span> {donation.initialVitals.hb} g/dL
            </p>
            <p>
              <span className="font-medium">Weight:</span> {donation.initialVitals.weightKg} kg
            </p>
            <p>
              <span className="font-medium">Pulse:</span> {donation.initialVitals.pulse} bpm
            </p>
            <p>
              <span className="font-medium">Temp:</span> {donation.initialVitals.tempC} °C
            </p>
            <p className="md:col-span-2">
              <span className="font-medium">BP:</span> {donation.initialVitals.bp}
            </p>
          </div>
        </div>
      )}

      {Array.isArray(donation.components) && donation.components.length > 0 && (
        <div>
          <p className="font-semibold text-slate-700 mb-1">Components</p>
          <div className="border rounded-lg divide-y">
            {donation.components.map((comp) => (
              <div
                key={comp._id || comp.componentId}
                className="px-3 py-2 text-xs flex justify-between"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-800">{comp.componentType}</p>
                  {comp.componentId && (
                    <p className="text-slate-500">ID: {comp.componentId}</p>
                  )}
                </div>
                <div className="text-right space-y-0.5">
                  {comp.volumeMl && (
                    <p className="text-slate-600">Volume: {comp.volumeMl} mL</p>
                  )}
                  {comp.status && (
                    <p className="text-slate-600">Status: {comp.status}</p>
                  )}
                  {comp.expiryDate && (
                    <p className="text-slate-500">
                      Exp: {formatDate(comp.expiryDate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationDetails;

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDonorDetail } from '@/hooks/useDonor';

const DonorDetails = ({ donor: initialDonor, isOpen, onClose }) => {
  const { data: donorDetail, isLoading } = useDonorDetail(initialDonor?._id || initialDonor?.id);
  const donor = donorDetail || initialDonor;

  if (!donor) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "eligible":
        return "bg-green-100 text-green-800";
      case "deferred":
        return "bg-red-100 text-red-800";
      case "temp-deferred":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "eligible":
        return "Eligible";
      case "deferred":
        return "Deferred";
      case "temp-deferred":
        return "Temporarily Deferred";
      default:
        return status;
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fullName = [donor.name?.firstName, donor.name?.middleName, donor.name?.lastName].filter(Boolean).join(' ');
  const rhSymbol = donor.rh === 'Positive' || donor.rh === 'POSITIVE' ? '+' : donor.rh === 'Negative' || donor.rh === 'NEGATIVE' ? '-' : '';
  const age = donor.dob ? calculateAge(donor.dob) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-orange-50 to-white">
        <DialogHeader>
          <DialogTitle>Donor Details</DialogTitle>
        </DialogHeader>
      <div className="space-y-6 text-sm text-slate-800">
        {/* Summary */}
        <div className="rounded-lg bg-white/70 border border-slate-100 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              Donor overview
            </p>
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Donor ID
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
                {donor.donorId || '—'}
              </span>
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {fullName || '—'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {age !== null ? `Age ${age} years` : ''}{age !== null && donor.sex ? ' · ' : ''}{donor.sex || ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                {donor.bloodGroup} {rhSymbol}
              </span>
              <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(donor.eligibilityStatus)}`}>
                {getStatusText(donor.eligibilityStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Basic Info & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <p className="font-semibold text-slate-700 mb-2">Basic Information</p>
            <div className="space-y-1.5 text-slate-600">
              <p>
                <span className="font-medium">Date of Birth:</span>{' '}
                {donor.dob ? new Date(donor.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
              <p>
                <span className="font-medium">Sex:</span> {donor.sex || '—'}
              </p>
              <p>
                <span className="font-medium">Weight:</span> {donor.weightKg} kg
              </p>
              <p>
                <span className="font-medium">Blood Group:</span> {donor.bloodGroup} {rhSymbol}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <p className="font-semibold text-slate-700 mb-2">Contact Information</p>
            <div className="space-y-1.5 text-slate-600">
              <p>
                <span className="font-medium">Phone:</span> {donor.phone || '—'}
              </p>
              {donor.email && (
                <p>
                  <span className="font-medium">Email:</span> {donor.email}
                </p>
              )}
              <p>
                <span className="font-medium">Address:</span>{' '}
                {donor.address?.line1 && `${donor.address.line1}, `}
                {donor.address?.line2 && `${donor.address.line2}, `}
                {donor.address?.city && `${donor.address.city}, `}
                {donor.address?.district && `${donor.address.district}, `}
                {donor.address?.state && `${donor.address.state} - `}
                {donor.address?.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="rounded-lg border border-slate-100 bg-white/70 p-4">
          <p className="font-semibold text-slate-700 mb-2">Medical Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
            <p>
              <span className="font-medium">Occupation:</span> {donor.occupation || 'Not specified'}
            </p>
            <p>
              <span className="font-medium">Last Donation:</span>{' '}
              {donor.lastDonationDate
                ? new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : 'No previous donations'
              }
            </p>
            <p>
              <span className="font-medium">Last Donation Done At:</span>{' '}
              {!donor.lastDonationDate
                ? 'Not specified'
                : donor.lastDonationPlace === 'OTHER' ? 'Other' : 'Sanjivani Blood Bank'
              }
            </p>
            <p>
              <span className="font-medium">Recent Donation:</span>{' '}
              {donor.recentDonationDate
                ? new Date(donor.recentDonationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'No donations recorded in-system'
              }
            </p>
            <div className="md:col-span-2 flex items-center gap-2">
              <span className="font-medium">Emergency donation willingness:</span>
              {donor.emergencyDonationWillingness === 'Yes' ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Yes</span>
              ) : donor.emergencyDonationWillingness === 'No' ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">No</span>
              ) : (
                <span className="text-slate-500">Not specified</span>
              )}
            </div>
          </div>
        </div>

        {/* Donation History */}
        {isLoading ? (
          <div className="py-6 text-center text-gray-500 text-sm">Loading donation history...</div>
        ) : donor.donationHistory && donor.donationHistory.length > 0 ? (
          <div className="rounded-lg border border-slate-100 bg-white/70 p-4">
            <p className="font-semibold text-slate-700 mb-3">Donation History</p>
            <div className="space-y-6">
              {donor.donationHistory.map((donation, index) => (
                <div key={donation.donationId || index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Donation Meta Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-orange-855 text-orange-800 uppercase tracking-wider block sm:inline mr-2">
                        {donation.donationPlace}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 font-mono">
                        Donation ID: {donation.donationId}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-700 flex flex-wrap items-center gap-2">
                      <span className="bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                        Date: <span className="text-gray-950 font-mono font-bold ml-0.5">{donation.collectedAt ? new Date(donation.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                      </span>
                      <span className="bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                        Bag No: <span className="text-gray-950 font-mono font-bold ml-0.5">{donation.bagNo}</span>
                      </span>
                      <span className="bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                        Segment No: <span className="text-gray-950 font-mono font-bold ml-0.5">{donation.segmentNo}</span>
                      </span>
                      <span className="bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                        Batch No: <span className="text-gray-950 font-mono font-bold ml-0.5">{donation.lotNo || '—'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Donation Components */}
                  <div className="p-4 space-y-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Derived Components</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {donation.components && donation.components.map((comp) => {
                        const isIssued = comp.status === 'ISSUED' ||
                          comp.status === 'TRANSFUSED' ||
                          comp.requisition?.status === 'ISSUED' ||
                          comp.requisition?.status === 'COMPLETED';

                        const getUnitStatusText = () => {
                          if (comp.status === 'RELEASED') return 'INSTOCK';
                          if (isIssued) return 'ISSUED';
                          if (comp.status === 'RESERVED' || comp.status === 'CROSSMATCHED') return 'RESERVED';
                          return comp.status;
                        };

                        const getUnitStatusBadge = () => {
                          if (isIssued) return 'bg-slate-50 text-slate-700 border-slate-200';

                          switch (comp.status) {
                            case 'RELEASED':
                              return 'bg-green-50 text-green-700 border-green-200';
                            case 'IN_TESTING':
                            case 'QUARANTINE':
                              return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                            case 'RESERVED':
                            case 'CROSSMATCHED':
                              return 'bg-blue-50 text-blue-700 border-blue-200';
                            case 'DISCARDED':
                            case 'EXPIRED':
                              return 'bg-red-50 text-red-700 border-red-200';
                            case 'ISSUED':
                            case 'TRANSFUSED':
                              return 'bg-slate-50 text-slate-700 border-slate-200';
                            default:
                              return 'bg-gray-50 text-gray-700 border-gray-200';
                          }
                        };

                        return (
                          <div key={comp.unitId} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{comp.componentType}</p>
                                <p className="text-2xs text-gray-500 font-mono">{comp.unitId}</p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-0.5 rounded-full text-2xs font-medium border ${getUnitStatusBadge()}`}>
                                  {getUnitStatusText()}
                                </span>
                                <p className="text-2xs text-gray-500 mt-0.5">{comp.volumeMl} ml</p>
                              </div>
                            </div>

                            {/* Requisition Details (if matched) */}
                            {comp.requisition && (
                              <div className="mt-2 border-t border-dashed border-gray-200 pt-2 text-2xs">
                                <div className="bg-blue-50/70 border border-blue-100 rounded-md p-2.5 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-blue-800">REQUISITED DETAILS</span>
                                    <span className={`px-1.5 py-0.5 rounded text-3xs font-bold ${comp.requisition.status === 'ISSUED' || comp.requisition.status === 'COMPLETED'
                                        ? 'bg-green-100 text-green-800'
                                        : comp.requisition.status === 'REJECTED'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                      {comp.requisition.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-700">
                                    <div>
                                      <span className="text-gray-400 block font-normal">Req ID</span>
                                      <span className="font-semibold font-mono">{comp.requisition.requisitionId}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block font-normal">Hospital</span>
                                      <span className="font-semibold truncate block" title={comp.requisition.hospitalName}>
                                        {comp.requisition.hospitalName}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block font-normal">Patient Name</span>
                                      <span className="font-semibold">{comp.requisition.patientName}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block font-normal">Urgency</span>
                                      <span className={`font-bold ${comp.requisition.urgency === 'EMERGENCY'
                                          ? 'text-red-600'
                                          : comp.requisition.urgency === 'URGENT'
                                            ? 'text-yellow-600'
                                            : 'text-gray-600'
                                        }`}>{comp.requisition.urgency}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-100 bg-white/70 p-4">
            <p className="font-semibold text-slate-700 mb-3">Donation History</p>
            <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
              No previous donations recorded for this donor.
            </div>
          </div>
        )}
      </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonorDetails;

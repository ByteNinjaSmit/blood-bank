import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Heart } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Donor Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="p-3 bg-orange-100 rounded-full">
            <User className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {donor.name?.firstName} {donor.name?.middleName} {donor.name?.lastName}
            </h3>
            {donor.eligibilityStatus !== "deferred" && donor.eligibilityStatus !== "temp-deferred" && (
              <p className="text-gray-600">{donor.donorId}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donor.eligibilityStatus)}`}>
                {getStatusText(donor.eligibilityStatus)}
              </span>
              {donor.dob && calculateAge(donor.dob) !== null && (
                <span className="text-sm text-gray-500">
                  Age: {calculateAge(donor.dob)} years
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                <p className="text-gray-900">{donor.dob ? new Date(donor.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Sex</p>
                <p className="text-gray-900">{donor.sex}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Weight</p>
                <p className="text-gray-900">{donor.weightKg} kg</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Blood Group</p>
                <p className="text-gray-900">{donor.bloodGroup} {donor.rh === "Positive" ? "+" : "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <p className="text-gray-900">{donor.phone}</p>
              </div>
            </div>
            {donor.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-900">{donor.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 md:col-span-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-gray-900">
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
        </div>

        {/* Medical Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Medical Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Occupation</p>
              <p className="text-gray-900">{donor.occupation || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Last Donation</p>
              <p className="text-gray-900">
                {donor.lastDonationDate 
                  ? new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : 'No previous donations'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Donation History */}
        {isLoading ? (
          <div className="py-6 text-center text-gray-500 text-sm">Loading donation history...</div>
        ) : donor.donationHistory && donor.donationHistory.length > 0 ? (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4 pb-1 border-b border-gray-100">Donation History</h4>
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
                    <div className="text-xs text-gray-500 flex items-center gap-3 font-mono">
                      <span>Date: {donation.collectedAt ? new Date(donation.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                      <span>Bag No: {donation.bagNo}</span>
                      <span>Segment: {donation.segmentNo}</span>
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
                                    <span className={`px-1.5 py-0.5 rounded text-3xs font-bold ${
                                      comp.requisition.status === 'ISSUED' || comp.requisition.status === 'COMPLETED'
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
                                      <span className={`font-bold ${
                                        comp.requisition.urgency === 'EMERGENCY'
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
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 pb-1 border-b border-gray-100">Donation History</h4>
            <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
              No previous donations recorded for this donor.
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DonorDetails;

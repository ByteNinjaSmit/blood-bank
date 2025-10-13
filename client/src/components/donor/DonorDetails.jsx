import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Heart } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';

const DonorDetails = ({ donor, isOpen, onClose }) => {
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
    const today = new Date();
    const birthDate = new Date(dob);
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
            <p className="text-gray-600">{donor.donorId}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donor.eligibilityStatus)}`}>
                {getStatusText(donor.eligibilityStatus)}
              </span>
              <span className="text-sm text-gray-500">
                Age: {calculateAge(donor.dob)} years
              </span>
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
                <p className="text-gray-900">{new Date(donor.dob).toLocaleDateString()}</p>
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
                  ? new Date(donor.lastDonationDate).toLocaleDateString() 
                  : 'No previous donations'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Donation History */}
        {donor.donationHistory && donor.donationHistory.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Donation History</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bag No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {donor.donationHistory.map((donation, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(donation.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{donation.bagNo}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

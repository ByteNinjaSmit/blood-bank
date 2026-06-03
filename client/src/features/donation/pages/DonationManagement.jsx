import React, { useState } from 'react';
import { Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/shared/Button';
import DonationList from '@/components/donation/DonationList';
import DonationDetails from '@/components/donation/DonationDetails';
import CustomModal from '@/components/CustomModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useDonation } from '@/hooks/useDonation';

const DonationManagement = () => {
  const navigate = useNavigate();
  const { getDonationById } = useDonation();
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDonation, setViewDonation] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleViewDonation = async (donation) => {
    setViewLoading(true);
    const result = await getDonationById(donation._id);
    if (result.success) {
      setViewDonation(result.data);
      setShowViewModal(true);
    }
    setViewLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-orange-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Donation Management</h1>
              <p className="text-gray-600 text-sm">Manage blood donation records</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {viewLoading && (
          <div className="mb-4">
            <LoadingSpinner message="Loading donation details..." />
          </div>
        )}
        <DonationList
          onAddDonation={() => navigate('/donations/create-donation')}
          onViewDonation={handleViewDonation}
        />
      </div>

      {/* View Donation Modal */}
      <CustomModal
        open={showViewModal && !!viewDonation}
        title={viewDonation ? `Donation Details - ${viewDonation.bagNo}` : 'Donation Details'}
        description={
          viewDonation
            ? `Donor: ${
                (viewDonation.donor && viewDonation.donor.name && viewDonation.donor.name.firstName) || ''
              } ${
                (viewDonation.donor && viewDonation.donor.name && viewDonation.donor.name.lastName) || ''
              } · Blood Group: ${viewDonation.bloodGroup} ${viewDonation.rh === 'Positive' ? '+' : '-'}`
            : ''
        }
        onCancel={() => {
          setShowViewModal(false);
          setViewDonation(null);
        }}
        size="lg"
        hideFooter
      >
        {viewDonation && <DonationDetails donation={viewDonation} />}
      </CustomModal>
    </div>
  );
};

export default DonationManagement;

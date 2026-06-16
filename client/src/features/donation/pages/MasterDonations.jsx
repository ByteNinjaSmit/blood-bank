import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DonationList from '@/features/donation/components/DonationList';
import DonationDetails from '@/features/donation/components/DonationDetails';
import Modal from '@/components/shared/Modal';

const MasterDonations = () => {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  const handleViewDonation = (donation) => {
    setSelectedDonation(donation);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-orange-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Master Register - Donations</h1>
              <p className="text-gray-600 text-sm">Combined list of all inhouse and camp donations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <DonationList
          onAddDonation={() => navigate('/donations/create-donation')}
          onViewDonation={handleViewDonation}
          campId={null}
        />
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDonation(null);
        }}
        title="Donation Details"
        size="lg"
      >
        <DonationDetails donation={selectedDonation} />
      </Modal>
    </div>
  );
};

export default MasterDonations;

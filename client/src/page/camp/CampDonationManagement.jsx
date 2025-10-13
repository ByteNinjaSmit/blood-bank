import React, { useState, useEffect } from 'react';
import { ArrowLeft, Droplets } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/shared/Button';
import DonationList from '@/components/donation/DonationList';
import DonationForm from '@/components/donation/DonationForm';
import Modal from '@/components/shared/Modal';
import { useDonation } from '@/hooks/useDonation';

const CampDonationManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createDonation, updateDonation } = useDonation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [campId, setCampId] = useState(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) {
      navigate('/camp-listing');
      return;
    }
    setCampId(id);
  }, [searchParams, navigate]);

  const handleCreateDonation = async (donationData) => {
    setLoading(true);
    const result = await createDonation(donationData);
    if (result.success) {
      setShowCreateModal(false);
    }
    setLoading(false);
  };

  const handleEditDonation = (donation) => {
    setSelectedDonation(donation);
    setShowEditModal(true);
  };

  const handleUpdateDonation = async (donationData) => {
    setLoading(true);
    const result = await updateDonation(selectedDonation._id, donationData);
    if (result.success) {
      setShowEditModal(false);
      setSelectedDonation(null);
    }
    setLoading(false);
  };

  const handleViewDonation = (donation) => {
    console.log('View donation:', donation);
    // TODO: Implement view donation details
  };

  const handleDeleteDonation = (donation) => {
    console.log('Donation deleted:', donation);
  };

  if (!campId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Camp Not Found</h2>
          <p className="text-gray-600 mb-6">The requested camp could not be found.</p>
          <Button onClick={() => navigate('/camp-listing')}>
            Go to Camp List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/camp-details?id=${campId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Camp
          </Button>
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-orange-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Camp Donation Management</h1>
              <p className="text-gray-600 text-sm">Manage donations for this camp</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <DonationList
          campId={campId}
          onAddDonation={() => setShowCreateModal(true)}
          onViewDonation={handleViewDonation}
          onEditDonation={handleEditDonation}
          onDeleteDonation={handleDeleteDonation}
        />
      </div>

      {/* Create Donation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Donation"
        size="xl"
      >
        <DonationForm
          campId={campId}
          onSubmit={handleCreateDonation}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Donation Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDonation(null);
        }}
        title="Edit Donation"
        size="xl"
      >
        <DonationForm
          initialData={selectedDonation}
          campId={campId}
          onSubmit={handleUpdateDonation}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedDonation(null);
          }}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default CampDonationManagement;

import React, { useState } from 'react';
import { ArrowLeft, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/shared/Button';
import DonationList from '@/components/donation/DonationList';
import DonationForm from '@/components/donation/DonationForm';
import DonationDetails from '@/components/donation/DonationDetails';
import Modal from '@/components/shared/Modal';
import CustomModal from '@/components/CustomModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useDonation } from '@/hooks/useDonation';

const DonationManagement = () => {
  const navigate = useNavigate();
  const { createDonation, updateDonation, getDonationById } = useDonation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDonation, setViewDonation] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

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

  const handleViewDonation = async (donation) => {
    setViewLoading(true);
    const result = await getDonationById(donation._id);
    if (result.success) {
      setViewDonation(result.data);
      setShowViewModal(true);
    }
    setViewLoading(false);
  };

  const handleDeleteDonation = (donation) => {
    console.log('Donation deleted:', donation);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
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
          onSubmit={handleUpdateDonation}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedDonation(null);
          }}
          loading={loading}
        />
      </Modal>

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
        cancelText="Close"
        confirmText="OK"
        onCancel={() => {
          setShowViewModal(false);
          setViewDonation(null);
        }}
        onConfirm={() => {
          setShowViewModal(false);
          setViewDonation(null);
        }}
      >
        {viewDonation && <DonationDetails donation={viewDonation} />}
      </CustomModal>
    </div>
  );
};

export default DonationManagement;

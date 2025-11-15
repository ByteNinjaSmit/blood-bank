import React, { useState } from 'react';
import { ArrowLeft, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/shared/Button';
import DonationList from '@/components/donation/DonationList';
import DonationDetails from '@/components/donation/DonationDetails';
import CustomModal from '@/components/CustomModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useDonation } from '@/hooks/useDonation';

const DonationManagement = () => {
  const navigate = useNavigate();
  const { updateDonation, getDonationById } = useDonation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDonation, setViewDonation] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

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
          onAddDonation={() => navigate('/donations/create-donation')}
          onViewDonation={handleViewDonation}
          onEditDonation={handleEditDonation}
          onDeleteDonation={handleDeleteDonation}
        />
      </div>

      {/* Edit Donation Modal */}
      <CustomModal
        open={showEditModal && !!selectedDonation}
        title={selectedDonation ? `Edit Donation - ${selectedDonation.bagNo}` : 'Edit Donation'}
        description={
          selectedDonation
            ? `Update details for donation ${selectedDonation.bagNo}.`
            : ''
        }
        onCancel={() => {
          setShowEditModal(false);
          setSelectedDonation(null);
        }}
        onConfirm={() => {
          setShowEditModal(false);
          setSelectedDonation(null);
        }}
        size="lg"
        hideFooter
      >
        {selectedDonation && (
          <>
            <div className="mb-4 rounded-lg bg-white/70 border border-orange-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                  Editing donation
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Bag {selectedDonation.bagNo}
                </h3>
                <p className="text-xs text-slate-500">
                  Collected on{' '}
                  {selectedDonation.collectionDate
                    ? new Date(selectedDonation.collectionDate).toLocaleDateString()
                    : 'Unknown date'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                  {selectedDonation.bloodGroup}{' '}
                  {selectedDonation.rh === 'Positive' ? '+' : '-'}
                </span>
                {selectedDonation.status && (
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    Status: {selectedDonation.status}
                  </span>
                )}
              </div>
            </div>

            <DonationForm
              initialData={selectedDonation}
              onSubmit={handleUpdateDonation}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedDonation(null);
              }}
              loading={loading}
            />
          </>
        )}
      </CustomModal>

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
        confirmText="Close"
        onCancel={() => {
          setShowViewModal(false);
          setViewDonation(null);
        }}
        onConfirm={() => {
          setShowViewModal(false);
          setViewDonation(null);
        }}
        size="lg"
      >
        {viewDonation && <DonationDetails donation={viewDonation} />}
      </CustomModal>
    </div>
  );
};

export default DonationManagement;

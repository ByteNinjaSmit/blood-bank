import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/shared/Button';
import DonorList from '@/components/donor/DonorList';
import DonorForm from '@/components/donor/DonorForm';
import DonorDetails from '@/components/donor/DonorDetails';
import Modal from '@/components/shared/Modal';
import { useDonor } from '@/hooks/useDonor';

const CampDonorManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createDonor, updateDonor } = useDonor();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
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

  const handleCreateDonor = async (donorData) => {
    setLoading(true);
    const result = await createDonor(donorData);
    if (result.success) {
      setShowCreateModal(false);
    }
    setLoading(false);
  };

  const handleEditDonor = (donor) => {
    setSelectedDonor(donor);
    setShowEditModal(true);
  };

  const handleUpdateDonor = async (donorData) => {
    setLoading(true);
    const result = await updateDonor(selectedDonor._id, donorData);
    if (result.success) {
      setShowEditModal(false);
      setSelectedDonor(null);
    }
    setLoading(false);
  };

  const handleViewDonor = (donor) => {
    setSelectedDonor(donor);
    setShowDetailsModal(true);
  };

  const handleDeleteDonor = (donor) => {
    console.log('Donor deleted:', donor);
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
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Camp Donor Management</h1>
              <p className="text-gray-600 text-sm">Manage donors for this camp</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <DonorList
          campId={campId}
          onAddDonor={() => setShowCreateModal(true)}
          onViewDonor={handleViewDonor}
          onEditDonor={handleEditDonor}
          onDeleteDonor={handleDeleteDonor}
        />
      </div>

      {/* Create Donor Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Donor"
        size="xl"
      >
        <DonorForm
          onSubmit={handleCreateDonor}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>

      {/* Edit Donor Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDonor(null);
        }}
        title="Edit Donor"
        size="xl"
      >
        <DonorForm
          initialData={selectedDonor}
          onSubmit={handleUpdateDonor}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedDonor(null);
          }}
          loading={loading}
        />
      </Modal>

      {/* Donor Details Modal */}
      <DonorDetails
        donor={selectedDonor}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDonor(null);
        }}
      />
    </div>
  );
};

export default CampDonorManagement;

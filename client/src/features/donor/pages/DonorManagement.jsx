import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/shared/Button';
import DonorList from '@/components/donor/DonorList';
import DonorForm from '@/components/donor/DonorForm';
import DonorDetails from '@/components/donor/DonorDetails';
import Modal from '@/components/shared/Modal';
import { useDonor } from '@/hooks/useDonor';

const DonorManagement = () => {
  const navigate = useNavigate();
  const { createDonor, updateDonor } = useDonor();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(false);

  const editInitialData = selectedDonor
    ? {
      donorId: selectedDonor.donorId || '',
      firstName: selectedDonor.name?.firstName || '',
      middleName: selectedDonor.name?.middleName || '',
      lastName: selectedDonor.name?.lastName || '',
      uid: selectedDonor.uid || '',
      dob: selectedDonor.dob ? new Date(selectedDonor.dob).toISOString().split('T')[0] : '',
      sex: selectedDonor.sex || '',
      phone: selectedDonor.phone || '',
      email: selectedDonor.email || '',
      addressLine1: selectedDonor.address?.line1 || '',
      addressLine2: selectedDonor.address?.line2 || '',
      city: selectedDonor.address?.city || '',
      district: selectedDonor.address?.district || '',
      state: selectedDonor.address?.state || '',
      pincode: selectedDonor.address?.pincode || '',
      occupation: selectedDonor.occupation || '',
      weightKg: selectedDonor.weightKg != null ? String(selectedDonor.weightKg) : '',
      bloodGroup: selectedDonor.bloodGroup || '',
      rh: selectedDonor.rh || '',
      eligibilityStatus: selectedDonor.eligibilityStatus || '',
      lastDonationDate: selectedDonor.lastDonationDate
        ? new Date(selectedDonor.lastDonationDate).toISOString().split('T')[0]
        : '',
    }
    : null;

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Donor Management</h1>
              <p className="text-gray-600 text-sm">Manage donor records and information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <DonorList
          onAddDonor={() => navigate('/donor/create-donor')}
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
        className="bg-gradient-to-b from-orange-50 to-white"
      >
        {selectedDonor && (
          <div className="mb-4 rounded-lg bg-white/70 border border-orange-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">Editing donor</p>
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedDonor.name?.firstName} {selectedDonor.name?.lastName}
              </h3>
              <p className="text-xs text-slate-500">
                ID: <span className="font-mono">{selectedDonor.donorId}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                {selectedDonor.bloodGroup} {selectedDonor.rh === 'Positive' ? '+' : '-'}
              </span>
              {selectedDonor.lastDonationDate && (
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  Last donation: {new Date(selectedDonor.lastDonationDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
        <DonorForm
          initialData={editInitialData}
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

export default DonorManagement;

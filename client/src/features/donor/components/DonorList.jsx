import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Download } from 'lucide-react';
import Table from '@/components/shared/Table';
import Button from '@/components/shared/Button';
import CustomModal from '@/components/CustomModal';
import { toast } from 'sonner';
import { useDonor } from '@/hooks/useDonor';
import { useAuth } from '@/store/auth';
import { checkAccess } from '@/features/user/pages/utils/access';
import EnhancedLoader from '@/components/utils/Spinner';
import { exportMasterDonors } from '@/utils/excelExportHelper';

const DonorList = ({ 
  onAddDonor, 
  onViewDonor, 
  onEditDonor, 
  onDeleteDonor,
  campId = null 
}) => {
  const { donors, loading, error, fetchDonors, deleteDonor, fetchCampDonors } = useDonor();
  const { user } = useAuth();
  const donorAccess = checkAccess(user, ["donor","donors","donor management"]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForceModal, setShowForceModal] = useState(false);

  useEffect(() => {
    if (campId) {
      fetchCampDonors(campId);
    } else {
      fetchDonors();
    }
  }, [campId]);

  const filteredDonors = donors.filter((donor) => {
    const matchesSearch = 
      donor.name?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.name?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.donorId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBloodGroup = !bloodGroupFilter || donor.bloodGroup === bloodGroupFilter;
    const matchesEligibility = !eligibilityFilter || donor.eligibilityStatus === eligibilityFilter;

    return matchesSearch && matchesBloodGroup && matchesEligibility;
  });

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
        return "Temp Deferred";
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

  const handleDelete = (donor) => {
    if (!donorAccess.canDelete) {
      toast.error('You do not have permission to delete donors.');
      return;
    }
    setDeleteTarget(donor);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const donor = deleteTarget;

    const result = await deleteDonor(donor._id);

    if (result.success) {
      if (onDeleteDonor) onDeleteDonor(donor);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    if (result.code === 'DONOR_HAS_DONATIONS') {
      toast.error(result.message || 'Donor has donation history and cannot be deleted.');
      setShowDeleteModal(false);
      setShowForceModal(true);
    } else {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleExport = async () => {
    if (!donors || donors.length === 0) {
      toast.error('No donors to export');
      return;
    }
    try {
      await exportMasterDonors(donors);
    } catch {
      toast.error('Failed to export donors');
    }
  };

  if (loading) {
    return <EnhancedLoader message="Loading donors..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading donors: {error}</p>
        <Button onClick={() => fetchDonors()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {campId ? 'Camp Donors' : 'All Donors'}
          </h2>
          <p className="text-gray-600">
            {filteredDonors.length} donor{filteredDonors.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onAddDonor} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Donor
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or donor ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Blood Groups</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Status</option>
              <option value="eligible">Eligible</option>
              <option value="deferred">Deferred</option>
              <option value="temp-deferred">Temp Deferred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <Table.Header>
            <tr>
              {!campId && <Table.Head>Donor ID</Table.Head>}
              <Table.Head>Full Name</Table.Head>
              <Table.Head>DOB</Table.Head>
              <Table.Head>Sex</Table.Head>
              <Table.Head>Phone</Table.Head>
              <Table.Head>Blood Group</Table.Head>
              <Table.Head>Last Donation</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Actions</Table.Head>
            </tr>
          </Table.Header>
          <Table.Body>
            {filteredDonors.map((donor, index) => {
              const isDeferred = donor.eligibilityStatus === 'deferred' || donor.eligibilityStatus === 'temp-deferred';
              return (
                <Table.Row key={donor._id || donor.id || index}>
                  {!campId && (
                    <Table.Cell className="font-medium">
                      {isDeferred ? '-' : donor.donorId}
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    {donor.name?.firstName} {donor.name?.middleName} {donor.name?.lastName}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <span>{donor.dob ? new Date(donor.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                      {donor.dob && calculateAge(donor.dob) !== null && (
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                            calculateAge(donor.dob) < 18 
                              ? "bg-red-100 text-red-600" 
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {calculateAge(donor.dob)}
                        </span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{donor.sex}</Table.Cell>
                  <Table.Cell>{donor.phone}</Table.Cell>
                  <Table.Cell>
                    {donor.bloodGroup} {donor.rh === "Positive" ? "+" : "-"}
                  </Table.Cell>
                  <Table.Cell>
                    {donor.recentDonationDate || donor.lastDonationDate
                      ? new Date(donor.recentDonationDate || donor.lastDonationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : "N/A"
                    }
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donor.eligibilityStatus)}`}>
                      {getStatusText(donor.eligibilityStatus)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDonor && onViewDonor(donor)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {donorAccess.canUpdate && !isDeferred && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditDonor && onEditDonor(donor)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {donorAccess.canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(donor)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        {filteredDonors.length === 0 && !loading && (
          <div className="p-8 text-center">
            <p className="text-gray-600">No donors found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <CustomModal
        open={showDeleteModal && !!deleteTarget}
        title="Delete Donor"
        description={`Are you sure you want to delete donor ${(deleteTarget && (`${deleteTarget?.name?.firstName || ''} ${deleteTarget?.name?.lastName || ''}`.trim() || deleteTarget?.donorId)) || ''}? This action cannot be undone.`}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Informational modal: donors with donation history cannot be deleted */}
      <CustomModal
        open={showForceModal && !!deleteTarget}
        title="Cannot Delete Donor"
        description="This donor has donation history and cannot be deleted. Donation records are clinical data and must be preserved for audit purposes."
        onCancel={() => {
          setShowForceModal(false);
          setDeleteTarget(null);
        }}
        hideFooter
      />
    </div>
  );
};

export default DonorList;

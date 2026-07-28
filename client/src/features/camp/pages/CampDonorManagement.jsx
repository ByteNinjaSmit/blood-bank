import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Eye, Edit, Trash2, Download, Activity, AlertTriangle, X, ArrowUpDown, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/shared/Button';
import DonorForm from '@/features/donor/components/DonorForm';
import DonorDetails from '@/features/donor/components/DonorDetails';
import Modal from '@/components/shared/Modal';
import CustomModal from '@/components/CustomModal';
import { useDonor } from '@/hooks/useDonor';
import { useQueryClient } from '@tanstack/react-query';
import { campKeys } from '@/features/camp/queries';
import useAccess from '@/features/access/useAccess';
import EnhancedLoader from '@/components/utils/Spinner';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportCampDonors } from '@/utils/excelExportHelper';

const ConfirmDeleteModal = ({ isOpen, title, message, onConfirm, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0 animate-bounce">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title || 'Delete Confirmation'}</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{message || 'Are you sure you want to delete this?'}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const CampDonorManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAccess();
  const donorAccess = {
    canUpdate: hasPermission('donor:update'),
    canDelete: hasPermission('donor:delete'),
  };

  const {
    donors,
    loading,
    error,
    fetchCampDonors,
    createDonor,
    updateDonor,
    deleteDonor,
  } = useDonor();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [campId, setCampId] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');

  const toggleOrder = () => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
  const resetFilters = () => {
    setSearchQuery('');
    setBloodGroupFilter('');
    setEligibilityFilter('');
    setFromDate('');
    setToDate('');
    setSortBy('name');
    setOrder('asc');
  };

  // Delete dialogs state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  const [showForceModal, setShowForceModal] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      const dataToExport = exportAll ? donors : filteredDonors;
      await exportCampDonors(dataToExport, "Camp");
    } catch (e) {
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) {
      navigate('/camp-listing');
      return;
    }
    setCampId(id);
    fetchCampDonors(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  const handleCreateDonor = async (donorData) => {
    setActionLoading(true);
    const result = await createDonor({ ...donorData, campId });
    if (result.success) {
      setShowCreateModal(false);
      fetchCampDonors(campId);
      queryClient.invalidateQueries({ queryKey: campKeys.detail(campId) });
      queryClient.invalidateQueries({ queryKey: campKeys.list() });
    }
    setActionLoading(false);
  };

  const handleEditDonor = (donor) => {
    setSelectedDonor(donor);
    setShowEditModal(true);
  };

  const handleUpdateDonor = async (donorData) => {
    setActionLoading(true);
    const result = await updateDonor(selectedDonor._id, donorData);
    if (result.success) {
      setShowEditModal(false);
      setSelectedDonor(null);
      fetchCampDonors(campId);
      queryClient.invalidateQueries({ queryKey: campKeys.detail(campId) });
    }
    setActionLoading(false);
  };

  const handleViewDonor = (donor) => {
    setSelectedDonor(donor);
    setShowDetailsModal(true);
  };

  const handleDelete = (donor) => {
    if (!donorAccess.canDelete) {
      toast.error('You do not have permission to delete donors.');
      return;
    }
    setDeleteTarget(donor);
    setConfirmDelete({
      isOpen: true,
      title: 'Delete Donor?',
      message: `Are you sure you want to delete donor ${donor.name?.firstName || ''} ${donor.name?.lastName || ''}? This action cannot be undone.`,
      onConfirm: async () => {
        const result = await deleteDonor(donor._id);

        if (result.success) {
          setDeleteTarget(null);
          fetchCampDonors(campId);
          queryClient.invalidateQueries({ queryKey: campKeys.detail(campId) });
          queryClient.invalidateQueries({ queryKey: campKeys.list() });
          return;
        }

        if (result.code === 'DONOR_HAS_DONATIONS') {
          toast.error(result.message || 'Donor has donation history and cannot be deleted.');
          setShowForceModal(true);
        } else {
          setDeleteTarget(null);
        }
      }
    });
  };

  // Filter computation
  const filteredDonors = donors.filter((donor) => {
    const matchesSearch =
      donor.name?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.name?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.donorId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBloodGroup = !bloodGroupFilter || donor.bloodGroup === bloodGroupFilter;
    const matchesEligibility = !eligibilityFilter || donor.eligibilityStatus === eligibilityFilter;
    const matchesFrom = !fromDate || (donor.lastDonationDate && new Date(donor.lastDonationDate) >= new Date(fromDate));
    const matchesTo = !toDate || (donor.lastDonationDate && new Date(donor.lastDonationDate) <= new Date(`${toDate}T23:59:59`));

    return matchesSearch && matchesBloodGroup && matchesEligibility && matchesFrom && matchesTo;
  });

  filteredDonors.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') {
      cmp = `${a.name?.firstName || ''} ${a.name?.lastName || ''}`.localeCompare(`${b.name?.firstName || ''} ${b.name?.lastName || ''}`);
    } else if (sortBy === 'lastDonationDate') {
      cmp = new Date(a.lastDonationDate || 0) - new Date(b.lastDonationDate || 0);
    } else if (sortBy === 'dob') {
      cmp = new Date(a.dob || 0) - new Date(b.dob || 0);
    }
    return order === 'asc' ? cmp : -cmp;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "eligible":
        return "bg-green-50 text-green-700 border-green-200";
      case "deferred":
        return "bg-red-50 text-red-700 border-red-200";
      case "temp-deferred":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <Users className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Camp Donor Management</h1>
              <p className="text-gray-500 text-sm">Manage donors for this camp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchCampDonors(campId)}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-850 bg-orange-800 text-white rounded-lg text-sm font-semibold hover:bg-orange-900 transition-colors shadow-sm animate-in fade-in zoom-in duration-200"
            >
              <Plus className="w-4 h-4" />
              Add New Donor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        
        {/* Stats card */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 max-w-xs shadow-sm">
            <div className="p-3 bg-orange-50 text-orange-800 rounded-xl shrink-0 animate-in fade-in duration-300">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Records</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{filteredDonors.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or donor ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <select
                value={bloodGroupFilter}
                onChange={(e) => setBloodGroupFilter(e.target.value)}
                className="w-full md:w-auto px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">All Blood Groups</option>
                {['A', 'B', 'AB', 'O'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              <select
                value={eligibilityFilter}
                onChange={(e) => setEligibilityFilter(e.target.value)}
                className="w-full md:w-auto px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">All Status</option>
                <option value="eligible">Eligible</option>
                <option value="deferred">Deferred</option>
                <option value="temp-deferred">Temp Deferred</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Last Donation From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Last Donation To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
              >
                <option value="name">Name</option>
                <option value="lastDonationDate">Last Donation Date</option>
                <option value="dob">Date of Birth</option>
              </select>
            </div>
            <button
              type="button"
              onClick={toggleOrder}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              {order === 'asc' ? 'A → Z' : 'Z → A'}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 rounded-lg text-sm text-orange-800 hover:bg-orange-50 transition-colors font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500 animate-pulse">Loading donors...</div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-500">Error loading donors: {error}</div>
          ) : filteredDonors.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No records found matching filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4.5">Full Name</th>
                    <th className="px-6 py-4.5">DOB</th>
                    <th className="px-6 py-4.5">Sex</th>
                    <th className="px-6 py-4.5">Phone</th>
                    <th className="px-6 py-4.5">Blood Group</th>
                    <th className="px-6 py-4.5">Last Donation</th>
                    <th className="px-6 py-4.5 text-center">Status</th>
                    <th className="px-6 py-4.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-gray-700 font-medium">
                  {filteredDonors.map((donor, idx) => {
                    const isDeferred = donor.eligibilityStatus === 'deferred' || donor.eligibilityStatus === 'temp-deferred';
                    return (
                      <tr key={donor._id || donor.id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {donor.name?.firstName} {donor.name?.middleName} {donor.name?.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">
                              {donor.dob ? new Date(donor.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                            {donor.dob && calculateAge(donor.dob) !== null && (
                              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
                                calculateAge(donor.dob) < 18 ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"
                              }`}>
                                {calculateAge(donor.dob)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">{donor.sex}</td>
                        <td className="px-6 py-4 font-mono text-xs">{donor.phone}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {donor.bloodGroup} {donor.rh === "Positive" ? "+" : "-"}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {donor.lastDonationDate 
                            ? new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                            : "—"
                          }
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(donor.eligibilityStatus)}`}>
                            {getStatusText(donor.eligibilityStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewDonor(donor)}
                              title="View Details"
                              className="p-1 hover:bg-orange-50 rounded-lg text-orange-700 border border-orange-200 transition-all hover:scale-105"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {donorAccess.canUpdate && !isDeferred && (
                              <button
                                onClick={() => handleEditDonor(donor)}
                                title="Edit"
                                className="p-1 hover:bg-orange-50 rounded-lg text-orange-700 border border-orange-200 transition-all hover:scale-105"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {donorAccess.canDelete && (
                              <button
                                onClick={() => handleDelete(donor)}
                                title="Delete"
                                className="p-1 hover:bg-red-50 rounded-lg text-red-650 text-red-600 border border-red-200 transition-all hover:scale-105"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs">
            <span className="text-gray-500 font-medium">{filteredDonors.length} total donors</span>
            <div className="flex items-center gap-2">
              <button disabled className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-400 cursor-not-allowed">Previous</button>
              <span className="text-gray-600 font-semibold px-1">Page 1 / 1</span>
              <button disabled className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-400 cursor-not-allowed">Next</button>
            </div>
          </div>

        </div>

      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Donor"
        size="xl"
      >
        <DonorForm
          onSubmit={handleCreateDonor}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      </Modal>

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
          loading={actionLoading}
        />
      </Modal>

      <DonorDetails
        donor={selectedDonor}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDonor(null);
        }}
      />

      <ConfirmDeleteModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.title}
        message={confirmDelete.message}
        onConfirm={confirmDelete.onConfirm}
        onClose={() => setConfirmDelete({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />

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

export default CampDonorManagement;

import React, { useState } from 'react';
import { Home, Building2, Users, Activity, CheckCircle2, XCircle, Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDonor, useDonorList } from '@/hooks/useDonor';
import { useAuth } from '@/store/auth';
import { checkAccess } from '@/features/user/pages/utils/access';
import DonorForm from '@/features/donor/components/DonorForm';
import DonorDetails from '@/features/donor/components/DonorDetails';
import Modal from '@/components/shared/Modal';
import CustomModal from '@/components/CustomModal';

const TABS = [
  { key: 'inhouse', label: 'Inhouse Donors', icon: Home },
  { key: 'camp',    label: 'Camp Donors',    icon: Building2 },
];

const PAGE_SIZE = 20;

export default function DonorManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createDonor, updateDonor, deleteDonor, forceDeleteDonor } = useDonor();
  const donorAccess = checkAccess(user, ["donor", "donors", "donor management"]);

  const [activeTab, setActiveTab] = useState('inhouse');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('');

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForceModal, setShowForceModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch paginated lists filtered by source (activeTab)
  const { data, isLoading, isError } = useDonorList({
    source: activeTab,
    page,
    pageSize: PAGE_SIZE,
    search: searchQuery || undefined,
    bloodGroup: bloodGroupFilter || undefined,
  });

  const rawItems = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Local filtering for eligibility filter if active (or backend if supported, fallback to local for safety)
  const items = eligibilityFilter
    ? rawItems.filter(donor => donor.eligibilityStatus === eligibilityFilter)
    : rawItems;

  const eligible = items.filter(d => d.eligibilityStatus === 'eligible').length;
  const deferred = items.filter(d => d.eligibilityStatus === 'deferred' || d.eligibilityStatus === 'temp-deferred').length;

  function switchTab(key) {
    setActiveTab(key);
    setPage(1);
  }

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
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    if (result.code === 'DONOR_HAS_DONATIONS') {
      toast.error(result.message || 'Donor has donation history and cannot be deleted.');
      if (donorAccess.canDelete) {
        setShowDeleteModal(false);
        setShowForceModal(true);
      }
    } else {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleForceDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const donor = deleteTarget;
    const forceResult = await forceDeleteDonor(donor._id);
    if (forceResult.success) {
      setShowForceModal(false);
      setDeleteTarget(null);
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
        return status || 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-800 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Donor Management</h1>
                <p className="text-gray-500 text-sm">Central view — Inhouse &amp; Camp donors</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/donor/create-donor')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-800 text-white rounded-lg text-sm font-semibold hover:bg-orange-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Donor
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-6 border-b border-gray-200 -mb-px">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-orange-800 text-orange-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Records', value: total,          icon: Activity,      cls: 'text-gray-700 bg-white border-gray-200'        },
            { label: 'Eligible Donors', value: eligible,     icon: CheckCircle2,  cls: 'text-green-700 bg-green-50 border-green-200'   },
            { label: 'Deferred Donors', value: deferred,     icon: XCircle,       cls: 'text-red-700 bg-red-50 border-red-200'         },
            { label: 'Showing',       value: items.length,   icon: Users,         cls: 'text-orange-700 bg-orange-50 border-orange-200' },
          ].map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-xl border p-4 flex items-center gap-3 ${stat.cls}`}>
                <StatIcon className="w-5 h-5 flex-shrink-0 opacity-70" />
                <div>
                  <p className="text-xs font-medium opacity-70">{stat.label}</p>
                  <p className="text-2xl font-bold leading-none mt-0.5">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or donor ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={bloodGroupFilter}
                onChange={(e) => {
                  setBloodGroupFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">All Blood Groups</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
              <select
                value={eligibilityFilter}
                onChange={(e) => {
                  setEligibilityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading donors…</div>
          ) : isError ? (
            <div className="p-10 text-center text-red-600 text-sm">Failed to load donors.</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No {activeTab === 'inhouse' ? 'inhouse' : 'camp'} donors found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">DOB</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sex</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Group</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Donation</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((donor) => {
                    const isDeferred = donor.eligibilityStatus === 'deferred' || donor.eligibilityStatus === 'temp-deferred';
                    return (
                      <tr key={donor._id || donor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">
                          {isDeferred ? '-' : donor.donorId}
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {donor.name?.firstName} {donor.name?.middleName || ''} {donor.name?.lastName}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center gap-2">
                            <span>{donor.dob ? new Date(donor.dob).toLocaleDateString() : 'N/A'}</span>
                            {donor.dob && calculateAge(donor.dob) !== null && (
                              <span
                                className={`w-6 h-6 flex items-center justify-center rounded-full text-2xs font-bold ${
                                  calculateAge(donor.dob) < 18 
                                    ? "bg-red-100 text-red-600" 
                                    : "bg-green-100 text-green-600"
                                }`}
                              >
                                {calculateAge(donor.dob)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{donor.sex}</td>
                        <td className="px-4 py-3 text-gray-600">{donor.phone}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {donor.bloodGroup} {donor.rh === 'Positive' ? '+' : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {donor.lastDonationDate 
                            ? new Date(donor.lastDonationDate).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })
                            : 'N/A'
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${getStatusColor(donor.eligibilityStatus)}`}>
                            {getStatusText(donor.eligibilityStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewDonor(donor)}
                              title="View Details"
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {donorAccess.canUpdate && !isDeferred && (
                              <button
                                onClick={() => handleEditDonor(donor)}
                                title="Edit Donor"
                                className="p-1 rounded-lg text-orange-700 hover:text-orange-950 hover:bg-orange-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {donorAccess.canDelete && (
                              <button
                                onClick={() => handleDelete(donor)}
                                title="Delete Donor"
                                className="p-1 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm">
              <span className="text-gray-500 text-xs">{total} total donor{total !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600 px-1">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Force delete confirmation modal */}
      <CustomModal
        open={showForceModal && !!deleteTarget}
        title="Force Delete Donor & Related Data"
        description="This donor has donation history. Force deleting will remove the donor and all related blood bags, components, inventory entries, and discard logs. This action is permanent."
        onCancel={() => {
          setShowForceModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleForceDeleteConfirm}
        confirmText="Force Delete"
        confirmVariant="danger"
      >
        <p className="text-sm text-red-700 font-medium mt-2">
          Proceed only if you fully understand the impact.
        </p>
      </CustomModal>
    </div>
  );
}

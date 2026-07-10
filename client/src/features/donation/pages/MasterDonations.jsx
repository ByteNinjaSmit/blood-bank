import React, { useState, useEffect } from 'react';
import { BookOpen, Home, Building2, Droplets, Activity, CheckCircle2, XCircle, Search, Eye, GitCommitHorizontal, Trash2, Plus, X, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDonationList, useDonationDetail, useDeleteDonation } from '@/features/donation/queries';
import DonationTimeline from '../components/DonationTimeline';
import DonationDetails from '../components/DonationDetails';
import Modal from '@/components/shared/Modal';
import CustomModal from '@/components/CustomModal';
import { toast } from 'sonner';
import { exportDonationRegister } from '@/features/donation/donationRegisterExport';
import { donationApi } from '@/features/donation/api';
import { useAuth } from '@/store/auth';
import { checkAccess } from '@/features/user/pages/utils/access';
import RegisterExportDropdown from '@/features/donor/components/RegisterExportDropdown';

const DONATION_REGISTERS = [
  { key: 'all', label: 'Master Donation Register (All)' },
  { key: 'inhouse', label: 'Inhouse Donation Register' },
  { key: 'camp', label: 'Camp Donation Register' },
];

const TABS = [
  { key: 'all',     label: 'Master Donation Register', icon: BookOpen },
  { key: 'inhouse', label: 'Inhouse Donations',        icon: Home },
  { key: 'camp',    label: 'Camp Donations',            icon: Building2 },
];

const PAGE_SIZE = 20;

export default function MasterDonations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const donationAccess = checkAccess(user, ["donation", "donations", "donation management"]);
  const deleteMutation = useDeleteDonation();

  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [trackId, setTrackId] = useState(null);
  const [viewDonationId, setViewDonationId] = useState(null);
  const [searchedDonation, setSearchedDonation] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [bagTypeFilter, setBagTypeFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('collectedAt');
  const [order, setOrder] = useState('desc');
  const [excelLoading, setExcelLoading] = useState(false);

  const toggleOrder = () => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));

  const handleExportRegister = async (register, scope) => {
    try {
      setExcelLoading(true);
      const generatedBy = user?.name ? [user.name.first, user.name.last].filter(Boolean).join(' ') : (user?.username || 'System User');
      const filters = {
        search: searchQuery.trim() || undefined,
        bagType: bagTypeFilter || undefined,
        bloodGroup: bloodGroupFilter || undefined,
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      };
      await exportDonationRegister(register, scope, filters, generatedBy);
      toast.success('Register exported successfully!');
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  // source param: undefined for 'all', otherwise the tab key
  const sourceParam = activeTab === 'all' ? undefined : activeTab;

  // Fetch server-side for inhouse/camp tabs (paginated); fetch all for 'all' tab (client-side filtered)
  const { data, isLoading, isError } = useDonationList(
    activeTab === 'all'
      ? { page: 1, pageSize: 200 }
      : { source: sourceParam, page: 1, pageSize: 200 }
  );

  const { data: detail, isLoading: detailLoading } = useDonationDetail(trackId);
  const { data: viewDetail, isLoading: viewDetailLoading } = useDonationDetail(viewDonationId);

  const allItems = data?.items ?? [];

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchedDonation(null);
      return;
    }

    const exists = allItems.some(
      (d) =>
        (d.donationId || '').toLowerCase() === trimmed.toLowerCase() ||
        (d.bagNo || '').toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setSearchedDonation(null);
      return;
    }

    const fetchSearched = async () => {
      try {
        const res = await donationApi.detail(trimmed);
        if (res) {
          setSearchedDonation(res);
        } else {
          setSearchedDonation(null);
        }
      } catch (err) {
        setSearchedDonation(null);
      }
    };

    const timer = setTimeout(fetchSearched, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, allItems]);

  const baseItems = [...allItems];
  if (searchedDonation) {
    const alreadyExists = baseItems.some(
      (d) => d.donationId === searchedDonation.donationId
    );
    if (!alreadyExists) {
      baseItems.unshift(searchedDonation);
    }
  }

  // Client-side filtering
  const filteredItems = baseItems.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const bagNoMatch = (d.bagNo || d.donationId || '').toLowerCase().includes(q);
      const donorMatch = (d.donorName || '').toLowerCase().includes(q);
      if (!bagNoMatch && !donorMatch) return false;
    }
    if (bagTypeFilter && d.typeOfBag !== bagTypeFilter) return false;
    if (bloodGroupFilter && d.bloodGroup !== bloodGroupFilter) return false;
    const status = d.status || (d.ttiReleaseDecision === 'released' ? 'passed' : d.ttiReleaseDecision === 'reactive' ? 'failed' : 'pending');
    if (statusFilter && status !== statusFilter) return false;
    if (fromDate && (!d.collectedAt || new Date(d.collectedAt) < new Date(fromDate))) return false;
    if (toDate && (!d.collectedAt || new Date(d.collectedAt) > new Date(`${toDate}T23:59:59`))) return false;
    return true;
  });

  filteredItems.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'collectedAt') {
      cmp = new Date(a.collectedAt || 0) - new Date(b.collectedAt || 0);
    } else if (sortBy === 'bagNo') {
      cmp = (a.bagNo || a.donationId || '').localeCompare(b.bagNo || b.donationId || '');
    } else if (sortBy === 'donorName') {
      cmp = (a.donorName || '').localeCompare(b.donorName || '');
    }
    return order === 'asc' ? cmp : -cmp;
  });

  // Stats
  const totalCount = allItems.length;
  const fitCount = filteredItems.filter((d) => d.isFit === true).length;
  const unfitCount = filteredItems.filter((d) => d.isFit === false).length;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function resetFilters() {
    setSearchQuery('');
    setBagTypeFilter('');
    setBloodGroupFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setSortBy('collectedAt');
    setOrder('desc');
    setCurrentPage(1);
  }

  function switchTab(key) {
    setActiveTab(key);
    setTrackId(null);
    resetFilters();
  }

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
    setTrackId(null);
  };

  const handleDelete = (donation) => {
    if (!donationAccess.canDelete) {
      toast.error('You do not have permission to delete donations.');
      return;
    }
    setDeleteTarget(donation);
    setShowDeleteModal(true);
  };

  // Soft-delete only. The donation moves to Recycle Bin and disappears from
  // this register; it can be recovered from there.
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Donation deleted and moved to Recycle Bin');
    } catch (e) {
      toast.error(e?.message ?? 'Failed to delete donation');
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'collected': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'testing':   return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'passed':    return 'bg-green-50 text-green-700 border border-green-200';
      case 'failed':    return 'bg-red-50 text-red-700 border border-red-200';
      case 'issued':    return 'bg-purple-50 text-purple-700 border border-purple-200';
      default:          return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'collected': return 'Collected';
      case 'testing':   return 'Testing';
      case 'passed':    return 'Passed';
      case 'failed':    return 'Failed';
      case 'issued':    return 'Issued';
      default:          return status || 'N/A';
    }
  };

  const emptyText =
    activeTab === 'inhouse' ? 'No inhouse donations found.' :
    activeTab === 'camp'    ? 'No camp donations found.' :
                              'No donations found in the master register.';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-800 rounded-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Master Register — Donations</h1>
                <p className="text-gray-500 text-sm">Inhouse, Camp & combined master register</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RegisterExportDropdown onExport={handleExportRegister} isLoading={excelLoading} registers={DONATION_REGISTERS} />
              <button
                onClick={() => navigate('/master-register/donor-creation')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-800 text-white rounded-lg text-sm font-semibold hover:bg-orange-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Donation
              </button>
            </div>
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
            { label: 'Total Records', value: totalCount,           icon: Activity,     cls: 'text-gray-700 bg-white border-gray-200'        },
            { label: 'Donor Fit',     value: fitCount,             icon: CheckCircle2, cls: 'text-green-700 bg-green-50 border-green-200'   },
            { label: 'Donor Unfit',   value: unfitCount,           icon: XCircle,      cls: 'text-red-700 bg-red-50 border-red-200'         },
            { label: 'Showing',       value: filteredItems.length, icon: Droplets,     cls: 'text-orange-700 bg-orange-50 border-orange-200' },
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
                  placeholder="Search by bag number or donor name..."
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                value={bagTypeFilter}
                onChange={(e) => handleFilterChange(setBagTypeFilter, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">All Bag Types</option>
                <option value="SB">Single Bag (SB)</option>
                <option value="DB">Double Bag (DB)</option>
                <option value="TB">Triple Bag (TB)</option>
                <option value="QB">Quadruple Bag (QB)</option>
              </select>
              <select
                value={bloodGroupFilter}
                onChange={(e) => handleFilterChange(setBloodGroupFilter, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">All Blood Groups</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="collected">Collected</option>
                <option value="testing">Testing</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="issued">Issued</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Collected From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFilterChange(setFromDate, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Collected To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleFilterChange(setToDate, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
              >
                <option value="collectedAt">Collection Date</option>
                <option value="bagNo">Bag No</option>
                <option value="donorName">Donor Name</option>
              </select>
            </div>
            <button
              type="button"
              onClick={toggleOrder}
              title="Toggle sort order"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              {order === 'desc' ? 'Newest First' : 'Oldest First'}
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

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading donations…</div>
          ) : isError ? (
            <div className="p-10 text-center text-red-600 text-sm">Failed to load donations.</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">{emptyText}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bag No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor</th>
                    {activeTab === 'all' && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Units</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fitness</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Collected</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedItems.map((d) => {
                    const status = d.status || (d.ttiReleaseDecision === 'released' ? 'passed' : d.ttiReleaseDecision === 'reactive' ? 'failed' : 'pending');
                    const isCamp = !!d.campId;
                    return (
                      <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${trackId === d.id ? 'bg-orange-50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{d.bagNo || d.donationId}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {d.donorName || <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        {activeTab === 'all' && (
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                              isCamp
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {isCamp ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                              {isCamp ? 'Camp' : 'Inhouse'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                            {d.donationType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {d.bloodGroup
                            ? `${d.bloodGroup}${d.rhFactor === 'Positive' ? ' +' : d.rhFactor === 'Negative' ? ' −' : ''}`
                            : <span className="text-gray-400 font-normal text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 font-medium">{d.unitCount}</td>
                        <td className="px-4 py-3">
                          {d.isFit === true  && <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200 font-medium">Fit</span>}
                          {d.isFit === false && <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200 font-medium">Unfit</span>}
                          {d.isFit == null   && <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(d.collectedAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewDonationId(d.id)}
                              title="View Details"
                              className="p-1 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setTrackId(trackId === d.id ? null : d.id)}
                              title="Track donation timeline"
                              className={`p-1 rounded-lg border transition-colors ${
                                trackId === d.id
                                  ? 'bg-orange-800 text-white border-orange-800'
                                  : 'text-orange-700 hover:bg-orange-50 border-orange-200'
                              }`}
                            >
                              <GitCommitHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {donationAccess.canDelete && (
                              <button
                                onClick={() => handleDelete(d)}
                                title="Delete Donation"
                                className="p-1 rounded-lg border border-red-200 text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
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

          {/* Pagination */}
          {!isLoading && filteredItems.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm">
              <span className="text-gray-500 text-xs">{filteredItems.length} matching donation{filteredItems.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600 px-1">Page {currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline drawer */}
      {trackId && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setTrackId(null)}
          />
          <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <GitCommitHorizontal className="w-4 h-4 text-orange-800" />
                <h2 className="font-semibold text-gray-900 text-sm">Donation Timeline</h2>
                {activeTab === 'camp' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                    <Building2 className="w-3 h-3" /> Camp
                  </span>
                )}
              </div>
              <button
                onClick={() => setTrackId(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="py-16 text-center text-gray-400 text-sm">Loading timeline…</div>
              ) : detail ? (
                <DonationTimeline donation={detail} />
              ) : (
                <div className="py-16 text-center text-gray-400 text-sm">Donation not found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      <Modal
        isOpen={!!viewDonationId}
        onClose={() => setViewDonationId(null)}
        title="Donation Details"
        size="lg"
        className="bg-gradient-to-b from-orange-50 to-white"
      >
        {viewDetailLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading details…</div>
        ) : viewDetail ? (
          <DonationDetails donation={viewDetail} />
        ) : (
          <div className="py-16 text-center text-gray-400 text-sm">Donation not found.</div>
        )}
      </Modal>

      {/* Delete confirmation modal — soft delete only, donation moves to Recycle Bin */}
      <CustomModal
        open={showDeleteModal && !!deleteTarget}
        title="Delete Donation"
        description={`Delete donation ${deleteTarget?.bagNo || deleteTarget?.donationId || ''}? It will be moved to the Recycle Bin, where it can be restored or permanently removed.`}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Eye, Activity, Upload, X, Search, ArrowUpDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import DonationDetails from '@/features/donation/components/DonationDetails';
import { useDonationDetail } from '@/features/donation/queries';
import { useDonation } from '@/hooks/useDonation';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportCampDonations } from '@/utils/excelExportHelper';

const CampDonationManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { donations: rawDonations, pagination, loading, error, fetchDonations } = useDonation();
  const [campId, setCampId] = useState(null);
  const [viewDonationId, setViewDonationId] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [bagTypeFilter, setBagTypeFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('collectedAt');
  const [order, setOrder] = useState('desc');

  const toggleOrder = () => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
  const resetFilters = () => {
    setSearchQuery('');
    setBagTypeFilter('');
    setBloodGroupFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setSortBy('collectedAt');
    setOrder('desc');
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      await exportCampDonations(exportAll ? rawDonations : donations, "Camp");
    } catch (e) {
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  const { data: viewDetail, isLoading: viewDetailLoading } = useDonationDetail(viewDonationId);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) {
      navigate('/camp-listing');
      return;
    }
    setCampId(id);
    fetchDonations({
      campId: id,
      page: 1,
      pageSize: 200,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate, fromDate, toDate]);

  const donations = rawDonations.filter((d) => {
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
    return true;
  });

  donations.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'collectedAt') cmp = new Date(a.collectedAt || 0) - new Date(b.collectedAt || 0);
    else if (sortBy === 'bagNo') cmp = (a.bagNo || a.donationId || '').localeCompare(b.bagNo || b.donationId || '');
    else if (sortBy === 'donorName') cmp = (a.donorName || '').localeCompare(b.donorName || '');
    return order === 'asc' ? cmp : -cmp;
  });

  const handleViewDonation = (donation) => {
    setViewDonationId(donation._id || donation.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "collected":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "testing":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "passed":
        return "bg-green-50 text-green-700 border-green-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      case "issued":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "collected":
        return "Collected";
      case "testing":
        return "Testing";
      case "passed":
        return "Passed";
      case "failed":
        return "Failed";
      case "issued":
        return "Issued";
      default:
        return status;
    }
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
              <Droplets className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Camp Donation Management</h1>
              <p className="text-gray-500 text-sm">Manage donations for this camp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
            <button
              onClick={() => navigate(`/master-register/donor-creation?campId=${campId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-850 bg-orange-800 text-white rounded-lg text-sm font-semibold hover:bg-orange-900 transition-colors shadow-sm animate-in fade-in zoom-in duration-200"
            >
              <Plus className="w-4 h-4" />
              New Donation
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
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{donations.length}</p>
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
                placeholder="Search by bag number or donor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <select
                value={bagTypeFilter}
                onChange={(e) => setBagTypeFilter(e.target.value)}
                className="w-full md:w-auto px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">All Bag Types</option>
                <option value="SB">Single Bag (SB)</option>
                <option value="DB">Double Bag (DB)</option>
                <option value="TB">Triple Bag (TB)</option>
                <option value="QB">Quadruple Bag (QB)</option>
              </select>
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-auto px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
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
          <div className="flex flex-col md:flex-row md:items-end gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Collected From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Collected To</label>
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
                <option value="collectedAt">Collection Date</option>
                <option value="bagNo">Bag No</option>
                <option value="donorName">Donor Name</option>
              </select>
            </div>
            <button
              type="button"
              onClick={toggleOrder}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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

        {/* Table list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500 animate-pulse">Loading donations...</div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-500">Error loading donations: {error}</div>
          ) : donations.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4.5">Bag No</th>
                    <th className="px-6 py-4.5">Donor</th>
                    <th className="px-6 py-4.5">Type</th>
                    <th className="px-6 py-4.5">Blood</th>
                    <th className="px-6 py-4.5 text-center">Units</th>
                    <th className="px-6 py-4.5 text-center">Fitness</th>
                    <th className="px-6 py-4.5 text-center">Status</th>
                    <th className="px-6 py-4.5">Collected</th>
                    <th className="px-6 py-4.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-gray-700 font-medium">
                  {donations.map((donation, idx) => {
                    const bagNo = donation.bagNo || donation.donationId || '-';
                    const typeOfBag = donation.typeOfBag || '-';
                    const donorName = donation.donorName || 
                      (donation.donor?.name 
                        ? [donation.donor.name.firstName, donation.donor.name.middleName, donation.donor.name.lastName].filter(Boolean).join(' ') 
                        : (typeof donation.donor === 'string' ? donation.donor : '-'));
                    const bloodGroup = donation.bloodGroup || '-';
                    const rhSymbol = donation.rhFactor
                      ? (donation.rhFactor === 'POSITIVE' || donation.rhFactor === 'Positive' ? '+' : '-')
                      : (donation.rh === 'Positive' || donation.rh === 'POSITIVE' ? '+' : donation.rh === 'Negative' || donation.rh === 'NEGATIVE' ? '-' : '');
                    const isFit = donation.isFit !== undefined
                      ? donation.isFit
                      : (donation.donorFitness?.isFit !== undefined ? donation.donorFitness.isFit : true);
                    const status = donation.status ||
                      (donation.ttiReleaseDecision === 'released' ? 'passed' : donation.ttiReleaseDecision === 'reactive' ? 'failed' : 'pending');
                    const colDate = donation.collectedAt || donation.collectionDate;

                    return (
                      <tr key={donation._id || donation.id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-700 font-medium">
                          {bagNo}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {donorName}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-[10px]">
                            {typeOfBag}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {bloodGroup} {rhSymbol}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-900">
                          {donation.unitCount || 1}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isFit 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {isFit ? 'Fit' : 'Unfit'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {colDate ? new Date(colDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleViewDonation(donation)}
                              title="View Details"
                              className="p-1 hover:bg-orange-50 rounded-lg text-orange-700 border border-orange-200 transition-all hover:scale-105"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
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
            <span className="text-gray-500 font-medium">{donations.length} total donations</span>
            <div className="flex items-center gap-2">
              <button disabled className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-400 cursor-not-allowed">Previous</button>
              <span className="text-gray-600 font-semibold px-1">Page 1 / 1</span>
              <button disabled className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-400 cursor-not-allowed">Next</button>
            </div>
          </div>

        </div>

      </div>

      {/* Details Modal */}
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

    </div>
  );
};

export default CampDonationManagement;

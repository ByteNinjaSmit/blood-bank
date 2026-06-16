import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Table from '@/components/shared/Table';
import Button from '@/components/shared/Button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useDonation } from '@/hooks/useDonation';

const DonationList = ({
  onAddDonation,
  onViewDonation,
  campId = null,
}) => {
  const { donations, pagination, loading, error, fetchDonations, fetchCampDonations } = useDonation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeOfBag: '',
    bloodGroup: '',
    status: '',
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadDonations = useCallback(() => {
    if (campId) {
      fetchCampDonations(campId);
    } else {
      const queryParams = {
        page,
        limit: rowsPerPage,
      };
      if (filters.typeOfBag) queryParams.typeOfBag = filters.typeOfBag;
      if (filters.bloodGroup) queryParams.bloodGroup = filters.bloodGroup;
      if (filters.status) queryParams.status = filters.status;

      fetchDonations(queryParams);
    }
  }, [campId, page, rowsPerPage, filters]);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  // Reset to page 1 when filters change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleRowsPerPageChange = (newLimit) => {
    setRowsPerPage(newLimit);
    setPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "collected":
        return "bg-blue-100 text-blue-800";
      case "testing":
        return "bg-yellow-100 text-yellow-800";
      case "passed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "issued":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export donations');
  };

  if (loading) {
    return <LoadingSpinner message="Loading donations..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading donations: {error}</p>
        <Button onClick={loadDonations} className="mt-4">
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
            {campId ? 'Camp Donations' : 'All Donations'}
          </h2>
          <p className="text-gray-600">
            {pagination.totalBags} donation{pagination.totalBags !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onAddDonation} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Donation
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
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
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Donations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type of Bag</label>
              <select
                value={filters.typeOfBag}
                onChange={(e) => handleFilterChange('typeOfBag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Types</option>
                <option value="DB">Double Bag (DB)</option>
                <option value="TB">Triple Bag (TB)</option>
                <option value="QB">Quadruple Bag (QB)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <select
                value={filters.bloodGroup}
                onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Groups</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Status</option>
                <option value="collected">Collected</option>
                <option value="testing">Testing</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="issued">Issued</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <Table.Header>
            <tr>
              <Table.Head>Bag No</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>Donor Name</Table.Head>
              <Table.Head>Blood Group</Table.Head>
              <Table.Head>Fitness</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Collection Date</Table.Head>
              <Table.Head>Actions</Table.Head>
            </tr>
          </Table.Header>
          <Table.Body>
            {donations.map((donation) => {
              const bagNo = donation.bagNo || donation.donationId || '-';
              const typeOfBag = donation.typeOfBag || '-';
              const donorName = donation.donorName || 
                (donation.donor?.name 
                  ? `${donation.donor.name.firstName || ''} ${donation.donor.name.lastName || ''}`.trim() 
                  : (typeof donation.donor === 'string' ? donation.donor : '-'));
              const bloodGroup = donation.bloodGroup || '-';
              const rhSymbol = donation.rhFactor
                ? (donation.rhFactor === 'POSITIVE' ? '+' : '-')
                : (donation.rh === 'Positive' ? '+' : donation.rh === 'Negative' ? '-' : '');
              const isFit = donation.isFit !== undefined
                ? donation.isFit
                : (donation.donorFitness?.isFit !== undefined ? donation.donorFitness.isFit : true);
              const rejectionReason = donation.donorFitness?.rejectionReason || '';
              const status = donation.status ||
                (donation.ttiReleaseDecision === 'released' ? 'passed' : donation.ttiReleaseDecision === 'reactive' ? 'failed' : 'pending');
              const colDate = donation.collectedAt || donation.collectionDate;

              return (
                <Table.Row key={donation._id || donation.id}>
                  <Table.Cell className="font-medium font-mono text-xs">{bagNo}</Table.Cell>
                  <Table.Cell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {typeOfBag}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{donorName}</Table.Cell>
                  <Table.Cell className="font-semibold text-gray-800">
                    {bloodGroup} {rhSymbol}
                  </Table.Cell>
                  <Table.Cell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isFit
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                      title={rejectionReason}
                    >
                      {isFit ? 'Fit' : 'Unfit'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-gray-500 text-xs">
                    {colDate ? new Date(colDate).toLocaleString() : '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDonation && onViewDonation(donation)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        {donations.length === 0 && !loading && (
          <div className="p-8 text-center">
            <p className="text-gray-600">No donations found matching your criteria.</p>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
              {' '}({pagination.totalBags} total)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="px-2 py-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(pagination.totalPages || 1, prev + 1))}
                disabled={page >= (pagination.totalPages || 1)}
                className="px-2 py-1"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationList;


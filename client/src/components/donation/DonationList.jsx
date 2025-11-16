import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Download, Filter } from 'lucide-react';
import Table from '@/components/shared/Table';
import Button from '@/components/shared/Button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useDonation } from '@/hooks/useDonation';

const DonationList = ({ 
  onAddDonation, 
  onViewDonation, 
  campId = null,
}) => {
  const { donations, loading, error, fetchDonations, fetchCampDonations } = useDonation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    typeOfBag: '',
    bloodGroup: '',
    status: '',
  });

  useEffect(() => {
    if (campId) {
      fetchCampDonations(campId);
    } else {
      fetchDonations();
    }
  }, [campId]);

  const filteredDonations = donations.filter((donation) => {
    return (
      (!filters.typeOfBag || donation.typeOfBag === filters.typeOfBag) &&
      (!filters.bloodGroup || donation.bloodGroup === filters.bloodGroup) &&
      (!filters.status || donation.status === filters.status)
    );
  });

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
        <Button onClick={() => fetchDonations()} className="mt-4">
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
            {filteredDonations.length} donation{filteredDonations.length !== 1 ? 's' : ''} found
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
                onChange={(e) => setFilters({ ...filters, typeOfBag: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              <Table.Head>Donor Name</Table.Head>
              <Table.Head>Blood Group</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Collection Date</Table.Head>
              <Table.Head>Actions</Table.Head>
            </tr>
          </Table.Header>
          <Table.Body>
            {filteredDonations.map((donation) => (
              <Table.Row key={donation._id}>
                <Table.Cell className="font-medium">{donation.bagNo}</Table.Cell>
                <Table.Cell>
                  {donation.donor?.name?.firstName} {donation.donor?.name?.lastName}
                </Table.Cell>
                <Table.Cell>
                  {donation.bloodGroup} {donation.rh === "Positive" ? "+" : "-"}
                </Table.Cell>
                <Table.Cell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                    {getStatusText(donation.status)}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {new Date(donation.collectionDate).toLocaleDateString()}
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
            ))}
          </Table.Body>
        </Table>

        {filteredDonations.length === 0 && !loading && (
          <div className="p-8 text-center">
            <p className="text-gray-600">No donations found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationList;

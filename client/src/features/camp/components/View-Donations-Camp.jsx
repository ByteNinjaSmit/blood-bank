import React, { useEffect, useState } from "react"
import { Filter, Eye, Edit, Trash2, X, Droplets } from "lucide-react"
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/core/api-client";
import Loader from "../utils/Spinner";
import EnhancedLoader from "../utils/Spinner";

const ViewDonationsCamp = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null })
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState([])

  const [filters, setFilters] = useState({
    typeOfBag: "",
    bloodGroup: "",
    status: "",
  })

  const onBack = () => {
    navigate(-1);
  }

  useEffect(() => {
    setLoading(true);
    const searchParams = new URLSearchParams(location.search);
    const campId = searchParams.get("id");
    console.log("Camp ID from URL:", campId);
    if (!campId) {
      navigate("/camp-listing");
      return;
    }
    getCampDonations(campId);
  }, [location.search]);

  const getCampDonations = async (campId) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v2/camp/donations/${campId}`);
      if (response.status === 200) {
        console.log("Camp Donations:", response.data.data.donations);
        setDonations(response.data.data.donations);
      }
    } catch (error) {
      console.log("Error fetching camp donors:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredDonations = donations.filter((donation) => {
    const typeOfBagFilter = filters.typeOfBag?.trim().toLowerCase();
    const bloodGroupFilter = filters.bloodGroup?.trim().toUpperCase();
    const statusFilter = filters.status?.trim().toLowerCase();
    const searchQueryLower = filters.searchQuery?.trim().toLowerCase();

    const donationType = donation.typeOfBag?.toLowerCase();
    const donationBlood = donation.bloodGroup?.toUpperCase();
    const donationStatus = donation.status?.toLowerCase();

    const donorName = donation.donor
      ? `${donation.donor.name.firstName} ${donation.donor.name.middleName || ''} ${donation.donor.name.lastName}`.toLowerCase()
      : '';
    const donorId = donation.donor?.donorId?.toLowerCase() || '';

    return (
      (!typeOfBagFilter || donationType === typeOfBagFilter) &&
      (!bloodGroupFilter || donationBlood === bloodGroupFilter) &&
      (!statusFilter || donationStatus === statusFilter) &&
      (!searchQueryLower || donorName.includes(searchQueryLower) || donorId.includes(searchQueryLower))
    );
  });



  const handleViewDetails = (donation) => {
    setSelectedDonation(donation)
  }

  const handleUpdate = (donationId) => {
    console.log("Update donation:", donationId)
    // Handle update logic
  }

  const handleDelete = (donation) => {
    setDeleteConfirm({ show: true, item: donation })
  }

  const confirmDelete = () => {
    if (deleteConfirm.item) {
      console.log("Delete donation:", deleteConfirm.item)
      // Implement actual delete functionality here
      setDeleteConfirm({ show: false, item: null })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, item: null })
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDonorFullName = (donation) => {
    if (!donation.donor || !donation.donor.name) return "N/A";
    const { firstName, middleName, lastName } = donation.donor.name;
    return `${firstName} ${middleName || ""} ${lastName}`.trim();
  };


  useEffect(() => {
    if (!donations && !loading) {
      // Redirect to camp listing page
      onBack();
    }
  }, [donations, loading, navigate]);

  if (loading) {
    return <EnhancedLoader message="Loading camp details..." />
  }

  return (
    <div className="min-h-screen bg-white">

      <div className="bg-white border-b border-orange-200 text-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">View Camp Donations</h1>
                <p className="text-gray-500 text-sm">Manage donation records</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white cursor-pointer hover:bg-red-900 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Filter Donations</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search by Name or Donor ID</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.searchQuery || ""}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              {/* Type of Bag */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type of Bag</label>
                <select
                  value={filters.typeOfBag}
                  onChange={(e) => setFilters({ ...filters, typeOfBag: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Types</option>
                  <option value="DB">Double Bag (DB)</option>
                  <option value="TB">Triple Bag (TB)</option>
                  <option value="QB">Quadruple Bag (QB)</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Groups</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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


        {/* Donations Table */}
        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Bag No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Segment No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Donor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Donor ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Type of Bag</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Blood Group</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Collection Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Hemoglobin</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Weight (kg)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Pulse</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Temperature (°C)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Blood Pressure</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDonations?.length > 0 ? (
                  filteredDonations.map((donation) => (
                    <tr key={donation._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.bagNo}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.segmentNo}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{getDonorFullName(donation)}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.donor.donorId}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.typeOfBag}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">
                        {donation.bloodGroup}{donation.rh === "Positive" ? "+" : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${donation.status === "collected"
                            ? "bg-blue-100 text-blue-800"
                            : donation.status === "testing"
                              ? "bg-yellow-100 text-yellow-800"
                              : donation.status === "passed"
                                ? "bg-green-100 text-green-800"
                                : donation.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-800"
                            }`}
                        >
                          {donation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">{formatDate(donation.collectionDate)}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.initialVitals?.hb || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.initialVitals?.weightKg || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.initialVitals?.pulse || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.initialVitals?.tempC || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-slate-800">{donation.initialVitals?.bp || "N/A"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 relative">
                          {/* Update Button */}
                          <button
                            onClick={() => handleUpdate(donation._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Update"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(donation)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Delete Confirmation */}
                          {deleteConfirm.show && deleteConfirm.item?._id === donation._id && (
                            <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 min-w-48">
                              <p className="text-sm text-gray-700 mb-3">Do you want to delete <strong>{getDonorFullName(donation)}</strong>?</p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={confirmDelete}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={cancelDelete}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="text-center py-8 text-gray-500">
                      No donations available.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>

      </div>

      {/* View Details Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">Donation Details</h2>
              <button
                onClick={() => setSelectedDonation(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Bag Number</label>
                    <p className="text-slate-800">{selectedDonation.bagNo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Segment Number</label>
                    <p className="text-slate-800">{selectedDonation.segmentNo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Donor Name</label>
                    <p className="text-slate-800">{getDonorFullName(selectedDonation)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Type of Bag</label>
                    <p className="text-slate-800">{selectedDonation.typeOfBag}</p>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Vitals</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Hemoglobin</label>
                    <p className="text-slate-800">{selectedDonation.hb} g/dL</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Weight</label>
                    <p className="text-slate-800">{selectedDonation.weightKg} kg</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Pulse</label>
                    <p className="text-slate-800">{selectedDonation.pulse} bpm</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Temperature</label>
                    <p className="text-slate-800">{selectedDonation.tempC}°C</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600">Blood Pressure</label>
                    <p className="text-slate-800">{selectedDonation.bp}</p>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Test Results</h3>
                <div className="space-y-2">
                  {selectedDonation.testResults.map((test, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="font-medium text-slate-700">{test.test}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${test.result === "Negative"
                          ? "bg-green-100 text-green-800"
                          : test.result === "Positive"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {test.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewDonationsCamp

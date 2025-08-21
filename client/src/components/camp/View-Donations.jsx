import React from "react"
import { useState } from "react"
import { ArrowLeft, Filter, Eye, Edit, Trash2, X, Droplets } from "lucide-react"

const ViewDonations = ({ onBack }) => {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [filters, setFilters] = useState({
    typeOfBag: "",
    bloodGroup: "",
    status: "",
  })

  // Mock data - in real app, this would come from API
  const donations = [
    {
      id: "1",
      bagNo: "BG001",
      segmentNo: "SG001",
      donorName: "John Doe",
      donorUID: "D001",
      typeOfBag: "DB",
      bloodGroup: "A",
      rh: "Positive",
      collectionDate: "2024-01-15",
      expiryDate: "2024-02-15",
      status: "collected",
      hb: 13.5,
      weightKg: 70,
      pulse: 72,
      tempC: 36.5,
      bp: "120/80",
      testResults: [
        { test: "HIV", result: "Negative", testedAt: "2024-01-15" },
        { test: "HBsAg", result: "Negative", testedAt: "2024-01-15" },
      ],
    },
  ]

  const filteredDonations = donations.filter((donation) => {
    return (
      (!filters.typeOfBag || donation.typeOfBag === filters.typeOfBag) &&
      (!filters.bloodGroup || donation.bloodGroup === filters.bloodGroup) &&
      (!filters.status || donation.status === filters.status)
    )
  })

  const handleViewDetails = (donation) => {
    setSelectedDonation(donation)
  }

  const handleUpdate = (donationId) => {
    console.log("Update donation:", donationId)
    // Handle update logic
  }

  const handleDelete = (donationId) => {
    console.log("Delete donation:", donationId)
    // Handle delete logic
  }

  return (
    <div className="min-h-screen bg-white">

      <div className="bg-white border-b border-orange-200 text-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center cursor-pointer gap-3 text-orange-800 border border-orange-300 hover:bg-orange-50 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Donations
          </button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">View Camp Donations</h1>
                <p className="text-gray-600 mt-1">Manage donation records</p>
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
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Filter Donations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Donor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Blood Group</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Collection Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-800">{donation.bagNo}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">{donation.donorName}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">
                      {donation.bloodGroup}
                      {donation.rh === "Positive" ? "+" : "-"}
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
                    <td className="px-6 py-4 text-sm text-slate-800">{donation.collectionDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(donation)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdate(donation.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Update"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(donation.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                    <p className="text-slate-800">{selectedDonation.donorName}</p>
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

export default ViewDonations

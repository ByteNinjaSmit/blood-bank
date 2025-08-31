import React, { useState, useEffect } from "react"
import {
  ArrowLeft,
  Search,
  Plus,
  Droplets,
  Users,
  Pencil,
  Trash2,
} from "lucide-react"

const ViewDonorCamp = ({ onBack }) => {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [bloodGroupFilter, setBloodGroupFilter] = useState("")
  const [eligibilityFilter, setEligibilityFilter] = useState("")
  const [deleteConfirmFor, setDeleteConfirmFor] = useState(null)

  // Mock data
  useEffect(() => {
    const mockDonors = [
      {
        id: "1",
        donorId: "DNR-2025-0001",
        fullName: "John Michael Doe",
        lastDonationDate: "2024-12-15",
        uid: "123456789012",
        dob: "1990-05-15",
        sex: "M",
        phone: "9876543210",
        email: "john.doe@email.com",
        city: "Mumbai",
        district: "Mumbai",
        state: "Maharashtra",
        bloodGroup: "O",
        rh: "Positive",
        weightKg: 70,
        eligibilityStatus: "eligible",
        occupation: "Engineer",
      },
      {
        id: "2",
        donorId: "DNR-2025-0002",
        fullName: "Sarah Jane Smith",
        lastDonationDate: "2024-11-20",
        uid: "987654321098",
        dob: "1985-08-22",
        sex: "F",
        phone: "8765432109",
        email: "sarah.smith@email.com",
        city: "Delhi",
        district: "New Delhi",
        state: "Delhi",
        bloodGroup: "A",
        rh: "Negative",
        weightKg: 55,
        eligibilityStatus: "temp-deferred",
        occupation: "Doctor",
      },
    ]

    setTimeout(() => {
      setDonors(mockDonors)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredDonors = donors.filter((donor) => {
    const matchesSearch =
      donor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.donorId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBloodGroup =
      !bloodGroupFilter || donor.bloodGroup === bloodGroupFilter
    const matchesEligibility =
      !eligibilityFilter || donor.eligibilityStatus === eligibilityFilter

    return matchesSearch && matchesBloodGroup && matchesEligibility
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "eligible":
        return "bg-green-100 text-green-800"
      case "deferred":
        return "bg-red-100 text-red-800"
      case "temp-deferred":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "eligible":
        return "Eligible"
      case "deferred":
        return "Deferred"
      case "temp-deferred":
        return "Temp Deferred"
      default:
        return status
    }
  }

  const handleDelete = (donorId) => {
    setDonors((prev) => prev.filter((donor) => donor.id !== donorId))
    setDeleteConfirmFor(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-3 text-orange-800 border border-orange-300 hover:bg-orange-50 bg-white shadow rounded-xl px-6 py-3 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Donations
          </button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 mb-6 sm:mb-0">
              <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  View Camp Donors
                </h1>
                <p className="text-gray-600 mt-1">Manage Donor Records</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white hover:bg-red-900 rounded-lg">
              <Plus className="w-4 h-4" />
              Add New Donor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or donor ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={bloodGroupFilter}
                onChange={(e) => setBloodGroupFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
        <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading donors...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    {[
                      "Donor ID",
                      "Full Name",
                      "UID",
                      "DOB",
                      "Sex",
                      "Phone",
                      "Email",
                      "City",
                      "District",
                      "State",
                      "Blood Group",
                      "Eligibility",
                      "Weight",
                      "Occupation",
                      "Last Donation",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDonors.map((donor, idx) => (
                    <tr
                      key={donor.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4">{donor.donorId}</td>
                      <td className="px-6 py-4">{donor.fullName}</td>
                      <td className="px-6 py-4">{donor.uid}</td>
                      <td className="px-6 py-4">{donor.dob}</td>
                      <td className="px-6 py-4">{donor.sex}</td>
                      <td className="px-6 py-4">{donor.phone}</td>
                      <td className="px-6 py-4">{donor.email}</td>
                      <td className="px-6 py-4">{donor.city}</td>
                      <td className="px-6 py-4">{donor.district}</td>
                      <td className="px-6 py-4">{donor.state}</td>
                      <td className="px-6 py-4">
                        {donor.bloodGroup} {donor.rh === "Positive" ? "+" : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            donor.eligibilityStatus
                          )}`}
                        >
                          {getStatusText(donor.eligibilityStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{donor.weightKg} kg</td>
                      <td className="px-6 py-4">{donor.occupation}</td>
                      <td className="px-6 py-4">{donor.lastDonationDate}</td>
                      <td className="px-6 py-4 relative">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                            <Pencil className="w-4 h-4 inline" /> 
                          </button>
                          <button
                            onClick={() => setDeleteConfirmFor(donor.id)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4 inline" /> 
                          </button>
                        </div>

                        {/* Inline Delete Popup */}
                        {deleteConfirmFor === donor.id && (
                          <div className="absolute top-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 w-56">
                            <p className="text-sm text-gray-700 mb-3">
                              Do you want to delete{" "}
                              <strong>{donor.fullName}</strong>?
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDelete(donor.id)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmFor(null)}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDonors.length === 0 && !loading && (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No donors found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewDonorCamp

import React, { useState, useEffect } from "react"
import { ArrowLeft, Eye, X, Users, Search, Plus, Droplets, Download } from "lucide-react"
// import * as XLSX from "xlsx"


const ViewDonor = ({ onBack }) => {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [bloodGroupFilter, setBloodGroupFilter] = useState("")
  const [eligibilityFilter, setEligibilityFilter] = useState("")

  // Mock data
  useEffect(() => {
    const mockDonors = [
      {
        id: "1",
        donorId: "DNR-YY-MM-DD-HH-MM",
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
        address: {
          line1: "123 Main Street",
          line2: "Apt 4B",
          pincode: "400001",
        },
        donationHistory: [
          { date: "2024-12-15", bagNo: "BAG001", donationId: "DON001" },
          { date: "2024-09-10", bagNo: "BAG002", donationId: "DON002" },
        ],
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
        address: {
          line1: "456 Park Avenue",
          line2: "",
          pincode: "110001",
        },
        donationHistory: [{ date: "2024-11-20", bagNo: "BAG003", donationId: "DON003" }],
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
    const matchesBloodGroup = !bloodGroupFilter || donor.bloodGroup === bloodGroupFilter
    const matchesEligibility = !eligibilityFilter || donor.eligibilityStatus === eligibilityFilter

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

  //excel sheet export part check and do changes
  const handleExport = () => {
    const rows = filteredDonors.map((d) => ({
      "Donor ID": d.donorId,
      "Full Name": d.fullName,
      UID: d.uid,
      DOB: d.dob,
      Sex: d.sex,
      Phone: d.phone,
      Email: d.email,
      City: d.city,
      District: d.district,
      State: d.state,
      "Blood Group": d.bloodGroup,
      RH: d.rh,
      "Weight (kg)": d.weightKg,
      "Eligibility Status": d.eligibilityStatus,
      "Last Donation": d.lastDonationDate,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Donors")
    XLSX.writeFile(wb, "donors.xlsx")
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
                <h1 className="text-3xl font-bold text-gray-900">View Camp Donors</h1>
                <p className="text-gray-600 mt-1">Manage Donor records</p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Add New Donor */}
              <button className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white cursor-pointer hover:bg-red-900 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                Add New Donor
              </button>

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-400 rounded-lg transition-colors"
                title="Export to Excel"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading donors...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEX</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Donation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDonors.map((donor) => (
                    <tr key={donor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{donor.donorId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{donor.fullName}</td>

                      {/* DOB + Age Badge */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                        <span>{donor.dob}</span>
                        {(() => {
                          const today = new Date();
                          const dob = new Date(donor.dob);
                          let age = today.getFullYear() - dob.getFullYear();
                          const monthDiff = today.getMonth() - dob.getMonth();
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                            age--;
                          }

                          return (
                            <span
                              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold 
                        ${age < 18 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                            >
                              {age}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{donor.sex}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{donor.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donor.bloodGroup} {donor.rh === "Positive" ? "+" : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{donor.lastDonationDate || "N/A"}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedDonor(donor)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDonors.length === 0 && !loading && (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No donors found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* View Details Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Donor Details</h2>
              <button
                onClick={() => setSelectedDonor(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">UID:</span> {selectedDonor.uid}</div>

                  <div><span className="font-medium">Weight:</span> {selectedDonor.weightKg} kg</div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Email:</span> {selectedDonor.email}</div>
                  <div><span className="font-medium">Address:</span> {selectedDonor.address.line1} {selectedDonor.address.line2}</div>
                  <div><span className="font-medium">City:</span> {selectedDonor.city}</div>
                  <div><span className="font-medium">District:</span> {selectedDonor.district}</div>
                  <div><span className="font-medium">State:</span> {selectedDonor.state}</div>
                  <div><span className="font-medium">Pincode:</span> {selectedDonor.address.pincode}</div>
                  <div><span className="font-medium">Occupation:</span> {selectedDonor.occupation}</div>
                </div>
              </div>

              {/* Donation History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Donation History</h3>
                {selectedDonor.donationHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bag No</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Donation ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedDonor.donationHistory.map((donation, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{donation.date}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{donation.bagNo}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{donation.donationId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No donation history available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewDonor

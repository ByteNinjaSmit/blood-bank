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
import axios from "axios"
import { useAuth } from "@/store/auth"
import { useNavigate } from "react-router-dom"
import Loader from "@/components/Loader"

const ViewDonorCamp = () => {
  const navigate = useNavigate();
  const { API, authorizationToken } = useAuth();
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [bloodGroupFilter, setBloodGroupFilter] = useState("")
  const [eligibilityFilter, setEligibilityFilter] = useState("")
  const [deleteConfirmFor, setDeleteConfirmFor] = useState(null)

  const onBack = () => {
    // Back by Browser
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
    getCampDonors(campId);
  }, [location.search]);

  const getCampDonors = async (campId) => {
    try {
      const response = await axios.get(`${API}/api/site/camp-donors/${campId}`, {
        headers: { Authorization: authorizationToken }, withCredentials: true,
      });
      if (response.status === 200) {
        console.log("Camp Donors:", response.data.data.donors);
        setDonors(response.data.data.donors);
      }
    } catch (error) {
      console.log("Error fetching camp donors:", error);
    } finally {
      setLoading(false);
    }
  }
  const filteredDonors = donors?.filter((donor) => {
    const fullName = `${donor.name.firstName} ${donor.name.middleName || ""} ${donor.name.lastName}`.trim();

    // Search filter: name or donorId
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.donorId.toLowerCase().includes(searchQuery.toLowerCase());

    // Blood group filter
    const matchesBloodGroup = !bloodGroupFilter || donor.bloodGroup === bloodGroupFilter;

    // Eligibility filter
    const matchesEligibility = !eligibilityFilter || donor.eligibilityStatus === eligibilityFilter;

    return matchesSearch && matchesBloodGroup && matchesEligibility;
  });


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
    setDonors((prev) => prev.filter((donor) => donor._id !== donorId));
    setDeleteConfirmFor(null);
  }


  const getFullName = (donor) =>
    `${donor.name.firstName} ${donor.name.middleName || ""} ${donor.name.lastName}`.trim();

  const formatAddress = (address) => {
    if (!address) return "N/A";
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.district,
      address.state,
      address.pincode,
    ].filter(Boolean); // removes empty strings or undefined
    return parts.join(", ");
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };


  useEffect(() => {
    if (!donors && !loading) {
      // Redirect to camp listing page
      onBack();
    }
  }, [donors, loading, navigate]);

  if (loading) {
    return <Loader message="Loading camp details..." />
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
                      "Address",
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
                      key={donor._id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4">{donor.donorId}</td>
                      <td className="px-6 py-4">{getFullName(donor)}</td>
                      <td className="px-6 py-4">{donor.uid}</td>

                      {/* DOB + Age Badge */}
                      <td className="px-6 py-20 flex items-center-safe gap-2">
                        <span>{formatDate(donor.dob)}</span>
                        {(() => {
                          const today = new Date();
                          const dob = new Date(donor.dob);
                          let age = today.getFullYear() - dob.getFullYear();
                          const monthDiff = today.getMonth() - dob.getMonth();
                          if (
                            monthDiff < 0 ||
                            (monthDiff === 0 && today.getDate() < dob.getDate())
                          ) {
                            age--;
                          }

                          return (
                            <span
                              title={`Age: ${age} years`}
                              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold 
                        ${age < 18 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                            >
                              {age}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-4">{donor.sex}</td>
                      <td className="px-6 py-4">{donor.phone}</td>
                      <td className="px-6 py-4">{donor.email}</td>
                      <td className="px-6 py-4">{formatAddress(donor.address)}</td>

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
                      <td className="px-6 py-4">{formatDate(donor.lastDonationDate)}</td>
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
                                onClick={() => setDeleteConfirmFor(donor._id)}
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

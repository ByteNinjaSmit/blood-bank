import React, { useState } from "react"
import { ArrowLeft, Plus, Eye, Edit, Trash2, X, Droplets } from "lucide-react"

const CampListing = ({ onBack }) => {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCamp, setSelectedCamp] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Mock data for demonstration
  React.useEffect(() => {
    setTimeout(() => {
      setCamps([
        {
          _id: "1",
          siteId: "SITE001",
          name: "Red Cross Blood Donation Camp",
          description: "Annual donation drive",
          address: "123 Main Street, City",
          contactInfo: {
            phone: "123-456-7890",
            email: "contact@redcross.org",
          },
          createdBy: "John Doe",
          lastUpdatedBy: "Jane Smith",
          staff: ["staff1", "staff2", "staff3"],
          createdAt: "2024-01-15",
          updatedAt: "2024-01-20",
          progress: "ongoing",
        },
        {
          _id: "2",
          siteId: "SITE002",
          name: "Community Health Center Camp",
          description: "Monthly blood collection",
          address: "456 Oak Avenue, Town",
          contactInfo: {
            phone: "987-654-3210",
            email: "health@community.org",
          },
          createdBy: "Mike Johnson",
          lastUpdatedBy: "Sarah Wilson",
          staff: ["staff4", "staff5"],
          createdAt: "2024-01-10",
          updatedAt: "2024-01-18",
          progress: "upcoming",
        },
        {
          _id: "3",
          siteId: "SITE003",
          name: "University Blood Drive",
          description: "Student volunteer drive",
          address: "789 College Road, Campus",
          contactInfo: {
            phone: "555-123-4567",
            email: "blooddrive@university.edu",
          },
          createdBy: "Dr. Smith",
          lastUpdatedBy: "Admin User",
          staff: ["staff6", "staff7", "staff8", "staff9"],
          createdAt: "2024-01-05",
          updatedAt: "2024-01-15",
          progress: "completed",
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleView = (camp) => {
    setSelectedCamp(camp)
    setShowModal(true)
  }

  const handleEdit = (camp) => {
    console.log("Edit camp:", camp)
  }

  const handleDelete = (camp) => {
    if (window.confirm(`Are you sure you want to delete "${camp.name}"?`)) {
      setCamps(camps.filter((c) => c._id !== camp._id))
      console.log("Delete camp:", camp)
    }
  }

  const getProgressBadge = (progress) => {
    const colors = {
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[progress]}`}>
        {progress.charAt(0).toUpperCase() + progress.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-white border-b border-orange-200 text-gray-900 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-orange-800 border border-orange-300 hover:bg-orange-50 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Camp
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Camp Listing & Details</h1>
                <p className="text-gray-600 mt-1">Comprehensive Camp detials lsiting section</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading camps...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-orange-200 text-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-3 text-orange-800 border border-orange-300 hover:bg-orange-50 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Camp
          </button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Camp Listing & Details</h1>
                <p className="text-gray-600 mt-1">Comprehensive Camp detials lsiting section</p>
              </div>
            </div>
            <button className="bg-orange-800 hover:bg-orange-900 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Create New Camp
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-700">Site ID</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-700">Name</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-700">Progress</th>
                  <th className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {camps.map((camp) => (
                  <tr key={camp._id} className="hover:bg-slate-50">
                    <td className="px-4 md:px-6 py-4 text-sm text-slate-900 font-medium">{camp.siteId}</td>
                    <td className="px-4 md:px-6 py-4 text-sm font-medium text-slate-900">{camp.name}</td>
                    <td className="px-4 md:px-6 py-4 text-sm">{getProgressBadge(camp.progress)}</td>
                    <td className="px-4 md:px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(camp)}
                          className="p-2 text-blue-600 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(camp)}
                          className="p-2 text-green-600 cursor-pointer hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(camp)}
                          className="p-2 text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors"
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

          {camps.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-slate-900 mb-2">No camps found</h3>
              <p className="text-slate-600">Create your first camp to get started.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Camp Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CampListing

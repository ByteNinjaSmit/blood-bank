
import React, { useState, useEffect } from "react"
import { ArrowLeft, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { se } from "date-fns/locale"
import { useNavigate , Link } from 'react-router-dom';
import ca from "zod/v4/locales/ca.cjs"
import CampDonations from "./Camp-Donations";
import { set } from "date-fns";

const Button = ({ children, onClick, variant = "default", size = "default", className = "", ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  }
  const sizes = {
    default: "h-10 py-2 px-4",
    lg: "h-11 px-8",
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

const CampList = ({ onBack, onViewCamp }) => {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState("CampList")
  const [selectedCamp, setSelectedCamp] = useState(null)
  const navigate = useNavigate();

  // Mock data
  useEffect(() => {
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

   
  }
  const handleEdit = (camp) => {
    console.log("Edit camp:", camp)
  }

  const handleDelete = (camp) => {
    if (window.confirm(`Are you sure you want to delete "${camp.name}"?`)) {
      setCamps(camps.filter((c) => c._id !== camp._id))
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
        <div className="bg-gradient-to-br from-red-800 via-red-700 to-red-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="flex items-center gap-3 text-white border-white/30 hover:bg-white/10 bg-transparent"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Camp
            </Button>
            <h1 className="text-3xl font-bold text-white">Camp List</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading camps...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-red-800 via-red-700 to-red-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="flex items-center gap-3 text-white border-white/30 hover:bg-white/10 bg-transparent"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Camp
          </Button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-white">Camp List</h1>
            <Button className="bg-white/20 hover:bg-white/30 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Camp
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-medium text-slate-700">Site ID</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-slate-700">Name</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-slate-700">Progress</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {camps.map((camp) => (
                  <tr key={camp._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-sm text-slate-900 font-medium">{camp.siteId}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">{camp.name}</td>
                    <td className="px-4 py-4 text-sm">{getProgressBadge(camp.progress)}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link to={`/camp-donations?id=${camp._id}`}>
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        </Link>
                        <button
                          onClick={() => handleEdit(camp)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(camp)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

          {/* {currentView === "CampDonations" && (
            <CampDonations
              camp={selectedCamp}
              onBack={() => setCurrentView("CampList")}
              onViewCamp={onViewCamp}
              />
          )} */}
        </div>
      </div>
    </div>
  )
}

export default CampList

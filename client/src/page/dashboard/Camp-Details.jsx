
import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  X,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  Droplets,
  Plus,
  Activity,
} from "lucide-react"
import { data, useNavigate, useParams, useSearchParams } from "react-router-dom"
import axios from "axios"
import { useAuth } from "@/store/auth"
import Loader from "@/components/Loader"


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

const CampDonations = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { API, authorizationToken } = useAuth();
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [activeView, setActiveView] = useState("hub")
  const [searchParam] = useSearchParams();
  const [camp, setcamp] = useState(null);

  useEffect(() => {
    setLoading(true);
    const searchParams = new URLSearchParams(location.search);
    const campId = searchParams.get("id");
    console.log("Camp ID from URL:", campId);
    if(!campId) {
      navigate("/camp-listing");
      return;
    }
    fetchCampDetails(campId);
  }, [location.search]);

  const fetchCampDetails = async (campId) => {
    try {
      const response = await axios.get(`${API}/api/site/details/${campId}`, {
        headers: {
          Authorization: authorizationToken,
        }, withCredentials: true,
      });
      if (response.status === 200) {
        console.log("Camp details:", response.data.site);
        setcamp(response.data.site);
      }
    } catch (error) {
      console.error("Error fetching camp details:", error);
    } finally {
      setLoading(false);
    }
  }

  const onBack = () => {
    navigate('/camp-listing');
  }
  const handleViewDonation = (donation) => {
    setSelectedDonation(donation)
  }

  const handleEditDonation = (donationId) => {
    console.log("Edit donation:", donationId)
  }

  const handleDeleteDonation = (donationId) => {
    if (window.confirm("Are you sure you want to delete this donation?")) {
      setDonations(donations.filter((d) => d.id !== donationId))
      console.log("Delete donation:", donationId)
    }
  }

  const handleFacilityClick = (facilityType,facilityId) => {
    if(facilityType === "view-donor") {
      navigate(`/camp-donors?id=${camp._id}`);
    }else if(facilityType === "create-donation") {
      navigate(`/donations/create-donation?campId=${camp._id}`);
    }else if(facilityType === "view-donations") {
      navigate(`/camp-donation?id=${camp._id}`);
    }
  }

  const handleBackToHub = () => {
    setActiveView("hub")
  }


  const getStatusBadge = (status) => {
    const colors = {
      collected: "bg-blue-100 text-blue-800",
      testing: "bg-yellow-100 text-yellow-800",
      passed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      issued: "bg-purple-100 text-purple-800",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-slate-100 text-slate-800"}`}>
        {status}
      </span>
    )
  }

  const facilities = [
    {
      id: "view-donor",
      title: "View Donors",
      description: "Browse, search, and manage existing donor records and history",
      icon: Users,
      color: "bg-orange-800",
      stats: `${camp?.donorCount || 0} Active This Month`,
    },
    {
      id: "create-donation",
      title: "Create Donation",
      description: "Record new blood donations with vitals, tests, and bag information",
      icon: Plus,
      color: "bg-orange-800",
      stats: `${camp?.bagsCount || 0} Total Donations`,
    },
    {
      id: "view-donations",
      title: "View Donations",
      description: "Manage donation records, track status, and view test results",
      icon: Activity,
      color: "bg-orange-800",
      stats: `${camp?.bagsCount || 0} This Camp`,
    },
  ]

  const getProgressStatus = (camp) => {
    if (!camp.dateFrom || !camp.dateTo) return "N/A";

    const now = new Date();
    const start = new Date(camp.dateFrom);
    const end = new Date(camp.dateTo);

    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  }

  const getProgressBadge = (status) => {
    const colors = {
      Upcoming: "bg-blue-100 text-blue-800",
      Ongoing: "bg-green-100 text-green-800",
      Completed: "bg-gray-100 text-gray-800",
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    )
  }

  useEffect(() => {
  if (!camp && !loading) {
    // Redirect to camp listing page
   onBack();
  }
}, [camp, loading, navigate]);

  if (loading){
    return <Loader message="Loading camp details..." />
  }

  if (!camp) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-white border-b border-orange-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={onBack}
              className="flex items-center cursor-pointer gap-3 text-orange-800 border border-orange-200 hover:bg-orange-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Donor & Donation Management</h1>
                <p className="text-gray-600 mt-1">Comprehensive blood bank donor and donation management system</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-12 text-center">
            <div className="mb-6">
              <MapPin className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">No Camp Selected</h2>
              <p className="text-slate-600 mb-6">
                Please select a camp from the Camp List page to display camp details.
              </p>
              <Button
                onClick={() => {
                  onBack()
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3"
              >
                Go to Camp List
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center cursor-pointer gap-3 text-orange-800 border border-orange-200 hover:bg-orange-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Camp List
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Donor & Donation Management</h1>
              <p className="text-gray-600 mt-1">Comprehensive blood bank donor and donation management system</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{camp.name}</h2>
            {getProgressBadge(getProgressStatus(camp))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Description</p>
                <p className="text-slate-600 text-sm">{camp.description || "No description provided"}</p>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Address</p>
                  <p className="text-slate-600 text-sm">{camp.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Phone</p>
                  <p className="text-slate-600 text-sm">{camp.contactInfo?.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <p className="text-slate-600 text-sm">{camp.contactInfo?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Created By</p>
                  <p className="text-slate-600 text-sm">{camp.createdBy.name.first} {camp.createdBy.name.last}</p>

                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Site ID</p>
                <p className="text-slate-600 font-mono text-sm">{camp.siteId}</p>
              </div>
              <div className="flex flex-col gap-3">
                {/* Staff Count */}
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Staff Count</p>
                    <p className="text-slate-600 text-sm">{camp.staff?.length} members</p>
                  </div>
                </div>

                {/* Staff List */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-slate-700 mb-2">Staff Members</p>

                  <div className="grid gap-2">
                    {camp.staff && camp.staff.length > 0 ? (
                      camp.staff.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
                        >
                          {/* Left side: name + role */}
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {member.name.first} {member.name.last}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Staff"}
                            </p>
                          </div>

                          {/* Right side: contact */}
                          <div className="text-right">
                            <p className="text-xs text-slate-600">{member.email}</p>
                            <p className="text-xs text-slate-600">{member.phone}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500">
                        No staff assigned
                      </div>
                    )}
                  </div>
                </div>
              </div>



              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Created Date</p>
                  <p className="text-slate-600 text-sm">{new Date(camp.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Updated By</p>
                  <p className="text-slate-600 text-sm">{camp.lastUpdatedBy.name.first} {camp.lastUpdatedBy.name.last}</p>

                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {facilities.map((facility) => {
            const IconComponent = facility.icon
            return (
              <div
                key={facility.id}
                onClick={() => handleFacilityClick(facility.id,camp._id)}
                className="group cursor-pointer bg-white rounded-2xl border border-gray-200 transition-transform duration-700 hover:shadow-xl hover:shadow-orange-100 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className={`p-4 bg-orange-800 rounded-xl group-hover:scale-110 transition-transform duration-700`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Current</p>
                      <p className="text-lg font-semibold text-orange-800">{facility.stats}</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-800 transition-colors">
                    {facility.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{facility.description}</p>

                  <div className="flex items-center text-orange-800 font-medium group-hover:text-orange-700 transition-colors">
                    <span>Access Facility</span>
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-800 to-orange-900 rounded-full mb-4">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Medical-Grade Security</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              All donor and donation data is protected with HIPAA-compliant security measures, ensuring complete privacy
              and regulatory compliance for your blood bank operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampDonations;

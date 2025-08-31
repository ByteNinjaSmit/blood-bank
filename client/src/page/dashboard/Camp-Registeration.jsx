import React, { useEffect } from "react"
import { useState } from "react"
import { ArrowLeft, Droplets } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/store/auth"
import axios from "axios"
import { useNavigate } from "react-router-dom"

const CampRegisteration = () => {
  const { API, authorizationToken } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    siteId: "",
    name: "",
    description: "",
    address: "",
    contactInfo: {
      phone: "",
      email: "",
    },
    staff: [],
    dateFrom: "",
    dateTo: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [staffList, setStaffList] = useState([])  // _id name

  const validateForm = () => {
    const newErrors = {}

    if (!formData.siteId.trim()) newErrors.siteId = "Site ID is required"
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.contactInfo.phone.trim()) newErrors.phone = "Phone is required"
    if (!formData.contactInfo.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors.email = "Email format is invalid"
    }

    const phoneRegex = /^\d{10}$/
    if (formData.contactInfo.phone && !phoneRegex.test(formData.contactInfo.phone)) {
      newErrors.phone = "Phone format should be XXXXXXXXXX"
    }
    if (!formData.dateFrom) newErrors.dateFrom = "Start date is required"
    if (!formData.dateTo) newErrors.dateTo = "End date is required"
    if (formData.dateFrom && formData.dateTo && new Date(formData.dateTo) < new Date(formData.dateFrom)) {
      newErrors.dateTo = "End date cannot be earlier than start date"
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getStaffNames = async () => {
    try {
      const response = await axios.get(`${API}/api/site/staff-list`, {
        headers: {
          'Authorization': authorizationToken,
        }, withCredentials: true
      });
      if (response.status === 200) {
        setStaffList(response.data.data || []);
        console.log(response.data.data);
      }
    } catch (error) {
      console.log(error.response?.data?.message);
    }
  }

  useEffect(() => {
    getStaffNames();
  }, [API])

  const onBack = () => {
    navigate('/camp-listing');
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/api/site/new`, {
        siteId: formData.siteId,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.contactInfo.phone,
        email: formData.contactInfo.email,
        staff: formData.staff,
        dateFrom: formData.dateFrom,
        dateTo: formData.dateTo,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authorizationToken,
        },
        withCredentials: true,
      });

      if (response.status === 201) {
        toast.success(response.data.message || "Camp created successfully");
        setFormData({
          siteId: "",
          name: "",
          description: "",
          address: "",
          contactInfo: {
            phone: "",
            email: "",
          },
          staff: [],
          dateFrom: "",
          dateTo: "",
        });

        onBack(); // Navigate back to the previous page

      }
    } catch (error) {
      toast.error(error.response?.data?.message);
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center cursor-pointer gap-3 text-orange-800 border border-orange-200 hover:bg-orange-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Camp
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Blood Donation Camp</h1>
              <p className="text-gray-600 mt-1">Set up a new blood donation camp location</p>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-orange-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Site ID *</label>
                <input
                  type="text"
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.siteId ? "border-red-500" : ""}`}
                  placeholder="e.g., SITE001"
                />
                {errors.siteId && <p className="text-red-500 text-sm mt-1">{errors.siteId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Camp Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.name ? "border-red-500" : ""}`}
                  placeholder="e.g., Red Cross Blood Donation Camp"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                placeholder="Brief description of the camp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.address ? "border-red-500" : ""}`}
                placeholder="Full address of the camp location"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, phone: e.target.value },
                    })
                  }
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.phone ? "border-red-500" : ""}`}
                  placeholder="123-456-7890"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, email: e.target.value },
                    })
                  }
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.email ? "border-red-500" : ""}`}
                  placeholder="contact@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* From && To Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.dateFrom}
                    onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.dateFrom ? "border-red-500" : ""
                      }`}
                  />
                  {errors.dateFrom && <p className="text-red-500 text-sm mt-1">{errors.dateFrom}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={formData.dateTo}
                    onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.dateTo ? "border-red-500" : ""
                      }`}
                  />
                  {errors.dateTo && <p className="text-red-500 text-sm mt-1">{errors.dateTo}</p>}
                </div>
              </div>

              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign Staff
                </label>
                <select
                  multiple
                  value={formData.staff}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      staff: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px]"
                >
                  {staffList && staffList.length > 0 ? (
                    staffList?.map((staff, index) => {
                      if (!staff || !staff._id || !staff.name) return null; // skip bad data
                      return (
                        <option key={staff._id || index} value={staff._id}>
                          {String(staff?.name?.first)} {String(staff?.name?.last)}
                        </option>
                      );
                    })
                  ) : (
                    <option disabled>No staff available</option>
                  )}
                </select>

                <p className="text-xs text-gray-500 mt-1">
                  Hold <kbd>Ctrl</kbd> (or <kbd>Cmd</kbd> on Mac) to select multiple staff.
                </p>
              </div>
            </div>


            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={onBack}
                className="px-8 py-3 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground rounded-md font-medium transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-8 py-3 bg-orange-800 hover:bg-orange-900 text-white rounded-md font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none order-1 sm:order-2"
              >
                {isSubmitting ? "Creating..." : "Create Camp"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CampRegisteration

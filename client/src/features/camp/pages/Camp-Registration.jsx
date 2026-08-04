"use client"
import { useEffect, useState } from "react"
import { Droplets, CheckCircle, ClipboardList, MapPin, Phone, Mail, Calendar, Users } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/core/api-client"
import { useNavigate } from "react-router-dom"
import Stepper, { Step } from "@/components/Stepper"
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav"

const CampRegistration = () => {
  const navigate = useNavigate()
  const [, setIsSubmitting] = useState(false)
  const [staffList, setStaffList] = useState([])
  const [, setErrors] = useState({})
  const [stepErrors, setStepErrors] = useState({})

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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.siteId.trim()) newErrors.siteId = "Site ID is requiorange"
    if (!formData.name.trim()) newErrors.name = "Name is requiorange"
    if (!formData.address.trim()) newErrors.address = "Address is requiorange"
    if (!formData.contactInfo.phone.trim()) newErrors.phone = "Phone is requiorange"
    if (formData.contactInfo.email.trim() && !/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors.email = "Email format is invalid"
    }

    const phoneRegex = /^\d{10}$/
    if (formData.contactInfo.phone && !phoneRegex.test(formData.contactInfo.phone)) {
      newErrors.phone = "Phone format should be XXXXXXXXXX"
    }
    if (!formData.dateFrom) newErrors.dateFrom = "Start date is requiorange"
    if (!formData.dateTo) newErrors.dateTo = "End date is requiorange"
    if (formData.dateFrom && formData.dateTo && new Date(formData.dateTo) < new Date(formData.dateFrom)) {
      newErrors.dateTo = "End date cannot be earlier than start date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getStaffNames = async () => {
    try {
      const response = await apiClient.get('/api/v2/camp/staff-list')
      if (response.status === 200) {
        setStaffList(response.data.data || [])
      }
    } catch {
      // Staff list is non-critical; ignore load failures.
    }
  }

  useEffect(() => {
    getStaffNames();
  }, [])

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.siteId.trim()) newErrors.siteId = "Site ID is required"
      if (!formData.name.trim()) newErrors.name = "Camp name is required"
    } else if (step === 2) {
      if (!formData.address.trim()) newErrors.address = "Address is required"
      if (!formData.contactInfo.phone.trim()) newErrors.phone = "Phone is required"
      if (formData.contactInfo.email.trim() && !/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
        newErrors.email = "Email format is invalid"
      }
      const phoneRegex = /^\d{10}$/
      if (formData.contactInfo.phone && !phoneRegex.test(formData.contactInfo.phone)) {
        newErrors.phone = "Phone format should be 10 digits"
      }
    } else if (step === 3) {
      if (!formData.dateFrom) newErrors.dateFrom = "Start date is required"
      if (!formData.dateTo) newErrors.dateTo = "End date is required"
      if (formData.dateFrom && formData.dateTo && new Date(formData.dateTo) < new Date(formData.dateFrom)) {
        newErrors.dateTo = "End date cannot be earlier than start date"
      }
    }

    setStepErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes("contact")) {
      const field = name.split(".")[1]
      setFormData({
        ...formData,
        contactInfo: { ...formData.contactInfo, [field]: value },
      })
    } else {
      setFormData({ ...formData, [name]: name === "siteId" ? value.toUpperCase() : value })
    }
  }

  const handleStaffToggle = (staffId) => {
    setFormData({
      ...formData,
      staff: formData.staff.includes(staffId)
        ? formData.staff.filter((id) => id !== staffId)
        : [...formData.staff, staffId],
    })
  }

  const handleStepChange = (step, fromStep) => {
    // Only gate forward navigation — going back should never be blocked by
    // validation on the step being left.
    if (step > fromStep && !validateStep(fromStep)) {
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiClient.post('/api/v2/camp/new', {
          campId: formData.siteId,
          name: formData.name,
          description: formData.description,
          address: formData.address,
          phone: formData.contactInfo.phone,
          email: formData.contactInfo.email,
          staff: formData.staff,
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
        })

      if (response.status === 201) {
        const created = response.data.data
        toast.success(response.data.message || "Camp created successfully")
        setFormData({
          siteId: "",
          name: "",
          description: "",
          address: "",
          contactInfo: { phone: "", email: "" },
          staff: [],
          dateFrom: "",
          dateTo: "",
        })
        // Land on the camp list first (so it's one back-step away), then
        // Camp-Listing forwards straight into the camp we just created.
        navigate("/camp-listing", { state: { openCampId: created?._id } })
      }
    } catch (error) {
      // apiClient's response interceptor throws a plain ApiError (not a raw
      // axios error), so the real validation reason lives on error.message —
      // error.response is never set here.
      toast.error(error.message || "Error creating camp")
    } finally {
      setIsSubmitting(false)
    }
  }

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers()

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <ClipboardList className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Blood Donation Camp</h1>
              <p className="text-gray-500 text-sm">Register a new camp</p>
            </div>
          </div>
        </div>

        <div onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange}>
        <Stepper
          initialStep={1}
          onStepChange={handleStepChange}
          onFinalStepCompleted={handleSubmit}
          stepCircleContainerClassName="bg-white"
          contentClassName="py-8"
          footerClassName="border-t border-orange-100"
        >
          {/* Step 1: Basic Info */}
          <Step>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                <p className="text-gray-600 text-sm sm:text-base">Tell us about your camp</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Site ID */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">Site ID *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="siteId"
                      value={formData.siteId}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm sm:text-base transition-colors ${
                        stepErrors.siteId ? "border-orange-700" : ""
                      }`}
                      placeholder="e.g., SITE001"
                    />
                  </div>
                  {stepErrors.siteId && <p className="text-orange-700 text-xs sm:text-sm mt-1">{stepErrors.siteId}</p>}
                </div>

                {/* Camp Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">Camp Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm sm:text-base transition-colors ${
                        stepErrors.name ? "border-orange-700" : ""
                      }`}
                      placeholder="e.g., Red Cross Blood Donation Camp"
                    />
                  </div>
                  {stepErrors.name && <p className="text-orange-700 text-xs sm:text-sm mt-1">{stepErrors.name}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm sm:text-base transition-colors min-h-[100px] sm:min-h-[120px]"
                  placeholder="Brief description of the camp"
                />
              </div>
            </div>
          </Step>

          {/* Step 2: Location & Contact */}
          <Step>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Location & Contact</h2>
                <p className="text-gray-600 text-sm sm:text-base">Where and how to reach your camp</p>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm sm:text-base transition-colors ${
                      stepErrors.address ? "border-orange-500" : ""
                    }`}
                    placeholder="Full address of the camp location"
                  />
                </div>
                {stepErrors.address && <p className="text-orange-500 text-xs sm:text-sm mt-1">{stepErrors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">Phone *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="contact.phone"
                      value={formData.contactInfo.phone}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm sm:text-base transition-colors ${
                        stepErrors.phone ? "border-orange-500" : ""
                      }`}
                      placeholder="10-digit phone number"
                    />
                  </div>
                  {stepErrors.phone && <p className="text-orange-500 text-xs sm:text-sm mt-1">{stepErrors.phone}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="contact.email"
                      value={formData.contactInfo.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm sm:text-base transition-colors ${
                        stepErrors.email ? "border-orange-500" : ""
                      }`}
                      placeholder="contact@example.com"
                    />
                  </div>
                  {stepErrors.email && <p className="text-orange-500 text-xs sm:text-sm mt-1">{stepErrors.email}</p>}
                </div>
              </div>
            </div>
          </Step>

          {/* Step 3: Dates */}
          <Step>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Camp Dates</h2>
                <p className="text-gray-600 text-sm sm:text-base">When will your camp run</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">Start Date *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="datetime-local"
                      name="dateFrom"
                      value={formData.dateFrom}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm sm:text-base transition-colors ${
                        stepErrors.dateFrom ? "border-orange-500" : ""
                      }`}
                    />
                  </div>
                  {stepErrors.dateFrom && <p className="text-orange-500 text-xs sm:text-sm mt-1">{stepErrors.dateFrom}</p>}
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">End Date *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="datetime-local"
                      name="dateTo"
                      value={formData.dateTo}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm sm:text-base transition-colors ${
                        stepErrors.dateTo ? "border-orange-500" : ""
                      }`}
                    />
                  </div>
                  {stepErrors.dateTo && <p className="text-orange-500 text-xs sm:text-sm mt-1">{stepErrors.dateTo}</p>}
                </div>
              </div>
            </div>
          </Step>

          {/* Step 4: Staff Selection */}
          <Step>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Assign Staff</h2>
                <p className="text-gray-600 text-sm sm:text-base">Select staff members for this camp</p>
              </div>

              {staffList && staffList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {staffList.map((staff) => {
                    if (!staff || !staff._id || !staff.name) return null
                    const staffName = `${String(staff?.name?.first || "")} ${String(staff?.name?.last || "")}`
                    const isSelected = formData.staff.includes(staff._id)

                    return (
                      <div
                        key={staff._id}
                        onClick={() => handleStaffToggle(staff._id)}
                        className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected ? "border-orange-800 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected ? "bg-orange-800 border-orange-800" : "border-gray-300"
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{staffName}</p>
                            <p className="text-xs sm:text-sm text-gray-500">ID: {staff._id}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No staff members available</p>
                </div>
              )}
            </div>
          </Step>
        </Stepper>
        </div>
      </div>
    </div>
  )
}

export default CampRegistration

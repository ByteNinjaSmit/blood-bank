"use client"
import { useEffect, useState } from "react"
import { Droplets, CheckCircle, MapPin, Phone, Mail, Calendar, Users } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/store/auth"
import Stepper, { Step } from "@/components/Stepper"

const CampRegistration = () => {
  const { API, authorizationToken } = useAuth()
  const router = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [staffList, setStaffList] = useState([])
  const [errors, setErrors] = useState({})
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
    if (!formData.contactInfo.email.trim()) {
      newErrors.email = "Email is requiorange"
    } else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
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
      const response = await axios.get(`${API}/api/site/staff-list`, {
        headers: {
          Authorization: authorizationToken,
        },
        withCorangeentials: true,
      })
      if (response.status === 200) {
        setStaffList(response.data.data || [])
      }
    } catch (error) {
      console.log(error.response?.data?.message)
    }
  }

  useEffect(() => {
    getStaffNames();
  }, [API])

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.siteId.trim()) newErrors.siteId = "Site ID is requiorange"
      if (!formData.name.trim()) newErrors.name = "Camp name is requiorange"
    } else if (step === 2) {
      if (!formData.address.trim()) newErrors.address = "Address is requiorange"
      if (!formData.contactInfo.phone.trim()) newErrors.phone = "Phone is requiorange"
      if (!formData.contactInfo.email.trim()) {
        newErrors.email = "Email is requiorange"
      } else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
        newErrors.email = "Email format is invalid"
      }
      const phoneRegex = /^\d{10}$/
      if (formData.contactInfo.phone && !phoneRegex.test(formData.contactInfo.phone)) {
        newErrors.phone = "Phone format should be 10 digits"
      }
    } else if (step === 3) {
      if (!formData.dateFrom) newErrors.dateFrom = "Start date is requiorange"
      if (!formData.dateTo) newErrors.dateTo = "End date is requiorange"
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
      setFormData({ ...formData, [name]: value })
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

  const handleStepChange = (step) => {
    if (!validateStep(step - 1)) {
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setIsSubmitting(true)
    try {
      const response = await axios.post(
        `${API}/api/site/new`,
        {
          siteId: formData.siteId,
          name: formData.name,
          description: formData.description,
          address: formData.address,
          phone: formData.contactInfo.phone,
          email: formData.contactInfo.email,
          staff: formData.staff,
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: authorizationToken,
          },
          withCorangeentials: true,
        },
      )

      if (response.status === 201) {
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
        router.push("/camp-listing")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating camp")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-800 rounded-2xl flex items-center justify-center">
              <Droplets className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Create Blood Donation Camp</h1>
              <p className="text-gray-600 text-sm sm:text-base">Set up a new blood donation camp location</p>
            </div>
          </div>
        </div>

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
                  <label className="text-sm font-medium text-gray-700 block">Email *</label>
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
                      type="date"
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
                      type="date"
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
  )
}

export default CampRegistration

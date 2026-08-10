"use client"
import { useState } from "react"
import { Droplets, CheckCircle, ClipboardList, MapPin, Phone, Mail, Calendar, Plus, X, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { campApi } from "../api"
import { useNavigate } from "react-router-dom"
import Stepper, { Step } from "@/components/Stepper"
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav"

const CampRegistration = () => {
  const navigate = useNavigate()
  const [, setIsSubmitting] = useState(false)
  const [, setErrors] = useState({})
  const [stepErrors, setStepErrors] = useState({})

  const [volunteerInput, setVolunteerInput] = useState("")
  const [formData, setFormData] = useState({
    siteId: "",
    name: "",
    description: "",
    address: "",
    contactInfo: {
      phone: "",
      email: "",
    },
    volunteers: [],
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

  const handleAddVolunteer = (e) => {
    if (e) e.preventDefault()
    const name = volunteerInput.trim()
    if (!name) return
    if (formData.volunteers.includes(name)) {
      toast.info("Staff member already added")
      return
    }
    setFormData((prev) => ({
      ...prev,
      volunteers: [...prev.volunteers, name],
    }))
    setVolunteerInput("")
  }

  const handleRemoveVolunteer = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      volunteers: prev.volunteers.filter((_, idx) => idx !== indexToRemove),
    }))
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
      const created = await campApi.create({
        campId: formData.siteId,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.contactInfo.phone,
        email: formData.contactInfo.email,
        volunteers: formData.volunteers,
        dateFrom: formData.dateFrom,
        dateTo: formData.dateTo,
      })

      toast.success("Camp created successfully")
      setFormData({
        siteId: "",
        name: "",
        description: "",
        address: "",
        contactInfo: { phone: "", email: "" },
        volunteers: [],
        dateFrom: "",
        dateTo: "",
      })
      setVolunteerInput("")
      // Land on the camp list first (so it's one back-step away), then
      // Camp-Listing forwards straight into the camp we just created.
      navigate("/camp-listing", { state: { openCampId: created?._id } })
    } catch (error) {
      // campApi's response interceptor throws a plain ApiError (not a raw
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

          {/* Step 4: Staff Assignment */}
          <Step>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Camp Staff</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Type in the names of everyone assigned to run this camp.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-orange-800" />
                  Staff Names
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={volunteerInput}
                    onChange={(e) => setVolunteerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddVolunteer()
                      }
                    }}
                    placeholder="Enter name (e.g. Rahul Sharma - NSS)"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-800 text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddVolunteer}
                    className="px-5 py-3 bg-orange-800 hover:bg-orange-900 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {formData.volunteers.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.volunteers.map((volName, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 text-xs font-medium shadow-xs"
                      >
                        <span>{volName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVolunteer(idx)}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-orange-700 hover:bg-orange-200 transition-colors"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No staff added yet.</p>
                )}
              </div>

            </div>
          </Step>
        </Stepper>
        </div>
      </div>
    </div>
  )
}

export default CampRegistration

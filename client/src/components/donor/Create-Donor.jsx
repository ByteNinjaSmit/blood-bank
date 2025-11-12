import React from "react"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, User, Save, Loader2, CheckCircle } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import { useNavigate } from "react-router-dom"

const CreateDonor = ({ onBack, onCreated, backText = "Back to Donations", afterCreate = "back", prefill = {}, showPostCreateActions = false, onStartDonation }) => {
  const { API, authorizationToken } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState("quick")
  const donorIdInputRef = useRef(null)
  const [showPostCreate, setShowPostCreate] = useState(false)
  const [createdDonor, setCreatedDonor] = useState(null)

  const [formData, setFormData] = useState({
    donorId: prefill?.donorId || "",
    firstName: prefill?.firstName || "",
    middleName: prefill?.middleName || "",
    lastName: prefill?.lastName || "",
    uid: prefill?.uid || "",
    dob: prefill?.dob || "",
    sex: prefill?.sex || "",
    phone: prefill?.phone || "",
    email: prefill?.email || "",
    addressLine1: prefill?.address?.line1 || "",
    addressLine2: prefill?.address?.line2 || "",
    city: prefill?.address?.city || "",
    district: prefill?.address?.district || "",
    state: prefill?.address?.state || "",
    pincode: prefill?.address?.pincode || "",
    occupation: prefill?.occupation || "",
    weightKg: prefill?.weightKg ? String(prefill.weightKg) : "",
    bloodGroup: prefill?.bloodGroup || "",
    rh: prefill?.rh || "Positive",
    eligibilityStatus: prefill?.eligibilityStatus || "eligible",
    lastDonationDate: prefill?.lastDonationDate || "",
  })

  useEffect(() => {
    donorIdInputRef.current?.focus()
  }, [])

  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (formData.uid && !/^\d{12}$/.test(formData.uid)) {
      setError("UID must be exactly 12 digits when provided")
      return false
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone must be exactly 10 digits")
      return false
    }
    if (formData.weightKg && (isNaN(Number(formData.weightKg)) || Number(formData.weightKg) <= 0)) {
      setError("Weight must be a positive number")
      return false
    }
    return true
  }

  const resetForm = () => {
    setFormData({
      donorId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      uid: "",
      dob: "",
      sex: "",
      phone: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      occupation: "",
      weightKg: "",
      bloodGroup: "",
      rh: "Positive",
      eligibilityStatus: "eligible",
      lastDonationDate: "",
    })
    setError("")
    setSuccess(false)
    donorIdInputRef.current?.focus()
  }

  const generateDonorId = () => {
    const year = new Date().getFullYear()
    const seq = Math.floor(1000 + Math.random() * 9000)
    setFormData((prev) => ({ ...prev, donorId: `DNR-${year}-${seq}` }))
    setTimeout(() => donorIdInputRef.current?.select(), 0)
  }

  const handleSubmit = async (e, action = "save") => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setLoading(true)
    try {
      const donorData = {
        donorId: formData.donorId,
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        uid: formData.uid || undefined,
        dob: formData.dob,
        sex: formData.sex,
        phone: formData.phone,
        email: formData.email || undefined,
        address: {
          line1: formData.addressLine1 || undefined,
          line2: formData.addressLine2 || undefined,
          city: formData.city,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode,
        },
        occupation: formData.occupation || undefined,
        weightKg: Number(formData.weightKg),
        bloodGroup: formData.bloodGroup,
        rh: formData.rh,
        eligibilityStatus: formData.eligibilityStatus,
        lastDonationDate: formData.lastDonationDate || undefined,
      }
      const response = await axios.post(
        `${API}/api/donor/new`,
        donorData,
        {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        }
      )
      if (response.status === 201) {
        setSuccess(true)
        const newDonor = response.data.donor
        onCreated && onCreated(newDonor)

        if (showPostCreateActions) {
          setCreatedDonor(newDonor)
          setShowPostCreate(true)
          return
        }

        if (action === "save-next" || afterCreate === "stay") {
          resetForm()
          setSuccess(false)
          return
        }

        if (afterCreate === "back") {
          setTimeout(() => {
            setSuccess(false)
            onBack && onBack()
          }, 600)
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create donor. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleStartDonation = () => {
    if (!createdDonor) return
    if (onStartDonation) {
      onStartDonation(createdDonor)
    } else {
      navigate('/donations/create-donation', { state: { donor: createdDonor } })
    }
    setShowPostCreate(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-3 text-orange-800 hover:text-orange-700 transition-colors mb-6 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            {backText}
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br bg-orange-800 rounded-xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Donor</h1>
              <p className="text-gray-600 mt-1">Register a new blood donor with complete information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Donor created successfully!</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <form
          onSubmit={(e) => handleSubmit(e, "save")}
          onKeyDown={(e) => {
            if (mode === "quick" && e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e, "save-next");
            }
          }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-md border border-orange-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setMode("quick")}
                className={`px-4 py-2 text-sm ${mode === "quick" ? "bg-orange-800 text-white" : "bg-white text-orange-800"}`}
              >
                Quick Entry
              </button>
              <button
                type="button"
                onClick={() => setMode("full")}
                className={`px-4 py-2 text-sm ${mode === "full" ? "bg-orange-800 text-white" : "bg-white text-orange-800"}`}
              >
                Full Form
              </button>
            </div>
            <span className="text-xs text-gray-500">Tip: In Quick Entry, press Enter to Save & Add Next</span>
          </div>

          {mode === "quick" ? (
            <div className="bg-white rounded-lg border border-orange-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Donor ID *</label>
                  <div className="flex gap-2">
                    <input
                      ref={donorIdInputRef}
                      type="text"
                      name="donorId"
                      value={formData.donorId}
                      onChange={handleInputChange}
                      placeholder="DNR-2025-0001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateDonorId}
                      className="px-3 py-2 border border-orange-300 text-orange-800 rounded-md hover:bg-orange-50"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (10 digits) *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Kg) *</label>
                  <input
                    type="number"
                    name="weightKg"
                    value={formData.weightKg}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group *</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rh Factor *</label>
                  <select
                    name="rh"
                    value={formData.rh}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Status *</label>
                  <select
                    name="eligibilityStatus"
                    value={formData.eligibilityStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  >
                    <option value="">Select</option>
                    <option value="eligible">Eligible</option>
                    <option value="deferred">Deferred</option>
                    <option value="temp-deferred">Temporarily Deferred</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UID (12 digits)</label>
                  <input
                    type="text"
                    name="uid"
                    value={formData.uid}
                    onChange={handleInputChange}
                    placeholder="123456789012"
                    maxLength={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Basic Information */}
              <div className="bg-white rounded-lg border border-orange-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donor ID *</label>
                    <input
                      type="text"
                      name="donorId"
                      value={formData.donorId}
                      onChange={handleInputChange}
                      placeholder="DNR-2025-0001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UID (12 digits)</label>
                    <input
                      type="text"
                      name="uid"
                      value={formData.uid}
                      onChange={handleInputChange}
                      placeholder="123456789012"
                      maxLength={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-white rounded-lg border border-orange-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                    <select
                      name="sex"
                      value={formData.sex}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    >
                      <option value="">Select</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Kg) *</label>
                    <input
                      type="number"
                      name="weightKg"
                      value={formData.weightKg}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg border border-orange-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (10 digits) *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-white rounded-lg border border-orange-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group *</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    >
                      <option value="">Select</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rh Factor *</label>
                    <select
                      name="rh"
                      value={formData.rh}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Positive">Positive</option>
                      <option value="Negative">Negative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Status *</label>
                    <select
                      name="eligibilityStatus"
                      value={formData.eligibilityStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    >
                      <option value="">Select</option>
                      <option value="eligible">Eligible</option>
                      <option value="deferred">Deferred</option>
                      <option value="temp-deferred">Temporarily Deferred</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Date</label>
                    <input
                      type="date"
                      name="lastDonationDate"
                      value={formData.lastDonationDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "save-next")}
              disabled={loading}
              className="px-6 py-2 border border-orange-300 text-orange-800 rounded-md hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save & Add Next
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-800 text-white rounded-md hover:bg-orange-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showPostCreate && showPostCreateActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Donor created successfully</h3>
                <p className="text-sm text-gray-600 mt-1">What would you like to do next?</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleStartDonation}
                className="w-full px-4 py-2 rounded-lg bg-orange-800 text-white hover:bg-orange-900"
              >
                Create Donation for this donor
              </button>
              <button
                onClick={() => { setShowPostCreate(false); resetForm(); }}
                className="w-full px-4 py-2 rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50"
              >
                Save & Add Next Donor
              </button>
              <button
                onClick={() => { setShowPostCreate(false); onBack && onBack(); }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Donors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateDonor

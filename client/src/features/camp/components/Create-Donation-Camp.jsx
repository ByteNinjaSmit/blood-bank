import React from "react"
import { useState } from "react"
import { ArrowLeft, User, Save, Loader2 } from "lucide-react"
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav"

const CreateDonationCamp = ({ onBack }) => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
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
    rh: "",
    eligibilityStatus: "",
    lastDonationDate: "",
  })

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
    if (!/^\d{12}$/.test(formData.uid)) {
      setError("UID must be exactly 12 digits")
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
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
          rh: "",
          eligibilityStatus: "",
          lastDonationDate: "",
        })
      }, 3000)
    } catch (err) {
      setError("Failed to create donor. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers()

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        onBack={onBack}
        icon={User}
        title="Create Donor at this camp"
        description="Create Donar and Initailize it Details with ease!"
        iconBgColor="bg-red-800"
      />

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

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="space-y-8">
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
                  placeholder="DNR-YY-MM-DD-HH-MM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UID (12 digits) *</label>
                <input
                  type="text"
                  name="uid"
                  value={formData.uid}
                  onChange={handleInputChange}
                  placeholder="123456789012"
                  maxLength={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                  required
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

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-800 text-white rounded-md hover:bg-orange-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Donor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateDonationCamp

import React from "react"
import { useState, useEffect, useRef } from "react"
import { User, Save, Loader2, CheckCircle } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import { useNavigate } from "react-router-dom"

const CreateDonor = ({ onBack, onCreated, backText = "Back to Donations", afterCreate = "back", prefill = {}, showPostCreateActions = false, onStartDonation, originCampId }) => {
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
    age: "",
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
    dobDisplay: prefill?.dob ? (() => {
      const parts = prefill.dob.split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : prefill.dob;
    })() : "",
    lastDonationDateDisplay: prefill?.lastDonationDate ? (() => {
      const parts = prefill.lastDonationDate.split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : prefill.lastDonationDate;
    })() : "",
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
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      if (name === "weightKg" || name === "sex") {
        const autoStatus = getAutoEligibilityStatus(newData.age, newData.weightKg, newData.lastDonationDate, newData.sex)
        if (autoStatus) newData.eligibilityStatus = autoStatus
      }
      return newData
    })
  }

  // Calculate age from DOB
  const calculateAgeFromDob = (dobStr) => {
    if (!dobStr) return ""
    const dob = new Date(dobStr)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age >= 0 ? String(age) : ""
  }

  // Calculate DOB from age (sets Jan 1 of birth year)
  const calculateDobFromAge = (ageStr) => {
    if (!ageStr) return ""
    const ageNum = parseInt(ageStr, 10)
    if (isNaN(ageNum) || ageNum <= 0) return ""
    const birthYear = new Date().getFullYear() - ageNum
    return `${birthYear}-01-01`
  }

  // Auto-calculate eligibility status based on age, weight, last donation date, and sex
  const getAutoEligibilityStatus = (age, weight, lastDonationDate, sex) => {
    if (!age || !weight) return null
    const ageNum = parseInt(age, 10)
    const weightNum = parseFloat(weight)
    if (isNaN(ageNum) || isNaN(weightNum)) return null

    if (ageNum < 18 || ageNum > 65 || weightNum < 45) {
      return "deferred"
    }

    if (lastDonationDate && sex) {
      const lDate = new Date(lastDonationDate);
      const now = new Date();
      lDate.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
      const diffTime = now.getTime() - lDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const requiredInterval = sex === 'F' ? 120 : 90;
      if (diffDays < requiredInterval) {
        return "temp-deferred"
      }
    }

    return "eligible"
  }

  const handleDobChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    let display = val;
    if (val.length > 4) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
    } else if (val.length > 2) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }

    let isoDob = "";
    let age = "";
    if (val.length === 8) {
      const d = val.slice(0, 2);
      const m = val.slice(2, 4);
      const y = val.slice(4, 8);
      isoDob = `${y}-${m}-${d}`;
      age = calculateAgeFromDob(isoDob);
    }

    const autoStatus = getAutoEligibilityStatus(age, formData.weightKg, formData.lastDonationDate, formData.sex)
    setFormData((prev) => ({
      ...prev,
      dobDisplay: display,
      dob: isoDob,
      age: age,
      eligibilityStatus: autoStatus || prev.eligibilityStatus
    }))
  }

  const handleLastDonationDateChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    let display = val;
    if (val.length > 4) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
    } else if (val.length > 2) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }

    let isoDate = "";
    if (val.length === 8) {
      const d = val.slice(0, 2);
      const m = val.slice(2, 4);
      const y = val.slice(4, 8);
      isoDate = `${y}-${m}-${d}`;
    }

    setFormData((prev) => {
      const autoStatus = getAutoEligibilityStatus(prev.age, prev.weightKg, isoDate || prev.lastDonationDate, prev.sex)
      return {
        ...prev,
        lastDonationDateDisplay: display,
        lastDonationDate: isoDate || prev.lastDonationDate,
        eligibilityStatus: autoStatus || prev.eligibilityStatus
      }
    })
  }

  const handleAgeChange = (e) => {
    const age = e.target.value
    const dob = calculateDobFromAge(age)
    const autoStatus = getAutoEligibilityStatus(age, formData.weightKg, formData.lastDonationDate, formData.sex)
    setFormData((prev) => ({
      ...prev,
      age,
      dob,
      eligibilityStatus: autoStatus || prev.eligibilityStatus
    }))
  }

  const validateForm = () => {
    if (!formData.firstName) {
      setError("First Name is required")
      return false
    }
    if (!formData.middleName) {
      setError("Middle Name is required")
      return false
    }
    if (!formData.lastName) {
      setError("Last Name is required")
      return false
    }
    if (!formData.city || !formData.district || !formData.state) {
      setError("City, District, and State are required")
      return false
    }
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

    if (!formData.dobDisplay) {
      setError("Date of Birth is required")
      return false
    }
    const dobCheck = validateDateString(formData.dobDisplay);
    if (dobCheck !== true) {
      setError(`Date of Birth: ${dobCheck}`);
      return false;
    }

    if (formData.lastDonationDateDisplay) {
      const ldCheck = validateDateString(formData.lastDonationDateDisplay);
      if (ldCheck !== true) {
        setError(`Last Donation Date: ${ldCheck}`);
        return false;
      }
    }

    return true
  }

  const validateDateString = (dateStr) => {
    if (!dateStr) return true;
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(dateStr)) return "Format must be DD/MM/YYYY";

    const parts = dateStr.match(regex);
    const d = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const y = parseInt(parts[3], 10);

    if (m < 1 || m > 12) return "Invalid month (01-12)";
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < 1 || d > daysInMonth) return `Invalid day for month (01-${daysInMonth})`;

    const inputDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate > today) return "Date cannot be in the future";

    return true;
  }

  const resetForm = () => {
    setFormData({
      donorId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      uid: "",
      dob: "",
      age: "",
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
      dobDisplay: "",
      lastDonationDateDisplay: "",
    })

    setError("")
    setSuccess(false)
    donorIdInputRef.current?.focus()
  }

  const generateDonorId = () => {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')

    setFormData((prev) => ({ ...prev, donorId: `DNR-${yy}-${mm}-${dd}-${hh}-${min}` }))
    setTimeout(() => donorIdInputRef.current?.select(), 0)
  }

  const handleSubmit = async (e, action = "save") => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setLoading(true)
    try {
      // donorId is assigned by the server at registration time (unique,
      // format DNR-YYYYMMDD-XXXXXX) regardless of eligibilityStatus.
      const donorData = {
        name: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
        },
        uid: formData.uid || undefined,
        dob: formData.dob || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        sex: formData.sex,
        phone: formData.phone,
        email: formData.email || undefined,
        address: {
          line1: formData.addressLine1 || undefined,
          line2: formData.addressLine2 || undefined,
          city: formData.city,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode || undefined,
        },
        occupation: formData.occupation || undefined,
        weightKg: Number(formData.weightKg),
        bloodGroup: formData.bloodGroup,
        rh: formData.rh,
        eligibilityStatus: formData.eligibilityStatus,
        lastDonationDate: formData.lastDonationDate || undefined,
        siteId: originCampId || undefined,
      }
      const response = await axios.post(
        `${API}/api/v2/donor`,
        donorData,
        {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        }
      )
      if (response.status === 201 || response.status === 200) {
        setSuccess(true)
        const newDonor = response.data.donor || response.data.data
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
      const apiMessage = err?.response?.data?.message
      const details = err?.response?.data?.details
      if (details && Array.isArray(details)) {
        const detailStr = details.map(d => `${d.path.join('.')}: ${d.message}`).join(', ')
        setError(`${apiMessage || "Validation error"}: ${detailStr}`)
      } else {
        setError(apiMessage || "Failed to create donor. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStartDonation = () => {
    if (!createdDonor) return
    if (onStartDonation) {
      onStartDonation(createdDonor)
    } else {
      navigate('/master-register/donor-creation', { state: { donor: createdDonor } })
    }
    setShowPostCreate(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br bg-orange-800 rounded-xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Donor</h1>
              <p className="text-gray-500 text-sm">Register a new blood donor with complete information</p>
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
          onSubmit={(e) => handleSubmit(e, mode === "quick" ? "save-next" : "save")}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name *</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Middle Name"
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
                    type="text"
                    name="dobDisplay"
                    value={formData.dobDisplay}
                    onChange={handleDobChange}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    required
                  />
                  {formData.age && (
                    <p className="text-xs text-gray-500 mt-1">Age: {formData.age} years</p>
                  )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                  />
                </div>
              </div>
            </div>
          ) : (
             <>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name *</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="text"
                      name="dobDisplay"
                      value={formData.dobDisplay}
                      onChange={handleDobChange}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                      required
                    />
                    {formData.age && (
                      <p className="text-xs text-gray-500 mt-1">Age: {formData.age} years</p>
                    )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-white rounded-lg border border-orange-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      type="text"
                      name="lastDonationDateDisplay"
                      value={formData.lastDonationDateDisplay}
                      onChange={handleLastDonationDateChange}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800"
                    />
                    {formData.lastDonationDateDisplay && validateDateString(formData.lastDonationDateDisplay) === true && formData.lastDonationDate && formData.sex && (() => {
                      const lDate = new Date(formData.lastDonationDate);
                      const now = new Date();
                      lDate.setHours(0,0,0,0);
                      now.setHours(0,0,0,0);
                      const diffTime = now.getTime() - lDate.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      const requiredInterval = formData.sex === 'F' ? 120 : 90;
                      if (diffDays < requiredInterval) {
                        return (
                          <p className="text-xs text-red-655 mt-1 font-semibold">
                            Interval too short: last donation was {diffDays} days ago. Required is {requiredInterval === 120 ? '120 days (4 months)' : '90 days (3 months)'}.
                          </p>
                        );
                      }
                      return null;
                    })()}
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
                <p className="text-sm text-gray-500">What would you like to do next?</p>
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

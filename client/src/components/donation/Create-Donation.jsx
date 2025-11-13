"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Search, Plus, Droplets, X, CheckCircle } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import { toast } from "sonner"
import CreateDonor from "../donor/Create-Donor"
import Stepper, { Step } from "@/components/Stepper"

const CreateDonation = ({ onCreateDonor }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const campId = searchParams.get("campId")
  const { API, authorizationToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [donor, setDonor] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const [showCreateDonor, setShowCreateDonor] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedDonation, setSavedDonation] = useState(null)

  // Donor Search Fields
  const [donorInfo, setDonorInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    uid: "",
    phone: "",
    donorId: "",
  })

  const searchRequiredFilled =
    donorInfo.firstName.trim() && donorInfo.middleName.trim() && donorInfo.lastName.trim() && donorInfo.dob

  // Donation Form Data
  const [formData, setFormData] = useState({
    bagNo: "",
    segmentNo: "",
    batchNo: "",
    typeOfBag: "",
    collectionDate: new Date().toISOString().split("T")[0],
    hb: "",
    weightKg: "",
    pulse: "",
    tempC: "",
    bp: "",
    bloodGroup: "",
    rh: "",
    atypicalAntibody: "",
  })

  // Prefill and enforce blood group/Rh and optionally weight from donor to avoid backend mismatch & speed up
  useEffect(() => {
    if (donor) {
      const donorBG = donor?.bloodGroup
      const donorRh = donor?.rh
      const donorWeight = donor?.weightKg
      setFormData((prev) => ({
        ...prev,
        bloodGroup: donorBG || prev.bloodGroup,
        rh: donorRh || prev.rh,
        weightKg: prev.weightKg || (donorWeight ? String(donorWeight) : prev.weightKg),
      }))
    }
  }, [donor])

  // Accept donor from navigation state and skip search step
  useEffect(() => {
    const navDonor = location?.state?.donor
    if (navDonor) {
      setDonor(navDonor)
      setCurrentStep(2)
    }
  }, [location?.state])

  const getDonorName = (d) => {
    if (!d) return ""
    const f = d?.name?.firstName || d?.firstName || ""
    const m = d?.name?.middleName || d?.middleName || ""
    const l = d?.name?.lastName || d?.lastName || ""
    return [f, m, l].filter(Boolean).join(" ")
  }

  const handleDonorSearch = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await axios.get(`${API}/api/donor/search`, {
        params: donorInfo,
        headers: {
          Authorization: authorizationToken,
        },
        withCredentials: true,
      })
      if (res.status === 200) {
        setDonor(res.data.donor)
        setShowPopup(false)
        setCurrentStep(2)
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setShowPopup(true)
      } else {
        toast.error("Something went wrong while searching donor.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!donor) {
      toast.error("Please search and select a donor before submitting.")
      return
    }

    const payload = {
      bagNo: formData.bagNo,
      segmentNo: formData.segmentNo,
      batchNo: formData.batchNo,
      typeOfBag: formData.typeOfBag,
      donor: donor._id,
      initialVitals: {
        hb: Number.parseFloat(formData.hb),
        weightKg: Number.parseFloat(formData.weightKg),
        pulse: Number.parseInt(formData.pulse),
        tempC: Number.parseFloat(formData.tempC),
        bp: formData.bp,
      },
      bloodGroup: formData.bloodGroup,
      rh: formData.rh,
      atypicalAntibody: formData.atypicalAntibody,
      siteId: campId || null,
      donorId: donor.donorId,
    }

    try {
      setLoading(true)
      const response = await axios.post(`${API}/api/donation/new`, payload, {
        headers: {
          Authorization: authorizationToken,
        },
        withCredentials: true,
      })
      if (response.status === 201) {
        setSavedDonation(response.data.data)
        setShowSuccess(true)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating donation")
    } finally {
      setLoading(false)
    }
  }

  const resetDonationForSameDonor = () => {
    // Reset bag info and vitals, keep donor and prefilled group/Rh
    setFormData((prev) => ({
      ...prev,
      bagNo: "",
      segmentNo: "",
      batchNo: "",
      typeOfBag: "",
      hb: "",
      weightKg: donor?.weightKg ? String(donor.weightKg) : "",
      pulse: "",
      tempC: "",
      bp: "",
      // bloodGroup and rh remain as is (prefilled from donor)
    }))
    setShowSuccess(false)
    setCurrentStep(2)
  }

  const startNewDonorFlow = () => {
    setShowSuccess(false)
    setDonor(null)
    setDonorInfo({ firstName: "", middleName: "", lastName: "", dob: "", uid: "", phone: "", donorId: "" })
    setCurrentStep(1)
    setShowCreateDonor(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate(campId ? `/camp-details/?id=${campId}` : "/donations/view-donation")}
            className="flex items-center gap-2 px-4 py-2 text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {campId ? "Back to Camp" : "Back to Donations"}
          </button>
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-orange-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {campId ? "New Camp Donation" : "New Inhouse Donation"}
              </h1>
              <p className="text-gray-600 text-sm">Register a new blood donation</p>
            </div>
          </div>
        </div>
      </div>

      <div className=" mx-auto px-4 py-8">
        <Stepper
          onFinalStepCompleted={handleSubmit}
          onStepChange={(s) => setCurrentStep(s)}
          nextButtonProps={{ disabled: currentStep === 1 && !donor }}
          stepCircleContainerClassName="bg-white"
          contentClassName="bg-white rounded-xl shadow border border-gray-100"
          footerClassName="bg-white rounded-b-xl"
        >
          {/* Step 1: Donor Search */}
          <Step>
            <div
              className="p-6"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (searchRequiredFilled) handleDonorSearch()
                }
              }}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Donor Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  firstName: "First Name",
                  middleName: "Middle Name",
                  lastName: "Last Name",
                }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm text-gray-700 mb-1">{label}</label>
                    <input
                      type="text"
                      value={donorInfo[key]}
                      onChange={(e) => setDonorInfo({ ...donorInfo, [key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={donorInfo.dob}
                    onChange={(e) => setDonorInfo({ ...donorInfo, dob: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="text-sm text-orange-800 hover:underline"
                >
                  {showAdvanced ? "Hide advanced" : "Show advanced (UID, Phone, Donor ID)"}
                </button>
              </div>
              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  {Object.entries({
                    uid: "UID (12 digits)",
                    phone: "Phone (10 digits)",
                    donorId: "Donor ID",
                  }).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-700 mb-1">{label}</label>
                      <input
                        type="text"
                        value={donorInfo[key]}
                        onChange={(e) => setDonorInfo({ ...donorInfo, [key]: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-4">
                <button
                  type="button"
                  onClick={handleDonorSearch}
                  disabled={loading || !searchRequiredFilled}
                  className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
                    loading || !searchRequiredFilled
                      ? "bg-orange-300 cursor-not-allowed"
                      : "bg-orange-800 hover:bg-orange-900 text-white"
                  }`}
                >
                  <Search className="w-4 h-4" /> Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateDonor(true)}
                  className="px-5 py-2 rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Create Donor
                </button>
                {!searchRequiredFilled && (
                  <span className="text-sm text-gray-500 self-center">
                    Enter First, Middle, Last name and DOB to search
                  </span>
                )}
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

              {/* Donor Not Found Popup */}
              {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                  <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
                    <button
                      onClick={() => setShowPopup(false)}
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold mb-4">Donor Not Found</h2>
                    <p className="text-gray-600 mb-6">No donor matched your search. Create one now and continue.</p>
                    <button
                      onClick={() => {
                        setShowPopup(false)
                        setShowCreateDonor(true)
                      }}
                      className="px-5 py-2 bg-orange-800 text-white rounded-lg hover:bg-orange-900 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Create Donor
                    </button>
                  </div>
                </div>
              )}

              {showCreateDonor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    <CreateDonor
                      onBack={() => setShowCreateDonor(false)}
                      onCreated={(created) => {
                        setDonor(created)
                        setShowCreateDonor(false)
                        setCurrentStep(2)
                      }}
                      prefill={{
                        donorId: donorInfo.donorId,
                        firstName: donorInfo.firstName,
                        middleName: donorInfo.middleName,
                        lastName: donorInfo.lastName,
                        dob: donorInfo.dob,
                        uid: donorInfo.uid,
                        phone: donorInfo.phone,
                      }}
                    />
                  </div>
                </div>
              )}

              {donor && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Donor selected: <strong>{getDonorName(donor)}</strong>
                    {donor?.donorId ? (
                      <span className="text-gray-600"> (ID: {donor.donorId})</span>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          </Step>

          {/* Step 2: Bag Information */}
          <Step>
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Bag Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "bagNo", label: "Bag No" },
                  { key: "segmentNo", label: "Segment No" },
                  { key: "batchNo", label: "Batch No" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm mb-1">{label}</label>
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm mb-1">Type of Bag</label>
                  <select
                    value={formData.typeOfBag}
                    onChange={(e) => setFormData({ ...formData, typeOfBag: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="DB">Double Bag</option>
                    <option value="TB">Triple Bag</option>
                    <option value="QB">Quadruple Bag</option>
                  </select>
                </div>
              </div>
            </div>
          </Step>

          {/* Step 3: Initial Vitals */}
          <Step>
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Initial Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "hb", label: "Hemoglobin (g/dL)", type: "number" },
                  { key: "weightKg", label: "Weight (kg)", type: "number" },
                  { key: "pulse", label: "Pulse (bpm)", type: "number" },
                  { key: "tempC", label: "Temperature (°C)", type: "number" },
                  { key: "bp", label: "Blood Pressure", type: "text" },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-sm mb-1">{label}</label>
                    <input
                      type={type}
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          </Step>

          {/* Step 4: Blood Group Information */}
          <Step>
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Blood Group Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!!donor}
                    required
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                  {donor && (
                    <p className="text-xs text-gray-500 mt-1">Prefilled from donor record</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Rh Factor</label>
                  <select
                    value={formData.rh}
                    onChange={(e) => setFormData({ ...formData, rh: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!!donor}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                  </select>
                  {donor && (
                    <p className="text-xs text-gray-500 mt-1">Prefilled from donor record</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Atypical Antibody</label>
                  <input
                    type="text"
                    value={formData.atypicalAntibody}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        atypicalAntibody: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </Step>

          {/* Step 5: Review & Submit */}
          <Step>
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Review Donation Details</h3>
              <div className="space-y-4">
                {/* Donor Info */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Donor Information</h4>
                  <p className="text-sm text-blue-800">
                    <strong>Name:</strong> {getDonorName(donor)}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Donor ID:</strong> {donor?.donorId}
                  </p>
                </div>

                {/* Bag Info */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Bag Information</h4>
                  <p className="text-sm text-purple-800">
                    <strong>Bag No:</strong> {formData.bagNo}
                  </p>
                  <p className="text-sm text-purple-800">
                    <strong>Segment No:</strong> {formData.segmentNo}
                  </p>
                  <p className="text-sm text-purple-800">
                    <strong>Batch No:</strong> {formData.batchNo}
                  </p>
                  <p className="text-sm text-purple-800">
                    <strong>Type:</strong> {formData.typeOfBag}
                  </p>
                </div>

                {/* Vitals */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Initial Vitals</h4>
                  <p className="text-sm text-green-800">
                    <strong>Hemoglobin:</strong> {formData.hb} g/dL
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Weight:</strong> {formData.weightKg} kg
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Pulse:</strong> {formData.pulse} bpm
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Temperature:</strong> {formData.tempC}°C
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Blood Pressure:</strong> {formData.bp}
                  </p>
                </div>

                {/* Blood Group */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">Blood Group</h4>
                  <p className="text-sm text-orange-800">
                    <strong>Group:</strong> {formData.bloodGroup} {formData.rh}
                  </p>
                  {formData.atypicalAntibody && (
                    <p className="text-sm text-orange-800">
                      <strong>Atypical Antibody:</strong> {formData.atypicalAntibody}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Step>
        </Stepper>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Donation recorded successfully</h3>
                <p className="text-sm text-gray-600 mt-1">Choose your next action to keep the queue moving fast.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={resetDonationForSameDonor}
                className="w-full px-4 py-2 rounded-lg bg-orange-800 text-white hover:bg-orange-900"
              >
                Add another bag for this donor
              </button>
              <button
                onClick={startNewDonorFlow}
                className="w-full px-4 py-2 rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50"
              >
                Create new donor & continue
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false)
                  navigate(campId ? `/camp-details/?id=${campId}` : "/donations/view-donation")
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {campId ? "Back to Camp" : "Go to Donations"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateDonation

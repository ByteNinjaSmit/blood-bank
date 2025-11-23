"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Search, Plus, Droplets, X, CheckCircle } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import { toast } from "sonner"
import Stepper, { Step } from "@/components/Stepper"
import CustomModal from "@/components/CustomModal"
import DonorSearchStep from "@/components/donation/steps/DonorSearchStep"
import BagInformationStep from "@/components/donation/steps/BagInformationStep"
import InitialVitalsStep from "@/components/donation/steps/InitialVitalsStep"
import BloodGroupStep from "@/components/donation/steps/BloodGroupStep"
import ReviewSubmitStep from "@/components/donation/steps/ReviewSubmitStep"

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
  const [fieldErrors, setFieldErrors] = useState({})
  const [stepperKey, setStepperKey] = useState(0)

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
  // Allow search by either (first + last name + dob) OR any of uid / phone / donorId
  const hasNameDob =
    donorInfo.firstName.trim() && donorInfo.lastName.trim() && donorInfo.dob
  const hasStrongIdentifier =
    donorInfo.uid.trim() || donorInfo.phone.trim() || donorInfo.donorId.trim()
  const canSearchDonor = !!(hasNameDob || hasStrongIdentifier)

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

  const getDonorName = (d) => {
    if (!d) return ""
    const f = d?.name?.firstName || d?.firstName || ""
    const m = d?.name?.middleName || d?.middleName || ""
    const l = d?.name?.lastName || d?.lastName || ""
    return [f, m, l].filter(Boolean).join(" ")
  }

  const handleDonorSelected = async (d) => {
    try {
      setLoading(true)
      // Fetch full donor details to ensure we have consistent schema (name object, history, etc.)
      const res = await axios.get(`${API}/api/donor/${d._id}`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      })
      const full = res?.data?.donor || d
      setDonor(full)
      setShowPopup(false)
      toast.success(`Selected donor ${getDonorName(full) || full.fullName || full.donorId}`)
    } catch (e) {
      setDonor(d) // fallback to quick record
    } finally {
      setLoading(false)
    }
  }

  // Accept donor from navigation state and skip search step
  useEffect(() => {
    const navDonor = location?.state?.donor
    if (navDonor) {
      setDonor(navDonor)
    }
  }, [location?.state])

  

  const handleDonorInfoFieldChange = (field, value) => {
    setDonorInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleAdvanced = () => {
    setShowAdvanced((v) => !v)
  }

  const handleOpenCreateDonor = () => {
    setShowCreateDonor(true)
  }

  const handleCloseCreateDonor = () => {
    setShowCreateDonor(false)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  const handleDonorCreated = (created) => {
    setDonor(created)
    setShowCreateDonor(false)
  }

  const handleFormFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const isCurrentStepComplete = () => {
    if (currentStep === 1) {
      return !!donor
    }

    if (currentStep === 2) {
      return (
        formData.bagNo.trim() &&
        formData.segmentNo.trim() &&
        formData.batchNo.trim() &&
        formData.typeOfBag
      )
    }

    if (currentStep === 3) {
      return (
        formData.hb &&
        formData.weightKg &&
        formData.pulse &&
        formData.tempC &&
        formData.bp.trim()
      )
    }

    if (currentStep === 4) {
      return formData.bloodGroup && formData.rh
    }

    // Step 5 is review; by the time user reaches here, previous steps are already valid
    return true
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
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setShowPopup(true)
      } else {
        const message = error.response?.data?.message || "Something went wrong while searching donor."
        setError(message)
        toast.error(message)
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

    const newErrors = {}
    if (!formData.bagNo.trim()) newErrors.bagNo = "Bag number is required."
    if (!formData.segmentNo.trim()) newErrors.segmentNo = "Segment number is required."
    if (!formData.batchNo.trim()) newErrors.batchNo = "Batch number is required."
    if (!formData.typeOfBag) newErrors.typeOfBag = "Type of bag is required."
    if (!formData.hb) newErrors.hb = "Hemoglobin value is required."
    if (!formData.weightKg) newErrors.weightKg = "Weight is required."
    if (!formData.pulse) newErrors.pulse = "Pulse is required."
    if (!formData.tempC) newErrors.tempC = "Temperature is required."
    if (!formData.bp.trim()) newErrors.bp = "Blood pressure is required."
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood group is required."
    if (!formData.rh) newErrors.rh = "Rh factor is required."

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      toast.error("Please fill all required fields before submitting.")
      return
    }

    setFieldErrors({})

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
    // Start a fresh donation flow for the same donor within the same page
    // by resetting local state and restarting the stepper.
    setShowSuccess(false)
    setSavedDonation(null)
    setFieldErrors({})
    setCurrentStep(1)
    setStepperKey((prev) => prev + 1)

    const today = new Date().toISOString().split("T")[0]

    setFormData(() => {
      const base = {
        bagNo: "",
        segmentNo: "",
        batchNo: "",
        typeOfBag: "",
        collectionDate: today,
        hb: "",
        weightKg: "",
        pulse: "",
        tempC: "",
        bp: "",
        bloodGroup: "",
        rh: "",
        atypicalAntibody: "",
      }

      if (!donor) return base

      const donorBG = donor?.bloodGroup
      const donorRh = donor?.rh
      const donorWeight = donor?.weightKg

      return {
        ...base,
        bloodGroup: donorBG || "",
        rh: donorRh || "",
        weightKg: donorWeight ? String(donorWeight) : "",
      }
    })
  }

  const startNewDonorFlow = () => {
    // Go to Create Donor page (camp-aware when applicable)
    setShowSuccess(false)
    navigate(campId ? `/donor/create-donor?campId=${campId}` : "/donor/create-donor")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate(campId ? `/camp-details?id=${campId}` : "/donations/view-donation")}
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
          key={stepperKey}
          onFinalStepCompleted={handleSubmit}
          onStepChange={(s) => setCurrentStep(s)}
          nextButtonProps={{
            disabled: !isCurrentStepComplete(),
            className: !isCurrentStepComplete()
              ? "duration-350 flex items-center justify-center rounded-full bg-gray-300 py-1.5 px-3.5 font-medium tracking-tight text-gray-500 cursor-not-allowed"
              : "duration-350 flex items-center justify-center rounded-full bg-red-800 py-1.5 px-3.5 font-medium tracking-tight text-white transition hover:bg-red-900 active:bg-red-950",
          }}
          disableStepIndicators
          stepCircleContainerClassName="bg-white"
          contentClassName="bg-white rounded-xl shadow border border-gray-100"
          footerClassName="bg-white rounded-b-xl"
        >
          {/* Step 1: Donor Search */}
          <Step>
            <DonorSearchStep
              donorInfo={donorInfo}
              onDonorInfoFieldChange={handleDonorInfoFieldChange}
              canSearchDonor={canSearchDonor}
              showAdvanced={showAdvanced}
              onToggleAdvanced={handleToggleAdvanced}
              loading={loading}
              error={error}
              onSearch={handleDonorSearch}
              onOpenCreateDonor={handleOpenCreateDonor}
              showPopup={showPopup}
              onClosePopup={handleClosePopup}
              showCreateDonor={showCreateDonor}
              onCloseCreateDonor={handleCloseCreateDonor}
              onDonorCreated={handleDonorCreated}
              getDonorName={getDonorName}
              donor={donor}
              onDonorSelected={handleDonorSelected}
            />
          </Step>

          {/* Step 2: Bag Information */}
          <Step>
            <BagInformationStep
              formData={formData}
              fieldErrors={fieldErrors}
              onFieldChange={handleFormFieldChange}
            />
          </Step>

          {/* Step 3: Initial Vitals */}
          <Step>
            <InitialVitalsStep
              formData={formData}
              fieldErrors={fieldErrors}
              onFieldChange={handleFormFieldChange}
            />
          </Step>

          {/* Step 4: Blood Group Information */}
          <Step>
            <BloodGroupStep
              formData={formData}
              fieldErrors={fieldErrors}
              donor={donor}
              onFieldChange={handleFormFieldChange}
            />
          </Step>

          {/* Step 5: Review & Submit */}
          <Step>
            <ReviewSubmitStep donor={donor} formData={formData} getDonorName={getDonorName} />
          </Step>
        </Stepper>
      </div>

      {showSuccess && (
        <CustomModal
          open={showSuccess}
          title="Donation recorded successfully"
          description="Choose your next action to continue."
          onCancel={() => setShowSuccess(false)}
          hideFooter
          size="md"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Donation recorded successfully</h3>
              <p className="text-sm text-gray-600 mt-1">What would you like to do next?</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={startNewDonorFlow}
              className="w-full px-4 py-2 rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50"
            >
              Create new donor
            </button>
            <button
              onClick={resetDonationForSameDonor}
              className="w-full px-4 py-2 rounded-lg bg-orange-800 text-white hover:bg-orange-900"
            >
              New donation
            </button>
            <button
              onClick={() => {
                setShowSuccess(false)
                navigate(campId ? `/camp-details?id=${campId}` : "/donations/view-donation")
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {campId ? "Back to Camp" : "Donation list (view)"}
            </button>
          </div>
        </CustomModal>
      )}
    </div>
  )
}

export default CreateDonation

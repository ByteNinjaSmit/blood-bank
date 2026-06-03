"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate, useLocation } from "react-router-dom"
import { Search, Plus, Droplets, X, CheckCircle } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import { toast } from "sonner"
import Stepper, { Step } from "@/components/Stepper"
import CustomModal from "@/components/CustomModal"
import DonorSearchStep from "@/features/donation/components/steps/DonorSearchStep"
import BagInformationStep from "@/features/donation/components/steps/BagInformationStep"
import MedicalQuestionsStep from "@/features/donation/components/steps/MedicalQuestionsStep"
import InitialVitalsStep from "@/features/donation/components/steps/InitialVitalsStep"
import BloodCollectionStep from "@/features/donation/components/steps/BloodCollectionStep"
import DonorFitnessStep from "@/features/donation/components/steps/DonorFitnessStep"
import BloodGroupStep from "@/features/donation/components/steps/BloodGroupStep"
import ReviewSubmitStep from "@/features/donation/components/steps/ReviewSubmitStep"

const INITIAL_FORM_DATA = {
  // Bag info
  bagNo: "",
  segmentNo: "",
  lotNo: "",
  typeOfBag: "",
  collectionDate: new Date().toISOString().split("T")[0],
  collectionTime: new Date().toTimeString().slice(0, 5), // "HH:MM"
  // New bag-level fields
  donationType: "",
  totalDonationCount: "",
  emergencyDonationWillingness: "",
  // Medical examination details
  hb: "",
  weightKg: "",
  pulse: "",
  tempC: "",
  bp: "",
  pedalOedema: "",
  o2Level: "",
  lymphadenopathy: "",
  cyanosis: "",
  systematicExam: "Normal",
  skinDiseaseFreeAtPhlebotomy: "Yes",
  armsFreeFromPunctureScars: "Yes",
  volumeGmMl: "",
  // Blood collection checklist
  emptyBagExamined: false,
  collectedWithin6to8Min: false,
  crossCheckingDone: false,
  // Donor fitness
  donorIsFit: null,
  rejectionReason: "",
  // Blood group
  bloodGroup: "",
  rh: "",
  // Medical questions q1-q36
  q1: "No", q2: "Yes", q3: "Yes", q4: "No", q5: "No", q6: "Yes", q7: "Yes", q8: "No", q9: "No", q10: "No",
  q11: "No", q12: "No", q13: "No", q14: "No", q15: "No", q16: "No", q17: "No", q18: "No", q19: "No", q20: "No",
  q21: "No", q22: "No", q23: "No", q24: "No", q25: "No", q26: "No", q27: "No", q28: "No", q29: "No", q30: "Yes",
  q31: "Yes", q32: "Yes", q33: "Yes", q34: "Yes", q35: "Yes", q36: "Yes",
}

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
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedDonation, setSavedDonation] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [stepperKey, setStepperKey] = useState(0)

  // Donation Form Data
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA })

  // Prefill blood group/Rh and weight from donor
  useEffect(() => {
    if (donor) {
      const donorBG = donor?.bloodGroup
      const donorRh = donor?.rh
      const donorWeight = donor?.weightKg
      setFormData((prev) => {
        const updated = {
          ...prev,
          bloodGroup: donorBG || prev.bloodGroup,
          rh: donorRh || prev.rh,
          weightKg: prev.weightKg || (donorWeight ? String(donorWeight) : prev.weightKg),
        }
        return calculateFitness(updated)
      })
    }
  }, [donor])

  const calculateFitness = (data) => {
    const reasons = []

    // 1. Weight & Volume
    const weight = Number.parseFloat(data.weightKg)
    let volume = data.volumeGmMl
    if (!isNaN(weight)) {
      if (weight < 45) {
        reasons.push("Weight must be at least 45 kg")
      }
    }

    // 2. Vitals
    const hb = Number.parseFloat(data.hb)
    if (!isNaN(hb) && hb < 12.5) reasons.push("Haemoglobin (Hb) must be at least 12.5 gm%")

    // Temperature range check removed: let it handle any entered temperature

    const pulse = Number.parseInt(data.pulse)
    if (!isNaN(pulse) && (pulse < 60 || pulse > 100)) reasons.push("Pulse must be between 60 and 100 bpm")

    const o2 = Number.parseFloat(data.o2Level)
    if (!isNaN(o2) && o2 < 95) reasons.push("Oxygen Saturation (SpO2) must be at least 95%")

    // 3. BP Parsing (expected format: "120/80")
    if (data.bp?.trim()) {
      const parts = data.bp.split("/")
      if (parts.length === 2) {
        const sys = Number.parseInt(parts[0].trim())
        const dia = Number.parseInt(parts[1].trim())
        if (!isNaN(sys) && (sys < 100 || sys > 180)) reasons.push("Systolic BP must be between 100 and 180 mmHg")
        if (!isNaN(dia) && (dia < 50 || dia > 100)) reasons.push("Diastolic BP must be between 50 and 100 mmHg")
      }
    }

    // 4. Physical Exams
    if (data.pedalOedema === "Yes") reasons.push("Pedal Oedema must be NO")
    if (data.lymphadenopathy === "Yes") reasons.push("Lymphadenopathy must be NO")
    if (data.cyanosis === "Yes") reasons.push("Cyanosis must be NO")
    if (data.systematicExam && data.systematicExam !== "Normal") {
      reasons.push(`Systematic Examination error: ${data.systematicExam} abnormal`)
    }
    if (data.skinDiseaseFreeAtPhlebotomy === "No") reasons.push("Donor must be free from skin disease at phlebotomy site")
    if (data.armsFreeFromPunctureScars === "No") reasons.push("Arms must be free from skin puncture and scars")

    // 5. Medical History Questions
    const yesRequired = ["q2", "q3", "q6", "q7", "q30", "q31", "q32", "q33", "q34", "q35", "q36"]
    for (let i = 1; i <= 36; i++) {
      const field = `q${i}`
      const val = data[field]
      if (val) {
        if (yesRequired.includes(field)) {
          if (val === "No") reasons.push(`Medical Question ${i} requires a YES answer`)
        } else {
          if (val === "Yes") reasons.push(`Medical Question ${i} requires a NO answer`)
        }
      }
    }

    const isFit = reasons.length === 0
    return {
      ...data,
      donorIsFit: isFit,
      rejectionReason: isFit ? "" : reasons.join("; "),
      volumeGmMl: volume,
    }
  }

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
      const res = await axios.get(`${API}/api/donor/${d._id}`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      })
      const full = res?.data?.donor || d
      setDonor(full)
      setShowPopup(false)
      toast.success(`Selected donor ${getDonorName(full) || full.fullName || full.donorId}`)
    } catch (e) {
      setDonor(d)
    } finally {
      setLoading(false)
    }
  }

  // Accept donor from navigation state
  useEffect(() => {
    const navDonor = location?.state?.donor
    if (navDonor) {
      setDonor(navDonor)
    }
  }, [location?.state])





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
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      return calculateFitness(updated)
    })
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  /*
    Steps:
    1 – Donor Search
    2 – Bag Information (+ donation type, lot no, etc.)
    3 – Medical History Questions (36 Q)
    4 – Medical Examination Details (vitals + physicals)
    5 – Blood Collection (3 checkboxes)
    6 – Donor Fitness (fit/unfit)
    7 – Blood Group
    8 – Review & Submit
  */
  const isCurrentStepComplete = () => {
    if (currentStep === 1) return !!donor

    if (currentStep === 2) {
      return (
        formData.bagNo.trim() &&
        formData.segmentNo.trim() &&
        formData.lotNo.trim() &&
        formData.typeOfBag &&
        formData.collectionDate &&
        formData.collectionTime
      )
    }

    // Step 3 – Medical questions: not strictly required, always allow proceed
    if (currentStep === 3) return true

    // Step 4 – Medical examination: require core vitals
    if (currentStep === 4) {
      return (
        formData.hb &&
        formData.weightKg &&
        formData.pulse &&
        formData.tempC &&
        formData.bp.trim()
      )
    }

    // Step 5 – Blood collection: always allow proceed
    if (currentStep === 5) return true

    // Step 6 – Donor fitness: must select fit or unfit
    if (currentStep === 6) {
      return formData.donorIsFit !== null
    }

    // Step 7 – Blood group
    if (currentStep === 7) {
      return formData.bloodGroup && formData.rh
    }

    // Step 8 is review
    return true
  }



  const handleSubmit = async () => {
    if (!donor) {
      toast.error("Please search and select a donor before submitting.")
      return
    }

    const newErrors = {}
    if (!formData.bagNo.trim()) newErrors.bagNo = "Bag number is required."
    if (!formData.segmentNo.trim()) newErrors.segmentNo = "Segment number is required."
    if (!formData.lotNo.trim()) newErrors.lotNo = "Lot number is required."
    if (!formData.typeOfBag) newErrors.typeOfBag = "Type of bag is required."
    if (!formData.hb) newErrors.hb = "Haemoglobin value is required."
    if (!formData.weightKg) newErrors.weightKg = "Weight is required."
    if (!formData.pulse) newErrors.pulse = "Pulse is required."
    if (!formData.tempC) newErrors.tempC = "Temperature is required."
    if (!formData.bp.trim()) newErrors.bp = "Blood pressure is required."
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood group is required."
    if (!formData.rh) newErrors.rh = "Rh factor is required."
    if (formData.donorIsFit === null) newErrors.donorIsFit = "Please assess donor fitness."
    if (formData.donorIsFit === false && !formData.rejectionReason?.trim()) {
      newErrors.rejectionReason = "Rejection reason is required when donor is unfit."
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      toast.error("Please fill all required fields before submitting.")
      return
    }

    setFieldErrors({})

    // Build medical questions object
    const medicalQuestions = {}
    for (let i = 1; i <= 36; i++) {
      const val = formData[`q${i}`]
      if (val) medicalQuestions[`q${i}`] = val
    }

    const payload = {
      bagNo: formData.bagNo,
      segmentNo: formData.segmentNo,
      lotNo: formData.lotNo,
      typeOfBag: formData.typeOfBag,
      donor: donor._id,
      collectionDate: new Date(`${formData.collectionDate}T${formData.collectionTime || '00:00'}:00`).toISOString(),
      // New top-level fields
      donationType: formData.donationType || undefined,
      totalDonationCount: formData.totalDonationCount ? Number(formData.totalDonationCount) : undefined,
      emergencyDonationWillingness: formData.emergencyDonationWillingness || undefined,
      // Medical examination (new shape)
      medicalExamination: {
        hb: Number.parseFloat(formData.hb),
        weightKg: Number.parseFloat(formData.weightKg),
        pulse: Number.parseInt(formData.pulse),
        tempC: Number.parseFloat(formData.tempC),
        bp: formData.bp,
        pedalOedema: formData.pedalOedema || undefined,
        o2Level: formData.o2Level ? Number.parseFloat(formData.o2Level) : undefined,
        lymphadenopathy: formData.lymphadenopathy || undefined,
        cyanosis: formData.cyanosis || undefined,
        systematicExam: formData.systematicExam || undefined,
        skinDiseaseFreeAtPhlebotomy: formData.skinDiseaseFreeAtPhlebotomy || undefined,
        armsFreeFromPunctureScars: formData.armsFreeFromPunctureScars || undefined,
        volumeGmMl: formData.volumeGmMl ? Number.parseFloat(formData.volumeGmMl) : undefined,
      },
      // Blood collection checklist
      bloodCollection: {
        emptyBagExamined: !!formData.emptyBagExamined,
        collectedWithin6to8Min: !!formData.collectedWithin6to8Min,
        crossCheckingDone: !!formData.crossCheckingDone,
      },
      // Donor fitness
      donorFitness: {
        isFit: formData.donorIsFit,
        rejectionReason: formData.donorIsFit === false ? formData.rejectionReason : undefined,
      },
      // Medical questions
      medicalQuestions,
      bloodGroup: formData.bloodGroup,
      rh: formData.rh,
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
    setShowSuccess(false)
    setSavedDonation(null)
    setFieldErrors({})
    setCurrentStep(1)
    setStepperKey((prev) => prev + 1)

    setFormData(() => {
      const base = {
        ...INITIAL_FORM_DATA,
        collectionDate: new Date().toISOString().split("T")[0],
        collectionTime: new Date().toTimeString().slice(0, 5)
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
    setShowSuccess(false)
    navigate(campId ? `/donor/create-donor?campId=${campId}` : "/donor/create-donor")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
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
              loading={loading}
              error={error}
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

          {/* Step 3: Medical History Questions */}
          <Step>
            <MedicalQuestionsStep
              formData={formData}
              onFieldChange={handleFormFieldChange}
            />
          </Step>

          {/* Step 4: Medical Examination Details */}
          <Step>
            <InitialVitalsStep
              formData={formData}
              fieldErrors={fieldErrors}
              onFieldChange={handleFormFieldChange}
            />
          </Step>

          {/* Step 5: Blood Collection */}
          <Step>
            <BloodCollectionStep
              formData={formData}
              onFieldChange={handleFormFieldChange}
            />
          </Step>

          {/* Step 6: Donor Fitness */}
          <Step>
            <DonorFitnessStep
              formData={formData}
              fieldErrors={fieldErrors}
              onFieldChange={handleFormFieldChange}
            />
          </Step>

          {/* Step 7: Blood Group Information */}
          <Step>
            <BloodGroupStep
              formData={formData}
              fieldErrors={fieldErrors}
              donor={donor}
              onFieldChange={handleFormFieldChange}
            />
          </Step>

          {/* Step 8: Review & Submit */}
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

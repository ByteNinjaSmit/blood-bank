import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import axios from "axios";
import {
  Droplets,
  User,
  Heart,
  Activity,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  Search,
  ChevronDown,
  Save,
  Loader2
} from "lucide-react";
import { states } from "@/constants/states";
import { useBagStockList } from "../../bag-procurement/queries";

const DEFERRAL_REASONS = [
  // --- Vitals & Standard Criteria ---
  { reason: "Low Haemoglobin (< 12.5 gm/dL)", days: 30, type: "TEMPORARY" },
  { reason: "Underweight (< 45 kg)", days: 90, type: "TEMPORARY" },
  { reason: "High Blood Pressure (> 180/100 mmHg)", days: 7, type: "TEMPORARY" },
  { reason: "Low Blood Pressure (< 100/50 mmHg)", days: 7, type: "TEMPORARY" },
  { reason: "High Temperature / Fever", days: 14, type: "TEMPORARY" },
  { reason: "Recent Alcohol Consumption (< 24 hours)", days: 1, type: "TEMPORARY" },

  // --- User-Requested Deferral Reasons ---
  { reason: "Pregnancy / Recently delivered", days: 365, type: "TEMPORARY" },
  { reason: "Abortion", days: 180, type: "TEMPORARY" },
  { reason: "Breastfeeding", days: 365, type: "TEMPORARY" },
  { reason: "Menstruation", days: 7, type: "TEMPORARY" },
  { reason: "Fever with joint pain/rash/petechiae (unspecified diagnosis)", days: 28, type: "TEMPORARY" },
  { reason: "Minor non-specific illness (fever, malaise, headache, pain)", days: 7, type: "TEMPORARY" },
  { reason: "Cold, flu, cough, sore throat, acute sinusitis", days: 7, type: "TEMPORARY" },
  { reason: "Asthma exacerbation or oral/injectable steroids", days: 14, type: "TEMPORARY" },
  { reason: "Major surgery", days: 365, type: "TEMPORARY" },
  { reason: "Minor surgery", days: 90, type: "TEMPORARY" },
  { reason: "Blood transfusion received", days: 365, type: "TEMPORARY" },
  { reason: "Dental scaling/filling", days: 2, type: "TEMPORARY" },
  { reason: "Root canal / extraction", days: 14, type: "TEMPORARY" },
  { reason: "Bone graft / dental reconstruction", days: 365, type: "TEMPORARY" },
  { reason: "Diabetes medication dose altered", days: 28, type: "TEMPORARY" },
  { reason: "Hepatitis A or E", days: 365, type: "TEMPORARY" },
  { reason: "Tattoo, acupuncture, body piercing, scarification, invasive cosmetic procedure (self or spouse/partner)", days: 365, type: "TEMPORARY" },
  { reason: "Spouse/partner received blood transfusion", days: 365, type: "TEMPORARY" },
  { reason: "Measles, Mumps, Chickenpox", days: 14, type: "TEMPORARY" },
  { reason: "Malaria", days: 90, type: "TEMPORARY" },
  { reason: "Typhoid", days: 365, type: "TEMPORARY" },
  { reason: "Dengue / Chikungunya / Zika infection", days: 180, type: "TEMPORARY" },
  { reason: "Travel to Zika outbreak area", days: 28, type: "TEMPORARY" },
  { reason: "Tuberculosis", days: 730, type: "TEMPORARY" },
  { reason: "Conjunctivitis", days: 7, type: "TEMPORARY" },
  { reason: "Osteomyelitis", days: 730, type: "TEMPORARY" },
  { reason: "Acute kidney infection (Pyelonephritis)", days: 180, type: "TEMPORARY" },
  { reason: "UTI / Acute cystitis", days: 14, type: "TEMPORARY" },
  { reason: "Diarrhea (especially with fever)", days: 14, type: "TEMPORARY" },
  { reason: "GI Endoscopy (no biopsy/sample)", days: 7, type: "TEMPORARY" },
  { reason: "GI Endoscopy with benign biopsy result", days: 28, type: "TEMPORARY" },
  { reason: "GI Endoscopy with other conditions (e.g., H. pylori)", days: 30, type: "TEMPORARY" },
  { reason: "Allergy requiring oral/injectable steroids", days: 28, type: "TEMPORARY" },
  { reason: "Non-live vaccines (Typhoid, Cholera, HPV, Influenza, Pneumococcal, Injectable Polio, Diphtheria, Tetanus, COVID-19 non-live, Swine Flu etc.)", days: 14, type: "TEMPORARY" },
  { reason: "Live vaccines (Oral Polio, MMR, Yellow Fever, JE, Live COVID-19 etc.)", days: 28, type: "TEMPORARY" },
  { reason: "Anti-tetanus serum / Anti-venom / Anti-diphtheria serum / Anti-gas gangrene serum", days: 28, type: "TEMPORARY" },
  { reason: "Anti-rabies vaccination after animal bite", days: 365, type: "TEMPORARY" },
  { reason: "Hepatitis B Immunoglobulin / Immunoglobulins", days: 365, type: "TEMPORARY" },
  { reason: "Aspirin / NSAIDs (for platelet donation)", days: 3, type: "TEMPORARY" },
  { reason: "Ketoconazole / Antihelminthics (Mebendazole etc.)", days: 7, type: "TEMPORARY" },
  { reason: "Antibiotics", days: 14, type: "TEMPORARY" },
  { reason: "Ticlopidine / Clopidogrel", days: 14, type: "TEMPORARY" },
  { reason: "Piroxicam / Dipyridamole", days: 14, type: "TEMPORARY" },
  { reason: "Isotretinoin", days: 30, type: "TEMPORARY" },
  { reason: "Finasteride", days: 30, type: "TEMPORARY" },
  { reason: "Radioactive contrast (non-malignant condition)", days: 180, type: "TEMPORARY" },
  { reason: "Dutasteride", days: 180, type: "TEMPORARY" },
  { reason: "Unknown medication", days: 30, type: "TEMPORARY" },
  { reason: "Hair transplant / PRP therapy / Skin grafting", days: 180, type: "TEMPORARY" },

  // --- Permanent Deferrals & Others ---
  { reason: "Cardiac conditions / Major heart disease", days: 0, type: "PERMANENT" },
  { reason: "Cancer / Active malignancy", days: 0, type: "PERMANENT" },
  { reason: "Active Jaundice or Hepatitis contact", days: 365, type: "TEMPORARY" },
  { reason: "Recent Travel to Malaria Endemic Area", days: 90, type: "TEMPORARY" },
  { reason: "Other Medical Contraindication", days: 30, type: "TEMPORARY" }
];

const QUESTIONS = [
  { key: "q1", text: "1. Have you ever been advised not to donate blood by your treating doctor?" },
  { key: "q2", text: "2. Is your age between 18 to 65 years and if above 60 are you donating for the first time?" },
  { key: "q3", text: "3. Are you in good health and mentally alert and prepared for blood donation?" },
  { key: "q4", text: "4. In the last 3 months (male) or 4 months (female) have you donated blood and in the last 28 days have you donated platelets by apheresis with complete reinfusion of red cells or was reinfusion incomplete?" },
  { key: "q5", text: "5. Have you had any illness or trouble during previous blood donation or after blood donation?" },
  { key: "q6", text: "6. Did you have sound sleep the prior night and do you have night shift duty, strenuous duty, long distance driving, emergency service duty, air crew member duty or above/below sea level duty in the next 24 hours after blood donation?" },
  { key: "q7", text: "7. Have you taken food in the last 4 hours before blood donation?" },
  { key: "q8", text: "8. Are you taking any medication and if so have you shared details with the doctor or staff?" },
  { key: "q9", text: "9. In the last 1 year have you donated for bone marrow harvesting or within 6 months donated for stem cell harvesting?" },
  { key: "q10", text: "10. Are you suffering from respiratory infection, cold, flu, cough, sore throat, sinusitis, fever or conjunctivitis?" },
  { key: "q11", text: "11. In the last 24 hours have you taken alcohol?" },
  { key: "q12", text: "12. In the last 3 days have you taken Aspirin or NSAID tablets?" },
  { key: "q13", text: "13. In the last 7 days have you taken drugs for de-worming or fungal infection like Albendazole, Mebendazole or Ketoconazole?" },
  { key: "q14", text: "14. In the last 15 days are you taking any antibiotics or medicines like Ticlopidine, Clopidogrel, Piroxicam, Dipiridamole or have you suffered from UTI, cystitis, swine flu or diarrhoea infection?" },
  { key: "q15", text: "15. In the last one month are you taking treatment for acne such as Etretinate, Acitretin or Isotretinoin, have you visited an endemic area for Dengue or Chikungunya, are you taking Finasteride for prostate or have you taken Dutasteride in the last 6 months?" },
  { key: "q16", text: "16. Have you had any exposure or consumed radioactive contrast material for diagnosis in the last 2 months?" },
  { key: "q17", text: "17. Have you suffered from malaria in the last 3 months or in the last 3 years if you stayed in a non-endemic area?" },
  { key: "q18", text: "18. Have you suffered from Zika virus or West Nile virus or visited an endemic area in the last 4 months?" },
  { key: "q19", text: "19. In the last 6 months have you had minor surgery, tooth extraction, dental surgery under anesthesia, dengue or chikungunya infection, acute nephritis, acute cystitis/UTI or treatment for prostate?" },
  { key: "q20", text: "20. Within the last 12 months have you had major surgery, anti-rabies vaccine, typhoid infection, GI endoscopy, hepatitis B vaccine, received blood or blood products, known hepatitis A or E, close contact with an individual suffering from hepatitis, tattoo, acupuncture, body piercing or cosmetic procedure?" },
  { key: "q21", text: "21. Have you had an inoculation of non-live or toxoid vaccination in the last 15 days such as typhoid, cholera, papillomavirus, influenza, meningococcal, polio injectable, whooping cough, pneumococcal, tetanus, plague or diphtheria?" },
  { key: "q22", text: "22. Have you had an inoculation of live attenuated vaccination in the last 28 days such as oral polio, measles (rubella), mumps, yellow fever, Japanese encephalitis, influenza, typhoid, cholera, hepatitis A, anti-tetanus serum, anti-venom serum, anti-diphtheria serum or anti-gas gangrene serum?" },
  { key: "q23", text: "23. Have you been told that you are tested positive for Hepatitis B, Hepatitis C or HIV, are you in close contact with an individual suffering from hepatitis, or have you had sexual contact with individuals at high risk of HIV infection including multiple sexual partners, cohabitation with HIV positive person, prostitution, non-prescribed injection drug use, hemophilia, homosexuality, hepatitis, living with HBsAg positive or hepatitis C?" },
  { key: "q24", text: "24. Have you been imprisoned for any cause?" },
  { key: "q25", text: "25. Do you have abnormal bleeding tendencies, asthma, blood cancer, leukemia, cancer, diabetes, open heart surgery, chest pain, shortness of breath, swelling of feet, heart attack, cardiac treatment, coronary artery disease, angina pectoris, rheumatic heart disease, convulsions or epilepsy, schizophrenia, thyroid or endocrine disorder, high risk symptoms of AIDS, known hepatitis B or C, HIV positive status of self or spouse/partner, liver disease, syphilis, gonorrhea, leishmania, leprosy, chronic kidney disease, renal failure, stomach ulcer with symptoms or recurrent bleeding, autoimmune disorders, rheumatoid arthritis, polycythemia vera, severe allergic disorders, hemoglobinopathies, red cell enzyme deficiency, diabetes on insulin, organ/stem cell/tissue transplant, unexplained faint with injury or two consecutive fainting episodes after blood donation, babesiosis, chagas disease, tuberculosis, stroke, high blood pressure, coronary heart disease, sickle cell disease, are you taking anticonvulsants, heparin, antithyroid, cancer or heart medicines, immunosuppressives, vasodilators, do you have ankylosing spondylitis, regular alcohol consumption or osteomyelitis?" },
  { key: "q26", text: "26. Are you a resident of another country with stay in India for 3 continuous years?" },
  { key: "q27", text: "27. For females only: Are you currently menstruating, pregnant, delivered in last 12 months, breastfeeding or had abortion in last 6 months?" },
  { key: "q28", text: "28. Have you or any family member or colleagues visited any foreign country in the past 28 days?" },
  { key: "q29", text: "29. Have you, your family members, colleagues or friends had cough, cold or fever in the past 28 days?" },
  { key: "q30", text: "30. Have you read and understood the above information?" },
  { key: "q31", text: "31. Have you given answers to all questions truthfully?" },
  { key: "q32", text: "32. Will you avoid consuming tobacco, gutkha, cigarette, bidi or alcohol for minimum 6 hours before and after blood donation?" },
  { key: "q33", text: "33. Will you wear comfortable clothes, take sufficient sleep, drink plenty of water before and after donation, take light breakfast and not donate on empty stomach?" },
  { key: "q34", text: "34. Have you followed all government guidelines for Corona such as social distancing and sanitization?" },
  { key: "q35", text: "35. Have you voluntarily come for blood donation?" },
  { key: "q36", text: "36. If within 14 days after blood donation you develop symptoms of Corona or test positive, will you communicate to the blood center?" }
];

const INITIAL_FORM_DATA = {
  // Step 1: Donor Profile
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  dobDisplay: "",
  age: "",
  sex: "",
  phone: "",
  email: "",
  weightKg: "",
  bloodGroup: "",
  rh: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  occupation: "",
  lastDonationDate: "",
  lastDonationDateDisplay: "",

  // Step 2: Medical Questions (q1-q36)
  q1: "No", q2: "Yes", q3: "Yes", q4: "No", q5: "No", q6: "Yes", q7: "Yes", q8: "No", q9: "No", q10: "No",
  q11: "No", q12: "No", q13: "No", q14: "No", q15: "No", q16: "No", q17: "No", q18: "No", q19: "No", q20: "No",
  q21: "No", q22: "No", q23: "No", q24: "No", q25: "No", q26: "No", q27: "No", q28: "No", q29: "No", q30: "Yes",
  q31: "Yes", q32: "Yes", q33: "Yes", q34: "Yes", q35: "Yes", q36: "Yes",

  // Step 3: Medical Exam & Fitness
  hb: "",
  tempC: "",
  pulse: "",
  bp: "",
  pedalOedema: "",
  o2Level: "",
  lymphadenopathy: "",
  cyanosis: "",
  systematicExam: "Normal",
  skinDiseaseFreeAtPhlebotomy: "Yes",
  armsFreeFromPunctureScars: "Yes",
  volumeGmMl: "350",
  donorIsFit: true,
  deferralReasonObj: null,

  // Step 4: Bag Information
  bagNo: "",
  segmentNo: "",
  lotNo: "",
  typeOfBag: "", // Unselected
  collectionDate: new Date().toISOString().split("T")[0],
  collectionTime: new Date().toTimeString().slice(0, 5),
  donationType: "", // Unselected
  totalDonationCount: "",
  emergencyDonationWillingness: "",

  // Step 5: Checklist
  emptyBagExamined: false,
  collectedWithin6to8Min: false,
  crossCheckingDone: false,
};

export default function DonorCreation() {
  const navigate = useNavigate();
  const { API, authorizationToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasonSearch, setReasonSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: stockData } = useBagStockList({});
  const stocks = stockData?.items ?? stockData?.bagStocks ?? (Array.isArray(stockData) ? stockData : []);

  const selectedBagType = formData.typeOfBag === 'DB' ? 'DOUBLE' : formData.typeOfBag === 'TB' ? 'TRIPLE' : null;
  const activeBatches = stocks.filter((s) => {
    const closing = (s.openingStock ?? 0) + (s.receivedQty ?? 0) - (s.issuedQty ?? 0) - (s.damagedQty ?? 0) - (s.discardedQty ?? 0);
    return s.bagType === selectedBagType &&
           s.status === 'AVAILABLE' &&
           closing > (s.unopenedBoxes ?? 0) * 45;
  });

  const handleFormFieldChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // 1. Determine if any medical history question is unhealthy
      const questionReason = getUnhealthyQuestionReason(updated);

      // 2. Determine if Hb is invalid (< 12.5)
      let isHbInvalid = false;
      let hbReason = null;
      if (updated.hb !== "") {
        const hbVal = parseFloat(updated.hb);
        if (!isNaN(hbVal) && hbVal < 12.5) {
          isHbInvalid = true;
          hbReason = DEFERRAL_REASONS.find((r) => r.reason.toLowerCase().includes("haemoglobin"))
            || { reason: "Low Haemoglobin (< 12.5 gm/dL)", days: 30, type: "TEMPORARY" };
        }
      }

      // 3. Set fit status and reason based on these checks
      if (questionReason) {
        updated.donorIsFit = false;
        updated.deferralReasonObj = questionReason;
      } else if (isHbInvalid) {
        updated.donorIsFit = false;
        updated.deferralReasonObj = hbReason;
      } else {
        // If neither check is active, see if we need to auto-recover from a previous forced unfit status
        const wasForced = prev.deferralReasonObj && (
          prev.deferralReasonObj.reason.startsWith("Unfit due to Medical Question") ||
          prev.deferralReasonObj.reason.toLowerCase().includes("haemoglobin")
        );
        if (wasForced) {
          updated.donorIsFit = true;
          updated.deferralReasonObj = null;
        }
      }

      return updated;
    });
  };

  const calculateAgeFromDob = (dobStr) => {
    if (!dobStr) return "";
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 0 ? String(age) : "";
  };

  const handleDobDisplayChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 8);
    let display = val;
    if (val.length > 4) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
    } else if (val.length > 2) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    
    handleFormFieldChange("dobDisplay", display);
    
    if (val.length === 8) {
      const d = val.slice(0, 2);
      const m = val.slice(2, 4);
      const y = val.slice(4, 8);
      const isoDob = `${y}-${m}-${d}`;
      const calculatedAge = calculateAgeFromDob(isoDob);
      setFormData((prev) => ({
        ...prev,
        dobDisplay: display,
        dob: isoDob,
        age: calculatedAge,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        dobDisplay: display,
        dob: "",
        age: "",
      }));
    }
  };

  const handleLastDonationDateDisplayChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 8);
    let display = val;
    if (val.length > 4) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
    } else if (val.length > 2) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    
    handleFormFieldChange("lastDonationDateDisplay", display);
    
    if (val.length === 8) {
      const d = val.slice(0, 2);
      const m = val.slice(2, 4);
      const y = val.slice(4, 8);
      handleFormFieldChange("lastDonationDate", `${y}-${m}-${d}`);
    } else {
      handleFormFieldChange("lastDonationDate", "");
    }
  };

  const validateDate = (value) => {
    if (!value) return false;
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(value)) return false;

    const parts = value.match(regex);
    const d = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const y = parseInt(parts[3], 10);

    if (m < 1 || m > 12) return false;
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < 1 || d > daysInMonth) return false;

    const inputDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate > today) return false;

    return true;
  };

  const getUnhealthyQuestionReason = (data) => {
    const yesRequired = ["q2", "q3", "q6", "q7", "q30", "q31", "q32", "q33", "q34", "q35", "q36"];
    for (let i = 1; i <= 36; i++) {
      const key = `q${i}`;
      const val = data[key];
      const qText = QUESTIONS.find((q) => q.key === key)?.text || `Question ${i}`;
      
      let isUnhealthy = false;
      if (yesRequired.includes(key)) {
        if (val === "No") isUnhealthy = true;
      } else {
        if (val === "Yes") isUnhealthy = true;
      }

      if (isUnhealthy) {
        const isPermanent = key === "q23" || key === "q25";
        return {
          reason: `Unfit due to Medical Question: ${qText}`,
          days: isPermanent ? 0 : 30,
          type: isPermanent ? "PERMANENT" : "TEMPORARY"
        };
      }
    }
    return null;
  };

  const isStep1Complete = () => {
    const isBaseComplete =
      formData.firstName.trim() &&
      formData.middleName.trim() &&
      formData.lastName.trim() &&
      validateDate(formData.dobDisplay) &&
      formData.sex &&
      formData.phone.trim().length === 10 &&
      parseFloat(formData.weightKg) > 0 &&
      formData.city.trim() &&
      formData.district.trim() &&
      formData.state &&
      formData.bloodGroup &&
      formData.rh;

    if (!isBaseComplete) return false;

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) return false;
    if (formData.lastDonationDateDisplay && !validateDate(formData.lastDonationDateDisplay)) return false;

    return true;
  };

  const isStep2Complete = () => true;

  const isStep3Complete = () => true;

  const isStep4Complete = () => {
    return (
      formData.bagNo.trim() &&
      formData.segmentNo.trim() &&
      formData.lotNo.trim() &&
      formData.typeOfBag &&
      formData.donationType &&
      formData.collectionDate &&
      formData.collectionTime
    );
  };

  const isStepComplete = () => {
    if (currentStep === 1) return isStep1Complete();
    if (currentStep === 2) return isStep2Complete();
    if (currentStep === 3) return isStep3Complete();
    if (currentStep === 4) return isStep4Complete();
    if (currentStep === 5) return true;
    return true;
  };

  const calculateUntilDate = (days) => {
    if (days === 0) return null; // permanent
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const generatedId = `DFR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const donorPayload = {
        donorId: formData.donorIsFit ? `DON-${Date.now()}` : generatedId,
        name: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
        },
        dob: new Date(formData.dob).toISOString(),
        sex: formData.sex,
        phone: formData.phone,
        email: formData.email || undefined,
        weightKg: Number(formData.weightKg),
        bloodGroup: formData.bloodGroup,
        rh: formData.rh,
        address: {
          line1: formData.addressLine1 || "",
          line2: formData.addressLine2 || "",
          city: formData.city,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode || "",
        },
        eligibilityStatus: formData.donorIsFit ? "eligible" : (formData.deferralReasonObj?.days === 0 ? "deferred" : "temp-deferred"),
        occupation: formData.occupation || undefined,
        lastDonationDate: formData.lastDonationDate ? new Date(formData.lastDonationDate).toISOString() : undefined,
      };

      const donorRes = await axios.post(`${API}/api/v2/donor`, donorPayload, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });

      const registeredDonor = donorRes.data?.data || donorRes.data?.donor;
      const registeredDonorId = registeredDonor?._id || registeredDonor?.id;

      if (!registeredDonorId) {
        throw new Error("Failed to resolve registered donor profile database ID.");
      }

      if (!formData.donorIsFit) {
        const reasonObj = formData.deferralReasonObj || { reason: "Unfit / Deferred", days: 30, type: "TEMPORARY" };
        
        const deferralPayload = {
          donor: registeredDonorId,
          type: reasonObj.days === 0 ? "PERMANENT" : "TEMPORARY",
          reason: reasonObj.reason,
          untilDate: reasonObj.days > 0 ? calculateUntilDate(reasonObj.days) : undefined,
          source: "VITALS",
        };

        await axios.post(`${API}/api/v2/deferral`, deferralPayload, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });

        const medicalQuestions = {};
        QUESTIONS.forEach((q) => {
          medicalQuestions[q.key] = formData[q.key];
        });

        const unfitDonationPayload = {
          donor: registeredDonorId,
          donationType: formData.donationType,
          collectedAt: new Date(formData.collectionDate).toISOString(),
          donorFitness: {
            isFit: false,
            rejectionReason: reasonObj.reason,
          },
          medicalExam: {
            weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
            hbGdl: formData.hb ? Number(formData.hb) : undefined,
            pulseBpm: formData.pulse ? Number(formData.pulse) : undefined,
            temperatureCelsius: formData.tempC ? Number(formData.tempC) : undefined,
            bloodPressure: formData.bp?.trim() && formData.bp.includes("/") ? {
              systolic: Number(formData.bp.split("/")[0]),
              diastolic: Number(formData.bp.split("/")[1]),
            } : undefined,
            hasPedalOedema: formData.pedalOedema ? formData.pedalOedema === "Yes" : undefined,
            oxygenSaturationPercent: formData.o2Level ? Number(formData.o2Level) : undefined,
            hasLymphadenopathy: formData.lymphadenopathy ? formData.lymphadenopathy === "Yes" : undefined,
            hasCyanosis: formData.cyanosis ? formData.cyanosis === "Yes" : undefined,
            systemicExamNotes: formData.systematicExam || undefined,
            skinClearAtPhlebotomy: formData.skinDiseaseFreeAtPhlebotomy ? formData.skinDiseaseFreeAtPhlebotomy === "Yes" : undefined,
            armsFreeOfPunctureScars: formData.armsFreeFromPunctureScars ? formData.armsFreeFromPunctureScars === "Yes" : undefined,
          },
          medicalQuestions,
          bloodGroup: formData.bloodGroup,
          rhFactor: formData.rh === "Positive" ? "POSITIVE" : "NEGATIVE",
        };

        await axios.post(`${API}/api/v2/donation`, unfitDonationPayload, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });

        toast.success(`Donor successfully registered and deferred for ${reasonObj.days === 0 ? "indefinite" : `${reasonObj.days} days`}`);
        navigate("/master-register/donors");
      } else {
        const medicalQuestions = {};
        QUESTIONS.forEach((q) => {
          medicalQuestions[q.key] = formData[q.key];
        });

        const collectionDateTimeStr = `${formData.collectionDate}T${formData.collectionTime}:00`;

        const donationPayload = {
          donor: registeredDonorId,
          donationType: formData.donationType,
          collectedAt: new Date(collectionDateTimeStr).toISOString(),
          campId: null,
          medicalExam: {
            weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
            hbGdl: formData.hb ? Number(formData.hb) : undefined,
            pulseBpm: formData.pulse ? Number(formData.pulse) : undefined,
            temperatureCelsius: formData.tempC ? Number(formData.tempC) : undefined,
            bloodPressure: formData.bp?.trim() && formData.bp.includes("/") ? {
              systolic: Number(formData.bp.split("/")[0]),
              diastolic: Number(formData.bp.split("/")[1]),
            } : undefined,
            hasPedalOedema: formData.pedalOedema ? formData.pedalOedema === "Yes" : undefined,
            oxygenSaturationPercent: formData.o2Level ? Number(formData.o2Level) : undefined,
            hasLymphadenopathy: formData.lymphadenopathy ? formData.lymphadenopathy === "Yes" : undefined,
            hasCyanosis: formData.cyanosis ? formData.cyanosis === "Yes" : undefined,
            systemicExamNotes: formData.systematicExam || undefined,
            skinClearAtPhlebotomy: formData.skinDiseaseFreeAtPhlebotomy ? formData.skinDiseaseFreeAtPhlebotomy === "Yes" : undefined,
            armsFreeOfPunctureScars: formData.armsFreeFromPunctureScars ? formData.armsFreeFromPunctureScars === "Yes" : undefined,
            volumeMl: formData.volumeGmMl ? Number(formData.volumeGmMl) : undefined,
          },
          bloodCollection: {
            emptyBagExamined: !!formData.emptyBagExamined,
            collectedWithin6to8Min: !!formData.collectedWithin6to8Min,
            crossCheckingDone: !!formData.crossCheckingDone,
          },
          donorFitness: {
            isFit: true,
          },
          medicalQuestions,
          bloodGroup: formData.bloodGroup,
          rhFactor: formData.rh === "Positive" ? "POSITIVE" : "NEGATIVE",
          typeOfBag: formData.typeOfBag,
          bagNo: formData.bagNo,
          segmentNo: formData.segmentNo,
          lotNo: formData.lotNo,
        };

        await axios.post(`${API}/api/v2/donation`, donationPayload, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });

        toast.success("Donor registered and fit donation saved successfully");
        navigate("/master-register/donations");
      }
    } catch (err) {
      const details = err.response?.data?.details;
      if (Array.isArray(details)) {
        const errorMsg = details.map((d) => `${d.path?.join(".")}: ${d.message}`).join(" | ");
        toast.error(`Validation Error: ${errorMsg}`);
      } else {
        toast.error(err.response?.data?.message || err.message || "An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      const questionReason = getUnhealthyQuestionReason(formData);
      if (questionReason) {
        setFormData((prev) => ({
          ...prev,
          donorIsFit: false,
          deferralReasonObj: questionReason
        }));
      } else {
        if (formData.deferralReasonObj && formData.deferralReasonObj.reason.startsWith("Unfit due to Medical Question")) {
          setFormData((prev) => ({
            ...prev,
            donorIsFit: true,
            deferralReasonObj: null
          }));
        }
      }
      setCurrentStep(3);
    } else if (currentStep === 3 && !formData.donorIsFit) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const filteredReasons = DEFERRAL_REASONS.filter((r) =>
    r.reason.toLowerCase().includes(reasonSearch.toLowerCase())
  );

  const answeredCount = Array.from({ length: 36 }, (_, i) => `q${i + 1}`).filter(
    (k) => formData[k] === "Yes" || formData[k] === "No"
  ).length;

  const isHbTooLow = formData.hb && parseFloat(formData.hb) < 12.5;
  const isQuestionUnfit = formData.deferralReasonObj && formData.deferralReasonObj.reason.startsWith("Unfit due to Medical Question");
  const isFitnessForcedUnfit = isHbTooLow || isQuestionUnfit;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-800 rounded-lg text-white">
              <Droplets className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Donor Creation & Register</h1>
              <p className="text-gray-500 text-sm">Unified registration, medical exam, fitness, and bag collection checks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Status Indicator Bar (6 Steps) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white p-6 rounded-3xl border border-red-200 flex justify-between items-center shadow-md">
          {[
            { step: 1, label: "Donor Profile" },
            { step: 2, label: "Medical History" },
            { step: 3, label: "Exam & Fitness" },
            { step: 4, label: "Bag Info" },
            { step: 5, label: "QA Checklist" },
            { step: 6, label: "Review & Save" }
          ].map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isActive = currentStep === s.step;
            return (
              <React.Fragment key={s.step}>
                <div className="flex flex-col items-center gap-1.5 flex-1 relative animate-fadeIn">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                      isCompleted
                        ? "bg-red-800 text-white shadow"
                        : isActive
                        ? "bg-red-800 text-white shadow-lg scale-110"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    ) : (
                      s.step
                    )}
                  </div>
                  <span
                    className={`text-2xs font-semibold uppercase tracking-wider hidden sm:block ${
                      isActive ? "text-red-800 font-bold" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 5 && (
                  <div className="relative mx-2 h-1 flex-1 overflow-hidden rounded bg-gray-200">
                    <div
                      className="absolute left-0 top-0 h-full bg-red-800 transition-all duration-500"
                      style={{ width: currentStep > s.step ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content Form Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow overflow-hidden">
          
          {/* Step 1: Donor Profile */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-800" />
                  Donor Profile Registration
                </h2>
                <p className="text-sm text-gray-500 mt-1">Provide full donor registration information. All fields marked * are required.</p>
              </div>

              {/* Personal Details */}
              <div className="bg-white rounded-lg border border-orange-200 p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-1">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleFormFieldChange("firstName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleFormFieldChange("middleName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleFormFieldChange("lastName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={formData.dobDisplay}
                      onChange={handleDobDisplayChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                      required
                    />
                    {formData.age && (
                      <p className="text-xs text-gray-500 mt-1 font-medium text-emerald-800">Age: {formData.age} years</p>
                    )}
                    {formData.dobDisplay && !validateDate(formData.dobDisplay) && (
                      <p className="text-xs text-red-655 mt-1 font-semibold">Enter a valid date of birth (DD/MM/YYYY)</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sex <span className="text-red-500">*</span></label>
                    <select
                      value={formData.sex}
                      onChange={(e) => handleFormFieldChange("sex", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                      required
                    >
                      <option value="">Select</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Kg) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={formData.weightKg}
                      onChange={(e) => handleFormFieldChange("weightKg", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleFormFieldChange("occupation", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg border border-orange-200 p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-1">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (10 Digits) <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => handleFormFieldChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                      required
                    />
                    {formData.phone && formData.phone.length !== 10 && (
                      <p className="text-xs text-red-655 mt-1 font-semibold">Phone must be exactly 10 digits</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormFieldChange("email", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.addressLine1}
                      onChange={(e) => handleFormFieldChange("addressLine1", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={formData.addressLine2}
                      onChange={(e) => handleFormFieldChange("addressLine2", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleFormFieldChange("city", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => handleFormFieldChange("district", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleFormFieldChange("state", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                      required
                    >
                      <option value="">Select</option>
                      {states.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleFormFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    />
                    {formData.pincode && formData.pincode.length !== 6 && (
                      <p className="text-xs text-red-655 mt-1 font-semibold">Pincode must be exactly 6 digits</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-white rounded-lg border border-orange-200 p-6 space-y-4 shadow-sm">
                <h3 className="text-md font-semibold text-gray-900 border-b pb-1">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group <span className="text-red-500">*</span></label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => handleFormFieldChange("bloodGroup", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rh Factor <span className="text-red-500">*</span></label>
                    <select
                      value={formData.rh}
                      onChange={(e) => handleFormFieldChange("rh", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Positive">Positive (+)</option>
                      <option value="Negative">Negative (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Date</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={formData.lastDonationDateDisplay}
                      onChange={handleLastDonationDateDisplayChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    />
                    {formData.lastDonationDateDisplay && !validateDate(formData.lastDonationDateDisplay) && (
                      <p className="text-xs text-red-655 mt-1 font-semibold">Enter a valid past date (DD/MM/YYYY)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medical History Questions */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-8 animate-fadeIn">
              <h3 className="font-semibold text-gray-800 mb-1 text-lg">Medical History Questions</h3>
              <p className="text-sm text-gray-500 mb-4">Please answer all questions truthfully. Select Yes or No for each.</p>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {QUESTIONS.map(({ key, text }) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-100/60 transition-colors animate-fadeIn">
                    <p className="text-sm text-gray-800 leading-relaxed max-w-3xl">{text}</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="radio"
                          name={`mq_${key}`}
                          value="Yes"
                          checked={formData[key] === "Yes"}
                          onChange={() => handleFormFieldChange(key, "Yes")}
                          className="w-4 h-4 text-red-800 focus:ring-red-800 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-750">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="radio"
                          name={`mq_${key}`}
                          value="No"
                          checked={formData[key] === "No"}
                          onChange={() => handleFormFieldChange(key, "No")}
                          className="w-4 h-4 text-red-800 focus:ring-red-800 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-750">No</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Medical Exam & Fitness (Disables Fit if low Hb or unhealthy medical question response) */}
          {currentStep === 3 && (
            <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1 text-lg">Medical Examination Details</h3>
                <p className="text-sm text-gray-500">Record medical examination details and vitals for the donor (All vitals are optional).</p>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-750 mb-1">Haemoglobin (Hb gm%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 13.5"
                    value={formData.hb}
                    onChange={(e) => handleFormFieldChange("hb", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                  />
                  {isHbTooLow && (
                    <p className="text-xs text-red-655 mt-1 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Hb must be at least 12.5 gm% for donation
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-750 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 36.8"
                    value={formData.tempC}
                    onChange={(e) => handleFormFieldChange("tempC", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-755 mb-1">Pulse Rate (Bpm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    value={formData.pulse}
                    onChange={(e) => handleFormFieldChange("pulse", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-755 mb-1">Blood Pressure (Systolic/Diastolic)</label>
                  <input
                    type="text"
                    placeholder="e.g. 120/80"
                    value={formData.bp}
                    onChange={(e) => handleFormFieldChange("bp", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-755 mb-1">Pedal Oedema</label>
                  <select
                    value={formData.pedalOedema}
                    onChange={(e) => handleFormFieldChange("pedalOedema", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                  >
                    <option value="">Select</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-755 mb-1">Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 98"
                    value={formData.o2Level}
                    onChange={(e) => handleFormFieldChange("o2Level", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-755 mb-1">Lymphadenopathy</label>
                  <select
                    value={formData.lymphadenopathy}
                    onChange={(e) => handleFormFieldChange("lymphadenopathy", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                  >
                    <option value="">Select</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-755 mb-1">Cyanosis</label>
                  <select
                    value={formData.cyanosis}
                    onChange={(e) => handleFormFieldChange("cyanosis", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                  >
                    <option value="">Select</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-755 mb-1">Systematic Exam</label>
                  <select
                    value={formData.systematicExam}
                    onChange={(e) => handleFormFieldChange("systematicExam", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="CVS">CVS Abnormal</option>
                    <option value="RS">RS Abnormal</option>
                    <option value="PA">PA Abnormal</option>
                    <option value="CNS">CNS Abnormal</option>
                    <option value="GIS">GIS Abnormal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-755 mb-1">Volume (mL)</label>
                  <select
                    value={formData.volumeGmMl}
                    onChange={(e) => handleFormFieldChange("volumeGmMl", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                  >
                    <option value="350">350 mL</option>
                    <option value="450">450 mL</option>
                  </select>
                </div>
              </div>

              {/* Physical Screening Check Cards */}
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-800 mb-2 font-medium">1. Is the donor free from skin disease at the sight of phlebotomy?</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="skinDiseaseFreeAtPhlebotomy"
                        value="Yes"
                        checked={formData.skinDiseaseFreeAtPhlebotomy === "Yes"}
                        onChange={() => handleFormFieldChange("skinDiseaseFreeAtPhlebotomy", "Yes")}
                        className="w-4 h-4 text-red-800 focus:ring-red-800"
                      />
                      <span className="text-sm font-medium text-gray-750">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="skinDiseaseFreeAtPhlebotomy"
                        value="No"
                        checked={formData.skinDiseaseFreeAtPhlebotomy === "No"}
                        onChange={() => handleFormFieldChange("skinDiseaseFreeAtPhlebotomy", "No")}
                        className="w-4 h-4 text-red-800 focus:ring-red-800"
                      />
                      <span className="text-sm font-medium text-gray-750">No</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-800 mb-2 font-medium">2. Are the arms and forearms free from skin puncture scars?</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="armsFreeFromPunctureScars"
                        value="Yes"
                        checked={formData.armsFreeFromPunctureScars === "Yes"}
                        onChange={() => handleFormFieldChange("armsFreeFromPunctureScars", "Yes")}
                        className="w-4 h-4 text-red-800 focus:ring-red-800"
                      />
                      <span className="text-sm font-medium text-gray-750">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="armsFreeFromPunctureScars"
                        value="No"
                        checked={formData.armsFreeFromPunctureScars === "No"}
                        onChange={() => handleFormFieldChange("armsFreeFromPunctureScars", "No")}
                        className="w-4 h-4 text-red-800 focus:ring-red-800"
                      />
                      <span className="text-sm font-medium text-gray-750">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Fitness Selector Options */}
              <div className="border-t border-gray-200 pt-5 space-y-4">
                <label className="block text-sm font-bold text-gray-800 mb-2">Fitness Status Determination</label>
                {isQuestionUnfit && (
                  <p className="text-xs text-red-655 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Propagated unfit status due to unhealthy medical history response.
                  </p>
                )}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isFitnessForcedUnfit) {
                        handleFormFieldChange("donorIsFit", true);
                        handleFormFieldChange("deferralReasonObj", null);
                      }
                    }}
                    disabled={isFitnessForcedUnfit}
                    className={`flex-1 py-4 px-5 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                      formData.donorIsFit === true
                        ? "border-green-500 bg-green-50 text-green-800 shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    } ${isFitnessForcedUnfit ? "opacity-45 cursor-not-allowed border-gray-200 bg-gray-55 text-gray-400" : ""}`}
                  >
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Donor is FIT for donation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormFieldChange("donorIsFit", false)}
                    className={`flex-1 py-4 px-5 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                      formData.donorIsFit === false
                        ? "border-red-500 bg-red-50 text-red-800 shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Donor is UNFIT / DEFERRED
                  </button>
                </div>

                {/* Deferral Reason Dropdown Filter (Shown only if unfit) */}
                {formData.donorIsFit === false && (
                  <div className="p-4 bg-red-50/40 border border-red-200 rounded-xl space-y-4 relative">
                    <label className="block text-sm font-semibold text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-650" />
                      Specify Deferral Reason (Search Dropdown)
                    </label>
                    <div className="relative">
                      <div
                        onClick={() => {
                          if (!isFitnessForcedUnfit) {
                            setDropdownOpen(!dropdownOpen);
                          }
                        }}
                        className={`w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white flex items-center justify-between cursor-pointer shadow-sm select-none ${
                          isFitnessForcedUnfit ? "cursor-not-allowed opacity-80" : ""
                        }`}
                      >
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <span className={`text-sm ${formData.deferralReasonObj ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                          {formData.deferralReasonObj
                            ? `${formData.deferralReasonObj.reason} (${formData.deferralReasonObj.days === 0 ? "Permanent" : `${formData.deferralReasonObj.days} Days`})`
                            : "Search and select deferral reason..."}
                        </span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      {dropdownOpen && !isFitnessForcedUnfit && (
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2.5 space-y-2">
                          <input
                            type="text"
                            placeholder="Type to filter reasons..."
                            value={reasonSearch}
                            onChange={(e) => setReasonSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
                            {filteredReasons.map((r, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  handleFormFieldChange("deferralReasonObj", r);
                                  setDropdownOpen(false);
                                  setReasonSearch("");
                                }}
                                className={`p-2.5 rounded-lg text-sm cursor-pointer hover:bg-red-55 hover:text-red-900 flex justify-between items-center transition-colors ${
                                  formData.deferralReasonObj?.reason === r.reason
                                    ? "bg-red-50 text-red-900 font-semibold"
                                    : "text-gray-700"
                                }`}
                              >
                                <span>{r.reason}</span>
                                <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                                  r.days === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-755"
                                }`}>
                                  {r.days === 0 ? "Permanent" : `${r.days} d`}
                                </span>
                              </div>
                            ))}
                            {filteredReasons.length === 0 && (
                              <p className="text-xs text-gray-400 text-center py-2">No matching reasons found.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Bag Info */}
          {currentStep === 4 && (
            <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
              <h3 className="font-semibold text-gray-800 mb-1 text-lg">Bag Information</h3>
              <p className="text-sm text-gray-500">Record blood bag specification and collection details. Bag type and donation type selections are required.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bag Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.bagNo}
                    onChange={(e) => handleFormFieldChange("bagNo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Segment Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.segmentNo}
                    onChange={(e) => handleFormFieldChange("segmentNo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bag Type <span className="text-red-500">*</span></label>
                  <select
                    value={formData.typeOfBag}
                    onChange={(e) => {
                      handleFormFieldChange("typeOfBag", e.target.value);
                      handleFormFieldChange("lotNo", "");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                    required
                  >
                    <option value="">Select Bag Type</option>
                    <option value="DB">Double Bag (DB)</option>
                    <option value="TB">Triple Bag (TB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number <span className="text-red-500">*</span></label>
                  <select
                    value={formData.lotNo}
                    onChange={(e) => handleFormFieldChange("lotNo", e.target.value)}
                    disabled={!formData.typeOfBag}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                    required
                  >
                    <option value="">Select batch...</option>
                    {activeBatches.map((s) => (
                      <option key={s.batchNumber || s.batchNo} value={s.batchNumber || s.batchNo}>
                        {s.batchNumber || s.batchNo} (Exp: {new Date(s.expiryDate).toLocaleDateString('en-IN')})
                      </option>
                    ))}
                  </select>
                  {!formData.typeOfBag && (
                    <p className="text-xs text-gray-500 mt-1">Please select Bag Type first to load active batches.</p>
                  )}
                  {formData.typeOfBag && activeBatches.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No active, opened boxes found for this bag type in inventory.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type <span className="text-red-500">*</span></label>
                  <select
                    value={formData.donationType}
                    onChange={(e) => handleFormFieldChange("donationType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                    required
                  >
                    <option value="">Select Donation Type</option>
                    <option value="WHOLE_BLOOD">Whole Blood (Voluntary)</option>
                    <option value="AUTOLOGOUS">Autologous</option>
                    <option value="DIRECTED">Directed</option>
                    <option value="REPLACEMENT">Replacement</option>
                    <option value="PLATELETPHERESIS">Plateletpheresis</option>
                    <option value="PLASMAPHERESIS">Plasmapheresis</option>
                    <option value="DOUBLE_RED_CELL">Double Red Cell</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How many times donated (including current)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalDonationCount}
                    onChange={(e) => handleFormFieldChange("totalDonationCount", e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Will you donate if we call in emergency?</label>
                  <select
                    value={formData.emergencyDonationWillingness}
                    onChange={(e) => handleFormFieldChange("emergencyDonationWillingness", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                  >
                    <option value="">Select Option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.collectionDate}
                    onChange={(e) => handleFormFieldChange("collectionDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={formData.collectionTime}
                    onChange={(e) => handleFormFieldChange("collectionTime", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: QA Checklist */}
          {currentStep === 5 && (
            <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
              <h3 className="font-semibold text-gray-800 mb-1 text-lg">Quality Assurance Checklist</h3>
              <p className="text-sm text-gray-500">Perform final quality checks on empty bag, collection duration, and labels.</p>

              <div className="border border-green-200 bg-green-50/40 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="space-y-3 text-sm text-gray-800">
                  <label className="flex items-center gap-3.5 cursor-pointer select-none p-3 hover:bg-green-100/20 rounded-xl transition-all">
                    <input
                      type="checkbox"
                      checked={formData.emptyBagExamined}
                      onChange={(e) => handleFormFieldChange("emptyBagExamined", e.target.checked)}
                      className="w-5 h-5 text-green-700 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="font-medium leading-normal">Empty bag examined for cracks, leakage, and expiry</span>
                  </label>
                  <label className="flex items-center gap-3.5 cursor-pointer select-none p-3 hover:bg-green-100/20 rounded-xl transition-all">
                    <input
                      type="checkbox"
                      checked={formData.collectedWithin6to8Min}
                      onChange={(e) => handleFormFieldChange("collectedWithin6to8Min", e.target.checked)}
                      className="w-5 h-5 text-green-700 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="font-medium leading-normal">Blood collected within standard time limits (6-8 minutes)</span>
                  </label>
                  <label className="flex items-center gap-3.5 cursor-pointer select-none p-3 hover:bg-green-100/20 rounded-xl transition-all">
                    <input
                      type="checkbox"
                      checked={formData.crossCheckingDone}
                      onChange={(e) => handleFormFieldChange("crossCheckingDone", e.target.checked)}
                      className="w-5 h-5 text-green-700 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="font-medium leading-normal">Double-check verification performed matching bag label and profile details</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Finalize */}
          {currentStep === 6 && (
            <div className="p-6 sm:p-8 space-y-5 animate-fadeIn">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">Review Donation Details</h3>
              <div className="space-y-4">
                
                {/* Donor Information Card */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Donor Information</h4>
                  <p className="text-sm text-blue-800">
                    <strong>Name:</strong> {[formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ")}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Donor ID:</strong> <span className="italic text-gray-500">To be auto-generated</span>
                  </p>
                </div>

                {/* Bag Information Card */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Bag Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
                    <p><strong>Bag No:</strong> {formData.bagNo}</p>
                    <p><strong>Segment No:</strong> {formData.segmentNo}</p>
                    <p><strong>Lot No:</strong> {formData.lotNo}</p>
                    <p><strong>Type:</strong> {formData.typeOfBag}</p>
                    {formData.collectionDate && (
                      <p><strong>Donation Date:</strong> {new Date(formData.collectionDate).toLocaleDateString()}</p>
                    )}
                    {formData.collectionTime && (
                      <p><strong>Donation Time:</strong> {formData.collectionTime}</p>
                    )}
                    {formData.donationType && (
                      <p><strong>Blood Donation:</strong> {formData.donationType}</p>
                    )}
                    {formData.totalDonationCount && (
                      <p><strong>Total Donations (incl. current):</strong> {formData.totalDonationCount}</p>
                    )}
                    {formData.emergencyDonationWillingness && (
                      <p><strong>Emergency Willingness:</strong> {formData.emergencyDonationWillingness}</p>
                    )}
                  </div>
                </div>

                {/* Medical History Questions Summary */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-900 mb-2">Medical History Questions</h4>
                  <p className="text-sm text-indigo-800 mb-2">
                    <strong>{answeredCount}/36</strong> questions answered
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {QUESTIONS.map(({ key, text }, idx) => {
                      const val = formData[key];
                      if (!val) return null;
                      return (
                        <div key={key} className="flex items-start gap-2 text-xs text-indigo-800">
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-white font-medium ${val === "Yes" ? "bg-green-650" : "bg-red-650"}`}>
                            {val}
                          </span>
                          <span className="leading-relaxed">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Medical Examination Details Card */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">MEDICAL EXAMINATION DETAILS</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-850">
                    <p><strong>Weight:</strong> {formData.weightKg ? `${formData.weightKg} kg` : "N/A"}</p>
                    <p><strong>Haemoglobin:</strong> {formData.hb ? `${formData.hb} gm%` : "N/A"}</p>
                    <p><strong>Temperature:</strong> {formData.tempC ? `${formData.tempC} °C` : "N/A"}</p>
                    <p><strong>Pulse:</strong> {formData.pulse ? `${formData.pulse} /min` : "N/A"}</p>
                    <p><strong>Blood Pressure:</strong> {formData.bp ? `${formData.bp} /mm of Hg` : "N/A"}</p>
                    <p><strong>Pedal Oedema:</strong> {formData.pedalOedema || "N/A"}</p>
                    {formData.o2Level && <p><strong>O2 Level:</strong> {formData.o2Level}%</p>}
                    <p><strong>Lymphadenopathy:</strong> {formData.lymphadenopathy || "N/A"}</p>
                    <p><strong>Cyanosis:</strong> {formData.cyanosis || "N/A"}</p>
                    <p><strong>Systematic Exam:</strong> {formData.systematicExam || "N/A"}</p>
                    <p><strong>Skin Disease Free at Phlebotomy:</strong> {formData.skinDiseaseFreeAtPhlebotomy || "N/A"}</p>
                    <p><strong>Arms Free from Puncture/Scars:</strong> {formData.armsFreeFromPunctureScars || "N/A"}</p>
                    <p><strong>Volume:</strong> {formData.volumeGmMl ? `${formData.volumeGmMl} gm/ml` : "N/A"}</p>
                  </div>
                </div>

                {/* Blood Collection QA Details Card */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Blood Collection</h4>
                  <div className="space-y-1 text-sm text-yellow-800">
                    <p>
                      <strong>Empty bag examined:</strong>{" "}
                      {formData.emptyBagExamined ? "✅ Yes" : "❌ No"}
                    </p>
                    <p>
                      <strong>Collected within 6-8 min:</strong>{" "}
                      {formData.collectedWithin6to8Min ? "✅ Yes" : "❌ No"}
                    </p>
                    <p>
                      <strong>Cross checking done:</strong>{" "}
                      {formData.crossCheckingDone ? "✅ Yes" : "❌ No"}
                    </p>
                  </div>
                </div>

                {/* Fitness Assessment Card */}
                <div className={`p-4 rounded-lg border ${formData.donorIsFit === false ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <h4 className={`font-semibold mb-2 ${formData.donorIsFit === false ? "text-red-900" : "text-emerald-900"}`}>
                    Donor Fitness
                  </h4>
                  <p className={`text-sm ${formData.donorIsFit === false ? "text-red-800" : "text-emerald-800"}`}>
                    <strong>Status:</strong> {formData.donorIsFit === true ? "Donor is fit for donation" : "Donor is unfit for donation"}
                  </p>
                  {formData.donorIsFit === false && formData.deferralReasonObj && (
                    <p className="text-sm text-red-850 mt-1">
                      <strong>Reason for rejection:</strong> {formData.deferralReasonObj.reason}
                    </p>
                  )}
                </div>

                {/* Blood Group Card */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">Blood Group</h4>
                  <p className="text-sm text-orange-850">
                    <strong>Group:</strong> {formData.bloodGroup} {formData.rh}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1 || isSubmitting}
              className="px-5 py-2 border border-gray-305 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-1 bg-white select-none shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={currentStep === 6 ? handleSubmit : handleNext}
              disabled={!isStepComplete() || isSubmitting}
              className={`px-6 py-2 rounded-full text-sm font-semibold text-white transition-all shadow flex items-center gap-1.5 select-none ${
                !isStepComplete() || isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  : currentStep === 3 && !formData.donorIsFit
                  ? "bg-red-800 hover:bg-red-900 active:bg-red-950"
                  : currentStep === 6
                  ? "bg-green-700 hover:bg-green-800 active:bg-green-900"
                  : "bg-red-800 hover:bg-red-900 active:bg-red-950"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === 3 && !formData.donorIsFit ? (
                <>
                  Complete (Defer)
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : currentStep === 6 ? (
                <>
                  Complete
                  <Save className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

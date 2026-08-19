import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { QUESTIONS } from "@/features/donor/donor-constants";
import { calculateUntilDate } from "../donor-creation-utils";
import { campKeys } from "@/features/camp/queries";

// Owns donor search + all donor/deferral/donation persistence for the
// creation wizard. Keeps axios out of the page/step components (CLAUDE.md #1).
export function useDonorSubmit({ form, campId, draftId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { API, authorizationToken } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const { formData, repeatedDonation, selectedDonor } = form;

  useEffect(() => {
    if (repeatedDonation !== "Yes" || !searchQuery.trim()) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");
        const res = await axios.get(`${API}/api/v2/donor/search`, {
          params: { q: searchQuery, limit: 20 },
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        const list = res?.data?.data?.items || res?.data?.data;
        setSearchResults(Array.isArray(list) ? list : []);
      } catch (e) {
        setSearchError(e?.response?.data?.message || "Search failed");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, repeatedDonation, API, authorizationToken]);

  const handleSelectDonor = async (d) => {
    const isDeferred = d.eligibilityStatus === 'deferred' || d.eligibilityStatus === 'temp-deferred';
    const isUnavailable = d.isAvailableToDonate === false;

    if (isDeferred) {
      form.setDeferralModalData({
        fullName: d.fullName,
        eligibilityStatus: d.eligibilityStatus,
        deferralReason: d.deferralReason || "Medical/vitals check or TTI reactive results",
        deferralUntil: d.deferralUntil,
      });
      form.setDeferralModalOpen(true);
      return;
    }

    if (isUnavailable) {
      const lastDate = d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString('en-IN') : "N/A";
      const errorMsg = `${d.fullName} cannot donate yet. Last donation: ${lastDate}. Eligible after ${d.daysUntilEligible} days.`;
      toast.error(errorMsg, { duration: 5000 });
      return;
    }

    try {
      const res = await axios.get(`${API}/api/v2/donor/${d._id}`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      const full = res?.data?.donor || res?.data?.data || d;
      form.setSelectedDonor(full);
      form.loadDonorIntoForm(full);
      toast.success(`Selected donor profile loaded`);
    } catch (e) {
      form.setSelectedDonor(d);
      form.loadDonorIntoForm(d);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const generatedId = `DFR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const donorPayload = {
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
        lastDonationPlace: formData.lastDonationDate ? formData.lastDonationPlace : undefined,
        emergencyDonationWillingness: formData.emergencyDonationWillingness || undefined,
      };

      let registeredDonorId = "";
      let registeredDonor = null;

      if (repeatedDonation === "Yes" && selectedDonor) {
        const donorRes = await axios.put(`${API}/api/v2/donor/${selectedDonor._id}`, donorPayload, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        registeredDonor = donorRes.data?.data || donorRes.data?.donor;
        registeredDonorId = registeredDonor?._id || registeredDonor?.id;
      } else {
        const fullPayload = {
          ...donorPayload,
          donorId: formData.donorIsFit ? `DON-${Date.now()}` : generatedId,
        };
        const donorRes = await axios.post(`${API}/api/v2/donor`, fullPayload, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        registeredDonor = donorRes.data?.data || donorRes.data?.donor;
        registeredDonorId = registeredDonor?._id || registeredDonor?.id;
      }

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
          campId: campId || null,
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

        // Delete draft from localStorage on success
        if (draftId) {
          const rawDrafts = localStorage.getItem("blood_bank_donor_creation_drafts");
          try {
            let drafts = rawDrafts ? JSON.parse(rawDrafts) : [];
            drafts = drafts.filter((d) => d.id !== draftId);
            localStorage.setItem("blood_bank_donor_creation_drafts", JSON.stringify(drafts));
          } catch (e) {
            console.error(e);
          }
        }

        toast.success(`Donor successfully registered and deferred for ${reasonObj.days === 0 ? "indefinite" : `${reasonObj.days} days`}`);
        if (campId) queryClient.invalidateQueries({ queryKey: campKeys.detail(campId) });
        navigate(campId ? `/camp-details?id=${campId}` : "/master-register/donors");
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
          campId: campId || null,
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

        // Delete draft from localStorage on success
        if (draftId) {
          const rawDrafts = localStorage.getItem("blood_bank_donor_creation_drafts");
          try {
            let drafts = rawDrafts ? JSON.parse(rawDrafts) : [];
            drafts = drafts.filter((d) => d.id !== draftId);
            localStorage.setItem("blood_bank_donor_creation_drafts", JSON.stringify(drafts));
          } catch (e) {
            console.error(e);
          }
        }

        toast.success("Donor registered and fit donation saved successfully");
        if (campId) queryClient.invalidateQueries({ queryKey: campKeys.detail(campId) });
        navigate(campId ? `/camp-details?id=${campId}` : "/master-register/donations");
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

  return {
    isSubmitting,
    searchQuery, setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    handleSelectDonor,
    handleSubmit,
  };
}

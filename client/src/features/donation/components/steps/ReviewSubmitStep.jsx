const MEDICAL_QUESTIONS_TEXT = [
  "1. Have you ever been advised not to donate blood by your treating doctor?",
  "2. Is your age between 18 to 65 years and if above 60 are you donating for the first time?",
  "3. Are you in good health and mentally alert and prepared for blood donation?",
  "4. In the last 3 months (male) or 4 months (female) have you donated blood and in the last 28 days have you donated platelets by apheresis with complete reinfusion of red cells or was reinfusion incomplete?",
  "5. Have you had any illness or trouble during previous blood donation or after blood donation?",
  "6. Did you have sound sleep the prior night and do you have night shift duty, strenuous duty, long distance driving, emergency service duty, air crew member duty or above/below sea level duty in the next 24 hours after blood donation?",
  "7. Have you taken food in the last 4 hours before blood donation?",
  "8. Are you taking any medication and if so have you shared details with the doctor or staff?",
  "9. In the last 1 year have you donated for bone marrow harvesting or within 6 months donated for stem cell harvesting?",
  "10. Are you suffering from respiratory infection, cold, flu, cough, sore throat, sinusitis, fever or conjunctivitis?",
  "11. In the last 24 hours have you taken alcohol?",
  "12. In the last 3 days have you taken Aspirin or NSAID tablets?",
  "13. In the last 7 days have you taken drugs for de-worming or fungal infection like Albendazole, Mebendazole or Ketoconazole?",
  "14. In the last 15 days are you taking any antibiotics or medicines like Ticlopidine, Clopidogrel, Piroxicam, Dipiridamole or have you suffered from UTI, cystitis, swine flu or diarrhoea infection?",
  "15. In the last one month are you taking treatment for acne such as Etretinate, Acitretin or Isotretinoin, have you visited an endemic area for Dengue or Chikungunya, are you taking Finasteride for prostate or have you taken Dutasteride in the last 6 months?",
  "16. Have you had any exposure or consumed radioactive contrast material for diagnosis in the last 2 months?",
  "17. Have you suffered from malaria in the last 3 months or in the last 3 years if you stayed in a non-endemic area?",
  "18. Have you suffered from Zika virus or West Nile virus or visited an endemic area in the last 4 months?",
  "19. In the last 6 months have you had minor surgery, tooth extraction, dental surgery under anesthesia, dengue or chikungunya infection, acute nephritis, acute cystitis/UTI or treatment for prostate?",
  "20. Within the last 12 months have you had major surgery, anti-rabies vaccine, typhoid infection, GI endoscopy, hepatitis B vaccine, received blood or blood products, known hepatitis A or E, close contact with an individual suffering from hepatitis, tattoo, acupuncture, body piercing or cosmetic procedure?",
  "21. Have you had an inoculation of non-live or toxoid vaccination in the last 15 days such as typhoid, cholera, papillomavirus, influenza, meningococcal, polio injectable, whooping cough, pneumococcal, tetanus, plague or diphtheria?",
  "22. Have you had an inoculation of live attenuated vaccination in the last 28 days such as oral polio, measles (rubella), mumps, yellow fever, Japanese encephalitis, influenza, typhoid, cholera, hepatitis A, anti-tetanus serum, anti-venom serum, anti-diphtheria serum or anti-gas gangrene serum?",
  "23. Have you been told that you are tested positive for Hepatitis B, Hepatitis C or HIV?",
  "24. Have you been imprisoned for any cause?",
  "25. Do you have abnormal bleeding tendencies, asthma, blood cancer, leukemia, cancer, diabetes, open heart surgery, etc.?",
  "26. Are you a resident of another country with stay in India for 3 continuous years?",
  "27. For females only: Are you currently menstruating, pregnant, delivered in last 12 months, breastfeeding or had abortion in last 6 months?",
  "28. Have you or any family member or colleagues visited any foreign country in the past 28 days?",
  "29. Have you, your family members, colleagues or friends had cough, cold or fever in the past 28 days?",
  "30. Have you read and understood the above information?",
  "31. Have you given answers to all questions truthfully?",
  "32. Will you avoid consuming tobacco, gutkha, cigarette, bidi or alcohol for minimum 6 hours before and after blood donation?",
  "33. Will you wear comfortable clothes, take sufficient sleep, drink plenty of water before and after donation?",
  "34. Have you followed all government guidelines for Corona such as social distancing and sanitization?",
  "35. Have you voluntarily come for blood donation?",
  "36. If within 14 days after blood donation you develop symptoms of Corona or test positive, will you communicate to the blood center?",
];

const donationTypeLabels = {
  first_time: "First Time",
  repeated: "Repeated Donation",
  last_donation: "Last Donation",
};

const ReviewSubmitStep = ({ donor, formData, getDonorName }) => {
  // Count answered medical questions
  const answeredCount = Array.from({ length: 36 }, (_, i) => `q${i + 1}`).filter(
    (k) => formData[k] === "Yes" || formData[k] === "No"
  ).length;

  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">Review Donation Details</h3>
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
          <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
            <p><strong>Bag No:</strong> {formData.bagNo}</p>
            <p><strong>Segment No:</strong> {formData.segmentNo}</p>
            <p><strong>Batch No:</strong> {formData.lotNo}</p>
            <p><strong>Type:</strong> {formData.typeOfBag}</p>
            {formData.collectionDate && (
              <p><strong>Donation Date:</strong> {new Date(formData.collectionDate).toLocaleDateString()}</p>
            )}
            {formData.collectionTime && (
              <p><strong>Donation Time:</strong> {formData.collectionTime}</p>
            )}
            {formData.donationType && (
              <p><strong>Blood Donation:</strong> {donationTypeLabels[formData.donationType] || formData.donationType}</p>
            )}
            {formData.totalDonationCount && (
              <p><strong>Total Donations (incl. current):</strong> {formData.totalDonationCount}</p>
            )}
            {formData.emergencyDonationWillingness && (
              <p><strong>Emergency Willingness:</strong> {formData.emergencyDonationWillingness}</p>
            )}
          </div>
        </div>

        {/* Medical Questions Summary */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-900 mb-2">Medical History Questions</h4>
          <p className="text-sm text-indigo-800 mb-2">
            <strong>{answeredCount}/36</strong> questions answered
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
              const val = formData[`q${n}`];
              if (!val) return null;
              return (
                <div key={n} className="flex items-start gap-2 text-xs text-indigo-800">
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-white font-medium ${val === "Yes" ? "bg-green-600" : "bg-red-600"}`}>
                    {val}
                  </span>
                  <span className="leading-relaxed">{MEDICAL_QUESTIONS_TEXT[n - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medical Examination Details */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">MEDICAL EXAMINATION DETAILS</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
            {formData.weightKg && <p><strong>Weight:</strong> {formData.weightKg} kg</p>}
            {formData.hb && <p><strong>Haemoglobin:</strong> {formData.hb} gm%</p>}
            {formData.tempC && <p><strong>Temperature:</strong> {formData.tempC} °C</p>}
            {formData.pulse && <p><strong>Pulse:</strong> {formData.pulse} /min</p>}
            {formData.bp && <p><strong>Blood Pressure:</strong> {formData.bp} /mm of Hg</p>}
            {formData.pedalOedema && <p><strong>Pedal Oedema:</strong> {formData.pedalOedema}</p>}
            {formData.o2Level && <p><strong>O2 Level:</strong> {formData.o2Level}%</p>}
            {formData.lymphadenopathy && <p><strong>Lymphadenopathy:</strong> {formData.lymphadenopathy}</p>}
            {formData.cyanosis && <p><strong>Cyanosis:</strong> {formData.cyanosis}</p>}
            {formData.systematicExam && <p><strong>Systematic Exam:</strong> {formData.systematicExam}</p>}
            {formData.skinDiseaseFreeAtPhlebotomy && <p><strong>Skin Disease Free at Phlebotomy:</strong> {formData.skinDiseaseFreeAtPhlebotomy}</p>}
            {formData.armsFreeFromPunctureScars && <p><strong>Arms Free from Puncture/Scars:</strong> {formData.armsFreeFromPunctureScars}</p>}
            {formData.volumeGmMl && <p><strong>Volume:</strong> {formData.volumeGmMl} gm/ml</p>}
          </div>
        </div>

        {/* Blood Collection */}
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

        {/* Donor Fitness */}
        <div className={`p-4 rounded-lg border ${formData.donorIsFit === false ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
          <h4 className={`font-semibold mb-2 ${formData.donorIsFit === false ? "text-red-900" : "text-emerald-900"}`}>
            Donor Fitness
          </h4>
          <p className={`text-sm ${formData.donorIsFit === false ? "text-red-800" : "text-emerald-800"}`}>
            <strong>Status:</strong>{" "}
            {formData.donorIsFit === true
              ? "Donor is fit for donation"
              : formData.donorIsFit === false
                ? "Donor is unfit for donation"
                : "Not assessed"}
          </p>
          {formData.donorIsFit === false && formData.rejectionReason && (
            <p className="text-sm text-red-800 mt-1">
              <strong>Reason for rejection:</strong> {formData.rejectionReason}
            </p>
          )}
        </div>

        {/* Blood Group */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-2">Blood Group</h4>
          <p className="text-sm text-orange-800">
            <strong>Group:</strong> {formData.bloodGroup} {formData.rh}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitStep;

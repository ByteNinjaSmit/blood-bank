// Static reference data for the donor registration wizard (DonorCreation).
// Extracted verbatim from DonorCreation.jsx to keep the page component focused
// on UI/flow rather than embedding ~170 lines of clinical config.

export const DEFERRAL_REASONS = [
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

export const QUESTIONS = [
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

// Blood bag numbers are prefixed with the collection center code + the
// current year's last two digits (e.g. "SBCK26-"), rolling over
// automatically at each new year. The operator types the remaining
// digits after the prefix; the field stays fully editable.
export function getBagNoPrefix() {
  const yy = String(new Date().getFullYear()).slice(-2);
  return `SBCK${yy}-`;
}

export const INITIAL_FORM_DATA = {
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
  lastDonationPlace: "SANJIVANI_BLOOD_BANK",

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
  bagNo: getBagNoPrefix(),
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

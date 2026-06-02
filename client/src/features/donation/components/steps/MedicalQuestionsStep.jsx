const MedicalQuestionsStep = ({ formData, onFieldChange }) => {
    const questions = [
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
        { key: "q27", text: "27. For females only: Are you currently menstruating, pregnant, delivered in the last 12 months, breastfeeding your child or had an abortion in the last 6 months?" },
        { key: "q28", text: "28. Have you or any family member or colleagues visited any foreign country in the past 28 days?" },
        { key: "q29", text: "29. Have you, your family members, colleagues or friends had cough, cold or fever in the past 28 days?" },
        { key: "q30", text: "30. Have you read and understood the above information?" },
        { key: "q31", text: "31. Have you given answers to all questions truthfully?" },
        { key: "q32", text: "32. Will you avoid consuming tobacco, gutkha, cigarette, bidi or alcohol for minimum 6 hours before and after blood donation?" },
        { key: "q33", text: "33. Will you wear comfortable clothes, take sufficient sleep, drink plenty of water before and after donation, take light breakfast and not donate on empty stomach?" },
        { key: "q34", text: "34. Have you followed all government guidelines for Corona such as social distancing and sanitization?" },
        { key: "q35", text: "35. Have you voluntarily come for blood donation?" },
        { key: "q36", text: "36. If within 14 days after blood donation you develop symptoms of Corona or test positive, will you communicate to the blood center?" },
    ];

    return (
        <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-1 text-lg">Medical History Questions</h3>
            <p className="text-sm text-gray-500 mb-4">Please answer all questions truthfully. Select Yes or No for each.</p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {questions.map(({ key, text }) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-800 mb-2 leading-relaxed">{text}</p>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`mq_${key}`}
                                    value="Yes"
                                    checked={formData[key] === "Yes"}
                                    onChange={() => onFieldChange(key, "Yes")}
                                    className="w-4 h-4 text-red-700 focus:ring-red-600"
                                />
                                <span className="text-sm font-medium text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`mq_${key}`}
                                    value="No"
                                    checked={formData[key] === "No"}
                                    onChange={() => onFieldChange(key, "No")}
                                    className="w-4 h-4 text-red-700 focus:ring-red-600"
                                />
                                <span className="text-sm font-medium text-gray-700">No</span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MedicalQuestionsStep;

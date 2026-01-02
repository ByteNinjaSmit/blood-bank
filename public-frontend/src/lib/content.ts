export type ContentData = {
    hero: {
        title: string;
        subtitle: string;
        description: string;
        ctaPrimary: string;
        ctaSecondary: string;
        trustedBy: string;
    };
    nav: {
        home: string;
        about: string;
        donate: string;
        contact: string;
    };
    about: {
        title: string;
        mission: string;
        missionText: string;
        description: string;
        servingTitle: string;
        talukas: string[];
    };
    stats: {
        donations: string;
        donationsLabel: string;
        issued: string;
        issuedLabel: string;
        donors: string;
        donorsLabel: string;
        camps: string;
        campsLabel: string;
        lives: string;
        livesLabel: string;
    };
    features: {
        title: string;
        items: { title: string; desc: string }[];
    };
    safety: {
        title: string;
        items: string[];
    };
    campaign: {
        title: string;
        subtitle: string;
        occasions: string[];
        cta: string;
    };
    education: {
        shortageTitle: string;
        shortageMonths: string[];
        processingTitle: string;
        processingDesc: string;
        processingItems: string[];
        noProfit: string;
    };
    contact: {
        title: string;
        subtitle: string;
        emergencyTitle: string;
        items: { label: string; value: string; detail: string; }[];
        ctaEmergency: string;
        ctaAppointment: string;
    };
    pageNotFound: {
        title: string;
        subtitle: string;
        backHome: string;
    };
    footer: {
        about: string;
        quickLinks: string;
        locationsTitle: string;
        locationName: string;
        address: string;
        workingDaysTitle: string;
        workingHours: { days: string; hours: string }[];
        phoneBooking: string;
    };
    form: {
        personalDetails: string;
        formTitle: string;
        walkInBadge: string;
        fullName: string;
        fullNamePlaceholder: string;
        gender: string;
        selectGender: string;
        mobileNo: string;
        mobilePlaceholder: string;
        birthDate: string;
        address: string;
        addressPlaceholder: string;
        medicalHistory: string;
        recentIllness: string;
        surgery: string;
        medication: string;
        lastDonation: string;
        donationDetails: string;
        preferredDate: string;
        flexibleNote: string;
        bloodGroup: string;
        submitBtn: string;
        processing: string;
        yes: string;
        no: string;
        genderOptions: string[];
    };
    feedback: {
        title: string;
        subtitle: string;
        placeholder: string;
        submitBtn: string;
        successMessage: string;
        errorMessage: string;
    };
}

export const content: Record<'en' | 'mr', ContentData> = {
    en: {
        hero: {
            title: "Sanjivani Blood Bank, Kopargaon",
            subtitle: "Operated by Sai Health Care Foundation",
            description: "Serving humanity through safe blood for 32 years—because no life should be lost for want of blood.",
            ctaPrimary: "Donate Now",
            ctaSecondary: "Learn More",
            trustedBy: "Trusted by 100,000+ lives served"
        },
        nav: {
            home: "Home",
            about: "About",
            donate: "Donate",
            contact: "Contact"
        },
        pageNotFound: {
            title: "404 - Page Not Found",
            subtitle: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
            backHome: "Back to Home"
        },
        about: {
            title: "About Sanjivani Blood Bank",
            mission: "Our Mission",
            missionText: "No one should die due to non-availability of blood.",
            description: "Sanjivani Blood Bank, Kopargaon, is a pioneer rural and taluka-level blood bank, serving society continuously for over 32 years. Established in 1993, when no blood bank existed in Kopargaon.",
            servingTitle: "Proudly Serving",
            talukas: ["Kopargaon", "Vaijapur", "Yeola", "Shirdi", "Rahata", "Manmad"]
        },
        stats: {
            donations: "1,00,000+",
            donationsLabel: "Blood Donations",
            issued: "1,60,000+",
            issuedLabel: "Components Issued",
            donors: "90,000+",
            donorsLabel: "Registered Donors",
            camps: "3,000+",
            campsLabel: "Camps Conducted",
            lives: "1,00,000+",
            livesLabel: "Lives Served"
        },
        features: {
            title: "Why Trust Sanjivani Blood Bank?",
            items: [
                { title: "First Rural Blood Bank", desc: "Serving the region since 1993 with unwavering dedication." },
                { title: "100% Voluntary Donation", desc: "Ensuring higher safety for patients and ethical practices." },
                { title: "Indias Quality Control", desc: "Achieved 100% quality score in All India Quality Control Program." },
                { title: "Advanced Technology", desc: "Using HemoCue machines & modern compatibility testing." }
            ]
        },
        safety: {
            title: "Donor & Patient Safety First",
            items: [
                "Strict medical screening before donation",
                "Hemoglobin testing using HemoCue",
                "Sterile, single-use kits only",
                "Blood storage maintained between +4°C to −15°C",
                "Continuous monitoring of stored blood",
                "Thalassemia detection tests conducted"
            ]
        },
        campaign: {
            title: "Celebrate Your Birthday by Saving Lives",
            subtitle: "Instead of cutting a cake, give someone a second chance at life.",
            occasions: ["Birthday", "Anniversary", "Special Occasions"],
            cta: "Register Your Pledge"
        },
        education: {
            shortageTitle: "Seasonal Blood Shortage Awareness",
            shortageMonths: ["May to July", "Post-Diwali period"],
            processingTitle: "Why Is There a Processing Charge?",
            processingDesc: "Blood donation is free — but processing blood is not. Charges cover:",
            processingItems: [
                "Mandatory blood testing (HIV, Hepatitis, Malaria)",
                "Testing kits & consumables",
                "Electricity & cold storage",
                "Salaries of qualified staff"
            ],
            noProfit: "No profit is made from donations. Charges are as per Govt of India regulations."
        },
        contact: {
            title: "Get in Touch 📞",
            subtitle: "Reach out to us for urgent blood requirements, donation inquiries, or any medical assistance. Our dedicated team is here to help you 24/7.",
            emergencyTitle: "24/7",
            items: [
                { label: "Emergency Hotline", value: "+91 94222 23117", detail: "24/7 Blood Availability" },
                { label: "Alternative Mobile", value: "+91 94217 23117", detail: "Emergency Support" },
                { label: "Landline", value: "02423 222237", detail: "Hospital Extension" },
                { label: "General Inquiry", value: "contact@sanjivanibloodbank.org", detail: "Response within 2 hours" },
                { label: "Our Location", value: "Sanjivani Blood Bank, Kopargaon", detail: "Vivekanand Nagar, Kopargaon, Maharashtra 423601" },
                { label: "Standard Hours", value: "9:00 AM - 6:00 PM", detail: "Monday - Saturday" }
            ],
            ctaEmergency: "Emergency Call Now",
            ctaAppointment: "Schedule Appointment"
        },
        footer: {
            about: "We enable healthcare professionals to deliver high-quality blood services, leading to the best possible outcome for patients.",
            quickLinks: "Quick Links",
            locationsTitle: "Locations",
            locationName: "Sanjivani Blood Bank, Kopargaon",
            address: "Vivekanand Nagar, Kopargaon, Maharashtra 423601",
            workingDaysTitle: "Working Days",
            workingHours: [
                { days: "Mon - Sat", hours: "09:00 AM - 06:00 PM" },
                { days: "Sunday", hours: "Emergency Only" }
            ],
            phoneBooking: "Phone Booking: 24/7"
        },
        form: {
            personalDetails: "Personal Details",
            formTitle: "Register as a Voluntary Blood Donor",
            walkInBadge: "Walk-ins Welcome",
            fullName: "Full Name *",
            fullNamePlaceholder: "Enter Full Name",
            gender: "Gender *",
            selectGender: "Select Gender",
            mobileNo: "Mobile Number *",
            mobilePlaceholder: "10-digit Mobile",
            birthDate: "Date of Birth *",
            address: "Full Address *",
            addressPlaceholder: "Enter current address",
            medicalHistory: "Medical History (Mandatory)",
            recentIllness: "Recent Illness?",
            surgery: "Surgery (Last 6 months)?",
            medication: "Ongoing Medication?",
            lastDonation: "Previous Donation Date (Optional)",
            donationDetails: "Donation Details",
            preferredDate: "Preferred Donation Day (Optional) *",
            flexibleNote: "Flexible – final confirmation at blood bank",
            bloodGroup: "Blood Group (If Known)",
            submitBtn: "become a lifesaver",
            processing: "Processing...",
            yes: "Yes",
            no: "No",
            genderOptions: ["Male", "Female", "Other"]
        },
        feedback: {
            title: "Your Feedback Matters",
            subtitle: "Help us improve our services. Your suggestions are valuable to us.",
            placeholder: "Share your thoughts, suggestions, or experience...",
            submitBtn: "Submit Feedback",
            successMessage: "Thank you for your feedback!",
            errorMessage: "Failed to submit feedback. Please try again."
        }
    },
    mr: {
        hero: {
            title: "संजीवनी ब्लड बँक, कोपरगाव",
            subtitle: "साई हेल्थ केअर फाउंडेशन द्वारा संचलित",
            description: "३२ वर्षांपासून सुरक्षित रक्तपुरवठ्याद्वारे माणुसकीची सेवा—रक्ताअभावी कोणाचेही प्राण जाऊ नयेत यासाठी कटिबद्ध.",
            ctaPrimary: "रक्तदान करा",
            ctaSecondary: "अधिक माहिती",
            trustedBy: "१,००,०००+ रुग्णांचा विश्वास"
        },
        nav: {
            home: "मुख्यपृष्ठ",
            about: "आमच्याबद्दल",
            donate: "रक्तदान करा",
            contact: "संपर्क"
        },
        pageNotFound: {
            title: "४०४ - पृष्ठ सापडले नाही",
            subtitle: "तुम्ही शोधत असलेले पृष्ठ काढले गेले असावे, त्याचे नाव बदलले असावे किंवा ते तात्पुरते अनुपलब्ध असू शकते.",
            backHome: "मुख्यपृष्ठावर जा"
        },
        about: {
            title: "संजीवनी ब्लड बँकेबद्दल",
            mission: "आमचे ध्येय",
            missionText: "रक्ताच्या अनुपलब्धतेमुळे कोणाचाही मृत्यू होऊ नये.",
            description: "संजीवनी ब्लड बँक, कोपरगाव ही ग्रामीण आणि तालुका स्तरावरील एक अग्रगण्य रक्तपेढी आहे, जी ३२ वर्षांपासून अविरत समाजसेवा करत आहे. १९९३ मध्ये जेव्हा कोपरगावमध्ये एकही रक्तपेढी नव्हती, तेव्हा याची स्थापना झाली.",
            servingTitle: "कार्यक्षेत्र",
            talukas: ["कोपरगाव", "वैजापूर", "येवला", "शिर्डी", "राहाता", "मनमाड"]
        },
        stats: {
            donations: "१,००,०००+",
            donationsLabel: "रक्तदान",
            issued: "१,६०,०००+",
            issuedLabel: "रक्त घटक वाटप",
            donors: "९०,०००+",
            donorsLabel: "नोंदणीकृत रक्तदाते",
            camps: "३,०००+",
            campsLabel: "शिबिरे आयोजित",
            lives: "१,००,०००+",
            livesLabel: "रुग्ण सेवा"
        },
        features: {
            title: "संजीवनी ब्लड बँक का निवडाल?",
            items: [
                { title: "पहिली ग्रामीण रक्तपेढी", desc: "१९९३ पासून अविरत सेवा." },
                { title: "१००% ऐच्छिक रक्तदान", desc: "रुग्णांसाठी अधिक सुरक्षितता." },
                { title: "गुणवत्ता हमी", desc: "All India Quality Control मध्ये १००% गुण." },
                { title: "प्रगत तंत्रज्ञान", desc: "HemoCue आणि अचूक चाचणी पद्धती." }
            ]
        },
        safety: {
            title: "रुग्ण आणि रक्तदात्याची सुरक्षा",
            items: [
                "रक्तदानापूर्वी काटेकोर वैद्यकीय तपासणी",
                "HemoCue द्वारे हिमोग्लोबिन तपासणी",
                "केवळ निर्जंतुक, सिंगल-युज किट्सचा वापर",
                "वैद्यकीय मानकांनुसार रक्त साठवणूक (+4°C to -15°C)",
                "साठवलेल्या रक्ताची निरंतर देखरेख",
                "थॅलेसेमिया तपासणी मोहीम"
            ]
        },
        campaign: {
            title: "वाढदिवस साजरा करा जीवदान देऊन",
            subtitle: "केक कापण्याऐवजी, कोणालातरी जीवनाची दुसरी संधी द्या.",
            occasions: ["वाढदिवस", "लग्नाचा वाढदिवस", "विशेष प्रसंग"],
            cta: "रक्तदानाची शपथ घ्या"
        },
        education: {
            shortageTitle: "रक्त तुटवड्याची जागरूकता",
            shortageMonths: ["मे ते जुलै", "दिवाळीनंतरचा काळ"],
            processingTitle: "रक्तपेढी प्रक्रिया शुल्क का आकारते?",
            processingDesc: "रक्तदान विनामूल्य आहे — पण रक्तावरील प्रक्रिया नाही. शुल्क यासाठी लागते:",
            processingItems: [
                "अनिवार्य चाचण्या (HIV, कावीळ, मलेरिया)",
                "टेस्टिंग किट्स आणि साधने",
                "वीज आणि कोल्ड स्टोरेज",
                "तज्ञ कर्मचाऱ्यांचा पगार"
            ],
            noProfit: "रक्तदानातून कोणताही नफा कमवला जात नाही. हे शुल्क सरकारी नियमांनुसार आहे."
        },
        contact: {
            title: "संपर्क साधा 📞",
            subtitle: "तातडीच्या रक्ताच्या गरजा, रक्तदान चौकशी किंवा कोणत्याही वैद्यकीय मदतीसाठी आमच्याशी संपर्क साधा. आमची टीम तुमच्या सेवेसाठी 24/7 तत्पर आहे.",
            emergencyTitle: "२४/७",
            items: [
                { label: "इमर्जन्सी हेल्पलाइन", value: "+९१ ९४२२२ २३११७", detail: "२४/७ रक्त उपलब्ध" },
                { label: "इतर मोबाईल", value: "+९१ ९४२१७ २३११७", detail: "इमर्जन्सी सपोर्ट" },
                { label: "फोन नंबर", value: "०२४२३ २२२२३७", detail: "हॉस्पिटल लाईन" },
                { label: "नियमित चौकशी", value: "contact@sanjivanibloodbank.org", detail: "२ तासात प्रतिसाद" },
                { label: "आमचा पत्ता", value: "संजीवनी ब्लड बँक, कोपरगाव", detail: "विवेकानंद नगर, कोपरगाव, महाराष्ट्र ४२३६०१" },
                { label: "वेळ", value: "सकाळी ९:०० - सायंकाळी ६:००", detail: "सोमवार - शनिवार" }
            ],
            ctaEmergency: "इमर्जन्सी कॉल करा",
            ctaAppointment: "अपॉइंटमेंट बुक करा"
        },
        footer: {
            about: "आम्ही आरोग्यसेवा व्यावसायिकांना उच्च-गुणवत्तेची रक्त सेवा प्रदान करण्यास सक्षम करतो, ज्यामुळे रुग्णांना सर्वोत्तम उपचार मिळतात.",
            quickLinks: "महत्वाचे दुवे",
            locationsTitle: "पत्ता",
            locationName: "संजीवनी ब्लड बँक, कोपरगाव",
            address: "विवेकानंद नगर, कोपरगाव, महाराष्ट्र ४२३६०१",
            workingDaysTitle: "कामाचे दिवस",
            workingHours: [
                { days: "सोम - शनि", hours: "सकाळी ०९:०० - सायं ०६:००" },
                { days: "रविवार", hours: "केवळ इमर्जन्सी" }
            ],
            phoneBooking: "फोन बुकिंग: २४/७"
        },
        form: {
            personalDetails: "वैयक्तिक माहिती",
            formTitle: "स्वयंस्फूर्त रक्तदाता नोंदणी",
            walkInBadge: "थेट (Walk-in) स्वागत",
            fullName: "पूर्ण नाव *",
            fullNamePlaceholder: "पूर्ण नाव प्रविष्ट करा",
            gender: "लिंग *",
            selectGender: "लिंग निवडा",
            mobileNo: "मोबाईल नंबर *",
            mobilePlaceholder: "१० अंकी मोबाईल नंबर",
            birthDate: "जन्मतारीख *",
            address: "पूर्ण पत्ता *",
            addressPlaceholder: "सध्याचा पत्ता प्रविष्ट करा",
            medicalHistory: "वैद्यकीय इतिहास (अनिवार्य)",
            recentIllness: "अलीकडील आजार?",
            surgery: "शस्त्रक्रिया (गेल्या ६ महिन्यात)?",
            medication: "सध्याचे औषध चालू आहे का?",
            lastDonation: "मागील रक्तदानाची तारीख (ऐच्छिक)",
            donationDetails: "रक्तदान तपशील",
            preferredDate: "पसंतीचा रक्तदान दिवस (ऐच्छिक) *",
            flexibleNote: "लवचिक – अंतिम पुष्टी रक्तपेढीमध्ये होईल",
            bloodGroup: "रक्तगट (माहित असल्यास)",
            submitBtn: "जीवनदाता बना – रक्तदान करा",
            processing: "प्रक्रिया सुरू आहे...",
            yes: "होय",
            no: "नाही",
            genderOptions: ["पुरुष", "स्त्री", "इतर"]
        },
        feedback: {
            title: "तुमचा अभिप्राय महत्त्वाचा आहे",
            subtitle: "आम्हाला आमच्या सेवा सुधारण्यास मदत करा. तुमच्या सूचना आमच्यासाठी मौल्यवान आहेत.",
            placeholder: "तुमचे विचार, सूचना किंवा अनुभव सामायिक करा...",
            submitBtn: "अभिप्राय सबमिट करा",
            successMessage: "तुमच्या अभिप्रायाबद्दल धन्यवाद!",
            errorMessage: "अभिप्राय सबमिट करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा."
        }
    }
};

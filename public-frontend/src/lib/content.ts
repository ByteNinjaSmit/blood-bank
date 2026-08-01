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
        mainLinks: {
            label: string;
            href: string;
            columns?: {
                title: string;
                links: { label: string; href: string }[];
            }[];
            viewAllLabel?: string;
            viewAllHref?: string;
        }[];
        bookNow: string;
        brandPrefix: string;
        brandSuffix: string;
        brandTagline: string;
    };
    misc: {
        backToTop: string;
    };
    about: {
        title: string;
        titleLine1Start: string;
        titleLine1Highlight: string;
        titleLine1End: string;
        mission: string;
        missionText: string;
        description: string;
        servingTitle: string;
        talukas: string[];
        statLabels: { years: string; lives: string; emergency: string; rural: string };
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
    campDonation: {
        badge: string;
        title: string;
        titleHighlight: string;
        description: string;
        points: { title: string; desc: string }[];
        cta: string;
    };
    features: {
        title: string;
        items: { title: string; desc: string }[];
    };
    safety: {
        title: string;
        intro: string;
        items: string[];
        tempControlledTitle: string;
        tempControlledDesc: string;
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
        wordmark: string;
        about: string;
        quickLinks: string;
        locationsTitle: string;
        locationName: string;
        address: string;
        workingDaysTitle: string;
        workingHours: { days: string; hours: string }[];
        phoneBooking: string;
        copyright: string;
        privacy: string;
        terms: string;
        cookies: string;
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
        medicalWarning: string;
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
        noHealthy: string;
        registrationSuccessTitle: string;
        genderOptions: string[];
        age: string;
        agePlaceholder: string;
        donationFrequency: string;
        donationFrequencyOptions: string[];
        wantReminder: string;
        reminderDaysLabel: string;
        reminderDaysOptions: string[];
        predictedReminderDate: string;
    };
    feedback: {
        badge: string;
        title: string;
        subtitle: string;
        placeholder: string;
        submitBtn: string;
        saving: string;
        successMessage: string;
        errorMessage: string;
    };
    donatePage: {
        badge: string;
        titleStart: string;
        titleHighlight: string;
        titleEnd: string;
        description: string;
        features: { title: string; desc: string }[];
    };
    eligibilityCriteriaPage: {
        heroBadge: string;
        heroTitleStart: string;
        heroTitleHighlight: string;
        heroDescription1: string;
        heroDescription2: string;
        redBannerSubtitle: string;
        redBannerTitle: string;
        topicsTitleStart: string;
        topicsTitleHighlight: string;
        topicsDescription: string;
        topics: {
            title: string;
            points: string[];
        }[];
        learnMoreTitleStart: string;
        learnMoreTitleHighlight: string;
        learnMoreCards: {
            title: string;
            desc: string;
            cta: string;
        }[];
        firstTimeBadge: string;
        firstTimeTitle: string;
        firstTimeTitleHighlight: string;
        firstTimeDescription: string;
        firstTimeBtn: string;
        frequencyTitle: string;
        frequencyTitleHighlight: string;
        frequencyCards: {
            titleStart: string;
            highlight: string;
            subtitle: string;
            value: string;
            footnote: string;
        }[];
        supportTitle: string;
        supportDonateBtn: string;
        supportCallBtn: string;
    };
    onsiteDonorPage: {
        title: string;
        description: string;
        ongoingCamps: string;
        upcomingCamps: string;
        campHistory: string;
        registerHere: string;
        registerToDonate: string;
        viewRecords: string;
        completed: string;
        noOngoing: string;
        noUpcoming: string;
        loadingCamps: string;
        totalDonors: string;
        totalDonations: string;
        liveNow: string;
    };
    onsiteRegistrationForm: {
        steps: {
            identity: string;
            contact: string;
            history: string;
            vitals: string;
            examination: string;
        };
        fields: {
            firstName: string;
            middleName: string;
            lastName: string;
            sex: string;
            dob: string;
            age: string;
            bloodGroup: string;
            occupation: string;
            camp: string;
            address: string;
            mobile: string;
            pincode: string;
            email: string;
            isFirstTime: string;
            isRepeated: string;
            lastDonation: string;
            totalDonations: string;
            emergencyConsent: string;
            weight: string;
            hb: string;
            temp: string;
            pulse: string;
            bp: string;
            o2Level: string;
            pedalOedema: string;
            lymphadenopathy: string;
            cyanosis: string;
            skinDisease: string;
            scars: string;
        };
        placeholders: {
            firstName: string;
            middleName: string;
            lastName: string;
            age: string;
            select: string;
            address: string;
            mobile: string;
            pincode: string;
            email: string;
            weight: string;
            hb: string;
            temp: string;
            pulse: string;
            bp: string;
            o2Level: string;
        };
        messages: {
            successTitle: string;
            successDesc: string;
            mandatoryError: string;
            processing: string;
            completeBtn: string;
            nextBtn: string;
            backBtn: string;
            homeBtn: string;
            anotherBtn: string;
        };
        options: {
            male: string;
            female: string;
            bloodGroupNotKnown: string;
            occupations: { student: string; service: string; business: string; selfEmployed: string; housewife: string; other: string };
            yes: string;
            no: string;
        };
    };
    incomingCampsPage: {
        title: string;
        description: string;
        location: string;
        schedule: string;
        contact: string;
        email: string;
        confirmed: string;
        registerBtn: string;
        directionsBtn: string;
        defaultDescription: string;
        defaultPhone: string;
        defaultEmail: string;
    };
    bloodTypePage: {
        heroBadge: string;
        heroTitleStart: string;
        heroTitleHighlight: string;
        heroDescription: string;
        howToFindTitle: string;
        howToFindText: string;
        mostCommonTitle: string;
        mostCommonText: string;
        mostCommonBadge: string;
        universalDonorTitle: string;
        universalDonorText1: string;
        universalDonorText2: string;
        typesTitleStart: string;
        typesTitleHighlight: string;
        typesDescription: string;
        bloodTypes: { type: string; percent: string; description: string }[];
        bloodFacts: { type: string; heading: string; body: string }[];
        compatTitleStart: string;
        compatTitleHighlight: string;
        compatDescription: string;
        compatRecipientHeader: string;
        rareBloodTitle: string;
        rareBloodText1: string;
        rareBloodText2: string;
        distributionTitle: string;
        mostNeededTitle: string;
        mostNeeded: { type: string; reason: string }[];
        unknownTitle: string;
        unknownText: string;
        bookAppointment: string;
        questionsTitle: string;
    };
    donationProcessPage: {
        heroBadge: string;
        heroTitle: string;
        heroDescription: string;
        bookAppointmentBtn: string;
        checkEligibilityBtn: string;
        beforeTitle: string;
        beforeDescription: string;
        beforeTips: { title: string; desc: string }[];
        duringTitleStart: string;
        duringTitleHighlight: string;
        duringDescription: string;
        processSteps: { title: string; desc: string; duration: string }[];
        totalTimeText: string;
        questionnaireTitle: string;
        questionnaireDescription: string;
        questionnairePoints: string[];
        redBannerTitle: string;
        redBannerText: string;
        donateNowBtn: string;
        afterBadge: string;
        afterTitle: string;
        afterDescription: string;
        afterTips: string[];
        honourTitle: string;
        honourText1: string;
        honourText2: string;
        accessibilityTitle: string;
        accessibilityDescription: string;
        accessibilityServices: { title: string; desc: string }[];
        faqTitle: string;
        faqs: { q: string; a: string }[];
        supportTitle: string;
    };
    donationCriteriaChangesPage: {
        heroBadge: string;
        heroTitleStart: string;
        heroTitleHighlight: string;
        heroDescription1: string;
        heroDescription2: string;
        redBannerTitle: string;
        redBannerText: string;
        checkEligibilityBtn: string;
        updatesTitle: string;
        updatesSubtitle: string;
        updates: { date: string; title: string; body: string }[];
        ctaBadge: string;
        ctaTitleStart: string;
        ctaTitleHighlight: string;
        ctaText: string;
        bookBtn: string;
        fullCriteriaBtn: string;
        supportTitle: string;
    };
    donorWellnessPage: {
        heroBadge: string;
        heroTitleStart: string;
        heroTitleHighlight: string;
        heroDescription: string;
        onPageIntro: string;
        onPageList: string[];
        faqSectionTitleStart: string;
        faqSectionTitleHighlight: string;
        faqSectionSubtitle: string;
        faqs: { q: string; a: string }[];
        redBannerTitle: string;
        redBannerText: string;
        viewProcessBtn: string;
        protocolsTitle: string;
        protocolsDescription: string;
        safetyProtocols: { title: string; desc: string }[];
        sideEffectsTitle: string;
        sideEffectsDescription: string;
        sideEffectsTableHeaders: { effect: string; likelihood: string; whatToDo: string };
        sideEffects: { effect: string; likelihood: string; what: string }[];
        ironTitle: string;
        ironDescription: string;
        ironTips: string[];
        whenToSeekTitle: string;
        whenToSeekText: string;
        whenToSeekItems: string[];
        helplineText: string;
        ctaTitle: string;
        ctaText: string;
        bookBtn: string;
        checkEligibilityBtn: string;
        contactTitle: string;
    };
    teamPage: {
        badge: string;
        title: string;
        titleHighlight: string;
        description: string;
        members: { name: string; role: string }[];
    };
    hospitalPortal: {
        portalTitle: string;
        emailLabel: string;
        emailPlaceholder: string;
        emailDescription: string;
        proceedBtn: string;
        verificationTitle: string;
        verificationText: string;
        codeExpires: string;
        codeExpired: string;
        verifyBtn: string;
        resendBtn: string;
        resendCooldownText: string;
        changeEmailBtn: string;
        invalidEmail: string;
        unregisteredEmail: string;
        codeExpiredMessage: string;
        verifiedSuccess: string;
        loading: string;
        connectedPortal: string;
        updated: string;
        refresh: string;
        signOut: string;
        bloodComponent: string;
        totals: string;
        totalAvailable: string;
        legendTitle: string;
        criticalSupply: string;
        lowSupply: string;
        healthySupply: string;
        footerNote: string;
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
            bookNow: "BOOK NOW",
            brandPrefix: "Blood",
            brandSuffix: "Bank",
            brandTagline: "Kopargaon",
            mainLinks: [
                {
                    label: "Blood",
                    href: "/",
                    columns: [
                        {
                            title: "Am I eligible to donate blood?",
                            links: [
                                { label: "Explore eligibility criteria", href: "/eligibility-criteria" },
                                { label: "Recent changes to donation criteria", href: "/donation-criteria-changes" }
                            ]
                        },
                        {
                            title: "Donating blood",
                            links: [
                                { label: "First-time donor", href: "/donate" },
                                { label: "What is my blood type?", href: "/blood-type" },
                                { label: "Donation process", href: "/donation-process" },
                                { label: "Donor wellness and safety", href: "/donor-wellness" }
                            ]
                        }
                    ]
                },

                {
                    label: "Ways to Donate",
                    href: "/donate",
                    columns: [
                        {
                            title: "Donation options",
                            links: [
                                { label: "Book an appointment", href: "/donate" }
                            ]
                        }
                    ]
                },
                {
                    label: "About Us",
                    href: "/about",
                    columns: [
                        {
                            title: "Our organization",
                            links: [
                                { label: "Our mission", href: "/about" },
                                { label: "Our history", href: "/about" }
                            ]
                        }
                    ]
                },
                {
                    label: "Donation",
                    href: "/onsite-donor",
                    columns: [
                        {
                            title: "Donation Services",
                            links: [
                                { label: "Voluntary Camp Donation", href: "/onsite-donor" }
                            ]
                        }
                    ]
                }
            ]
        },
        pageNotFound: {
            title: "404 - Page Not Found",
            subtitle: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
            backHome: "Back to Home"
        },
        misc: {
            backToTop: "Back to Top"
        },
        about: {
            title: "About Sanjivani Blood Bank",
            titleLine1Start: "Serving humanity through ",
            titleLine1Highlight: "safe blood",
            titleLine1End: " for 32 years.",
            mission: "Our Mission",
            missionText: "No one should die due to non-availability of blood.",
            description: "Sanjivani Blood Bank, Kopargaon, is a pioneer rural and taluka-level blood bank, serving society continuously for over 32 years. Established in 1993, when no blood bank existed in Kopargaon.",
            servingTitle: "Proudly Serving",
            talukas: ["Kopargaon", "Vaijapur", "Yeola", "Shirdi", "Rahata", "Manmad"],
            statLabels: { years: "Years of Service", lives: "Lives Impacted", emergency: "Emergency Support", rural: "Rural Dedication" }
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
        campDonation: {
            badge: "Voluntary Camp Donation",
            title: "Bring a Blood Donation",
            titleHighlight: "Camp to Your Community",
            description: "We organize voluntary blood donation camps at colleges, workplaces, and community events across Kopargaon and nearby talukas — complete with certified medical staff, free screening, and refreshments for every donor.",
            points: [
                { title: "On-site Medical Team", desc: "Qualified doctors and technicians handle screening and collection safely." },
                { title: "Free Health Check-up", desc: "Every donor gets a basic health screening at no cost." },
                { title: "For Groups & Institutions", desc: "Ideal for colleges, companies, and community organizations." },
                { title: "Easy Online Registration", desc: "Check ongoing and upcoming camps and register in minutes." }
            ],
            cta: "Check & Register for Camp Donation"
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
            intro: "We adhere to strict international medical protocols to ensure every drop of blood is safe for transfusion. From collection to storage, quality is our priority.",
            items: [
                "Strict medical screening before donation",
                "Hemoglobin testing using HemoCue",
                "Sterile, single-use kits only",
                "Blood storage maintained between +4°C to −15°C",
                "Continuous monitoring of stored blood",
                "Thalassemia detection tests conducted"
            ],
            tempControlledTitle: "Temperature Controlled",
            tempControlledDesc: "Maintained continuously between +4°C to -15°C"
        },
        campaign: {
            title: "Celebrate Your Birthday by Saving Lives",
            subtitle: "Instead of cutting a cake, give someone a second chance at life.",
            occasions: ["Birthday", "Anniversary", "Special Occasions"],
            cta: "Donate Now!"
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
            wordmark: "Sanjivani Blood Bank",
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
            phoneBooking: "Phone Booking: 24/7",
            copyright: "© {year} Sanjivani Blood Bank. Designed & Developed by ByteNinjaTeam",
            privacy: "Privacy",
            terms: "Terms",
            cookies: "Cookies"
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
            medicalWarning: "Have you had any recent illness, surgery, or medication in the last 3 months?",
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
            noHealthy: "No, I'm healthy",
            registrationSuccessTitle: "Registration Successful!",
            genderOptions: ["Male", "Female", "Other"],
            age: "Age",
            agePlaceholder: "Years",
            donationFrequency: "Donation Frequency (Per Year)",
            donationFrequencyOptions: ["1 Time (Yearly)", "2 Times (Every 6 months)", "3 Times (Every 4 months)", "4 Times (Every 3 months)"],
            wantReminder: "Send me a reminder for my next donation",
            reminderDaysLabel: "Remind me before",
            reminderDaysOptions: ["1 Day", "3 Days", "1 Week"],
            predictedReminderDate: "You will be reminded on:"
        },
        feedback: {
            badge: "Feedback",
            title: "Your Feedback Matters",
            subtitle: "Help us improve our services. Your suggestions are valuable to us.",
            placeholder: "Share your thoughts, suggestions, or experience...",
            submitBtn: "Submit Feedback",
            saving: "Saving...",
            successMessage: "Thank you for your feedback!",
            errorMessage: "Failed to submit feedback. Please try again."
        },
        donatePage: {
            badge: "Donate Blood, Save Lives",
            titleStart: "Your ",
            titleHighlight: "15 Minutes",
            titleEnd: " Can Save 3 Families.",
            description: "Join a community of heroes. Safe, sterile, and simple process.",
            features: [
                { title: "Super Fast", desc: "Whole process takes ~45 mins" },
                { title: "100% Safe", desc: "Sterile kits & expert care" },
                { title: "Free Health Check", desc: "BP, Hb, & basic screening" }
            ]
        },
        eligibilityCriteriaPage: {
            heroBadge: "Eligibility criteria",
            heroTitleStart: "Am I eligible to ",
            heroTitleHighlight: "Donate?",
            heroDescription1: "Thank you for your interest in donating blood! This section contains answers to common questions you might have before your appointment, to help determine if you’re able to donate.",
            heroDescription2: "We encourage all donors to review eligibility criteria before booking your appointment. Please keep in mind that donor eligibility can change over time. The final determination of eligibility will be made by our donor centre staff at the time of donation.",
            redBannerSubtitle: "Making a difference",
            redBannerTitle: "It only takes about an hour of your time to change someone’s life.",
            topicsTitleStart: "Explore the topics below to find out if you’re ",
            topicsTitleHighlight: "eligible to donate",
            topicsDescription: "Various factors can determine whether a person can donate at any given time. Sometimes, it’s not possible to donate, or we may ask that you wait before donating again.",
            topics: [
                {
                    title: "Age, gender and weight",
                    points: [
                        "To become a blood donor you must be between 18 and 65 years old.",
                        "You must weigh at least 45 kg.",
                        "First-time donors above the age of 60 may require additional medical clearance.",
                        "Repeat donors may be eligible to donate up to the age of 65 (or 68 with medical certification)."
                    ]
                },
                {
                    title: "Drugs and alcohol",
                    points: [
                        "Donors must not be impaired at the time of donation so we can obtain informed consent.",
                        "You must be sober and able to understand the donation process fully.",
                        "Illicit drug use may affect your eligibility depending on the substance and administration method."
                    ]
                },
                {
                    title: "Hemoglobin and iron",
                    points: [
                        "To ensure donors have sufficient hemoglobin after donation and to prevent anemia, a minimum hemoglobin level is required.",
                        "Your hemoglobin will be tested at the donor centre before every donation.",
                        "We recommend eating iron-rich foods in the weeks leading up to your donation."
                    ]
                },
                {
                    title: "Medical conditions and treatments",
                    points: [
                        "Some medical conditions effect your ability to donate or may make you temporarily ineligible to donate.",
                        "Most chronic conditions are acceptable if they are stable and under control.",
                        "If you have a heart condition, bleeding disorder, or history of cancer, special rules may apply."
                    ]
                },
                {
                    title: "Medications and vaccines",
                    points: [
                        "Most medications do not prevent you from donating.",
                        "If you have recently been vaccinated, you may be temporarily ineligible for a short period.",
                        "Some specifically restricted medications (like certain acne or hair loss drugs) require a waiting period."
                    ]
                },
                {
                    title: "Piercings and tattoos",
                    points: [
                        "Donors must wait 12 months after getting a tattoo or a piercing before returning to donate.",
                        "This waiting period applies even if the procedure was done at a licensed, sterile facility.",
                        "Ear piercing done with a sterile, single-use gun standard may be exempt after a short waiting period."
                    ]
                },
                {
                    title: "Pregnancy",
                    points: [
                        "While pregnant, you are not eligible to donate.",
                        "You must wait for at least 12 months after childbirth before you can donate again.",
                        "A waiting period of 6 months applies following a miscarriage or termination of pregnancy."
                    ]
                },
                {
                    title: "Sexual behaviour",
                    points: [
                        "All donors are asked about sexual behaviour as part of the safety screening.",
                        "Donors must wait three months after anal sex with a new partner or multiple sexual partners.",
                        "Our screening questionnaire focuses on individual risk factors rather than sexual orientation."
                    ]
                },
                {
                    title: "Travel and living abroad",
                    points: [
                        "If you have previously lived or travelled outside the country, where you’ve been may affect your ability to donate.",
                        "Travel to malaria-endemic areas usually requires a waiting period of 3 months to 1 year.",
                        "Extended residency in certain countries may lead to longer deferrals."
                    ]
                }
            ],
            learnMoreTitleStart: "Learn more about donating ",
            learnMoreTitleHighlight: "blood",
            learnMoreCards: [
                {
                    title: "Accessibility",
                    desc: "We are committed to making our donor centres as accessible and inclusive as possible for all. Find out how this affects your ability to donate.",
                    cta: "Find out more"
                },
                {
                    title: "False positive test results",
                    desc: "Every donation is tested for infectious diseases. Occasionally, a test may suggest disease is present when in fact, it is not. Find out how this affects your ability to donate.",
                    cta: "Find out more"
                },
                {
                    title: "Recent criteria changes",
                    desc: "Donor eligibility criteria change based on current scientific evidence. Donors who were previously deferred could now be eligible to donate. Don’t count yourself out.",
                    cta: "Find out more"
                }
            ],
            firstTimeBadge: "Impact Lives",
            firstTimeTitle: "First-time donor? ",
            firstTimeTitleHighlight: "Get started here.",
            firstTimeDescription: "Giving blood can save someone’s life. But for a donor, the experience can be deeply rewarding and validating. It’s about more than just giving a part of yourself to someone else; together, we’re saving each other. Experience what you get when you give, today.",
            firstTimeBtn: "Donate Now",
            frequencyTitle: "Donation ",
            frequencyTitleHighlight: "frequency",
            frequencyCards: [
                {
                    titleStart: "To donate ",
                    highlight: "blood",
                    subtitle: ", returning donors must wait:",
                    value: "90-120 days*",
                    footnote: "*Males (90 days), Females (120 days)"
                }
            ],
            supportTitle: "Ready to make a difference? Join Sanjivani's Lifeline today.",
            supportDonateBtn: "Donate Now",
            supportCallBtn: "Have questions? Call us"
        },
        onsiteDonorPage: {
            title: "Voluntary Camp Donation",
            description: "Find active blood donation camps near you. Register online to save time and help us prepare for your visit.",
            ongoingCamps: "Ongoing Camps",
            upcomingCamps: "Upcoming Camps",
            campHistory: "Camp History",
            registerHere: "Register Here",
            registerToDonate: "Register to Donate",
            viewRecords: "View Donation Records",
            completed: "Completed",
            noOngoing: "No ongoing camps at the moment.",
            noUpcoming: "No upcoming camps scheduled.",
            loadingCamps: "Loading Camps...",
            totalDonors: "Total Donors",
            totalDonations: "Total Donations",
            liveNow: "Live Now"
        },
        onsiteRegistrationForm: {
            steps: {
                identity: "Identity",
                contact: "Contact",
                history: "History",
                vitals: "Vitals",
                examination: "Examination"
            },
            fields: {
                firstName: "First Name",
                middleName: "Father / Husband Name",
                lastName: "Surname",
                sex: "Sex",
                dob: "Date of Birth",
                age: "Age",
                bloodGroup: "Blood Group",
                occupation: "Occupation",
                camp: "Current Camp / Location",
                address: "Full Address",
                mobile: "Mobile Number",
                pincode: "City Pincode",
                email: "Email Address",
                isFirstTime: "First Time Donor?",
                isRepeated: "Repeated Donor?",
                lastDonation: "Last Donation Date",
                totalDonations: "Total Donations to date",
                emergencyConsent: "Available for emergency calls?",
                weight: "Weight (kg)",
                hb: "HB (gm%)",
                temp: "Temp (°C)",
                pulse: "Pulse (/min)",
                bp: "BP (mmHg)",
                o2Level: "O2 Level (%)",
                pedalOedema: "Pedal Oedema",
                lymphadenopathy: "Lymphadenopathy",
                cyanosis: "Cyanosis",
                skinDisease: "Free from skin disease?",
                scars: "Free from scars/punctures?"
            },
            placeholders: {
                firstName: "ENTER NAME",
                middleName: "FATHER/HUSBAND",
                lastName: "LAST NAME",
                age: "Yrs",
                select: "Select",
                address: "Residential address",
                mobile: "10-DIGIT MOBILE",
                pincode: "423601",
                email: "email@example.com",
                weight: "kg",
                hb: "eg: 12.5",
                temp: "eg: 37.0",
                pulse: "eg: 72",
                bp: "eg: 120/80",
                o2Level: "eg: 98"
            },
            messages: {
                successTitle: "Thank you for registering!",
                successDesc: "Your donation details have been successfully recorded. We appreciate your contribution.",
                mandatoryError: "Please fill in all mandatory fields.",
                processing: "Processing...",
                completeBtn: "Complete & Consent",
                nextBtn: "Next Step",
                backBtn: "Back",
                homeBtn: "Go to Home",
                anotherBtn: "Register Another Donor"
            },
            options: {
                male: "Male",
                female: "Female",
                bloodGroupNotKnown: "Not Known",
                occupations: { student: "Student", service: "Service", business: "Business", selfEmployed: "Self Employed", housewife: "Housewife", other: "Other" },
                yes: "YES",
                no: "NO"
            }
        },
        incomingCampsPage: {
            title: "Incoming Blood Camps",
            description: "Stay informed about upcoming blood donation camps in and around Kopargaon. Join us in our mission to ensure no life is lost due to blood shortage.",
            location: "Location",
            schedule: "Schedule",
            contact: "Contact",
            email: "Email",
            confirmed: "Confirmed",
            registerBtn: "Register to Donate",
            directionsBtn: "Get Directions",
            defaultDescription: "Upcoming blood donation camp.",
            defaultPhone: "+91 94222 23117",
            defaultEmail: "camps@sanjivanibloodbank.org"
        },
        bloodTypePage: {
            heroBadge: "Blood Basics",
            heroTitleStart: "What is my ",
            heroTitleHighlight: "blood type?",
            heroDescription: "Your blood type is determined by the presence or absence of certain antigens — substances that can trigger an immune response. Understanding your blood type is important for safe transfusions, donations, and medical emergencies.",
            howToFindTitle: "How to find out your blood type",
            howToFindText: "The easiest way to find out your blood type is to donate blood. When you donate with us, your blood will be tested and your blood type will be confirmed. You'll receive your blood type information on your donor card and in your donor profile. You can also ask your doctor for a blood typing test during a routine check-up, or purchase a home blood typing kit from a pharmacy.",
            mostCommonTitle: "What is the most common blood type?",
            mostCommonText: "O-positive (O+) and B-positive (B+) are the most common blood types in India, each found in approximately 32% of the population. Because they are so prevalent, these blood types are always in high demand at hospitals and blood banks. If you have O+ or B+ blood, your donations are especially valuable and needed on a regular basis.",
            mostCommonBadge: "Most Common",
            universalDonorTitle: "What is the universal donor blood type?",
            universalDonorText1: "O-negative (O−) is known as the universal donor blood type because O− red blood cells can be transfused to patients of any blood type. This makes it the blood type most often used in emergencies when there's no time to determine a patient's blood type. O− blood is always in critical demand — only about 6.6% of the population has this type. If you are O−, your blood is literally a lifesaver for anyone in crisis.",
            universalDonorText2: "Similarly, AB-positive (AB+) is the universal recipient — AB+ patients can receive red blood cells from donors of any blood type. And AB plasma (both AB+ and AB−) is universal plasma and can be given to patients of any blood type.",
            typesTitleStart: "How many different ",
            typesTitleHighlight: "blood types",
            typesDescription: "There are 8 main blood types determined by the ABO group system and the Rh factor (positive or negative). Each type has unique properties that determine who you can donate to and receive from.",
            bloodTypes: [
                { type: "O+", percent: "32.5%", description: "One of the most common types in India. Can donate red blood cells to any Rh-positive type." },
                { type: "B+", percent: "32.1%", description: "Equally common as O+ in India. Can donate to B+ and AB+ recipients." },
                { type: "A+", percent: "22.5%", description: "Common type in India. Can donate to A+ and AB+ recipients." },
                { type: "AB+", percent: "7.7%", description: "Universal plasma donor. Found in about 8% of the Indian population." },
                { type: "O−", percent: "2.0%", description: "Universal red cell donor. Rare in India, comprising only 2% of the population." },
                { type: "B−", percent: "1.5%", description: "Rare in India. Can donate red cells to B+, B−, AB+, and AB− recipients." },
                { type: "A−", percent: "1.4%", description: "Rare in India. Can donate red cells to A+, A−, AB+, and AB− recipients." },
                { type: "AB−", percent: "0.3%", description: "Rarest blood type in India. Universal plasma donor." }
            ],
            bloodFacts: [
                { type: "AB+", heading: "AB-positive patients can receive red blood cells from all eight blood types — making them universal recipients.", body: "While AB+ is fortunate in receiving, it is also the universal plasma donor, meaning their plasma can be given to patients of any blood type." },
                { type: "AB−", heading: "AB-negative is the rarest blood type, found in less than 1% of the Indian population.", body: "Despite being rare, AB− donors are incredibly valuable as universal plasma donors, and their red cells can be given to all AB and AB-negative patients." },
                { type: "O−", heading: "O-negative is the universal donor for red blood cells — it can be given to anyone in an emergency.", body: "Because O-negative blood can be transfused to any patient regardless of their blood type, it is always in high demand and often the first blood used in trauma situations." },
                { type: "O+", heading: "O-positive is the most needed blood type, used in 37% of all red blood cell transfusions.", body: "As the most common blood type, O+ blood is constantly needed by hospitals. O+ donors are encouraged to donate regularly to help maintain stable supplies." }
            ],
            compatTitleStart: "Blood type ",
            compatTitleHighlight: "compatibility",
            compatDescription: "Not all blood types are compatible. The chart below shows which blood types a recipient can safely receive red blood cells from.",
            compatRecipientHeader: "Recipient ↓ / Donor →",
            rareBloodTitle: "Rare blood program",
            rareBloodText1: "Some people have blood types that are extremely rare or have unusual antigen combinations that go beyond the standard ABO/Rh system. Our Rare Blood Program maintains a registry of donors with rare blood types to ensure that patients with uncommon blood needs can receive safe, compatible transfusions.",
            rareBloodText2: "If you have been told you have a rare blood type, or if your blood has been difficult to cross-match in the past, please contact us. Your donations could be the only option for a patient in need.",
            distributionTitle: "Blood type distribution in India",
            mostNeededTitle: "Most needed blood types",
            mostNeeded: [
                { type: "O+", reason: "Used most often in transfusions; always in high demand due to large number of O+ patients." },
                { type: "O−", reason: "Universal donor — critical for emergencies. Only 6.6% of the population has this type." },
                { type: "A+", reason: "Second most common type; needed for A+ and AB+ patients in surgeries and treatments." },
                { type: "B+", reason: "Essential for B+ and AB+ recipients; demand often exceeds supply during festivals and monsoons." }
            ],
            unknownTitle: "Don't know your blood type?",
            unknownText: "The simplest way to find out is to donate blood. We'll test your blood and let you know your type — and you'll save a life in the process.",
            bookAppointment: "Book an Appointment",
            questionsTitle: "Have questions? Reach out to us."
        },
        donationProcessPage: {
            heroBadge: "Step-by-Step Guide",
            heroTitle: "Blood donation process",
            heroDescription: "Donating blood is a safe, simple, and rewarding experience. Whether it's your first time or you're a regular donor, here's everything you need to know about what happens before, during, and after your donation.",
            bookAppointmentBtn: "Book an appointment",
            checkEligibilityBtn: "Check eligibility",
            beforeTitle: "Before you donate",
            beforeDescription: "A little preparation goes a long way in making your donation experience smooth and comfortable. Follow these tips before your visit.",
            beforeTips: [
                { title: "Eat well", desc: "Have a healthy, iron-rich meal at least 2–3 hours before donating. Avoid fatty or fried foods as they can affect blood test results." },
                { title: "Stay hydrated", desc: "Drink plenty of water and fluids in the 24 hours before your donation. Being well-hydrated makes the process faster and more comfortable." },
                { title: "Get enough rest", desc: "Make sure you have had a good night's sleep (at least 6–8 hours) before your appointment." },
                { title: "Avoid alcohol", desc: "Do not consume alcohol for at least 24 hours before donating. Alcohol can cause dehydration and affect your blood test results." },
                { title: "Bring valid ID", desc: "Carry a valid photo ID (Aadhaar, PAN card, driving licence, or passport) when you come to donate." },
                { title: "Know your medications", desc: "Make a list of any medications you are currently taking. Some medications may require a temporary deferral." }
            ],
            duringTitleStart: "What happens ",
            duringTitleHighlight: "during your visit",
            duringDescription: "The entire donation process takes about 45 minutes to 1 hour. Here's a step-by-step breakdown.",
            processSteps: [
                { title: "Registration", desc: "When you arrive at the donor centre, you will be asked to fill out a registration form with your personal details and medical history. This is kept confidential and helps us ensure your donation is safe.", duration: "5–10 min" },
                { title: "Health screening", desc: "A trained healthcare professional will check your blood pressure, pulse, temperature, and hemoglobin level. You will also be asked a series of confidential health questions (the donor questionnaire) to determine your eligibility.", duration: "10–15 min" },
                { title: "The donation", desc: "You will be seated comfortably in a reclining chair. A sterile, single-use needle is gently inserted into a vein in your arm. The actual blood collection takes about 8–10 minutes, during which approximately 350–450 ml of blood is collected. The entire process is safe, hygienic, and virtually painless.", duration: "8–10 min" },
                { title: "Refreshments & rest", desc: "After donating, you will rest for 10–15 minutes in our refreshment area. You will be offered snacks, juice, and water. This helps your body begin to replenish fluids. Our staff will monitor you to ensure you feel well before leaving.", duration: "10–15 min" }
            ],
            totalTimeText: "Total time: approximately 45 minutes to 1 hour",
            questionnaireTitle: "Donor questionnaire",
            questionnaireDescription: "Before every donation, you will be asked to complete a donor questionnaire. This is an essential part of ensuring the safety of both the donor and the recipient. Here's what you should know:",
            questionnairePoints: [
                "The questionnaire is a standard part of every blood donation — for both new and returning donors.",
                "It includes questions about your general health, travel history, medications, and lifestyle.",
                "All responses are completely confidential and are used only to assess your eligibility.",
                "The questionnaire is reviewed by a trained healthcare professional before your donation.",
                "If you have any concerns about a question, our staff are happy to explain in a private setting.",
                "You can review the questionnaire in advance on our website to prepare for your visit."
            ],
            redBannerTitle: "Every donation can save up to 3 lives.",
            redBannerText: "Your single donation is separated into red cells, plasma, and platelets.",
            donateNowBtn: "Donate Now",
            afterBadge: "Post-donation care",
            afterTitle: "Relax and refresh",
            afterDescription: "After your donation, it's important to take care of yourself. Your body will replace the donated blood volume within 24–48 hours, and red blood cells are fully replenished within 4–6 weeks. Follow these guidelines at home:",
            afterTips: [
                "Drink extra fluids (water, juice) for the next 24–48 hours.",
                "Eat a full, nutritious meal within a few hours of donating.",
                "Avoid strenuous physical activity or heavy lifting for at least 12 hours.",
                "Avoid alcohol for at least 24 hours after donating.",
                "If you feel dizzy or lightheaded, lie down and elevate your legs until the feeling passes.",
                "Keep the bandage on your arm for at least 4–6 hours after donation."
            ],
            honourTitle: "A donation in your honour",
            honourText1: "Did you know you can dedicate your blood donation to someone special? Whether it's a friend, family member, or a loved one who has benefited from blood products — you can make your donation in their honour. Simply let our staff know at the donor centre, and we'll provide a dedication card that you can give to the person you're honouring.",
            honourText2: "It's a meaningful way to turn your generosity into a personal gesture and inspire others to donate as well.",
            accessibilityTitle: "Accessibility & interpreting services",
            accessibilityDescription: "We are committed to making blood donation accessible to everyone. Our donor centres offer the following services and accommodations:",
            accessibilityServices: [
                { title: "Wheelchair accessible", desc: "All donor centres are fully wheelchair accessible, with adapted donation chairs and accessible restrooms." },
                { title: "Language support", desc: "Many of our centres offer multi-language support, including Hindi, Marathi, and English. Interpreting services are available on request." },
                { title: "Support for anxious donors", desc: "If you feel nervous about donating, our staff are trained to help you feel comfortable. Let us know and we'll provide extra care." },
                { title: "Privacy & confidentiality", desc: "All health information and questionnaire responses are kept strictly confidential and used only for donation safety." }
            ],
            faqTitle: "Frequently asked questions",
            faqs: [
                { q: "Does donating blood hurt?", a: "You may feel a brief pinch when the needle is inserted, similar to a blood test. After that, most donors feel no discomfort at all during the donation." },
                { q: "How long does the entire process take?", a: "The total visit takes about 45 minutes to 1 hour, including registration, screening, the donation itself (8–10 minutes), and the refreshment/rest period." },
                { q: "How often can I donate blood?", a: "In India, males can donate whole blood every 90 days (3 months), and females every 120 days (4 months). Platelet donors can give every 14 days." },
                { q: "What happens to my blood after donation?", a: "Your blood is tested, processed, and separated into components (red cells, plasma, platelets). It is then stored and distributed to hospitals and patients in need." },
                { q: "Can I donate if I have a tattoo or piercing?", a: "Yes, you are eligible to donate blood 12 months after getting a tattoo or a piercing. Ear piercings with a sterile single-use gun standard may be accepted earlier." }
            ],
            supportTitle: "Have questions? We're here to help."
        },
        donationCriteriaChangesPage: {
            heroBadge: "Latest Updates",
            heroTitleStart: "Recent changes to ",
            heroTitleHighlight: "donation criteria",
            heroDescription1: "Donation eligibility criteria are reviewed and updated regularly to reflect the latest medical research, government guidelines, and global best practices. This page lists all recent changes in chronological order.",
            heroDescription2: "If you were previously deferred, these updates may affect your eligibility. Please review the changes below or contact our team for a confidential reassessment.",
            redBannerTitle: "Thousands more may now be eligible to donate!",
            redBannerText: "Review the latest criteria changes to see if you qualify.",
            checkEligibilityBtn: "Check Eligibility",
            updatesTitle: "All updates",
            updatesSubtitle: "Listed in reverse chronological order, with the most recent changes first.",
            updates: [
                { date: "January 15, 2025", title: "Hemoglobin threshold maintained for safety", body: "Minimum hemoglobin level for all donors remains at 12.5 g/dL, ensuring donor health and safety. We continue to use high-precision HemoCue machines for accurate pre-donation screening." },
                { date: "November 22, 2024", title: "Tattoo and piercing deferral period remains 12 months", body: "To ensure maximum safety against transfusion-transmitted infections, we maintain a 12-month deferral period for tattoos and body piercings. This professional standard helps protect the blood supply while allowing donors to return once the safety window is complete." },
                { date: "September 8, 2024", title: "Travel deferral for malaria-endemic areas revised", body: "Donors who have travelled to malaria-endemic zones now face a 3-month deferral period, reduced from the previous 6-month requirement. This revision is based on updated epidemiological data from the WHO and the National Centre for Disease Control (NCDC). Donors returning from sub-Saharan Africa or certain parts of Southeast Asia should consult with our team for a personalised assessment." },
                { date: "July 1, 2024", title: "Upper age limit extended for repeat donors", body: "Regular donors who are in good health may now continue donating up to the age of 68, increased from the previous limit of 65. This applies to returning donors with a consistent donation history and requires annual medical certification from a registered physician. First-time donors must still be between 18 and 60 years old." },
                { date: "April 20, 2024", title: "COVID-19 vaccination deferral removed", body: "The 14-day deferral period following COVID-19 vaccination (all approved vaccines) has been removed. Donors may now give blood immediately after vaccination provided they feel well and have no fever or systemic symptoms. This change applies to all primary doses and boosters." },
                { date: "February 5, 2024", title: "Platelet donation interval shortened", body: "The minimum interval between platelet (apheresis) donations has been reduced from 14 days to 7 days for healthy, regular platelet donors. This allows more frequent contributions from experienced donors and helps address seasonal shortages. Donors must meet all standard platelet eligibility criteria at each visit." },
                { date: "December 12, 2023", title: "Medication deferral list updated", body: "Several common over-the-counter medications have been removed from the deferral list. Donors taking antihistamines (e.g., cetirizine, loratadine), mild analgesics (e.g., paracetamol), and antacids are now eligible to donate without a waiting period. Prescription blood thinners (e.g., warfarin, heparin) still require a deferral — please consult our screening team." },
                { date: "October 3, 2023", title: "Weight requirement clarification", body: "Updated weight criteria now incorporate BMI alongside absolute weight for a more personalized eligibility assessment. While the minimum weight remains 45 kg for whole blood donations, donors with BMI below 18.5 may be asked to undergo additional screening. Platelet donations continue to require a minimum weight of 50 kg." },
                { date: "August 18, 2023", title: "Dental procedure deferral updated", body: "The deferral period following routine dental procedures (cleanings, fillings) has been reduced from 72 hours to 24 hours. More invasive dental surgery, such as extractions or root canals, continues to require a 7-day deferral. Donors are advised to inform our team about any recent dental work during screening." },
                { date: "June 30, 2023", title: "Iron supplement recommendation for repeat donors", body: "Effective immediately, all repeat donors (3 or more donations per year) will be offered iron supplement guidance after each donation. This is a preventive measure to maintain healthy iron stores and is based on recommendations from the Indian Journal of Haematology and Blood Transfusion. Supplements are available free of charge at all our donor centres." },
                { date: "March 15, 2023", title: "Sexual behaviour-based deferral policy updated", body: "In line with evolving global best practices, our screening criteria have moved from blanket deferrals based on orientation to an individualized risk assessment model. All prospective donors are now assessed equally based on recent sexual behaviour risk factors, regardless of gender identity or sexual orientation." },
                { date: "January 1, 2023", title: "Post-pregnancy deferral period clarified", body: "In accordance with national guidelines, the post-delivery deferral period is 12 months to allow for full maternal recovery. For miscarriage or termination of pregnancy, a 6-month deferral applies. These standards ensure the well-being of the mother before resuming voluntary blood donation." }
            ],
            ctaBadge: "Ready to donate?",
            ctaTitleStart: "With updated criteria, more people than ever ",
            ctaTitleHighlight: "may be eligible.",
            ctaText: "Check your eligibility and schedule your donation today. Every donation can save up to three lives.",
            bookBtn: "Book Appointment",
            fullCriteriaBtn: "Full Eligibility Criteria",
            supportTitle: "If you have questions or need support, please reach out:"
        },
        donorWellnessPage: {
            heroBadge: "Your Safety Matters",
            heroTitleStart: "Donor wellness ",
            heroTitleHighlight: "and safety",
            heroDescription: "Your health and safety are our top priority — before, during, and after every donation. We follow the highest medical standards and safety protocols to ensure that donating blood is a safe, comfortable, and positive experience for every donor.",
            onPageIntro: "On this page, you'll find:",
            onPageList: [
                "Answers to frequently asked questions about the donation process",
                "Our safety protocols and what we do to protect you",
                "Common side effects and how to manage them",
                "Iron and nutrition guidance for regular donors"
            ],
            faqSectionTitleStart: "Frequently asked questions about the ",
            faqSectionTitleHighlight: "blood donation process",
            faqSectionSubtitle: "Click any question below to see the full answer.",
            faqs: [
                { q: "What should I do if I don't feel well after donating?", a: "It is normal to feel slightly lightheaded or dizzy after donating. If this happens, sit or lie down immediately and elevate your legs. Apply a cold compress to your forehead and drink fluids. Most symptoms resolve within a few minutes. If you continue to feel unwell after 15–20 minutes, contact our donor helpline or visit our nearest centre for assistance. Do not drive or operate heavy machinery until you feel completely normal." },
                { q: "Is donating blood safe?", a: "Yes, donating blood is extremely safe. All equipment used — including needles, bags, and tubing — is sterile, single-use, and disposed of after each donation. There is absolutely no risk of contracting any infection from donating blood. Our staff are trained medical professionals who follow strict safety protocols at every step." },
                { q: "How much blood is taken during a donation?", a: "During a standard whole blood donation, approximately 350–450 ml of blood is collected, which is less than 10% of the total blood volume in an average adult. Your body begins to replenish the lost volume within hours and fully restores it within 24–48 hours. Red blood cells are completely replaced within 4–6 weeks." },
                { q: "Will I feel tired or weak after donating?", a: "Most donors feel perfectly normal after donating. Some may experience mild fatigue or tiredness for the rest of the day. This is normal and can be managed by staying hydrated, eating well, and avoiding strenuous activity for 12–24 hours. If you feel persistently tired beyond 24 hours, please contact our helpline." },
                { q: "Can I exercise after donating blood?", a: "We recommend avoiding strenuous physical activity, heavy lifting, and intense exercise for at least 12 hours after your donation. Light activities like walking are fine. After 24 hours, most donors can resume their normal exercise routine. Listen to your body — if you feel any dizziness or weakness during exercise, stop and rest." },
                { q: "What should I eat and drink before and after donating?", a: "Before donating, eat a healthy, iron-rich meal (such as spinach, lentils, or lean meat) and drink plenty of water. Avoid fatty or fried foods as they can affect blood testing. After donating, eat a nutritious snack and drink extra fluids — water, juice, or milk — for the next 24–48 hours. Avoid alcohol for at least 24 hours after donating." },
                { q: "What if I have a bruise at the needle site?", a: "Occasional bruising at the needle insertion site is normal and harmless. It occurs when a small amount of blood leaks under the skin. Apply a cold pack to the area for the first 24 hours to reduce swelling, then switch to a warm compress. The bruise will typically fade within 1–2 weeks. If the bruise is unusually large, painful, or doesn't improve, please contact us." },
                { q: "Can I donate blood if I am on medication?", a: "It depends on the medication. Many common medications — including vitamins, antihistamines (e.g., cetirizine), paracetamol, and most birth control pills — do not prevent you from donating. However, some medications like blood thinners (warfarin, heparin), certain antibiotics, and acne medications (e.g., isotretinoin) require a temporary deferral. Always inform our screening staff about all medications you are taking." },
                { q: "How often can I donate blood?", a: "In India, males can donate whole blood every 90 days (3 months), and females every 120 days (4 months). Platelet donors can donate every 14 days, up to 24 times per year. These intervals allow your body sufficient time to fully replenish the donated components." },
                { q: "Is there an age limit for blood donation?", a: "In India, healthy individuals aged 18 to 65 can donate blood. First-time donors must be between 18 and 60 years old. Repeat donors in good health may be eligible up to age 65 (extendable up to 68 with medical certification). Individuals under 18 years of age are not eligible to donate." }
            ],
            redBannerTitle: "Your safety is our highest priority.",
            redBannerText: "Every step of the donation process is designed to protect you.",
            viewProcessBtn: "View Donation Process",
            protocolsTitle: "Our safety protocols",
            protocolsDescription: "We adhere to the strictest national and international safety standards to ensure every donation is safe for both the donor and the recipient.",
            safetyProtocols: [
                { title: "Sterile, single-use equipment", desc: "Every needle, bag, and tube used in the donation process is brand new, sterile, and used only once. After your donation, all equipment is safely disposed of. There is zero risk of infection from donating blood." },
                { title: "Thorough health screening", desc: "Before every donation, a trained healthcare professional checks your blood pressure, pulse, temperature, hemoglobin level, and reviews your health history to ensure you are fit to donate safely." },
                { title: "Strict testing of all donations", desc: "Every unit of donated blood is tested for HIV, Hepatitis B, Hepatitis C, syphilis, and malaria. Any unit that does not pass these tests is safely discarded and the donor is confidentially notified." },
                { title: "Continuous donor monitoring", desc: "During and after your donation, our staff continuously monitor your wellbeing. If you feel any discomfort at any point, our team will immediately assist you and provide appropriate care." },
                { title: "Adverse reaction management", desc: "Although rare, our centres are fully equipped to handle any adverse reactions. All staff are trained in first aid and emergency response. You will never be left unattended during or after your donation." },
                { title: "Confidential health information", desc: "All personal and medical information you provide during the screening process is kept strictly confidential and is used only for determining your eligibility and ensuring the safety of the blood supply." }
            ],
            sideEffectsTitle: "Common side effects & how to manage them",
            sideEffectsDescription: "Most donors feel perfectly fine after donating. In rare cases, some mild side effects may occur. Here's what to expect and how to handle them.",
            sideEffectsTableHeaders: { effect: "Side Effect", likelihood: "Likelihood", whatToDo: "What to Do" },
            sideEffects: [
                { effect: "Lightheadedness or dizziness", likelihood: "Occasional", what: "Sit or lie down. Elevate your legs. Drink water or juice. Symptoms usually pass within a few minutes." },
                { effect: "Bruising at needle site", likelihood: "Occasional", what: "Apply cold compress for 24 hours, then warm compress. The bruise fades within 1–2 weeks." },
                { effect: "Mild fatigue", likelihood: "Common", what: "Rest, stay hydrated, and eat well. Avoid heavy exercise for 12 hours. Usually resolves within a day." },
                { effect: "Soreness at needle site", likelihood: "Common", what: "This is normal and temporary. Avoid heavy lifting with the arm used for donation for a few hours." },
                { effect: "Fainting", likelihood: "Rare", what: "Lie down immediately. Our staff will assist you. Do not leave the centre until you feel fully recovered." }
            ],
            ironTitle: "Iron & nutrition guidance for donors",
            ironDescription: "Iron is essential for producing healthy red blood cells. Regular donors should pay special attention to maintaining healthy iron levels. Here are practical tips:",
            ironTips: [
                "Include iron-rich foods in your diet: spinach, lentils (dal), chickpeas (chana), kidney beans (rajma), jaggery (gur), dates, and lean meats.",
                "Pair iron-rich foods with vitamin C sources (citrus fruits, tomatoes, bell peppers) to enhance absorption.",
                "Avoid tea and coffee with meals, as tannins can reduce iron absorption.",
                "If you donate regularly (3+ times/year), consider an iron supplement — consult your doctor or ask our staff.",
                "Calcium and dairy products can inhibit iron absorption when consumed with iron-rich foods. Space them apart.",
                "Cooking in cast-iron vessels can increase the iron content of your food."
            ],
            whenToSeekTitle: "When to seek medical attention",
            whenToSeekText: "While serious complications from blood donation are extremely rare, please contact us or seek medical attention if you experience any of the following after your donation:",
            whenToSeekItems: [
                "Prolonged bleeding from the needle site that doesn't stop after applying pressure for 10+ minutes",
                "Persistent dizziness or fainting more than 30 minutes after donation",
                "Signs of infection at the needle site — redness, swelling, warmth, or pus",
                "Tingling or numbness in the arm that persists beyond a few hours",
                "Fever or chills developing within 24 hours of donation",
                "Severe or worsening pain at the needle site"
            ],
            helplineText: "If you experience any of the above, call our donor helpline at {phone} or visit the nearest medical facility.",
            ctaTitle: "Ready to donate? Your safety is guaranteed.",
            ctaText: "Book your appointment today and experience a safe, comfortable, and life-saving donation.",
            bookBtn: "Book Appointment",
            checkEligibilityBtn: "Check Eligibility",
            contactTitle: "Have concerns? Contact our donor support team."
        },
        teamPage: {
            badge: "Our People",
            title: "Meet Our ",
            titleHighlight: "Team",
            description: "Dedicated professionals working together to save lives and make a difference.",
            members: [
                { name: "Dr. A.B. Pawar", role: "Dean Academics SCOE & Project Consultant" },
                { name: "Smitraj Bankar", role: "Developer & Project Lead" }
            ]
        },
        hospitalPortal: {
            portalTitle: "Hospital Portal",
            emailLabel: "Email Address",
            emailPlaceholder: "hospital@example.com",
            emailDescription: "Enter your registered email address to receive a verification code.",
            proceedBtn: "Proceed",
            verificationTitle: "Verification",
            verificationText: "We have sent an authentication code to",
            codeExpires: "Code expires in",
            codeExpired: "Code has expired.",
            verifyBtn: "Verify",
            resendBtn: "Resend Code",
            resendCooldownText: "Resend ({s}s)",
            changeEmailBtn: "Change Email",
            invalidEmail: "Please enter a valid email address.",
            unregisteredEmail: "This email address is not registered with our blood bank portal.",
            codeExpiredMessage: "Code expired. Please request a new one.",
            verifiedSuccess: "Verified Successfully",
            loading: "Loading...",
            connectedPortal: "Connected portal — Live Stock Directory",
            updated: "Updated",
            refresh: "Refresh",
            signOut: "Sign Out",
            bloodComponent: "Blood Component",
            totals: "Totals",
            totalAvailable: "Total Available",
            legendTitle: "Inventory Supply Indicators:",
            criticalSupply: "Critical Supply (0 Bags)",
            lowSupply: "Low Supply (1-3 Bags)",
            healthySupply: "Healthy Supply (4+ Bags)",
            footerNote: "All values reflect real-time active stock count."
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
            bookNow: "बुक करा",
            brandPrefix: "ब्लड",
            brandSuffix: "बँक",
            brandTagline: "कोपरगाव",
            mainLinks: [
                {
                    label: "रक्त",
                    href: "/",
                    columns: [
                        {
                            title: "मी रक्तदान करू शकतो का?",
                            links: [
                                { label: "पात्रता निकष जाणून घ्या", href: "/eligibility-criteria" },
                                { label: "दान निकषातील अलीकडील बदल", href: "/donation-criteria-changes" }
                            ]
                        },
                        {
                            title: "रक्तदान करणे",
                            links: [
                                { label: "प्रथमच रक्तदाता", href: "/donate" },
                                { label: "माझा रक्तगट कोणता?", href: "/blood-type" },
                                { label: "दान प्रक्रिया", href: "/donation-process" },
                                { label: "दाता कल्याण आणि सुरक्षा", href: "/donor-wellness" }
                            ]
                        }
                    ]
                },

                {
                    label: "दान करण्याचे मार्ग",
                    href: "/donate",
                    columns: [
                        {
                            title: "दान पर्याय",
                            links: [
                                { label: "अपॉइंटमेंट बुक करा", href: "/donate" }
                            ]
                        }
                    ]
                },
                {
                    label: "आमच्याबद्दल",
                    href: "/about",
                    columns: [
                        {
                            title: "आमची संस्था",
                            links: [
                                { label: "आमचे ध्येय", href: "/about" },
                                { label: "आमचा इतिहास", href: "/about" }
                            ]
                        }
                    ]
                },
                {
                    label: "रक्तदान",
                    href: "/onsite-donor",
                    columns: [
                        {
                            title: "रक्तदान सेवा",
                            links: [
                                { label: "स्वैच्छिक शिबिर रक्तदान", href: "/onsite-donor" }
                            ]
                        }
                    ]
                }
            ]
        },
        pageNotFound: {
            title: "४०४ - पृष्ठ सापडले नाही",
            subtitle: "तुम्ही शोधत असलेले पृष्ठ काढले गेले असावे, त्याचे नाव बदलले असावे किंवा ते तात्पुरते अनुपलब्ध असू शकते.",
            backHome: "मुख्यपृष्ठावर जा"
        },
        misc: {
            backToTop: "वर जा"
        },
        about: {
            title: "संजीवनी ब्लड बँकेबद्दल",
            titleLine1Start: "माणुसकीची सेवा ",
            titleLine1Highlight: "सुरक्षित रक्त",
            titleLine1End: " द्वारे, ३२ वर्षांपासून.",
            mission: "आमचे ध्येय",
            missionText: "रक्ताच्या अनुपलब्धतेमुळे कोणाचाही मृत्यू होऊ नये.",
            description: "संजीवनी ब्लड बँक, कोपरगाव ही ग्रामीण आणि तालुका स्तरावरील एक अग्रगण्य रक्तपेढी आहे, जी ३२ वर्षांपासून अविरत समाजसेवा करत आहे. १९९३ मध्ये जेव्हा कोपरगावमध्ये एकही रक्तपेढी नव्हती, तेव्हा याची स्थापना झाली.",
            servingTitle: "कार्यक्षेत्र",
            talukas: ["कोपरगाव", "वैजापूर", "येवला", "शिर्डी", "राहाता", "मनमाड"],
            statLabels: { years: "वर्षांची सेवा", lives: "प्रभावित जीवन", emergency: "आणीबाणी सहाय्य", rural: "ग्रामीण समर्पण" }
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
        campDonation: {
            badge: "स्वैच्छिक शिबिर रक्तदान",
            title: "आपल्या परिसरात रक्तदान",
            titleHighlight: "शिबिर आयोजित करा",
            description: "आम्ही कोपरगाव आणि आसपासच्या तालुक्यांमध्ये महाविद्यालये, कार्यालये आणि सामुदायिक कार्यक्रमांमध्ये स्वैच्छिक रक्तदान शिबिरे आयोजित करतो — प्रमाणित वैद्यकीय कर्मचारी, मोफत तपासणी आणि प्रत्येक दात्यासाठी अल्पोपाहारासह.",
            points: [
                { title: "वैद्यकीय पथक उपलब्ध", desc: "पात्र डॉक्टर आणि तंत्रज्ञ तपासणी व संकलन सुरक्षितपणे करतात." },
                { title: "मोफत आरोग्य तपासणी", desc: "प्रत्येक दात्याला विनामूल्य मूलभूत आरोग्य तपासणी मिळते." },
                { title: "संस्था व गटांसाठी योग्य", desc: "महाविद्यालये, कंपन्या आणि सामुदायिक संस्थांसाठी आदर्श." },
                { title: "सोपी ऑनलाइन नोंदणी", desc: "सुरू असलेली व आगामी शिबिरे पहा आणि काही मिनिटांत नोंदणी करा." }
            ],
            cta: "शिबिर रक्तदानासाठी तपासा व नोंदणी करा"
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
            intro: "आम्ही रक्तदात्याची आणि रुग्णाची काळजी घेण्यासाठी आंतरराष्ट्रीय वैद्यकीय नियमांचे पालन करतो. रक्त संकलन ते साठवणूक, गुणवत्ता हीच आमची प्राथमिकता आहे.",
            items: [
                "रक्तदानापूर्वी काटेकोर वैद्यकीय तपासणी",
                "HemoCue द्वारे हिमोग्लोबिन तपासणी",
                "केवळ निर्जंतुक, सिंगल-युज किट्सचा वापर",
                "वैद्यकीय मानकांनुसार रक्त साठवणूक (+4°C to -15°C)",
                "साठवलेल्या रक्ताची निरंतर देखरेख",
                "थॅलेसेमिया तपासणी मोहीम"
            ],
            tempControlledTitle: "तापमान नियंत्रित",
            tempControlledDesc: "सातत्याने +4°C ते -15°C दरम्यान राखले जाते"
        },
        campaign: {
            title: "वाढदिवस साजरा करा जीवदान देऊन",
            subtitle: "केक कापण्याऐवजी, कोणालातरी जीवनाची दुसरी संधी द्या.",
            occasions: ["वाढदिवस", "लग्नाचा वाढदिवस", "विशेष प्रसंग"],
            cta: "आता रक्तदान करा!"
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
            wordmark: "संजीवनी ब्लड बँक",
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
            phoneBooking: "फोन बुकिंग: २४/७",
            copyright: "© {year} संजीवनी ब्लड बँक. ByteNinjaTeam द्वारे डिझाइन आणि विकसित.",
            privacy: "गोपनीयता",
            terms: "अटी",
            cookies: "कुकीज"
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
            medicalWarning: "तुम्हाला गेल्या ३ महिन्यात कोणताही आजार, शस्त्रक्रिया किंवा औषधोपचार झाला आहे का?",
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
            noHealthy: "नाही, मी निरोगी आहे",
            registrationSuccessTitle: "नोंदणी यशस्वी झाली!",
            genderOptions: ["पुरुष", "स्त्री", "इतर"],
            age: "वय",
            agePlaceholder: "वर्षे",
            donationFrequency: "रक्तदान वारंवारता (प्रति वर्ष)",
            donationFrequencyOptions: ["१ वेळा (दरवर्षी)", "२ वेळा (दर ६ महिन्यांनी)", "३ वेळा (दर ४ महिन्यांनी)", "४ वेळा (दर ३ महिन्यांनी)"],
            wantReminder: "पुढील रक्तदानासाठी मला आठवण करून द्या",
            reminderDaysLabel: "यापूर्वी आठवण करा",
            reminderDaysOptions: ["१ दिवस", "३ दिवस", "१ आठवडा"],
            predictedReminderDate: "या दिवशी तुम्हाला आठवण करून दिली जाईल:"
        },
        feedback: {
            badge: "अभिप्राय",
            title: "तुमचा अभिप्राय महत्त्वाचा आहे",
            subtitle: "आम्हाला आमच्या सेवा सुधारण्यास मदत करा. तुमच्या सूचना आमच्यासाठी मौल्यवान आहेत.",
            placeholder: "तुमचे विचार, सूचना किंवा अनुभव सामायिक करा...",
            submitBtn: "अभिप्राय सबमिट करा",
            saving: "जतन करत आहे...",
            successMessage: "तुमच्या अभिप्रायाबद्दल धन्यवाद!",
            errorMessage: "अभिप्राय सबमिट करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा."
        },
        donatePage: {
            badge: "रक्तदान करा, जीवन वाचवा",
            titleStart: "तुमची ",
            titleHighlight: "१५ मिनिटे",
            titleEnd: " ३ कुटुंबांचे जीवन वाचवू शकतात.",
            description: "हिरोंच्या समुदायात सामील व्हा. सुरक्षित, निर्जंतुक आणि सोपी प्रक्रिया.",
            features: [
                { title: "अतिशय जलद", desc: "संपूर्ण प्रक्रियेस ~४५ मिनिटे लागतात" },
                { title: "१००% सुरक्षित", desc: "निर्जंतुक किट आणि तज्ञांची काळजी" },
                { title: "मोफत आरोग्य तपासणी", desc: "रक्तदाब, हिमोग्लोबिन आणि प्राथमिक चाचणी" }
            ]
        },
        eligibilityCriteriaPage: {
            heroBadge: "पात्रता निकष",
            heroTitleStart: "मी दानासाठी पात्र आहे ",
            heroTitleHighlight: "का?",
            heroDescription1: "रक्तदान करण्यात स्वारस्य दाखवल्याबद्दल धन्यवाद! या विभागात तुमच्या अपॉइंटमेंटपूर्वी तुम्हाला पडणाऱ्या सामान्य प्रश्नांची उत्तरे आहेत, ज्यामुळे तुम्ही दान करण्यास पात्र आहात की नाही हे ठरवण्यास मदत होईल.",
            heroDescription2: "आम्ही सर्व देणगीदारांना अपॉइंटमेंट बुक करण्यापूर्वी पात्रता निकष वाचण्यास प्रोत्साहित करतो. कृपया लक्षात ठेवा की दात्याची पात्रता काळानुसार बदलू शकते. पात्रतेबाबत अंतिम निर्णय आमच्या रक्तकेंद्राच्या कर्मचाऱ्यांकडून दानाच्या वेळी घेतला जाईल.",
            redBannerSubtitle: "एक पाऊल पुढे",
            redBannerTitle: "तुमच्या वेळेचा फक्त एक तास एखाद्याचे आयुष्य बदलू शकतो.",
            topicsTitleStart: "तुम्ही दान करण्यास पात्र आहात का हे शोधण्यासाठी खालील विषय ",
            topicsTitleHighlight: "एक्सप्लोर करा",
            topicsDescription: "विविध घटक एखादी व्यक्ती कोणत्याही वेळी दान करू शकते की नाही हे ठरवू शकतात. कधीकधी, दान करणे शक्य नसते किंवा आम्ही तुम्हाला पुन्हा दान करण्यापूर्वी थांबण्याची विनंती करू शकतो.",
            topics: [
                {
                    title: "वय, लिंग आणि वजन",
                    points: [
                        "रक्तदाता होण्यासाठी तुमचे वय १८ ते ६५ वर्षांच्या दरम्यान असावे.",
                        "तुमचे वजन किमान ४५ किलो असावे.",
                        "पहिल्यांदा रक्तदान करणाऱ्या ६० वर्षांवरील व्यक्तींना अतिरिक्त वैद्यकीय मंजुरीची आवश्यकता असू शकते.",
                        "नियमित रक्तदाते ६५ वर्षांपर्यंत (वैद्यकीय प्रमाणपत्रासह ६८ पर्यंत) पात्र असू शकतात."
                    ]
                },
                {
                    title: "अमली पदार्थ आणि मद्यपान",
                    points: [
                        "दानाच्या वेळी दात्यांनी अमली पदार्थांच्या प्रभावाखाली नसावे जेणेकरून आम्ही सुजाण संमती मिळवू शकू.",
                        "तुम्ही शुद्धीत असावे आणि दान प्रक्रिया पूर्णपणे समजून घेण्यास सक्षम असावे.",
                        "बेकायदेशीर औषधांचा वापर तुमच्या पात्रतेवर परिणाम करू शकतो."
                    ]
                },
                {
                    title: "हिमोग्लोबिन आणि लोह",
                    points: [
                        "दानानंतर दात्याकडे पुरेसे हिमोग्लोबिन आहे याची खात्री करण्यासाठी आणि अशक्तपणा टाळण्यासाठी, किमान हिमोग्लोबिनची पातळी आवश्यक आहे.",
                        "प्रत्येक दानापूर्वी दाता केंद्रात तुमच्या हिमोग्लोबिनची चाचणी केली जाईल.",
                        "तुमच्या दानाच्या काही आठवडे आधी लोहयुक्त आहार घेण्याची आम्ही शिफारस करतो."
                    ]
                },
                {
                    title: "वैद्यकीय स्थिती आणि उपचार",
                    points: [
                        "काही वैद्यकीय परिस्थिती तुमच्या दान करण्याच्या क्षमतेवर परिणाम करतात किंवा तुम्हाला दान करण्यासाठी तात्पुरते अपात्र करू शकतात.",
                        "बहुतेक जुनाट परिस्थिती स्वीकार्य आहेत जर त्या स्थिर आणि नियंत्रणात असतील.",
                        "जर तुम्हाला हृदयाची स्थिती, रक्तस्त्राव किंवा कर्करोगाचा इतिहास असेल तर विशेष नियम लागू होऊ शकतात."
                    ]
                },
                {
                    title: "औषधे आणि लसी",
                    points: [
                        "बहुतेक औषधे तुम्हाला दान करण्यापासून रोखत नाहीत.",
                        "जर तुम्ही अलीकडेच लस घेतली असेल, तर तुम्ही अल्प काळासाठी तात्पुरते अपात्र असू शकता.",
                        "काही प्रतिबंधित औषधांना (जसे मुरुम किंवा केस गळतीची काही औषधे) प्रतीक्षा कालावधी आवश्यक असतो."
                    ]
                },
                {
                    title: "पिअर्सिंग आणि टॅटू",
                    points: [
                        "टॅटू किंवा पिअर्सिंग केल्यानंतर दात्यांनी पुन्हा दान करण्यासाठी १२ महिने प्रतीक्षा करणे आवश्यक आहे.",
                        "ही प्रक्रिया परवानाधारक, निर्जंतुक सुविधेमध्ये केली असली तरीही हा प्रतीक्षा कालावधी लागू होतो.",
                        "निर्जंतुक, सिंगल-युज गनने केलेल्या कान टोचण्याला कमी कालावधीनंतर सूट दिली जाऊ शकते."
                    ]
                },
                {
                    title: "गर्भधारणा",
                    points: [
                        "गरोदर असताना, तुम्ही दान करण्यास पात्र नाही.",
                        "बाळंतपणानंतर किमान १२ महिने तुम्हाला पुन्हा दान करण्यापूर्वी प्रतीक्षा करावी लागेल.",
                        "गर्भपात किंवा गर्भधारणा संपुष्टात आल्यानंतर ६ महिने प्रतीक्षा करावी लागेल."
                    ]
                },
                {
                    title: "लैंगिक वर्तन",
                    points: [
                        "सर्व दात्यांना सुरक्षितता तपासणीचा एक भाग म्हणून लैंगिक वर्तनाबद्दल विचारले जाते.",
                        "नवीन भागीदार किंवा एकाधिक लैंगिक भागीदारांसोबत गुदद्वारासंबंधी संभोगानंतर दात्यांनी तीन महिने प्रतीक्षा करणे आवश्यक आहे.",
                        "आमची स्क्रीनिंग प्रश्नावली लैंगिक प्रवृत्तीऐवजी वैयक्तिक जोखीम घटकांवर लक्ष केंद्रितാवर लक्ष केंद्रित करते."
                    ]
                },
                {
                    title: "प्रवास आणि परदेशातील वास्तव्य",
                    points: [
                        "तुम्ही यापूर्वी देशाबाहेर राहत असल्यास किंवा प्रवास केला असल्यास, तुम्ही कुठे गेला होता ते तुमच्या दान करण्याच्या क्षमतेवर परिणाम करू शकते.",
                        "मलेरिया-स्थानिक भागात जाण्यासाठी साधारणपणे ३ महिने ते १ वर्षाचा प्रतीक्षा कालावधी लागतो.",
                        "काही देशांमधील वाढीव निवासांमुळे जास्त प्रतीक्षा लागू शकते."
                    ]
                }
            ],
            learnMoreTitleStart: "रक्त दानाबद्दल ",
            learnMoreTitleHighlight: "अधिक जाणून घ्या",
            learnMoreCards: [
                {
                    title: "सुगमता (Accessibility)",
                    desc: "आमची दाता केंद्रे सर्वांसाठी शक्य तितकी सुलभ आणि सर्वसमावेशक बनवण्यासाठी आम्ही कटिबद्ध आहोत. यामुळे तुमच्या दान करण्याच्या क्षमतेवर कसा परिणाम होतो ते शोधा.",
                    cta: "अधिक जाणून घ्या"
                },
                {
                    title: "चुकीचे पॉझिटिव्ह चाचणी परिणाम",
                    desc: "प्रत्येक दानाची संसर्गजन्य रोगांसाठी चाचणी केली जाते. क्वचितच, एखादी चाचणी खोटा आजार सुचवू शकते. यामुळे तुमच्या दान करण्याच्या क्षमतेवर कसा परिणाम होतो ते शोधा.",
                    cta: "अधिक जाणून घ्या"
                },
                {
                    title: "नवीनतम निकष बदल",
                    desc: "दाता पात्रता निकष सध्याच्या वैज्ञानिक पुराव्यांनुसार बदलतात. जे पूर्वी अपात्र होते ते आता पात्र असू शकतात.",
                    cta: "अधिक जाणून घ्या"
                }
            ],
            firstTimeBadge: "जीवन वाचवा",
            firstTimeTitle: "पहिल्यांदाच रक्तदान करत आहात? ",
            firstTimeTitleHighlight: "येथून सुरुवात करा.",
            firstTimeDescription: "रक्त दिल्याने एखाद्याचे प्राण वाचू शकतात. परंतु दात्यासाठी, हा अनुभव अत्यंत समाधानकारक आणि प्रेरणादायी असू शकतो. हे फक्त स्वतःचा भाग दुसऱ्याला देण्यापुरते नाही; आपण एकत्र येऊन एकमेकांचे रक्षण करत आहोत. आजच दान करा आणि अनुभव घ्या.",
            firstTimeBtn: "आत्ताच दान करा",
            frequencyTitle: "दान ",
            frequencyTitleHighlight: "वारंवारता",
            frequencyCards: [
                {
                    titleStart: "दान करण्यासाठी ",
                    highlight: "रक्त",
                    subtitle: ", परत येणाऱ्या दात्यांनी प्रतीक्षा करावी:",
                    value: "९०-१२० दिवस*",
                    footnote: "*पुरुष (९० दिवस), महिला (१२० दिवस)"
                }
            ],
            supportTitle: "फरक घडवण्यासाठी तयार आहात? आजच आमच्या जीवनवाहिनीमध्ये सामील व्हा.",
            supportDonateBtn: "आत्ताच दान करा",
            supportCallBtn: "प्रश्न आहेत? आम्हाला कॉल करा"
        },
        onsiteDonorPage: {
            title: "स्वयंस्फूर्त शिबिर रक्तदान",
            description: "तुमच्या जवळचे सक्रिय रक्तदान शिबिरे शोधा. तुमच्या भेटीची तयारी करण्यास मदत करण्यासाठी ऑनलाईन नोंदणी करा.",
            ongoingCamps: "सुरू असलेली शिबिरे",
            upcomingCamps: "येणारी शिबिरे",
            campHistory: "शिबिर इतिहास",
            registerHere: "येथे नोंदणी करा",
            registerToDonate: "दाखल व्हा",
            viewRecords: "नोंदी पहा",
            completed: "पूर्ण झाले",
            noOngoing: "सध्या कोणतेही शिबिर सुरू नाही.",
            noUpcoming: "पुढील कोणतेही शिबिर नियोजित नाही.",
            loadingCamps: "शिबिरे लोड होत आहेत...",
            totalDonors: "एकूण दाते",
            totalDonations: "एकूण रक्तदान",
            liveNow: "सुरू आहे"
        },
        onsiteRegistrationForm: {
            steps: {
                identity: "ओळख",
                contact: "संपर्क",
                history: "इतिहास",
                vitals: "तपासणी",
                examination: "परीक्षण"
            },
            fields: {
                firstName: "पहिले नाव",
                middleName: "वडील / पतीचे नाव",
                lastName: "आडनाव",
                sex: "लिंग",
                dob: "जन्मतारीख",
                age: "वय",
                bloodGroup: "रक्तगट",
                occupation: "व्यवसाय",
                camp: "सध्याचे शिबिर / ठिकाण",
                address: "पूर्ण पत्ता",
                mobile: "मोबाईल नंबर",
                pincode: "पिनकोड",
                email: "ईमेल पत्ता",
                isFirstTime: "प्रथमच रक्तदान?",
                isRepeated: "नियमित रक्तदाता?",
                lastDonation: "मागील रक्तदानाची तारीख",
                totalDonations: "एकूण रक्तदान संख्या",
                emergencyConsent: "आपत्कालीन कॉलसाठी उपलब्ध?",
                weight: "वजन (किलो)",
                hb: "हिमोग्लोबिन (gm%)",
                temp: "तापमान (°C)",
                pulse: "नाडीचे ठोके (/min)",
                bp: "रक्तदाब (mmHg)",
                o2Level: "ऑक्सिजन पातळी (%)",
                pedalOedema: "पॅडल एडेमा",
                lymphadenopathy: "लिम्फॅडेनोपॅथी",
                cyanosis: "सायनोसिस",
                skinDisease: "त्वचारोग मुक्त?",
                scars: "जखम/व्रण मुक्त?"
            },
            placeholders: {
                firstName: "नाव प्रविष्ट करा",
                middleName: "वडील/पतीचे नाव",
                lastName: "आडनाव",
                age: "वर्षे",
                select: "निवडा",
                address: "राहण्याचा पत्ता",
                mobile: "१० अंकी मोबाईल",
                pincode: "४२३६०१",
                email: "ईमेल पत्ता",
                weight: "किलो",
                hb: "उदा: १२.५",
                temp: "उदा: ३७.०",
                pulse: "उदा: ७२",
                bp: "उदा: १२०/८०",
                o2Level: "उदा: ९८"
            },
            messages: {
                successTitle: "नोंदणी केल्याबद्दल धन्यवाद!",
                successDesc: "तुमचे तपशील यशस्वीरित्या रेकॉर्ड केले गेले आहेत. तुमच्या योगदानाबद्दल धन्यवाद.",
                mandatoryError: "कृपया सर्व अनिवार्य फील्ड भरा.",
                processing: "प्रक्रिया सुरू आहे...",
                completeBtn: "पूर्ण करा आणि संमती द्या",
                nextBtn: "पुढील पाऊल",
                backBtn: "मागे",
                homeBtn: "मुख्यपृष्ठावर जा",
                anotherBtn: "दुसऱ्या दात्याची नोंदणी करा"
            },
            options: {
                male: "पुरुष",
                female: "स्त्री",
                bloodGroupNotKnown: "माहित नाही",
                occupations: { student: "विद्यार्थी", service: "नोकरी", business: "व्यवसाय", selfEmployed: "स्वयंरोजगार", housewife: "गृहिणी", other: "इतर" },
                yes: "हो",
                no: "नाही"
            }
        },
        incomingCampsPage: {
            title: "येणारी रक्तदान शिबिरे",
            description: "कोपरगाव आणि आसपासच्या आगामी रक्तदान शिबिरांबद्दल माहिती मिळवा. रक्ताच्या कमतरतेमुळे कोणताही जीव जाऊ नये या आमच्या मोहिमेत सामील व्हा.",
            location: "ठिकाण",
            schedule: "वेळापत्रक",
            contact: "संपर्क",
            email: "ईमेल",
            confirmed: "निश्चित",
            registerBtn: "दानासाठी नोंदणी करा",
            directionsBtn: "दिशा मिळवा",
            defaultDescription: "आगामी रक्तदान शिबिर.",
            defaultPhone: "+91 94222 23117",
            defaultEmail: "camps@sanjivanibloodbank.org"
        },
        bloodTypePage: {
            heroBadge: "रक्ताची मूलभूत माहिती",
            heroTitleStart: "माझा ",
            heroTitleHighlight: "रक्तगट कोणता आहे?",
            heroDescription: "तुमचा रक्तगट काही विशिष्ट प्रतिजनांच्या (अँटीजन) उपस्थिती किंवा अनुपस्थितीवरून ठरतो — जे रोगप्रतिकारक प्रतिक्रिया निर्माण करू शकतात. सुरक्षित रक्तसंक्रमण, रक्तदान आणि वैद्यकीय आणीबाणीसाठी तुमचा रक्तगट समजून घेणे महत्त्वाचे आहे.",
            howToFindTitle: "तुमचा रक्तगट कसा जाणून घ्याल",
            howToFindText: "तुमचा रक्तगट जाणून घेण्याचा सर्वात सोपा मार्ग म्हणजे रक्तदान करणे. जेव्हा तुम्ही आमच्याकडे रक्तदान करता, तेव्हा तुमच्या रक्ताची चाचणी केली जाईल आणि तुमचा रक्तगट निश्चित केला जाईल. तुम्हाला तुमच्या दाता कार्डवर आणि दाता प्रोफाइलमध्ये रक्तगटाची माहिती मिळेल. तुम्ही नियमित तपासणीदरम्यान डॉक्टरांकडून रक्तगट चाचणीही करून घेऊ शकता, किंवा औषधालयातून होम ब्लड टायपिंग किट खरेदी करू शकता.",
            mostCommonTitle: "सर्वात सामान्य रक्तगट कोणता आहे?",
            mostCommonText: "भारतात O-पॉझिटिव्ह (O+) आणि B-पॉझिटिव्ह (B+) हे सर्वात सामान्य रक्तगट आहेत, प्रत्येक लोकसंख्येच्या सुमारे ३२% मध्ये आढळतात. हे रक्तगट इतके सामान्य असल्यामुळे रुग्णालये आणि रक्तपेढ्यांमध्ये त्यांची मागणी नेहमीच जास्त असते. जर तुमचा रक्तगट O+ किंवा B+ असेल, तर तुमचे रक्तदान विशेष मौल्यवान असून नियमितपणे आवश्यक असते.",
            mostCommonBadge: "सर्वाधिक सामान्य",
            universalDonorTitle: "युनिव्हर्सल डोनर रक्तगट कोणता आहे?",
            universalDonorText1: "O-निगेटिव्ह (O−) हा युनिव्हर्सल डोनर रक्तगट म्हणून ओळखला जातो कारण O− रक्तपेशी कोणत्याही रक्तगटाच्या रुग्णाला दिल्या जाऊ शकतात. यामुळे रुग्णाचा रक्तगट ठरवण्यास वेळ नसताना आणीबाणीच्या परिस्थितीत हाच रक्तगट सर्वाधिक वापरला जातो. O− रक्ताची मागणी नेहमीच अत्यावश्यक असते — फक्त सुमारे ६.६% लोकसंख्येकडे हा रक्तगट आहे. जर तुमचा रक्तगट O− असेल, तर संकटात सापडलेल्या कोणासाठीही तुमचे रक्त खऱ्या अर्थाने जीवनरक्षक आहे.",
            universalDonorText2: "त्याचप्रमाणे, AB-पॉझिटिव्ह (AB+) हा युनिव्हर्सल रिसीपिएंट आहे — AB+ रुग्ण कोणत्याही रक्तगटाच्या दात्याकडून रक्तपेशी स्वीकारू शकतात. आणि AB प्लाझ्मा (AB+ आणि AB− दोन्ही) हा युनिव्हर्सल प्लाझ्मा असून तो कोणत्याही रक्तगटाच्या रुग्णाला दिला जाऊ शकतो.",
            typesTitleStart: "किती वेगवेगळे ",
            typesTitleHighlight: "रक्तगट",
            typesDescription: "ABO गट प्रणाली आणि Rh घटक (पॉझिटिव्ह किंवा निगेटिव्ह) यावरून निश्चित होणारे ८ मुख्य रक्तगट आहेत. प्रत्येक गटाचे वैशिष्ट्यपूर्ण गुणधर्म असतात, जे तुम्ही कोणाला दान करू शकता आणि कोणाकडून स्वीकारू शकता हे ठरवतात.",
            bloodTypes: [
                { type: "O+", percent: "३२.५%", description: "भारतातील सर्वात सामान्य रक्तगटांपैकी एक. कोणत्याही Rh-पॉझिटिव्ह गटाला रक्तपेशी दान करू शकतो." },
                { type: "B+", percent: "३२.१%", description: "भारतात O+ इतकाच सामान्य. B+ आणि AB+ प्राप्तकर्त्यांना दान करू शकतो." },
                { type: "A+", percent: "२२.५%", description: "भारतातील सामान्य रक्तगट. A+ आणि AB+ प्राप्तकर्त्यांना दान करू शकतो." },
                { type: "AB+", percent: "७.७%", description: "युनिव्हर्सल प्लाझ्मा दाता. भारतीय लोकसंख्येच्या सुमारे ८% मध्ये आढळतो." },
                { type: "O−", percent: "२.०%", description: "युनिव्हर्सल रेड सेल दाता. भारतात दुर्मिळ, फक्त २% लोकसंख्येत आढळतो." },
                { type: "B−", percent: "१.५%", description: "भारतात दुर्मिळ. B+, B−, AB+ आणि AB− प्राप्तकर्त्यांना रक्तपेशी दान करू शकतो." },
                { type: "A−", percent: "१.४%", description: "भारतात दुर्मिळ. A+, A−, AB+ आणि AB− प्राप्तकर्त्यांना रक्तपेशी दान करू शकतो." },
                { type: "AB−", percent: "०.३%", description: "भारतातील सर्वात दुर्मिळ रक्तगट. युनिव्हर्सल प्लाझ्मा दाता." }
            ],
            bloodFacts: [
                { type: "AB+", heading: "AB-पॉझिटिव्ह रुग्ण सर्व आठ रक्तगटांकडून रक्तपेशी स्वीकारू शकतात — त्यामुळे ते युनिव्हर्सल प्राप्तकर्ते ठरतात.", body: "AB+ हा प्राप्त करण्यास सुदैवी असला तरी, तो युनिव्हर्सल प्लाझ्मा दाताही आहे, म्हणजे त्याचा प्लाझ्मा कोणत्याही रक्तगटाच्या रुग्णाला दिला जाऊ शकतो." },
                { type: "AB−", heading: "AB-निगेटिव्ह हा सर्वात दुर्मिळ रक्तगट आहे, जो भारतीय लोकसंख्येच्या १% पेक्षा कमी लोकांत आढळतो.", body: "दुर्मिळ असूनही, AB− दाते युनिव्हर्सल प्लाझ्मा दाता म्हणून अत्यंत मौल्यवान आहेत, आणि त्यांच्या रक्तपेशी सर्व AB आणि AB-निगेटिव्ह रुग्णांना दिल्या जाऊ शकतात." },
                { type: "O−", heading: "O-निगेटिव्ह हा रक्तपेशींसाठी युनिव्हर्सल दाता आहे — आणीबाणीत तो कोणालाही दिला जाऊ शकतो.", body: "O-निगेटिव्ह रक्त कोणत्याही रुग्णाला त्याच्या रक्तगटाची पर्वा न करता दिले जाऊ शकते, त्यामुळे त्याची मागणी नेहमीच जास्त असते आणि आघात (ट्रॉमा) परिस्थितीत बहुधा सर्वप्रथम हेच रक्त वापरले जाते." },
                { type: "O+", heading: "O-पॉझिटिव्ह हा सर्वाधिक आवश्यक रक्तगट आहे, जो सर्व रक्तपेशी संक्रमणांपैकी ३७% मध्ये वापरला जातो.", body: "सर्वात सामान्य रक्तगट असल्याने, रुग्णालयांना O+ रक्ताची सतत गरज भासते. O+ दात्यांना स्थिर पुरवठा राखण्यासाठी नियमितपणे रक्तदान करण्यास प्रोत्साहित केले जाते." }
            ],
            compatTitleStart: "रक्तगट ",
            compatTitleHighlight: "सुसंगतता",
            compatDescription: "सर्व रक्तगट एकमेकांशी सुसंगत नसतात. खालील तक्त्यात कोणता रक्तगट कोणत्या दात्याकडून रक्तपेशी सुरक्षितपणे स्वीकारू शकतो हे दर्शवले आहे.",
            compatRecipientHeader: "प्राप्तकर्ता ↓ / दाता →",
            rareBloodTitle: "दुर्मिळ रक्त कार्यक्रम",
            rareBloodText1: "काही लोकांचे रक्तगट अत्यंत दुर्मिळ असतात किंवा प्रमाणित ABO/Rh प्रणालीच्या पलीकडे जाणारे असामान्य प्रतिजन संयोजन असतात. आमचा दुर्मिळ रक्त कार्यक्रम अशा दुर्मिळ रक्तगटांच्या दात्यांची नोंदणी ठेवतो, जेणेकरून असामान्य रक्ताची गरज असलेल्या रुग्णांना सुरक्षित, सुसंगत रक्तसंक्रमण मिळू शकेल.",
            rareBloodText2: "जर तुम्हाला सांगण्यात आले असेल की तुमचा रक्तगट दुर्मिळ आहे, किंवा पूर्वी तुमचे रक्त क्रॉस-मॅच करणे कठीण गेले असेल, तर कृपया आमच्याशी संपर्क साधा. गरजू रुग्णासाठी तुमचे रक्तदान हाच एकमेव पर्याय असू शकतो.",
            distributionTitle: "भारतातील रक्तगट वितरण",
            mostNeededTitle: "सर्वाधिक आवश्यक रक्तगट",
            mostNeeded: [
                { type: "O+", reason: "रक्तसंक्रमणात सर्वाधिक वापरला जातो; मोठ्या संख्येने O+ रुग्ण असल्याने नेहमीच मागणी जास्त असते." },
                { type: "O−", reason: "युनिव्हर्सल दाता — आणीबाणीसाठी अत्यावश्यक. फक्त ६.६% लोकसंख्येकडे हा रक्तगट आहे." },
                { type: "A+", reason: "दुसरा सर्वात सामान्य रक्तगट; शस्त्रक्रिया आणि उपचारांमध्ये A+ आणि AB+ रुग्णांसाठी आवश्यक." },
                { type: "B+", reason: "B+ आणि AB+ प्राप्तकर्त्यांसाठी अत्यावश्यक; सण आणि पावसाळ्यात मागणी पुरवठ्यापेक्षा अधिक असते." }
            ],
            unknownTitle: "तुमचा रक्तगट माहीत नाही?",
            unknownText: "तो जाणून घेण्याचा सर्वात सोपा मार्ग म्हणजे रक्तदान करणे. आम्ही तुमच्या रक्ताची चाचणी करून तुम्हाला तुमचा रक्तगट सांगू — आणि या प्रक्रियेत तुम्ही एखाद्याचा जीवही वाचवाल.",
            bookAppointment: "अपॉइंटमेंट बुक करा",
            questionsTitle: "प्रश्न आहेत? आमच्याशी संपर्क साधा."
        },
        donationProcessPage: {
            heroBadge: "टप्प्याटप्प्याने मार्गदर्शन",
            heroTitle: "रक्तदान प्रक्रिया",
            heroDescription: "रक्तदान करणे ही एक सुरक्षित, सोपी आणि समाधानकारक अनुभूती आहे. तुम्ही प्रथमच दान करत असाल किंवा नियमित दाता असाल, दानापूर्वी, दरम्यान आणि नंतर काय घडते हे जाणून घेण्यासाठी येथे सर्व माहिती आहे.",
            bookAppointmentBtn: "अपॉइंटमेंट बुक करा",
            checkEligibilityBtn: "पात्रता तपासा",
            beforeTitle: "रक्तदान करण्यापूर्वी",
            beforeDescription: "थोडी पूर्वतयारी तुमचा दानाचा अनुभव सुरळीत आणि आरामदायक बनवण्यास खूप मदत करते. भेटीपूर्वी या टिप्स पाळा.",
            beforeTips: [
                { title: "व्यवस्थित जेवण करा", desc: "रक्तदानाच्या किमान २–३ तास आधी लोहयुक्त, आरोग्यदायी जेवण घ्या. तेलकट किंवा तळलेले पदार्थ टाळा कारण ते रक्त चाचणीच्या निकालांवर परिणाम करू शकतात." },
                { title: "पुरेसे पाणी प्या", desc: "रक्तदानाच्या आधीच्या २४ तासांत भरपूर पाणी आणि द्रवपदार्थ प्या. पुरेसे हायड्रेटेड असल्याने प्रक्रिया जलद आणि अधिक आरामदायक होते." },
                { title: "पुरेशी विश्रांती घ्या", desc: "भेटीपूर्वी चांगली झोप (किमान ६–८ तास) झाल्याची खात्री करा." },
                { title: "मद्यपान टाळा", desc: "रक्तदानाच्या किमान २४ तास आधी मद्यपान करू नका. मद्यपानामुळे निर्जलीकरण होऊ शकते आणि रक्त चाचणीच्या निकालांवर परिणाम होऊ शकतो." },
                { title: "वैध ओळखपत्र आणा", desc: "रक्तदानासाठी येताना वैध फोटो ओळखपत्र (आधार, पॅन कार्ड, वाहन परवाना किंवा पासपोर्ट) सोबत आणा." },
                { title: "तुमची औषधे माहीत ठेवा", desc: "तुम्ही सध्या घेत असलेल्या औषधांची यादी तयार ठेवा. काही औषधांमुळे तात्पुरता विलंब आवश्यक असू शकतो." }
            ],
            duringTitleStart: "तुमच्या भेटीदरम्यान ",
            duringTitleHighlight: "काय घडते",
            duringDescription: "संपूर्ण रक्तदान प्रक्रियेस सुमारे ४५ मिनिटे ते १ तास लागतो. येथे टप्प्याटप्प्याने माहिती दिली आहे.",
            processSteps: [
                { title: "नोंदणी", desc: "तुम्ही दाता केंद्रात पोहोचल्यावर, तुम्हाला तुमची वैयक्तिक माहिती आणि वैद्यकीय इतिहास असलेला नोंदणी फॉर्म भरण्यास सांगितले जाईल. ही माहिती गोपनीय ठेवली जाते आणि तुमचे दान सुरक्षित आहे याची खात्री करण्यास मदत करते.", duration: "५–१० मिनिटे" },
                { title: "आरोग्य तपासणी", desc: "प्रशिक्षित आरोग्य कर्मचारी तुमचा रक्तदाब, नाडी, तापमान आणि हिमोग्लोबिन पातळी तपासतील. तुमची पात्रता ठरवण्यासाठी तुम्हाला गोपनीय आरोग्य प्रश्नावली (दाता प्रश्नावली) देखील विचारली जाईल.", duration: "१०–१५ मिनिटे" },
                { title: "प्रत्यक्ष रक्तदान", desc: "तुम्हाला आरामदायक रेक्लायनिंग खुर्चीवर बसवले जाईल. तुमच्या हातातील शिरेत एक निर्जंतुक, सिंगल-युज सुई हळुवारपणे टाकली जाईल. प्रत्यक्ष रक्तसंकलनास सुमारे ८–१० मिनिटे लागतात, ज्यादरम्यान अंदाजे ३५०–४५० मिली रक्त संकलित केले जाते. संपूर्ण प्रक्रिया सुरक्षित, स्वच्छ आणि जवळपास वेदनारहित असते.", duration: "८–१० मिनिटे" },
                { title: "अल्पोपाहार आणि विश्रांती", desc: "रक्तदानानंतर, तुम्ही आमच्या अल्पोपाहार क्षेत्रात १०–१५ मिनिटे विश्रांती घ्याल. तुम्हाला नाश्ता, ज्यूस आणि पाणी दिले जाईल. यामुळे तुमच्या शरीरातील द्रवपदार्थ पुन्हा भरण्यास सुरुवात होते. निघण्यापूर्वी तुम्हाला बरे वाटत आहे याची खात्री करण्यासाठी आमचे कर्मचारी तुमच्यावर लक्ष ठेवतील.", duration: "१०–१५ मिनिटे" }
            ],
            totalTimeText: "एकूण वेळ: अंदाजे ४५ मिनिटे ते १ तास",
            questionnaireTitle: "दाता प्रश्नावली",
            questionnaireDescription: "प्रत्येक रक्तदानापूर्वी, तुम्हाला दाता प्रश्नावली पूर्ण करण्यास सांगितले जाईल. दाता आणि प्राप्तकर्ता दोघांचीही सुरक्षितता सुनिश्चित करण्याचा हा एक आवश्यक भाग आहे. तुम्हाला हे माहीत असले पाहिजे:",
            questionnairePoints: [
                "प्रत्येक रक्तदानाचा — नवीन आणि नियमित दोन्ही दात्यांसाठी — प्रश्नावली हा एक मानक भाग आहे.",
                "यामध्ये तुमचे सर्वसाधारण आरोग्य, प्रवास इतिहास, औषधे आणि जीवनशैली याविषयी प्रश्न असतात.",
                "सर्व उत्तरे पूर्णपणे गोपनीय ठेवली जातात आणि केवळ तुमची पात्रता तपासण्यासाठी वापरली जातात.",
                "तुमच्या रक्तदानापूर्वी प्रशिक्षित आरोग्य कर्मचाऱ्याद्वारे प्रश्नावलीचे पुनरावलोकन केले जाते.",
                "एखाद्या प्रश्नाबाबत तुम्हाला काही शंका असल्यास, आमचे कर्मचारी खासगीत स्पष्टीकरण देण्यास तत्पर आहेत.",
                "भेटीची तयारी करण्यासाठी तुम्ही आमच्या वेबसाइटवर प्रश्नावली आधीच पाहू शकता."
            ],
            redBannerTitle: "प्रत्येक रक्तदान ३ जीव वाचवू शकते.",
            redBannerText: "तुमचे एक रक्तदान लाल पेशी, प्लाझ्मा आणि प्लेटलेट्समध्ये विभागले जाते.",
            donateNowBtn: "आत्ताच दान करा",
            afterBadge: "दानानंतरची काळजी",
            afterTitle: "आराम करा आणि ताजेतवाने व्हा",
            afterDescription: "रक्तदानानंतर स्वतःची काळजी घेणे महत्त्वाचे आहे. तुमचे शरीर २४–४८ तासांत दान केलेले रक्त प्रमाण भरून काढेल, आणि लाल रक्तपेशी ४–६ आठवड्यांत पूर्णपणे पुन्हा तयार होतील. घरी या मार्गदर्शक तत्त्वांचे पालन करा:",
            afterTips: [
                "पुढील २४–४८ तास जास्त द्रवपदार्थ (पाणी, ज्यूस) प्या.",
                "रक्तदानानंतर काही तासांतच संपूर्ण, पौष्टिक जेवण घ्या.",
                "किमान १२ तास जड शारीरिक हालचाल किंवा वजन उचलणे टाळा.",
                "रक्तदानानंतर किमान २४ तास मद्यपान टाळा.",
                "जर चक्कर किंवा गरगरल्यासारखे वाटले, तर झोपा आणि भावना दूर होईपर्यंत पाय उंच ठेवा.",
                "रक्तदानानंतर किमान ४–६ तास हातावरील पट्टी तशीच ठेवा."
            ],
            honourTitle: "तुमच्या प्रिय व्यक्तीच्या सन्मानार्थ दान",
            honourText1: "तुम्हाला माहीत आहे का की तुम्ही तुमचे रक्तदान एखाद्या विशेष व्यक्तीला समर्पित करू शकता? मित्र, कुटुंबातील सदस्य किंवा रक्त उत्पादनांचा लाभ घेतलेली प्रिय व्यक्ती असो — तुम्ही त्यांच्या सन्मानार्थ दान करू शकता. फक्त दाता केंद्रात आमच्या कर्मचाऱ्यांना सांगा, आणि आम्ही तुम्हाला एक समर्पण कार्ड देऊ जे तुम्ही त्या व्यक्तीला देऊ शकता.",
            honourText2: "तुमच्या उदारतेला वैयक्तिक हावभावात रूपांतरित करण्याचा आणि इतरांना दान करण्यासाठी प्रेरित करण्याचा हा एक अर्थपूर्ण मार्ग आहे.",
            accessibilityTitle: "सुगमता आणि भाषांतर सेवा",
            accessibilityDescription: "रक्तदान सर्वांसाठी सुलभ करण्यासाठी आम्ही कटिबद्ध आहोत. आमची दाता केंद्रे खालील सेवा आणि सुविधा देतात:",
            accessibilityServices: [
                { title: "व्हीलचेअर सुलभ", desc: "सर्व दाता केंद्रे पूर्णपणे व्हीलचेअर सुलभ असून, त्यात अनुकूल दान खुर्च्या आणि सुलभ स्वच्छतागृहे आहेत." },
                { title: "भाषा सहाय्य", desc: "आमची अनेक केंद्रे हिंदी, मराठी आणि इंग्रजीसह बहुभाषिक सहाय्य देतात. विनंतीनुसार भाषांतर सेवा उपलब्ध आहेत." },
                { title: "चिंताग्रस्त दात्यांसाठी सहाय्य", desc: "रक्तदानाबाबत तुम्हाला भीती वाटत असल्यास, आमचे कर्मचारी तुम्हाला आरामदायक वाटावे यासाठी प्रशिक्षित आहेत. आम्हाला कळवा, आम्ही अतिरिक्त काळजी घेऊ." },
                { title: "गोपनीयता आणि खासगीपणा", desc: "तुम्ही दिलेली सर्व आरोग्य माहिती आणि प्रश्नावलीची उत्तरे काटेकोरपणे गोपनीय ठेवली जातात आणि केवळ दानाच्या सुरक्षिततेसाठी वापरली जातात." }
            ],
            faqTitle: "वारंवार विचारले जाणारे प्रश्न",
            faqs: [
                { q: "रक्तदान करताना वेदना होतात का?", a: "सुई टोचताना तुम्हाला थोडासा टोचल्यासारखे वाटू शकते, रक्त चाचणीसारखेच. त्यानंतर, बहुतेक दात्यांना दानादरम्यान अजिबात अस्वस्थता जाणवत नाही." },
                { q: "संपूर्ण प्रक्रियेस किती वेळ लागतो?", a: "नोंदणी, तपासणी, प्रत्यक्ष दान (८–१० मिनिटे) आणि विश्रांती कालावधीसह संपूर्ण भेटीस सुमारे ४५ मिनिटे ते १ तास लागतो." },
                { q: "मी किती वेळा रक्तदान करू शकतो?", a: "भारतात, पुरुष दर ९० दिवसांनी (३ महिने) आणि महिला दर १२० दिवसांनी (४ महिने) संपूर्ण रक्तदान करू शकतात. प्लेटलेट दाते दर १४ दिवसांनी दान करू शकतात." },
                { q: "दानानंतर माझ्या रक्ताचे काय होते?", a: "तुमच्या रक्ताची चाचणी, प्रक्रिया आणि घटकांमध्ये (लाल पेशी, प्लाझ्मा, प्लेटलेट्स) विभाजन केले जाते. त्यानंतर ते साठवले जाते आणि गरजू रुग्णालये व रुग्णांना वितरित केले जाते." },
                { q: "टॅटू किंवा पिअर्सिंग असल्यास मी दान करू शकतो का?", a: "होय, टॅटू किंवा पिअर्सिंग केल्यानंतर १२ महिन्यांनी तुम्ही रक्तदान करण्यास पात्र आहात. निर्जंतुक सिंगल-युज गनने केलेले कान टोचणे आधीच स्वीकारले जाऊ शकते." }
            ],
            supportTitle: "प्रश्न आहेत? आम्ही मदतीसाठी येथे आहोत."
        },
        donationCriteriaChangesPage: {
            heroBadge: "नवीनतम अद्यतने",
            heroTitleStart: "दान निकषातील ",
            heroTitleHighlight: "अलीकडील बदल",
            heroDescription1: "नवीनतम वैद्यकीय संशोधन, सरकारी मार्गदर्शक तत्त्वे आणि जागतिक सर्वोत्तम पद्धती प्रतिबिंबित करण्यासाठी दान पात्रता निकषांचे नियमितपणे पुनरावलोकन आणि अद्यतन केले जाते. या पानावर सर्व अलीकडील बदल कालानुक्रमे सूचीबद्ध आहेत.",
            heroDescription2: "जर तुम्हाला पूर्वी अपात्र ठरवले गेले असेल, तर हे बदल तुमच्या पात्रतेवर परिणाम करू शकतात. कृपया खालील बदल पाहा किंवा गोपनीय पुनर्मूल्यांकनासाठी आमच्या टीमशी संपर्क साधा.",
            redBannerTitle: "आता हजारो अधिक लोक दान करण्यास पात्र असू शकतात!",
            redBannerText: "तुम्ही पात्र आहात का हे पाहण्यासाठी नवीनतम निकष बदल पाहा.",
            checkEligibilityBtn: "पात्रता तपासा",
            updatesTitle: "सर्व अद्यतने",
            updatesSubtitle: "उलट कालानुक्रमे सूचीबद्ध, सर्वात अलीकडील बदल प्रथम.",
            updates: [
                { date: "१५ जानेवारी २०२५", title: "सुरक्षिततेसाठी हिमोग्लोबिन मर्यादा कायम", body: "सर्व दात्यांसाठी किमान हिमोग्लोबिन पातळी १२.५ g/dL वर कायम आहे, ज्यामुळे दात्याचे आरोग्य आणि सुरक्षितता सुनिश्चित होते. दानपूर्व अचूक तपासणीसाठी आम्ही अचूक HemoCue मशीन्सचा वापर सुरू ठेवतो." },
                { date: "२२ नोव्हेंबर २०२४", title: "टॅटू आणि पिअर्सिंग विलंब कालावधी १२ महिनेच कायम", body: "रक्तसंक्रमणाद्वारे पसरणाऱ्या संसर्गांविरुद्ध जास्तीत जास्त सुरक्षितता सुनिश्चित करण्यासाठी, आम्ही टॅटू आणि बॉडी पिअर्सिंगसाठी १२-महिन्यांचा विलंब कालावधी कायम ठेवतो. हा व्यावसायिक मानक सुरक्षितता कालावधी पूर्ण झाल्यावर दात्यांना परत येण्याची परवानगी देत रक्तपुरवठ्याचे संरक्षण करण्यास मदत करतो." },
                { date: "८ सप्टेंबर २०२४", title: "मलेरिया-स्थानिक भागांसाठी प्रवास विलंब सुधारित", body: "मलेरिया-स्थानिक भागात प्रवास केलेल्या दात्यांना आता पूर्वीच्या ६-महिन्यांच्या आवश्यकतेऐवजी ३-महिन्यांचा विलंब कालावधी लागू आहे. हा बदल WHO आणि राष्ट्रीय रोग नियंत्रण केंद्र (NCDC) यांच्या अद्ययावत साथरोगविषयक माहितीवर आधारित आहे. उप-सहारा आफ्रिका किंवा आग्नेय आशियाच्या काही भागांतून परतणाऱ्या दात्यांनी वैयक्तिक मूल्यांकनासाठी आमच्या टीमशी सल्लामसलत करावी." },
                { date: "१ जुलै २०२४", title: "नियमित दात्यांसाठी वयोमर्यादा वाढवली", body: "चांगल्या आरोग्याच्या नियमित दात्यांना आता पूर्वीच्या ६५ वर्षांच्या मर्यादेऐवजी ६८ वर्षांपर्यंत दान सुरू ठेवता येईल. हे सातत्यपूर्ण दान इतिहास असलेल्या नियमित दात्यांना लागू असून नोंदणीकृत डॉक्टरांकडून वार्षिक वैद्यकीय प्रमाणपत्र आवश्यक आहे. प्रथमच दान करणाऱ्यांचे वय १८ ते ६० वर्षांच्या दरम्यानच असणे आवश्यक आहे." },
                { date: "२० एप्रिल २०२४", title: "COVID-19 लसीकरण विलंब रद्द", body: "COVID-19 लसीकरणानंतर (सर्व मान्यताप्राप्त लसी) १४-दिवसांचा विलंब कालावधी रद्द करण्यात आला आहे. दाते आता लसीकरणानंतर लगेच रक्तदान करू शकतात, जर त्यांना बरे वाटत असेल आणि ताप किंवा इतर लक्षणे नसतील. हा बदल सर्व प्राथमिक डोस आणि बूस्टरना लागू आहे." },
                { date: "५ फेब्रुवारी २०२४", title: "प्लेटलेट दान अंतराल कमी केला", body: "निरोगी, नियमित प्लेटलेट दात्यांसाठी प्लेटलेट (ॲफेरेसिस) दानांमधील किमान अंतराल १४ दिवसांवरून ७ दिवसांपर्यंत कमी करण्यात आले आहे. यामुळे अनुभवी दात्यांकडून अधिक वारंवार योगदान शक्य होते आणि हंगामी तुटवडा दूर करण्यास मदत होते. दात्यांनी प्रत्येक भेटीत सर्व प्रमाणित प्लेटलेट पात्रता निकष पूर्ण करणे आवश्यक आहे." },
                { date: "१२ डिसेंबर २०२३", title: "औषध विलंब यादी अद्ययावत", body: "अनेक सामान्य ओव्हर-द-काउंटर औषधे विलंब यादीतून काढून टाकण्यात आली आहेत. अँटीहिस्टामाइन्स (उदा. सिटीरिझिन, लोराटाडीन), सौम्य वेदनाशामक (उदा. पॅरासिटामॉल), आणि अँटासिड घेणारे दाते आता प्रतीक्षा कालावधीशिवाय दान करण्यास पात्र आहेत. प्रिस्क्रिप्शन ब्लड थिनर्स (उदा. वॉरफेरिन, हेपारिन) ला अजूनही विलंब आवश्यक आहे — कृपया आमच्या स्क्रीनिंग टीमचा सल्ला घ्या." },
                { date: "३ ऑक्टोबर २०२३", title: "वजन आवश्यकतेचे स्पष्टीकरण", body: "अद्ययावत वजन निकष आता अधिक वैयक्तिकृत पात्रता मूल्यांकनासाठी परिपूर्ण वजनासोबत BMI देखील समाविष्ट करतात. संपूर्ण रक्तदानासाठी किमान वजन ४५ किलो कायम असले तरी, १८.५ पेक्षा कमी BMI असलेल्या दात्यांना अतिरिक्त तपासणी करण्यास सांगितले जाऊ शकते. प्लेटलेट दानासाठी किमान वजन ५० किलो आवश्यक आहे." },
                { date: "१८ ऑगस्ट २०२३", title: "दंत प्रक्रिया विलंब अद्ययावत", body: "नियमित दंत प्रक्रियांनंतर (सफाई, फिलिंग) विलंब कालावधी ७२ तासांवरून २४ तासांपर्यंत कमी करण्यात आला आहे. अधिक व्यापक दंत शस्त्रक्रिया, जसे की दात काढणे किंवा रूट कॅनल, यासाठी अजूनही ७-दिवसांचा विलंब आवश्यक आहे. दात्यांनी तपासणीदरम्यान अलीकडील कोणत्याही दंत कामाबद्दल आमच्या टीमला माहिती द्यावी." },
                { date: "३० जून २०२३", title: "नियमित दात्यांसाठी लोह पूरक शिफारस", body: "आजपासून, सर्व नियमित दात्यांना (वर्षातून ३ किंवा अधिक वेळा दान करणारे) प्रत्येक दानानंतर लोह पूरक मार्गदर्शन दिले जाईल. हा एक प्रतिबंधात्मक उपाय असून तो निरोगी लोह साठा राखण्यासाठी आहे आणि इंडियन जर्नल ऑफ हिमॅटोलॉजी अँड ब्लड ट्रान्सफ्युजनच्या शिफारशींवर आधारित आहे. आमच्या सर्व दाता केंद्रांवर पूरक विनामूल्य उपलब्ध आहेत." },
                { date: "१५ मार्च २०२३", title: "लैंगिक वर्तन-आधारित विलंब धोरण अद्ययावत", body: "विकसित होत असलेल्या जागतिक सर्वोत्तम पद्धतींनुसार, आमचे स्क्रीनिंग निकष प्रवृत्तीवर आधारित सरसकट विलंबाकडून वैयक्तिक जोखीम मूल्यांकन मॉडेलकडे वळले आहेत. सर्व संभाव्य दात्यांचे आता लिंग ओळख किंवा लैंगिक प्रवृत्तीची पर्वा न करता, अलीकडील लैंगिक वर्तन जोखीम घटकांवर आधारित समान मूल्यांकन केले जाते." },
                { date: "१ जानेवारी २०२३", title: "प्रसूतीनंतरचा विलंब कालावधी स्पष्ट केला", body: "राष्ट्रीय मार्गदर्शक तत्त्वांनुसार, पूर्ण मातृ पुनर्प्राप्तीसाठी प्रसूतीनंतरचा विलंब कालावधी १२ महिने आहे. गर्भपात किंवा गर्भधारणा संपुष्टात आल्यास, ६-महिन्यांचा विलंब लागू होतो. स्वैच्छिक रक्तदान पुन्हा सुरू करण्यापूर्वी हे मानक आईच्या आरोग्याची खात्री करतात." }
            ],
            ctaBadge: "दान करण्यास तयार आहात?",
            ctaTitleStart: "अद्ययावत निकषांसह, पूर्वीपेक्षा अधिक लोक ",
            ctaTitleHighlight: "आता पात्र असू शकतात.",
            ctaText: "आजच तुमची पात्रता तपासा आणि तुमचे दान नियोजित करा. प्रत्येक दान तीन जीव वाचवू शकते.",
            bookBtn: "अपॉइंटमेंट बुक करा",
            fullCriteriaBtn: "संपूर्ण पात्रता निकष",
            supportTitle: "प्रश्न असल्यास किंवा सहाय्य हवे असल्यास, कृपया संपर्क साधा:"
        },
        donorWellnessPage: {
            heroBadge: "तुमची सुरक्षा महत्त्वाची आहे",
            heroTitleStart: "दाता कल्याण ",
            heroTitleHighlight: "आणि सुरक्षा",
            heroDescription: "दानापूर्वी, दरम्यान आणि नंतर तुमचे आरोग्य आणि सुरक्षा ही आमची सर्वोच्च प्राथमिकता आहे. प्रत्येक दात्यासाठी रक्तदान हा सुरक्षित, आरामदायक आणि सकारात्मक अनुभव व्हावा यासाठी आम्ही सर्वोच्च वैद्यकीय मानके आणि सुरक्षा प्रोटोकॉल पाळतो.",
            onPageIntro: "या पानावर, तुम्हाला हे सापडेल:",
            onPageList: [
                "रक्तदान प्रक्रियेबद्दल वारंवार विचारल्या जाणाऱ्या प्रश्नांची उत्तरे",
                "आमचे सुरक्षा प्रोटोकॉल आणि तुमचे संरक्षण करण्यासाठी आम्ही काय करतो",
                "सामान्य दुष्परिणाम आणि ते कसे व्यवस्थापित करावे",
                "नियमित दात्यांसाठी लोह आणि पोषण मार्गदर्शन"
            ],
            faqSectionTitleStart: "रक्तदान प्रक्रियेबाबत ",
            faqSectionTitleHighlight: "वारंवार विचारले जाणारे प्रश्न",
            faqSectionSubtitle: "पूर्ण उत्तर पाहण्यासाठी खालील कोणत्याही प्रश्नावर क्लिक करा.",
            faqs: [
                { q: "दान केल्यानंतर मला बरे वाटत नसेल तर मी काय करावे?", a: "दानानंतर थोडी चक्कर किंवा गरगरल्यासारखे वाटणे सामान्य आहे. असे झाल्यास, ताबडतोब बसा किंवा झोपा आणि पाय उंच ठेवा. कपाळावर थंड पट्टी ठेवा आणि द्रवपदार्थ प्या. बहुतेक लक्षणे काही मिनिटांत दूर होतात. १५–२० मिनिटांनंतरही बरे वाटत नसल्यास, आमच्या दाता हेल्पलाइनशी संपर्क साधा किंवा जवळच्या केंद्राला भेट द्या. पूर्णपणे सामान्य वाटेपर्यंत वाहन चालवू नका किंवा अवजड यंत्रसामग्री हाताळू नका." },
                { q: "रक्तदान करणे सुरक्षित आहे का?", a: "होय, रक्तदान करणे अत्यंत सुरक्षित आहे. सुई, पिशव्या आणि नळ्यांसह वापरलेली सर्व उपकरणे निर्जंतुक, सिंगल-युज असतात आणि प्रत्येक दानानंतर विल्हेवाट लावली जाते. रक्तदानातून कोणताही संसर्ग होण्याचा धोका अजिबात नाही. आमचे कर्मचारी प्रशिक्षित वैद्यकीय व्यावसायिक असून प्रत्येक टप्प्यावर कडक सुरक्षा प्रोटोकॉल पाळतात." },
                { q: "दानादरम्यान किती रक्त घेतले जाते?", a: "प्रमाणित संपूर्ण रक्तदानादरम्यान अंदाजे ३५०–४५० मिली रक्त संकलित केले जाते, जे सरासरी प्रौढ व्यक्तीच्या एकूण रक्ताच्या प्रमाणाच्या १०% पेक्षा कमी आहे. तुमचे शरीर काही तासांतच गमावलेले प्रमाण भरून काढण्यास सुरुवात करते आणि २४–४८ तासांत ते पूर्णपणे भरून काढते. लाल रक्तपेशी ४–६ आठवड्यांत पूर्णपणे पुनर्स्थापित होतात." },
                { q: "दानानंतर मला थकवा किंवा अशक्तपणा जाणवेल का?", a: "बहुतेक दात्यांना दानानंतर पूर्णपणे सामान्य वाटते. काहींना उर्वरित दिवसासाठी सौम्य थकवा जाणवू शकतो. हे सामान्य आहे आणि पुरेसे पाणी पिणे, चांगले जेवण करणे आणि १२–२४ तास जोरदार हालचाल टाळणे याद्वारे व्यवस्थापित करता येते. २४ तासांपेक्षा जास्त काळ सतत थकवा जाणवल्यास, कृपया आमच्या हेल्पलाइनशी संपर्क साधा." },
                { q: "रक्तदानानंतर मी व्यायाम करू शकतो का?", a: "दानानंतर किमान १२ तास जोरदार शारीरिक हालचाल, वजन उचलणे आणि तीव्र व्यायाम टाळण्याची आम्ही शिफारस करतो. चालण्यासारख्या सौम्य हालचाली ठीक आहेत. २४ तासांनंतर, बहुतेक दाते त्यांचा नेहमीचा व्यायाम पुन्हा सुरू करू शकतात. तुमच्या शरीराचे ऐका — व्यायामादरम्यान चक्कर किंवा अशक्तपणा जाणवल्यास, थांबा आणि विश्रांती घ्या." },
                { q: "दानाआधी आणि नंतर मी काय खावे आणि प्यावे?", a: "दान करण्यापूर्वी, लोहयुक्त, आरोग्यदायी जेवण (जसे पालक, डाळी किंवा पातळ मांस) घ्या आणि भरपूर पाणी प्या. तेलकट किंवा तळलेले पदार्थ टाळा कारण ते रक्त चाचणीवर परिणाम करू शकतात. दानानंतर, पौष्टिक नाश्ता घ्या आणि पुढील २४–४८ तास जास्त द्रवपदार्थ — पाणी, ज्यूस किंवा दूध — प्या. दानानंतर किमान २४ तास मद्यपान टाळा." },
                { q: "सुई टोचलेल्या जागी जखम (bruise) झाली तर?", a: "सुई टोचलेल्या जागी अधूनमधून जखम होणे सामान्य आणि निरुपद्रवी आहे. त्वचेखाली थोडेसे रक्त गळल्यामुळे असे होते. सूज कमी करण्यासाठी पहिल्या २४ तासांत त्या भागावर थंड पट्टी ठेवा, नंतर गरम पट्टीकडे वळा. जखम साधारणपणे १–२ आठवड्यांत नाहीशी होते. जखम असामान्यपणे मोठी, वेदनादायक असल्यास किंवा बरी होत नसल्यास, कृपया आमच्याशी संपर्क साधा." },
                { q: "मी औषधोपचारावर असल्यास रक्तदान करू शकतो का?", a: "हे औषधावर अवलंबून आहे. जीवनसत्त्वे, अँटीहिस्टामाइन्स (उदा. सिटीरिझिन), पॅरासिटामॉल आणि बहुतेक गर्भनिरोधक गोळ्यांसह अनेक सामान्य औषधे तुम्हाला दान करण्यापासून रोखत नाहीत. तथापि, ब्लड थिनर्स (वॉरफेरिन, हेपारिन), काही प्रतिजैविके आणि मुरुमांची औषधे (उदा. आयसोट्रेटिनॉइन) यासारख्या काही औषधांसाठी तात्पुरता विलंब आवश्यक आहे. तुम्ही घेत असलेल्या सर्व औषधांबद्दल नेहमी आमच्या स्क्रीनिंग कर्मचाऱ्यांना माहिती द्या." },
                { q: "मी किती वेळा रक्तदान करू शकतो?", a: "भारतात, पुरुष दर ९० दिवसांनी (३ महिने) आणि महिला दर १२० दिवसांनी (४ महिने) संपूर्ण रक्तदान करू शकतात. प्लेटलेट दाते दर १४ दिवसांनी, वर्षातून २४ वेळा दान करू शकतात. हे अंतराल तुमच्या शरीराला दान केलेले घटक पूर्णपणे भरून काढण्यासाठी पुरेसा वेळ देतात." },
                { q: "रक्तदानासाठी वयोमर्यादा आहे का?", a: "भारतात, १८ ते ६५ वयोगटातील निरोगी व्यक्ती रक्तदान करू शकतात. प्रथमच दान करणाऱ्यांचे वय १८ ते ६० वर्षांच्या दरम्यान असणे आवश्यक आहे. चांगल्या आरोग्याचे नियमित दाते वयाच्या ६५ पर्यंत (वैद्यकीय प्रमाणपत्रासह ६८ पर्यंत वाढवता येते) पात्र असू शकतात. १८ वर्षांखालील व्यक्ती दान करण्यास पात्र नाहीत." }
            ],
            redBannerTitle: "तुमची सुरक्षा ही आमची सर्वोच्च प्राथमिकता आहे.",
            redBannerText: "दान प्रक्रियेचा प्रत्येक टप्पा तुमच्या संरक्षणासाठी तयार करण्यात आला आहे.",
            viewProcessBtn: "दान प्रक्रिया पहा",
            protocolsTitle: "आमचे सुरक्षा प्रोटोकॉल",
            protocolsDescription: "दाता आणि प्राप्तकर्ता दोघांसाठीही प्रत्येक दान सुरक्षित आहे याची खात्री करण्यासाठी आम्ही कठोर राष्ट्रीय आणि आंतरराष्ट्रीय सुरक्षा मानकांचे पालन करतो.",
            safetyProtocols: [
                { title: "निर्जंतुक, सिंगल-युज उपकरणे", desc: "दान प्रक्रियेत वापरलेली प्रत्येक सुई, पिशवी आणि नळी पूर्णपणे नवीन, निर्जंतुक असून फक्त एकदाच वापरली जाते. तुमच्या दानानंतर, सर्व उपकरणांची सुरक्षितपणे विल्हेवाट लावली जाते. रक्तदानातून संसर्गाचा धोका शून्य आहे." },
                { title: "सखोल आरोग्य तपासणी", desc: "प्रत्येक दानापूर्वी, प्रशिक्षित आरोग्य कर्मचारी तुमचा रक्तदाब, नाडी, तापमान, हिमोग्लोबिन पातळी तपासतात आणि तुम्ही सुरक्षितपणे दान करण्यास योग्य आहात याची खात्री करण्यासाठी तुमचा आरोग्य इतिहास पाहतात." },
                { title: "सर्व दानांची कडक चाचणी", desc: "दान केलेल्या रक्ताच्या प्रत्येक युनिटची HIV, हिपॅटायटीस B, हिपॅटायटीस C, सिफिलीस आणि मलेरियासाठी चाचणी केली जाते. या चाचण्यांमध्ये अपयशी ठरणारे कोणतेही युनिट सुरक्षितपणे टाकून दिले जाते आणि दात्याला गोपनीयपणे कळवले जाते." },
                { title: "सातत्यपूर्ण दाता निरीक्षण", desc: "दानादरम्यान आणि नंतर, आमचे कर्मचारी तुमच्या तब्येतीवर सतत लक्ष ठेवतात. कोणत्याही क्षणी अस्वस्थता जाणवल्यास, आमची टीम तत्काळ मदत करेल आणि योग्य काळजी घेईल." },
                { title: "प्रतिकूल प्रतिक्रिया व्यवस्थापन", desc: "दुर्मिळ असले तरी, आमची केंद्रे कोणत्याही प्रतिकूल प्रतिक्रिया हाताळण्यासाठी पूर्णपणे सुसज्ज आहेत. सर्व कर्मचारी प्रथमोपचार आणि आणीबाणी प्रतिसादात प्रशिक्षित आहेत. दानादरम्यान किंवा नंतर तुम्हाला कधीही एकटे सोडले जाणार नाही." },
                { title: "गोपनीय आरोग्य माहिती", desc: "तपासणी प्रक्रियेदरम्यान तुम्ही दिलेली सर्व वैयक्तिक आणि वैद्यकीय माहिती काटेकोरपणे गोपनीय ठेवली जाते आणि केवळ तुमची पात्रता ठरवण्यासाठी आणि रक्तपुरवठ्याची सुरक्षितता सुनिश्चित करण्यासाठी वापरली जाते." }
            ],
            sideEffectsTitle: "सामान्य दुष्परिणाम आणि ते कसे व्यवस्थापित करावे",
            sideEffectsDescription: "बहुतेक दात्यांना दानानंतर पूर्णपणे बरे वाटते. क्वचित प्रसंगी, काही सौम्य दुष्परिणाम होऊ शकतात. काय अपेक्षित आहे आणि ते कसे हाताळायचे ते येथे आहे.",
            sideEffectsTableHeaders: { effect: "दुष्परिणाम", likelihood: "शक्यता", whatToDo: "काय करावे" },
            sideEffects: [
                { effect: "चक्कर किंवा गरगरणे", likelihood: "अधूनमधून", what: "बसा किंवा झोपा. पाय उंच ठेवा. पाणी किंवा ज्यूस प्या. लक्षणे साधारणपणे काही मिनिटांत दूर होतात." },
                { effect: "सुई टोचलेल्या जागी जखम", likelihood: "अधूनमधून", what: "२४ तास थंड पट्टी लावा, नंतर गरम पट्टी लावा. जखम १–२ आठवड्यांत नाहीशी होते." },
                { effect: "सौम्य थकवा", likelihood: "सामान्य", what: "विश्रांती घ्या, पुरेसे पाणी प्या आणि व्यवस्थित जेवण करा. १२ तास जड व्यायाम टाळा. साधारणपणे एका दिवसात बरे होते." },
                { effect: "सुई टोचलेल्या जागी दुखणे", likelihood: "सामान्य", what: "हे सामान्य आणि तात्पुरते आहे. दान केलेल्या हाताने काही तास जड वस्तू उचलणे टाळा." },
                { effect: "बेशुद्ध पडणे", likelihood: "दुर्मिळ", what: "ताबडतोब झोपा. आमचे कर्मचारी तुम्हाला मदत करतील. पूर्णपणे बरे वाटेपर्यंत केंद्र सोडू नका." }
            ],
            ironTitle: "दात्यांसाठी लोह आणि पोषण मार्गदर्शन",
            ironDescription: "निरोगी लाल रक्तपेशी तयार करण्यासाठी लोह आवश्यक आहे. नियमित दात्यांनी लोह पातळी निरोगी राखण्यावर विशेष लक्ष द्यावे. येथे काही व्यावहारिक टिप्स आहेत:",
            ironTips: [
                "तुमच्या आहारात लोहयुक्त पदार्थांचा समावेश करा: पालक, डाळी, चणे, राजमा, गूळ, खजूर आणि पातळ मांस.",
                "शोषण वाढवण्यासाठी लोहयुक्त पदार्थांसोबत व्हिटॅमिन C स्रोत (लिंबूवर्गीय फळे, टोमॅटो, शिमला मिरची) घ्या.",
                "जेवणासोबत चहा आणि कॉफी टाळा, कारण त्यातील टॅनिन्स लोह शोषण कमी करू शकतात.",
                "तुम्ही नियमितपणे (वर्षातून ३+ वेळा) दान करत असल्यास, लोह पूरक विचारात घ्या — तुमच्या डॉक्टरांचा सल्ला घ्या किंवा आमच्या कर्मचाऱ्यांना विचारा.",
                "कॅल्शियम आणि दुग्धजन्य पदार्थ लोहयुक्त पदार्थांसोबत घेतल्यास लोह शोषणात अडथळा आणू शकतात. ते वेगळे घ्या.",
                "लोखंडी भांड्यांमध्ये स्वयंपाक केल्याने तुमच्या अन्नातील लोहाचे प्रमाण वाढू शकते."
            ],
            whenToSeekTitle: "वैद्यकीय मदत केव्हा घ्यावी",
            whenToSeekText: "रक्तदानातून गंभीर गुंतागुंत होणे अत्यंत दुर्मिळ असले तरी, दानानंतर खालीलपैकी काही जाणवल्यास कृपया आमच्याशी संपर्क साधा किंवा वैद्यकीय मदत घ्या:",
            whenToSeekItems: [
                "सुई टोचलेल्या जागेतून सतत रक्तस्त्राव जो १०+ मिनिटे दाब दिल्यानंतरही थांबत नाही",
                "दानानंतर ३० मिनिटांपेक्षा जास्त काळ सतत चक्कर किंवा बेशुद्धी",
                "सुई टोचलेल्या जागी संसर्गाची लक्षणे — लालसरपणा, सूज, उष्णता किंवा पू",
                "हातात मुंग्या येणे किंवा बधिरपणा जो काही तासांपेक्षा जास्त काळ टिकतो",
                "दानाच्या २४ तासांच्या आत ताप किंवा थंडी वाजणे",
                "सुई टोचलेल्या जागी तीव्र किंवा वाढणारी वेदना"
            ],
            helplineText: "वरीलपैकी काही जाणवल्यास, आमच्या दाता हेल्पलाइन {phone} वर कॉल करा किंवा जवळच्या वैद्यकीय सुविधेला भेट द्या.",
            ctaTitle: "दान करण्यास तयार आहात? तुमची सुरक्षा हमीदार आहे.",
            ctaText: "आजच तुमची अपॉइंटमेंट बुक करा आणि सुरक्षित, आरामदायक व जीवनरक्षक दानाचा अनुभव घ्या.",
            bookBtn: "अपॉइंटमेंट बुक करा",
            checkEligibilityBtn: "पात्रता तपासा",
            contactTitle: "काही चिंता आहे? आमच्या दाता सहाय्य टीमशी संपर्क साधा."
        },
        teamPage: {
            badge: "आमचे लोक",
            title: "आमच्या ",
            titleHighlight: "टीमला भेटा",
            description: "जीव वाचवण्यासाठी आणि बदल घडवण्यासाठी एकत्र काम करणारे समर्पित व्यावसायिक.",
            members: [
                { name: "डॉ. ए.बी. पवार", role: "डीन अकॅडेमिक्स SCOE आणि प्रोजेक्ट सल्लागार" },
                { name: "स्मितराज बनकर", role: "डेव्हलपर आणि प्रोजेक्ट लीड" }
            ]
        },
        hospitalPortal: {
            portalTitle: "रुग्णालय पोर्टल",
            emailLabel: "ईमेल पत्ता",
            emailPlaceholder: "hospital@example.com",
            emailDescription: "पडताळणी कोड मिळवण्यासाठी तुमचा नोंदणीकृत ईमेल प्रविष्ट करा.",
            proceedBtn: "पुढे जा",
            verificationTitle: "पडताळणी",
            verificationText: "आम्ही खालील ईमेलवर पडताळणी कोड पाठवला आहे:",
            codeExpires: "कोडची मुदत संपेल:",
            codeExpired: "कोडची मुदत संपली आहे.",
            verifyBtn: "पडताळणी करा",
            resendBtn: "कोड पुन्हा पाठवा",
            resendCooldownText: "पुन्हा पाठवा ({s}से)",
            changeEmailBtn: "ईमेल बदला",
            invalidEmail: "कृपया वैध ईमेल पत्ता प्रविष्ट करा.",
            unregisteredEmail: "हा ईमेल पत्ता आमच्या ब्लड बँक पोर्टलवर नोंदणीकृत नाही.",
            codeExpiredMessage: "कोडची मुदत संपली आहे. कृपया नवीन कोडसाठी विनंती करा.",
            verifiedSuccess: "यशस्वीरित्या पडताळणी झाली",
            connectedPortal: "कनेक्ट केलेले पोर्टल — थेट साठा मार्गदर्शिका",
            loading: "लोड होत आहे...",
            updated: "अपडेट केले",
            refresh: "रिफ्रेश करा",
            signOut: "बाहेर पडा",
            bloodComponent: "रक्ताचे घटक",
            totals: "एकूण",
            totalAvailable: "एकूण उपलब्ध",
            legendTitle: "साठा पुरवठा निर्देशक:",
            criticalSupply: "गंभीर पुरवठा (० पिशव्या)",
            lowSupply: "कमी पुरवठा (१-३ पिशव्या)",
            healthySupply: "योग्य पुरवठा (४+ पिशव्या)",
            footerNote: "सर्व मूल्ये रिअल-टाइम सक्रिय साठा दर्शवतात."
        }
    }
};

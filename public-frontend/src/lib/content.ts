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
        topLinks: { label: string; href: string }[];
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
        title: string;
        subtitle: string;
        placeholder: string;
        submitBtn: string;
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
            topLinks: [
                { label: "Hospital Services", href: "/" },
                { label: "Research", href: "/" },
                { label: "Careers", href: "/" },
                { label: "Shop", href: "/" }
            ],
            bookNow: "BOOK NOW",
            mainLinks: [
                {
                    label: "Blood",
                    href: "/",
                    columns: [
                        {
                            title: "Am I eligible to donate blood?",
                            links: [
                                { label: "Explore eligibility criteria", href: "/eligibility-criteria" },
                                { label: "Take our eligibility quiz", href: "/" },
                                { label: "Recent changes to donation criteria", href: "/donation-criteria-changes" }
                            ]
                        },
                        {
                            title: "Donating blood",
                            links: [
                                { label: "First-time donor", href: "/donate" },
                                { label: "What is my blood type?", href: "/blood-type" },
                                { label: "Donation process", href: "/donation-process" },
                                { label: "Donor questionnaire", href: "/" },
                                { label: "Donor wellness and safety", href: "/donor-wellness" }
                            ]
                        }
                    ],
                    viewAllLabel: "View all Blood info",
                    viewAllHref: "/"
                },

                {
                    label: "Ways to Donate",
                    href: "/donate",
                    columns: [
                        {
                            title: "Donation options",
                            links: [
                                { label: "Book an appointment", href: "/donate" },
                                { label: "Donor centres hours & locations", href: "/" },
                                { label: "Recognition programs", href: "/" }
                            ]
                        }
                    ],
                    viewAllLabel: "View all Ways to Donate",
                    viewAllHref: "/donate"
                },
                {
                    label: "About Us",
                    href: "/about",
                    columns: [
                        {
                            title: "Our organization",
                            links: [
                                { label: "Our mission", href: "/about" },
                                { label: "Our history", href: "/about" },
                                { label: "Contact us", href: "/" },
                                { label: "Accessibility in donor centres", href: "/" }
                            ]
                        }
                    ],
                    viewAllLabel: "View all About Us",
                    viewAllHref: "/about"
                },
                {
                    label: "Donation",
                    href: "#",
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
            title: "Your Feedback Matters",
            subtitle: "Help us improve our services. Your suggestions are valuable to us.",
            placeholder: "Share your thoughts, suggestions, or experience...",
            submitBtn: "Submit Feedback",
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
            totalDonations: "Total Donations"
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
            directionsBtn: "Get Directions"
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
            topLinks: [
                { label: "रुग्णालय सेवा", href: "/" },
                { label: "संशोधन", href: "/" },
                { label: "करिअर", href: "/" },
                { label: "शॉप", href: "/" }
            ],
            bookNow: "बुक करा",
            mainLinks: [
                {
                    label: "रक्त",
                    href: "/",
                    columns: [
                        {
                            title: "मी रक्तदान करू शकतो का?",
                            links: [
                                { label: "पात्रता निकष जाणून घ्या", href: "/eligibility-criteria" },
                                { label: "पात्रता चाचणी घ्या", href: "/" },
                                { label: "दान निकषातील अलीकडील बदल", href: "/donation-criteria-changes" }
                            ]
                        },
                        {
                            title: "रक्तदान करणे",
                            links: [
                                { label: "प्रथमच रक्तदाता", href: "/donate" },
                                { label: "माझा रक्तगट कोणता?", href: "/blood-type" },
                                { label: "दान प्रक्रिया", href: "/donation-process" },
                                { label: "दाता प्रश्नावली", href: "/" },
                                { label: "दाता कल्याण आणि सुरक्षा", href: "/donor-wellness" }
                            ]
                        }
                    ],
                    viewAllLabel: "सर्व रक्त माहिती पहा",
                    viewAllHref: "/"
                },

                {
                    label: "दान करण्याचे मार्ग",
                    href: "/donate",
                    columns: [
                        {
                            title: "दान पर्याय",
                            links: [
                                { label: "अपॉइंटमेंट बुक करा", href: "/donate" },
                                { label: "दाता केंद्रे तास आणि स्थाने", href: "/" },
                                { label: "ओळख कार्यक्रम", href: "/" }
                            ]
                        }
                    ],
                    viewAllLabel: "सर्व दान मार्ग पहा",
                    viewAllHref: "/donate"
                },
                {
                    label: "आमच्याबद्दल",
                    href: "/about",
                    columns: [
                        {
                            title: "आमची संस्था",
                            links: [
                                { label: "आमचे ध्येय", href: "/about" },
                                { label: "आमचा इतिहास", href: "/about" },
                                { label: "संपर्क करा", href: "/" },
                                { label: "दाता केंद्रांमध्ये सुलभता", href: "/" }
                            ]
                        }
                    ],
                    viewAllLabel: "सर्व आमच्याबद्दल पहा",
                    viewAllHref: "/about"
                },
                {
                    label: "रक्तदान",
                    href: "#",
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
            title: "तुमचा अभिप्राय महत्त्वाचा आहे",
            subtitle: "आम्हाला आमच्या सेवा सुधारण्यास मदत करा. तुमच्या सूचना आमच्यासाठी मौल्यवान आहेत.",
            placeholder: "तुमचे विचार, सूचना किंवा अनुभव सामायिक करा...",
            submitBtn: "अभिप्राय सबमिट करा",
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
            totalDonations: "एकूण रक्तदान"
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
            directionsBtn: "दिशा मिळवा"
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

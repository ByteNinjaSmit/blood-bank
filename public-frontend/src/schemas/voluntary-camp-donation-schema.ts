import { z } from 'zod'

export type SchemaLanguage = 'en' | 'mr'

const messages: Record<SchemaLanguage, {
    firstNameRequired: string
    middleNameRequired: string
    lastNameRequired: string
    dobRequired: string
    ageRange: string
    bloodGroupRequired: string
    occupationRequired: string
    campRequired: string
    addressTooShort: string
    mobileLength: string
    digitsOnly: string
    pincodeLength: string
    invalidEmail: string
}> = {
    en: {
        firstNameRequired: "First name is required",
        middleNameRequired: "Father/Husband name is required",
        lastNameRequired: "Surname is required",
        dobRequired: "Date of birth is required",
        ageRange: "Donor must be between 18 and 65 years old",
        bloodGroupRequired: "Blood group is required",
        occupationRequired: "Occupation is required",
        campRequired: "Camp selection is required",
        addressTooShort: "Address is too short",
        mobileLength: "Mobile must be 10 digits",
        digitsOnly: "Digits only",
        pincodeLength: "Pincode must be 6 digits",
        invalidEmail: "Invalid email"
    },
    mr: {
        firstNameRequired: "पहिले नाव आवश्यक आहे",
        middleNameRequired: "वडील/पतीचे नाव आवश्यक आहे",
        lastNameRequired: "आडनाव आवश्यक आहे",
        dobRequired: "जन्मतारीख आवश्यक आहे",
        ageRange: "दात्याचे वय १८ ते ६५ वर्षांच्या दरम्यान असावे",
        bloodGroupRequired: "रक्तगट आवश्यक आहे",
        occupationRequired: "व्यवसाय आवश्यक आहे",
        campRequired: "शिबिर निवडणे आवश्यक आहे",
        addressTooShort: "पत्ता खूप लहान आहे",
        mobileLength: "मोबाईल नंबर १० अंकी असावा",
        digitsOnly: "फक्त अंक वापरा",
        pincodeLength: "पिनकोड ६ अंकी असावा",
        invalidEmail: "अवैध ईमेल पत्ता"
    }
}

export function getCampDonationSchema(language: SchemaLanguage = 'en') {
    const m = messages[language]

    return z.object({
        // 1. Identity
        firstName: z.string().min(1, m.firstNameRequired),
        middleName: z.string().min(1, m.middleNameRequired),
        lastName: z.string().min(1, m.lastNameRequired),
        sex: z.enum(['M', 'F']),
        dob: z.string().min(1, m.dobRequired),
        age: z.string().refine((val) => {
            const n = parseInt(val)
            return !isNaN(n) && n >= 18 && n <= 65
        }, m.ageRange),
        bloodGroup: z.string().min(1, m.bloodGroupRequired),
        occupation: z.string().min(1, m.occupationRequired),
        campId: z.string().min(1, m.campRequired),

        // 2. Contact
        address: z.string().min(5, m.addressTooShort),
        mobile: z.string().length(10, m.mobileLength).regex(/^\d+$/, m.digitsOnly),
        pincode: z.string().length(6, m.pincodeLength).regex(/^\d+$/, m.digitsOnly).optional().or(z.literal('')),
        email: z.string().email(m.invalidEmail).optional().or(z.literal('')),

        // 3. History
        isFirstTime: z.enum(['yes', 'no']),
        isRepeated: z.enum(['yes', 'no']),
        lastDonationDate: z.string().optional().or(z.literal('')),
        totalDonations: z.string().optional().or(z.literal('')),
        emergencyConsent: z.enum(['yes', 'no']),
    })
}

// Backward-compatible default (English) export
export const voluntaryCampDonationSchema = getCampDonationSchema('en')

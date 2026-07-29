import { z } from 'zod'

export const voluntaryCampDonationSchema = z.object({
    // 1. Identity
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().min(1, "Father/Husband name is required"),
    lastName: z.string().min(1, "Surname is required"),
    sex: z.enum(['M', 'F']),
    dob: z.string().min(1, "Date of birth is required"),
    age: z.string().refine((val) => {
        const n = parseInt(val)
        return !isNaN(n) && n >= 18 && n <= 65
    }, "Donor must be between 18 and 65 years old"),
    bloodGroup: z.string().min(1, "Blood group is required"),
    occupation: z.string().min(1, "Occupation is required"),
    campId: z.string().min(1, "Camp selection is required"),

    // 2. Contact
    address: z.string().min(5, "Address is too short"),
    mobile: z.string().length(10, "Mobile must be 10 digits").regex(/^\d+$/, "Digits only"),
    pincode: z.string().length(6, "Pincode must be 6 digits").regex(/^\d+$/, "Digits only"),
    email: z.string().email("Invalid email").optional().or(z.literal('')),

    // 3. History
    isFirstTime: z.enum(['yes', 'no']),
    isRepeated: z.enum(['yes', 'no']),
    lastDonationDate: z.string().optional().or(z.literal('')),
    totalDonations: z.string().optional().or(z.literal('')),
    emergencyConsent: z.enum(['yes', 'no']),
})

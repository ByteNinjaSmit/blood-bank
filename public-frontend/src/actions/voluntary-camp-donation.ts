"use server";

import connectToDatabase from "@/lib/db";
import CampDonation from "@/models/voluntary-camp-donation-model";
import Camp from "@/models/camp-model";

import { voluntaryCampDonationSchema } from "@/schemas/voluntary-camp-donation-schema";

const yn = (v: unknown) => v === "yes" || v === true;

// The form collects "yes"/"no" strings for a simpler UI, but the shared
// CampDonation collection (same one the admin panel's Camp Donor Appointment
// view reads) stores booleans — convert here rather than reshape the whole form.
// Vitals and clinical exam findings are intentionally not collected on this
// initial public registration — staff record them in person at the camp.
function toCampDonationDoc(data: Record<string, any>) {
    return {
        firstName: data.firstName,
        middleName: data.middleName || undefined,
        lastName: data.lastName,
        sex: data.sex,
        dob: data.dob,
        age: Number(data.age),
        occupation: data.occupation || undefined,
        address: data.address,
        mobile: data.mobile,
        pincode: data.pincode,
        email: data.email || undefined,
        isFirstTime: yn(data.isFirstTime),
        isRepeated: yn(data.isRepeated),
        lastDonationDate: data.lastDonationDate || undefined,
        totalDonations: Number(data.totalDonations) || 0,
        emergencyConsent: yn(data.emergencyConsent),
        bloodGroup: data.bloodGroup,
        campId: data.campId,
    };
}

export async function createVoluntaryCampDonation(data: any) {
    try {
        await connectToDatabase();

        // Server-side validation
        const validation = voluntaryCampDonationSchema.safeParse(data);
        if (!validation.success) {
            const errorMsg = validation.error.issues.map(e => e.message).join(", ");
            return { success: false, message: `Validation failed: ${errorMsg}` };
        }

        // The campId comes from client state (a URL query param on the
        // registration page), so it must be re-checked against a real,
        // still-open camp here — never trust it just because it looks like
        // a valid ObjectId.
        const camp = await Camp.findOne({ _id: validation.data.campId, dateTo: { $gte: new Date() } })
            .select("_id")
            .lean();
        if (!camp) {
            return { success: false, message: "Selected camp is not valid or has already ended." };
        }

        const newDonation = await CampDonation.create(toCampDonationDoc(validation.data));

        return {
            success: true,
            message: "Voluntary camp donation registered successfully",
            data: { id: newDonation._id.toString() }
        };
    } catch (error: any) {
        console.error("Error creating voluntary camp donation:", error);
        return {
            success: false,
            message: error.message || "Failed to register donation"
        };
    }
}

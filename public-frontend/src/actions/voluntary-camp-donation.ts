"use server";

import connectToDatabase from "@/lib/db";
import CampDonation from "@/models/voluntary-camp-donation-model";

import { voluntaryCampDonationSchema } from "@/schemas/voluntary-camp-donation-schema";

const yn = (v: unknown) => v === "yes" || v === true;

// The form collects "yes"/"no" strings and flat clinical-exam fields for a
// simpler UI, but the shared CampDonation collection (same one the admin
// panel's Camp Donor Appointment view reads) stores booleans and nests them
// under clinicalFindings — convert here rather than reshape the whole form.
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
        weight: Number(data.weight),
        hb: Number(data.hb),
        temp: Number(data.temp),
        pulse: Number(data.pulse),
        bp: data.bp,
        o2Level: Number(data.o2Level),
        bloodGroup: data.bloodGroup,
        clinicalFindings: {
            pedalOedema: yn(data.pedalOedema),
            lymphadenopathy: yn(data.lymphadenopathy),
            cyanosis: yn(data.cyanosis),
            cvs: data.cvs || "normal",
            rs: data.rs || "normal",
            pa: data.pa || "normal",
            cns: data.cns || "normal",
            gis: data.gis || "normal",
            freeFromSkinDisease: yn(data.freeFromSkinDisease),
            freeFromScars: yn(data.freeFromScars),
        },
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

        const newDonation = await CampDonation.create(toCampDonationDoc(validation.data));

        return {
            success: true,
            message: "Voluntary camp donation registered successfully",
            data: JSON.parse(JSON.stringify(newDonation))
        };
    } catch (error: any) {
        console.error("Error creating voluntary camp donation:", error);
        return {
            success: false,
            message: error.message || "Failed to register donation"
        };
    }
}

export async function getVoluntaryDonationsByCamp(campId: string) {
    try {
        await connectToDatabase();
        const donations = await CampDonation.find({ campId }).sort({ createdAt: -1 });
        return {
            success: true,
            data: JSON.parse(JSON.stringify(donations))
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message
        };
    }
}

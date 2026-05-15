"use server";

import connectToDatabase from "@/lib/db";
import VoluntaryCampDonation from "@/models/voluntary-camp-donation-model";

import { voluntaryCampDonationSchema } from "@/schemas/voluntary-camp-donation-schema";

export async function createVoluntaryCampDonation(data: any) {
    try {
        await connectToDatabase();
        
        // Server-side validation
        const validation = voluntaryCampDonationSchema.safeParse(data);
        if (!validation.success) {
            const errorMsg = validation.error.issues.map(e => e.message).join(", ");
            return { success: false, message: `Validation failed: ${errorMsg}` };
        }

        const newDonation = await VoluntaryCampDonation.create(validation.data);
        
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

export async function getVoluntaryDonationsByCamp(siteId: string) {
    try {
        await connectToDatabase();
        const donations = await VoluntaryCampDonation.find({ siteId }).sort({ createdAt: -1 });
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

"use server";

import connectToDatabase from "@/lib/db";
import Appointment from "@/models/appointment-model";

interface AppointmentData {
    fullName?: string;
    gender?: string;
    mobileNo: string;
    email?: string;
    bloodGroup?: string;
    birthDate?: string;
    age?: number;
    address?: string;
    appointmentDate?: string;
    recentIllness?: string;
    surgery?: string;
    medication?: string;
    lastDonation?: string;
    donationFrequency?: string;
    wantReminder?: boolean;
    reminderDays?: number;
}

interface ActionResponse {
    success: boolean;
    message: string;
    error?: string;
}

export async function bookAppointment(data: AppointmentData): Promise<ActionResponse> {
    try {
        await connectToDatabase();

        const sanitizedData = Object.fromEntries(
            Object.entries(data).filter(([, value]) => {
                if (value === undefined || value === null) return false;
                if (typeof value === "string" && value.trim() === "") return false;
                return true;
            })
        ) as AppointmentData;

        const newAppointment = new Appointment({
            ...sanitizedData,
            source: "public-frontend-nextjs",
        });

        await newAppointment.save();

        return { success: true, message: "Appointment booked successfully!" };
    } catch (error: any) {
        console.error("Failed to book appointment:", error);
        return {
            success: false,
            message: error.message || "Failed to book appointment.",
            error: JSON.stringify(error)
        };
    }
}

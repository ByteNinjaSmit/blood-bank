"use server";

import connectToDatabase from "@/lib/db";
import Appointment from "@/models/appointment-model";

interface AppointmentData {
    fullName: string;
    gender: string;
    mobileNo: string;
    email?: string;
    bloodGroup: string;
    birthDate: string;
    address: string;
    appointmentDate: string;
    recentIllness?: string;
    surgery?: string;
    medication?: string;
    lastDonation?: string;
}

interface ActionResponse {
    success: boolean;
    message: string;
    error?: string;
}

export async function bookAppointment(data: AppointmentData): Promise<ActionResponse> {
    try {
        await connectToDatabase();

        const newAppointment = new Appointment({
            ...data,
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

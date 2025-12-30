import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppointment extends Document {
    fullName?: string;
    gender?: string;
    mobileNo: string;
    email?: string;
    bloodGroup?: string;
    birthDate?: Date;
    address?: string;
    appointmentDate?: Date;
    status: "pending" | "confirmed" | "cancelled";
    source: string;
    createdAt: Date;
    recentIllness?: string;
    surgery?: string;
    medication?: string;
    lastDonation?: Date;
}

const AppointmentSchema: Schema<IAppointment> = new Schema({
    fullName: {
        type: String,
        required: false,
        trim: true,
    },
    gender: {
        type: String,
        required: false,
        trim: true,
    },
    mobileNo: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v: string) {
                return /^\d{10}$/.test(v);
            },
            message: (props: { value: string }) => `${props.value} is not a valid mobile number!`,
        },
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    bloodGroup: {
        type: String,
        required: false,
        trim: true,
    },
    birthDate: {
        type: Date,
        required: false,
    },
    address: {
        type: String,
        required: false,
        trim: true,
    },
    appointmentDate: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled"],
        default: "pending",
    },
    source: {
        type: String,
        default: "public-frontend-nextjs",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    recentIllness: {
        type: String,
        default: "no",
    },
    surgery: {
        type: String,
        default: "no",
    },
    medication: {
        type: String,
        default: "no",
    },
    lastDonation: {
        type: Date,
    }
});

AppointmentSchema.index({ appointmentDate: 1 });
AppointmentSchema.index({ mobileNo: 1 });

// Prevent model overwrite in development HMR
const Appointment: Model<IAppointment> =
    mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;

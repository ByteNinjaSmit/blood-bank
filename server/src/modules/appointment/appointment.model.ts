// Appointment — donor-facing "book an appointment" form on the public
// marketing site (public-frontend/src/models/appointment-model.ts writes
// here directly via its own Mongoose connection to the same database).
// This module only reads/updates; the public site owns creation.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const AppointmentSchema = new Schema(
  {
    fullName: { type: String, trim: true },
    gender: { type: String, trim: true },
    mobileNo: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    bloodGroup: { type: String, trim: true },
    birthDate: { type: Date },
    age: { type: Number },
    address: { type: String, trim: true },
    appointmentDate: { type: Date },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    source: { type: String, default: 'public-frontend-nextjs' },
    recentIllness: { type: String, default: 'no' },
    surgery: { type: String, default: 'no' },
    medication: { type: String, default: 'no' },
    lastDonation: { type: Date },
    donationFrequency: { type: String, enum: ['1', '2', '3', '4'], default: '1' },
    wantReminder: { type: Boolean, default: false },
    reminderDays: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'appointments' },
);

AppointmentSchema.index({ appointmentDate: 1 });
AppointmentSchema.index({ mobileNo: 1 });
AppointmentSchema.index({ status: 1, createdAt: -1 });

export type Appointment = InferSchemaType<typeof AppointmentSchema>;
export type AppointmentModelType = Model<Appointment>;
export const AppointmentModel: AppointmentModelType =
  (mongoose.models.Appointment as AppointmentModelType | undefined) ??
  mongoose.model<Appointment>('Appointment', AppointmentSchema);

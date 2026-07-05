// Requisition — a hospital's request for blood components for a
// patient. Drives the match → crossmatch → issue flow.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ABO_GROUP, COMPONENT_TYPE, RH_FACTOR } from '@/shared/enums';

const RequestedComponent = new Schema(
  {
    componentType: { type: String, enum: COMPONENT_TYPE, required: true },
    units: { type: Number, required: true, min: 1 },
    aboGroup: { type: String, enum: ABO_GROUP, required: true },
    rhFactor: { type: String, enum: RH_FACTOR, required: true },
    urgency: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'EMERGENCY'],
      default: 'ROUTINE',
    },
  },
  { _id: false },
);

const MatchedUnit = new Schema(
  {
    unitId: { type: String, required: true },
    componentType: { type: String, enum: COMPONENT_TYPE, required: true },
    compatibilityType: { type: String, enum: ['EXACT', 'COMPATIBLE'], required: true },
    crossmatchRequired: { type: Boolean, required: true },
    crossmatchStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'COMPATIBLE', 'INCOMPATIBLE'],
      default: 'PENDING',
    },
    reservedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const PatientHistorySchema = new Schema(
  {
    previousTransfusions: { type: Number, default: 0 },
    approximateDate: { type: String, trim: true },
    presenceOfReaction: {
      type: String,
      enum: ['Presence', 'Absence', 'None'],
      default: 'None',
    },
  },
  { _id: false },
);

const PatientPregnancySchema = new Schema(
  {
    numPregnancies: { type: Number, default: 0 },
    numMiscarriages: { type: Number, default: 0 },
    numChildrenWithHemolyticDisease: { type: Number, default: 0 },
  },
  { _id: false },
);

const RequisitionPatientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    sex: { type: String, enum: ['M', 'F', 'O'], required: true },
    mrn: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    indication: { type: String, trim: true },
    hb: { type: Number },
    history: { type: PatientHistorySchema, default: () => ({}) },
    pregnancy: { type: PatientPregnancySchema, default: () => ({}) },
  },
  { _id: false },
);

const RequisitionSchema = new Schema(
  {
    requisitionId: { type: String, required: true, unique: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    clinicianName: { type: String, required: true, trim: true },
    doctorName: { type: String, trim: true },
    requiredAt: { type: Date, index: true },
    requestedAt: { type: Date, default: Date.now },
    medicalOfficerSignature: { type: String, trim: true },
    hospitalSeal: { type: String, trim: true },
    patient: { type: RequisitionPatientSchema },
    requestedComponents: { type: [RequestedComponent], default: [] },
    matchedUnits: { type: [MatchedUnit], default: [] },
    status: {
      type: String,
      enum: ['PENDING', 'MATCHED', 'CROSSMATCHED', 'APPROVED', 'ISSUED', 'COMPLETED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    plateletCompatibilityMode: {
      type: String,
      enum: ['UNIVERSAL', 'MAJOR', 'MINOR'],
      default: 'UNIVERSAL',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,

    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Hospital dashboard: active requisitions fast lookup.
RequisitionSchema.index({ hospitalId: 1, status: 1 });
// Patient history view.
RequisitionSchema.index({ patientId: 1, status: 1 });
// Urgency queue: sort by requiredAt for PENDING/MATCHED.
RequisitionSchema.index({ status: 1, requiredAt: 1 });
RequisitionSchema.index({ createdAt: -1 });

export type Requisition = InferSchemaType<typeof RequisitionSchema>;
export type RequisitionModel = Model<Requisition>;
export const RequisitionModel: RequisitionModel =
  (mongoose.models.Requisition as RequisitionModel | undefined) ??
  mongoose.model<Requisition>('Requisition', RequisitionSchema);

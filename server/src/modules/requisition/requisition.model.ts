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

const RequisitionSchema = new Schema(
  {
    requisitionId: { type: String, required: true, unique: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    clinicianName: { type: String, required: true, trim: true },
    requiredAt: Date,
    requestedComponents: { type: [RequestedComponent], default: [] },
    matchedUnits: { type: [MatchedUnit], default: [] },
    status: {
      type: String,
      enum: ['PENDING', 'MATCHED', 'CROSSMATCHED', 'APPROVED', 'ISSUED', 'COMPLETED', 'REJECTED'],
      default: 'PENDING',
      index: true,
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

export type Requisition = InferSchemaType<typeof RequisitionSchema>;
export type RequisitionModel = Model<Requisition>;
export const RequisitionModel: RequisitionModel =
  (mongoose.models.Requisition as RequisitionModel | undefined) ??
  mongoose.model<Requisition>('Requisition', RequisitionSchema);

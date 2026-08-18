// Requisition — a hospital's request for blood components for a
// patient. Drives the match → crossmatch → issue flow.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import {
  ABO_GROUP,
  CLINICAL_DISEASE,
  COMPONENT_TYPE,
  GRADING_REACTION,
  RH_FACTOR,
  SPECIAL_NEED,
} from '@/shared/enums';
import { cascadeFields } from '@/shared/schemas/cascade-fields';

// One agglutination-grading cell. Every worksheet reagent is stored as
// this enum (or null until the tech records it).
const grade = () => ({ type: String, enum: GRADING_REACTION, default: null }) as const;

// Blood-grouping / crossmatch worksheet: forward cell grouping, reverse
// serum grouping, and Rh typing. Reused for the recipient (once per
// requisition) and per matched donor bag.
const GroupingWorksheet = new Schema(
  {
    cellGrouping: new Schema(
      { antiA: grade(), antiA1: grade(), antiB: grade(), antiAB: grade(), antiH: grade() },
      { _id: false },
    ),
    serumGrouping: new Schema({ aCell: grade(), bCell: grade(), oCell: grade() }, { _id: false }),
    rhTyping: new Schema(
      { antiD: grade(), antiDBovine: grade(), indirectCoombs: grade() },
      { _id: false },
    ),
  },
  { _id: false },
);

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
    compatibilityMode: {
      type: String,
      enum: ['UNIVERSAL', 'MAJOR', 'MINOR'],
      default: 'UNIVERSAL',
    },
    // Per-component lifecycle within a requisition. ACTIVE = being fulfilled;
    // REJECTED = operator dropped this component (with reason) but the
    // requisition continues with the rest; UNAVAILABLE = no compatible stock.
    status: {
      type: String,
      enum: ['ACTIVE', 'REJECTED', 'UNAVAILABLE'],
      default: 'ACTIVE',
    },
    rejectionReason: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const MatchedUnit = new Schema(
  {
    unitId: { type: String, required: true },
    componentType: { type: String, enum: COMPONENT_TYPE, required: true },
    compatibilityType: { type: String, enum: ['EXACT', 'COMPATIBLE'], required: true },
    // Whether the unit is currently reserved (RESERVE fires at match time,
    // right when this entry is created). Cleared (false) once the unit is
    // unreserved (manually or by the auto-expiry scan) or issued.
    reserved: { type: Boolean, default: false },
    // Set when this unit is unreserved (manually from the requisition list /
    // Reserve page, or automatically by the expiry scan) so the UI can show
    // "Manually unreserved" vs "System unreserved" instead of just "Reserved".
    unreservedBy: { type: String, enum: ['SYSTEM', 'MANUAL'], default: null },
    unreservedReason: { type: String, trim: true, default: null },
    // Operator's explicit sign-off that a compatible SUBSTITUTE-group bag
    // (e.g. O− for an AB− patient) is acceptable. Only meaningful when
    // compatibilityType === 'COMPATIBLE'; reset on bag swap.
    compatibilityConfirmed: { type: Boolean, default: false },
    crossmatchRequired: { type: Boolean, required: true },
    crossmatchStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'COMPATIBLE', 'INCOMPATIBLE'],
      default: 'PENDING',
    },
    reservedAt: { type: Date, default: Date.now },
    // Manual crossmatch worksheet fields — operator-entered, never
    // auto-derived from ABO/Rh classification. Applies to every component
    // type (not just RBC); left null until the lab tech actually records it.
    compatibilityResult: {
      type: String,
      enum: ['MAJOR_COMPATIBLE', 'MINOR_COMPATIBLE', 'UNIVERSAL'],
      default: null,
    },
    crossmatchDoneAt: { type: Date, default: null },
    crossmatchSeenAt: { type: Date, default: null },
    cardNumber: { type: String, trim: true, default: null },
    // Per-bag (donor-side) blood-grouping worksheet.
    grouping: { type: GroupingWorksheet, default: undefined },
  },
  { _id: false },
);

// A single matched bag the operator dropped (with reason) before approval —
// the rest of the requisition/component continues. Kept as a standalone
// history record (unlike matchedUnits, which the bag is removed from) so the
// rejection is visible for the life of the requisition.
const RejectedUnit = new Schema(
  {
    unitId: { type: String, required: true },
    componentType: { type: String, enum: COMPONENT_TYPE, required: true },
    bloodGroup: { type: String, trim: true },
    rh: { type: String, trim: true },
    bagNo: { type: String, trim: true },
    reason: { type: String, trim: true, required: true },
    rejectedAt: { type: Date, default: Date.now },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
    address: { type: String, trim: true },
    age: { type: Number, required: true },
    ageUnit: { type: String, enum: ['YEARS', 'DAYS'], default: 'YEARS' },
    sex: { type: String, enum: ['M', 'F', 'O'], required: true },
    mrn: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    // Free text (or the literal enum string when a named disease is picked
    // via the dropdown, or the typed "Other" text). See indicationCategory
    // for the unambiguous, non-string-matching signal used to filter the
    // Clinical Indication / Disease Patients view — kept as a separate field
    // rather than repurposing `indication` so legacy free-text values remain
    // valid without migration.
    indication: { type: String, trim: true },
    indicationCategory: { type: String, enum: CLINICAL_DISEASE, default: null },
    // Free-text disease name when indicationCategory === 'OTHER' — kept
    // separate from `indication` (which stays a plain free-text "Indication
    // for Transfusion" field, independent of this structured classification).
    otherDiseaseName: { type: String, trim: true },
    hb: { type: Number },
    specialNeeds: { type: [String], enum: SPECIAL_NEED, default: [] },
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
    // Distinguishes a reservation (create -> match -> grouping/crossmatch ->
    // approve, then stop) from a normal requisition (which continues to
    // issue/complete) — same document shape and pipeline either way, only
    // the origin/intent differs.
    purpose: {
      type: String,
      enum: ['REQUISITION', 'RESERVATION'],
      default: 'REQUISITION',
      index: true,
    },
    patient: { type: RequisitionPatientSchema },
    // Recipient (patient-side) blood-grouping worksheet, entered once in
    // Match Review.
    recipientGrouping: { type: GroupingWorksheet, default: undefined },
    requestedComponents: { type: [RequestedComponent], default: [] },
    matchedUnits: { type: [MatchedUnit], default: [] },
    // Individually rejected bags — removed from matchedUnits but kept here
    // as a permanent record for the life of the requisition.
    rejectedUnits: { type: [RejectedUnit], default: [] },
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
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...cascadeFields,
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
// Reserve list / Requisition list split by purpose.
RequisitionSchema.index({ purpose: 1, status: 1, createdAt: -1 });
// Donor donation-history lookback: find the requisition a given unit was
// matched into.
RequisitionSchema.index({ 'matchedUnits.unitId': 1 });

export type Requisition = InferSchemaType<typeof RequisitionSchema>;
export type RequisitionModel = Model<Requisition>;
export const RequisitionModel: RequisitionModel =
  (mongoose.models.Requisition as RequisitionModel | undefined) ??
  mongoose.model<Requisition>('Requisition', RequisitionSchema);

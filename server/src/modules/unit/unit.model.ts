// BloodUnit — the aggregate. One per producible component. Carries its
// own state machine status, expiry, special-attribute flags, and
// references to the donation it came from. Inventory is a derived view
// over { status: { $in: ['RELEASED', 'RESERVED', 'CROSSMATCHED'] } }.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import {
  ABO_GROUP,
  CLINICAL_DISEASE,
  COMPONENT_TYPE,
  DISCARD_REASON,
  RH_FACTOR,
  SPECIAL_NEED,
  UNIT_STATUS,
} from '@/shared/enums';
import { cascadeFields } from '@/shared/schemas/cascade-fields';

const StatusHistoryEntry = new Schema(
  {
    from: { type: String, enum: UNIT_STATUS },
    to: { type: String, enum: UNIT_STATUS, required: true },
    event: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now, required: true },
    reason: { type: String, trim: true },
  },
  { _id: false },
);

const BloodUnitSchema = new Schema(
  {
    unitId: { type: String, required: true, unique: true },
    unitDin: { type: String, index: true, default: null }, // ISBT 128 DIN (Phase 9)
    productCode: { type: String, default: null }, // ISBT product code

    donationId: { type: String, required: true, index: true },
    legacyBagId: { type: Schema.Types.ObjectId, index: true },

    componentType: { type: String, enum: COMPONENT_TYPE, required: true, index: true },
    aboGroup: { type: String, enum: ABO_GROUP, required: true, index: true },
    rhFactor: { type: String, enum: RH_FACTOR, required: true, index: true },

    volumeMl: { type: Number, required: true },
    collectedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },

    status: { type: String, enum: UNIT_STATUS, required: true, default: 'COLLECTED', index: true },
    statusHistory: { type: [StatusHistoryEntry], default: [] },

    specialAttributes: [{ type: String, enum: SPECIAL_NEED }],

    campId: { type: Schema.Types.ObjectId, ref: 'Camp', index: true },

    // Set only for a bag taken on loan from another blood bank (BulkTransfer
    // TAKE_LOAN) — this bank never ran its own donation/collection for it,
    // so donationId is a synthetic `LOAN-<transferId>` rather than a real
    // Donation record. Kept for traceability/display only.
    loanedFrom: {
      transferId: { type: String, trim: true },
      bloodBankName: { type: String, trim: true },
    },

    quarantineReason: { type: String, trim: true },
    discardReason: { type: String, enum: DISCARD_REASON },
    discardNotes: { type: String, trim: true },

    reservedFor: { type: Schema.Types.ObjectId, ref: 'Requisition' },
    reservedAt: Date,
    reservedUntil: Date,

    issuedTo: { type: Schema.Types.ObjectId, ref: 'Issue' },
    issuedAt: Date,
    storageLocation: { type: String, default: null },
    // A unit issued directly to a named patient for a clinical indication
    // (Thalassemia / Sickle Cell Anaemia / Other), as opposed to being
    // sent to storage or matched against a hospital requisition.
    clinicalIndicationPatient: {
      firstName: String,
      middleName: String,
      lastName: String,
      address: String,
      age: Number,
      sex: String,
      bloodGroup: String,
      disease: { type: String, enum: CLINICAL_DISEASE },
      otherDiseaseName: { type: String, trim: true },
    },

    transfusedTo: { type: Schema.Types.ObjectId, ref: 'Transfusion' },
    transfusedAt: Date,

    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...cascadeFields,

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Composite index supporting the FEFO selector: filter by component +
// status + ABO + Rh, sort by expiry.
BloodUnitSchema.index({
  componentType: 1,
  status: 1,
  aboGroup: 1,
  rhFactor: 1,
  expiresAt: 1,
});

// Lookback (find units by donation) is already covered by the
// field-level `index: true` on donationId above.

export type BloodUnit = InferSchemaType<typeof BloodUnitSchema>;
export type BloodUnitModel = Model<BloodUnit>;
export const BloodUnitModel: BloodUnitModel =
  (mongoose.models.BloodUnit as BloodUnitModel | undefined) ??
  mongoose.model<BloodUnit>('BloodUnit', BloodUnitSchema);

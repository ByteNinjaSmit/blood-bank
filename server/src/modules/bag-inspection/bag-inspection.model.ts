import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { INSPECTION_DECISION } from '@/shared/enums';

const PhysicalChecksSchema = new Schema(
  {
    sealIntact: { type: Boolean },
    noLeakage: { type: Boolean },
    tubeIntegrity: { type: Boolean },
    needleCondition: { type: Boolean },
    labelPresence: { type: Boolean },
    sterilityCheck: { type: Boolean },
    packagingCondition: { type: Boolean },
  },
  { _id: false },
);

const BagInspectionSchema = new Schema(
  {
    inspectionId: { type: String, required: true, unique: true },
    grnId: { type: Schema.Types.ObjectId, ref: 'GoodsReceipt', required: true, index: true },
    stockId: { type: Schema.Types.ObjectId, ref: 'BagStock' },
    batchNumber: { type: String, required: true, trim: true, index: true },
    inspectionDate: { type: Date, required: true },
    inspectedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sampleSize: { type: Number, required: true, min: 1 },
    physicalChecks: { type: PhysicalChecksSchema },
    anticoagulantVolumeOk: { type: Boolean },
    tubePatency: { type: Boolean },
    observation: { type: String, trim: true },
    decision: { type: String, enum: INSPECTION_DECISION, required: true, index: true },
    rejectionReason: { type: String, trim: true },
    testingType: { type: String, enum: ['EMPTY', 'WB', 'PRBC', 'FFP', 'PC', 'CRYO', 'OTHER'] },
    testingStatus: { type: String, enum: ['SENT', 'REPORT_RECEIVED'] },
    sentDate: { type: Date },
    reportDate: { type: Date },
    testingLab: { type: String, trim: true },
    bagNo: { type: String, trim: true },
    segmentNo: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    testResult: { type: String, trim: true },
    factorVIII: { type: Number },
    fibrinogen: { type: Number },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

BagInspectionSchema.index({ grnId: 1, batchNumber: 1 });

export type BagInspection = InferSchemaType<typeof BagInspectionSchema>;
export type BagInspectionModel = Model<BagInspection>;
export const BagInspectionModel: BagInspectionModel =
  (mongoose.models.BagInspection as BagInspectionModel | undefined) ??
  mongoose.model<BagInspection>('BagInspection', BagInspectionSchema);

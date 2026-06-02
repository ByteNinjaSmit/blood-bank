// Issue — a unit leaving the bank against a requisition. Records the
// cold-chain start and who took it.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const IssueSchema = new Schema(
  {
    issueId: { type: String, required: true, unique: true },
    requisitionId: { type: Schema.Types.ObjectId, ref: 'Requisition', required: true, index: true },
    unitId: { type: String, required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collectedByName: { type: String, trim: true }, // porter / nurse who took it
    transportTempCelsius: Number,
    // Set when the unit comes back unused (within 30-min rule).
    returnedAt: Date,
    returnedReason: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export type Issue = InferSchemaType<typeof IssueSchema>;
export type IssueModel = Model<Issue>;
export const IssueModel: IssueModel =
  (mongoose.models.Issue as IssueModel | undefined) ??
  mongoose.model<Issue>('Issue', IssueSchema);

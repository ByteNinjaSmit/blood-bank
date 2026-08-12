import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { cascadeFields } from '@/shared/schemas/cascade-fields';

const HospitalSchema = new Schema(
  {
    hospitalId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    address: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...cascadeFields,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

HospitalSchema.index({ name: 'text' });

export type Hospital = InferSchemaType<typeof HospitalSchema>;
export type HospitalModelType = Model<Hospital>;
export const HospitalModel: HospitalModelType =
  (mongoose.models.Hospital as HospitalModelType | undefined) ??
  mongoose.model<Hospital>('Hospital', HospitalSchema);

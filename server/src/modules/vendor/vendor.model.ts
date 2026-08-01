import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { VENDOR_STATUS } from '@/shared/enums';
import { cascadeFields } from '@/shared/schemas/cascade-fields';

const VendorSchema = new Schema(
  {
    vendorId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    drugLicenseNo: { type: String, required: true, unique: true, trim: true },
    gstNo: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    approvalStatus: { type: String, enum: VENDOR_STATUS, default: 'PENDING' },
    contractStart: { type: Date },
    contractEnd: { type: Date },
    notes: { type: String, trim: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...cascadeFields,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

VendorSchema.index({ approvalStatus: 1 });
VendorSchema.index({ name: 1 });

export type Vendor = InferSchemaType<typeof VendorSchema>;
export type VendorModel = Model<Vendor>;
export const VendorModel: VendorModel =
  (mongoose.models.Vendor as VendorModel | undefined) ??
  mongoose.model<Vendor>('Vendor', VendorSchema);

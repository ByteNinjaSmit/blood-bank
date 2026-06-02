import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE } from '@/shared/enums';

const PermissionSchema = new Schema(
  {
    moduleName: { type: String, required: true },
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    publicId: { type: String, required: true, unique: true, index: true },
    name: {
      first: { type: String, required: true, trim: true },
      last: { type: String, required: true, trim: true },
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    role: { type: String, enum: ROLE, required: true, index: true },
    password: { type: String, required: true, select: false },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'blocked', 'rejected'],
      default: 'active',
      index: true,
    },
    permissions: { type: [PermissionSchema], default: [] },
    campId: { type: Schema.Types.ObjectId, ref: 'Camp', index: true },
    lastLoginAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

UserSchema.index({ role: 1, status: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const looksHashed =
    typeof this.password === 'string' &&
    /^(\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53})$/.test(this.password);
  if (looksHashed) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.password as string);
};

export type User = InferSchemaType<typeof UserSchema>;
export type UserModelType = Model<User & { comparePassword(p: string): Promise<boolean> }>;
export const UserModel: UserModelType =
  (mongoose.models.User as UserModelType | undefined) ??
  mongoose.model<User & { comparePassword(p: string): Promise<boolean> }>('User', UserSchema);

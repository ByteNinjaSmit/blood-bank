import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

const PermissionSchema = new Schema(
  {
    moduleName: { type: String, required: true },
    // Absent = a module-wide grant (cascades to every page under this
    // module). Present = a page-scoped override — only meaningful to the
    // frontend's access registry (client/src/config/access-registry); the
    // backend still projects it into the same flat Permission[] set a
    // module-wide entry would (see role-map.ts projectPermissions()).
    pageId: { type: String, default: null },
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
    // Free-text display label only — carries no authorization weight.
    // What a user can do is governed entirely by isFullAccess + permissions
    // below (see server/src/shared/role-map.ts).
    role: { type: String, required: true, trim: true, index: true },
    // Unconditional bypass of every requirePermission(...) check,
    // decoupled from the (cosmetic) role label above.
    isFullAccess: { type: Boolean, default: false },
    // Which Role template was last applied to prefill `role`/`permissions`
    // below (see server/src/modules/role). Display/prefill metadata only —
    // applying a role COPIES its grid onto this user; roleId is not read by
    // role-map.ts and later edits to the Role do not cascade here.
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', default: null },
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

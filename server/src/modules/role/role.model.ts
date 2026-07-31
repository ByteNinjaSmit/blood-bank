import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

// Same shape as User.model.ts's PermissionSchema — a Role is just a named,
// reusable snapshot of that grid an admin can apply to a user in one click
// (see role.service.ts / client CreateUserForm.jsx). Applying a role COPIES
// this grid onto the user; it is not a live reference read at auth time.
const PermissionSchema = new Schema(
  {
    moduleName: { type: String, required: true },
    pageId: { type: String, default: null },
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false },
);

const RoleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true, default: '' },
    isFullAccess: { type: Boolean, default: false },
    permissions: { type: [PermissionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type Role = InferSchemaType<typeof RoleSchema>;
export type RoleModelType = Model<Role>;
export const RoleModel: RoleModelType =
  (mongoose.models.Role as RoleModelType | undefined) ?? mongoose.model<Role>('Role', RoleSchema);

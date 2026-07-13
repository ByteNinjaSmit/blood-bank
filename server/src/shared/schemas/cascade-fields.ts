// Reusable Mongoose schema partial for cascade-aware soft delete. Spread
// this into any model's schema definition object alongside the existing
// deletedAt/deletedBy fields (add those too if the model lacks them).
//
// Usage:
//   const XSchema = new Schema({ ...fields, ...cascadeFields });
//
// Additive only — never remove or rename fields already on a model.

import { Schema } from 'mongoose';

export const cascadeFields = {
  deleteReason: { type: String },
  // Correlates every record affected by one cascade delete operation, so
  // cascadeRestore() can find exactly what to restore (and nothing else
  // that was independently soft-deleted before or after it).
  deleteBatchId: { type: String, index: true },

  // Set instead of deletedAt when a record participates in a completed
  // downstream workflow and cannot safely be soft-deleted without losing
  // medical/business traceability (see cascade-delete.ts isDownstreamLocked).
  affected: { type: Boolean, default: false, index: true },
  affectedReason: { type: String },
  affectedByModule: { type: String },
  affectedByRecord: { type: String },
  affectedDate: { type: Date },
  canAutoRecover: { type: Boolean, default: true },

  permanentlyDeletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  permanentlyDeletedAt: { type: Date },
  permanentDeleteReason: { type: String },
} as const;

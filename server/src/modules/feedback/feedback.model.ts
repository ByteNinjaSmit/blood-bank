// Feedback — "Your Feedback Matters" form on the public marketing site
// (public-frontend/src/models/feedback-model.ts writes here directly via
// its own Mongoose connection to the same database). This module only
// reads — the public site owns creation. Field shape mirrors the
// public-frontend schema exactly since both sides share the collection.

import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const FeedbackSchema = new Schema(
  {
    content: { type: String, required: true, trim: true },
    language: { type: String },
    source: { type: String, default: 'public-frontend' },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'feedbacks' },
);

FeedbackSchema.index({ createdAt: -1 });

export type Feedback = InferSchemaType<typeof FeedbackSchema>;
export type FeedbackModelType = Model<Feedback>;
export const FeedbackModel: FeedbackModelType =
  (mongoose.models.Feedback as FeedbackModelType | undefined) ??
  mongoose.model<Feedback>('Feedback', FeedbackSchema);

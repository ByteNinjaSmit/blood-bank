import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
    content: string;
    language?: string;
    source: string;
    createdAt: Date;
}

const FeedbackSchema: Schema<IFeedback> = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
    },
    language: {
        type: String,
        required: false,
    },
    source: {
        type: String,
        default: "public-frontend",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent model overwrite in development HMR
const Feedback: Model<IFeedback> =
    mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);

export default Feedback;

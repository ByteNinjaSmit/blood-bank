"use server";

import connectToDatabase from "@/lib/db";
import Feedback from "@/models/feedback-model";

interface FeedbackData {
    content: string;
    language?: string;
}

interface ActionResponse {
    success: boolean;
    message: string;
    error?: string;
}

export async function submitFeedback(data: FeedbackData): Promise<ActionResponse> {
    try {
        await connectToDatabase();

        if (!data.content || data.content.trim() === "") {
            return {
                success: false,
                message: "Feedback content is required."
            };
        }

        const newFeedback = new Feedback({
            content: data.content,
            language: data.language,
            source: "public-frontend"
        });

        await newFeedback.save();

        return { success: true, message: "Feedback submitted successfully!" };
    } catch (error: any) {
        console.error("Failed to submit feedback:", error);
        return {
            success: false,
            message: "Failed to submit feedback.",
            error: error.message
        };
    }
}

import { FeedbackModel } from '@/modules/feedback/feedback.model';
import type { ListFeedbackInput } from '@/modules/feedback/feedback.validator';

export interface FeedbackDto {
  id: string;
  content: string;
  language?: string;
  source: string;
  createdAt: string;
}

function toDto(raw: any): FeedbackDto {
  return {
    id: raw._id.toString(),
    content: raw.content,
    language: raw.language || undefined,
    source: raw.source,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
  };
}

export interface FeedbackRepo {
  list(q: ListFeedbackInput): Promise<{ items: FeedbackDto[]; total: number }>;
}

export function createFeedbackRepo(): FeedbackRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = {};
      if (q.fromDate || q.toDate) {
        const range: Record<string, Date> = {};
        if (q.fromDate) range.$gte = q.fromDate;
        if (q.toDate) range.$lte = q.toDate;
        filter.createdAt = range;
      }
      if (q.search) {
        filter.content = new RegExp(q.search, 'i');
      }

      const skip = (q.page - 1) * q.limit;
      const [docs, total] = await Promise.all([
        FeedbackModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
        FeedbackModel.countDocuments(filter),
      ]);
      return { items: docs.map(toDto), total };
    },
  };
}

import type { FeedbackRepo } from '@/modules/feedback/feedback.repository';
import type { ListFeedbackInput } from '@/modules/feedback/feedback.validator';

export interface FeedbackService {
  list(
    q: ListFeedbackInput,
  ): Promise<{ items: any[]; total: number; page: number; pageSize: number }>;
}

export function createFeedbackService(repo: FeedbackRepo): FeedbackService {
  return {
    async list(q) {
      const { items, total } = await repo.list(q);
      return { items, total, page: q.page, pageSize: q.limit };
    },
  };
}

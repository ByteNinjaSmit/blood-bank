import type { NotificationType } from '@/shared/enums';
import type { TemplatePayloads } from '@/shared/email/templates';

export interface INotificationService {
  send<K extends NotificationType>(job: {
    type: K;
    to: string;
    payload: TemplatePayloads[K];
  }): Promise<void>;
}

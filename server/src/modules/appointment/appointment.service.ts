import type { AppointmentRepo } from '@/modules/appointment/appointment.repository';
import type { ListAppointmentsInput } from '@/modules/appointment/appointment.validator';
import { notificationCenterService } from '@/modules/notification/notification-center.service';
import type { NotificationCategory, NotificationSeverity } from '@/shared/enums';

export interface AppointmentService {
  list(q: ListAppointmentsInput): Promise<{ items: any[]; total: number; page: number; pageSize: number }>;
  updateStatus(id: string, status: string): Promise<any>;
  summary(): Promise<{ pending: number; confirmed: number; cancelled: number; total: number }>;
}

const STATUS_NOTIFICATION: Partial<
  Record<string, { title: string; category: NotificationCategory; severity: NotificationSeverity }>
> = {
  confirmed: { title: 'Appointment approved', category: 'APPOINTMENT_APPROVED', severity: 'INFORMATION' },
  cancelled: { title: 'Appointment cancelled', category: 'APPOINTMENT_CANCELLED', severity: 'WARNING' },
};

export function createAppointmentService(repo: AppointmentRepo): AppointmentService {
  return {
    async list(q) {
      const { items, total } = await repo.list(q);
      return { items, total, page: q.page, pageSize: q.limit };
    },
    async updateStatus(id, status) {
      const updated = await repo.updateStatus(id, status);
      const notif = STATUS_NOTIFICATION[status];
      if (notif) {
        void notificationCenterService
          .notify({
            title: notif.title,
            message: `Appointment ${id} marked ${status}`,
            module: 'APPOINTMENTS',
            category: notif.category,
            severity: notif.severity,
            relatedRecordId: id,
            relatedRecordType: 'Appointment',
            actionLink: `/appointments/donors`,
          })
          .catch(() => undefined);
      }
      return updated;
    },
    async summary() {
      return repo.summary();
    },
  };
}

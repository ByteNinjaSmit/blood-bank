import type { AppointmentRepo } from '@/modules/appointment/appointment.repository';
import type { ListAppointmentsInput } from '@/modules/appointment/appointment.validator';

export interface AppointmentService {
  list(q: ListAppointmentsInput): Promise<{ items: any[]; total: number; page: number; pageSize: number }>;
  updateStatus(id: string, status: string): Promise<any>;
  summary(): Promise<{ pending: number; confirmed: number; cancelled: number; total: number }>;
}

export function createAppointmentService(repo: AppointmentRepo): AppointmentService {
  return {
    async list(q) {
      const { items, total } = await repo.list(q);
      return { items, total, page: q.page, pageSize: q.limit };
    },
    async updateStatus(id, status) {
      return repo.updateStatus(id, status);
    },
    async summary() {
      return repo.summary();
    },
  };
}

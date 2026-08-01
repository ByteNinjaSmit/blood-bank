import { AppointmentModel } from '@/modules/appointment/appointment.model';
import { NotFoundError } from '@/shared/errors';
import type { ListAppointmentsInput } from '@/modules/appointment/appointment.validator';

export interface AppointmentDto {
  id: string;
  fullName?: string;
  gender?: string;
  mobileNo: string;
  email?: string;
  bloodGroup?: string;
  birthDate?: string;
  age?: number;
  address?: string;
  appointmentDate?: string;
  status: string;
  source: string;
  recentIllness?: string;
  surgery?: string;
  medication?: string;
  lastDonation?: string;
  donationFrequency?: string;
  wantReminder?: boolean;
  reminderDays?: number;
  createdAt: string;
}

function toDto(raw: any): AppointmentDto {
  return {
    id: raw._id.toString(),
    fullName: raw.fullName || undefined,
    gender: raw.gender || undefined,
    mobileNo: raw.mobileNo,
    email: raw.email || undefined,
    bloodGroup: raw.bloodGroup || undefined,
    birthDate: raw.birthDate ? new Date(raw.birthDate).toISOString() : undefined,
    age: raw.age ?? undefined,
    address: raw.address || undefined,
    appointmentDate: raw.appointmentDate ? new Date(raw.appointmentDate).toISOString() : undefined,
    status: raw.status,
    source: raw.source,
    recentIllness: raw.recentIllness,
    surgery: raw.surgery,
    medication: raw.medication,
    lastDonation: raw.lastDonation ? new Date(raw.lastDonation).toISOString() : undefined,
    donationFrequency: raw.donationFrequency,
    wantReminder: raw.wantReminder,
    reminderDays: raw.reminderDays,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
  };
}

export interface AppointmentRepo {
  list(q: ListAppointmentsInput): Promise<{ items: AppointmentDto[]; total: number }>;
  updateStatus(id: string, status: string): Promise<AppointmentDto>;
  summary(): Promise<{ pending: number; confirmed: number; cancelled: number; total: number }>;
}

export function createAppointmentRepo(): AppointmentRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = {};
      if (q.status) filter.status = q.status;
      if (q.fromDate || q.toDate) {
        const range: Record<string, Date> = {};
        if (q.fromDate) range.$gte = q.fromDate;
        if (q.toDate) range.$lte = q.toDate;
        filter.appointmentDate = range;
      }
      if (q.search) {
        const rx = new RegExp(q.search, 'i');
        filter.$or = [{ fullName: rx }, { mobileNo: rx }, { email: rx }];
      }

      const skip = (q.page - 1) * q.limit;
      const [docs, total] = await Promise.all([
        AppointmentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
        AppointmentModel.countDocuments(filter),
      ]);
      return { items: docs.map(toDto), total };
    },

    async updateStatus(id, status) {
      const doc = await AppointmentModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
      if (!doc) throw new NotFoundError('Appointment', id);
      return toDto(doc);
    },

    async summary() {
      const rows = await AppointmentModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const summary = { pending: 0, confirmed: 0, cancelled: 0, total: 0 };
      for (const r of rows as any[]) {
        if (r._id === 'pending') summary.pending = r.count;
        else if (r._id === 'confirmed') summary.confirmed = r.count;
        else if (r._id === 'cancelled') summary.cancelled = r.count;
        summary.total += r.count;
      }
      return summary;
    },
  };
}

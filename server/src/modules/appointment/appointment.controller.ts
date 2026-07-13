import type { NextFunction, Request, Response } from 'express';
import { ValidateAppointment } from '@/modules/appointment/appointment.validator';
import type { AppointmentService } from '@/modules/appointment/appointment.service';
import { withAudit } from '@/shared/utils/with-audit';

export interface AppointmentControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
  summary(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createAppointmentControllers(service: AppointmentService): AppointmentControllers {
  return {
    async list(req, res, next) {
      try {
        const q = ValidateAppointment.listQuery(req);
        const data = await service.list(q);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async updateStatus(req, res, next) {
      try {
        const { id } = ValidateAppointment.idParam(req);
        const { status } = ValidateAppointment.updateStatusBody(req);
        const data = await service.updateStatus(id, status);
        if (req.user) {
          void withAudit(
            { actorId: req.user.id, role: req.user.role, requestId: req.id },
            { module: 'appointment', action: 'UPDATE', entityType: 'Appointment', entityId: id },
            undefined,
            { status },
          );
        }
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async summary(req, res, next) {
      try {
        const data = await service.summary();
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}

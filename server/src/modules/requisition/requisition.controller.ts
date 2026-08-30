import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { ValidateRequisition } from '@/modules/requisition/requisition.validator';
import { ValidateCrossmatch } from '@/modules/crossmatch/crossmatch.validator';
import { ValidateIssue } from '@/modules/issue/issue.validator';
import { ConflictError, UnauthorizedError, ForbiddenError } from '@/shared/errors';
import type { RequisitionService } from '@/modules/requisition/requisition.service';
import type { CrossmatchService } from '@/modules/crossmatch/crossmatch.service';
import type { IssueService } from '@/modules/issue/issue.service';
import type { PatientRepo } from '@/modules/patient/patient.repository';
import { enrichRequisition } from '@/modules/requisition/requisition.view';
import { normalizeRequestedComponents } from '@/modules/requisition/requisition.mapper';

export interface RequisitionControllers {
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  createPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  match: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  approve: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  complete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  reject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  crossmatch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  issue: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  issueAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateCrossmatchLegacy: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  availableUnits: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  swapMatchedUnit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  setRecipientGrouping: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  setMatchedUnitGrouping: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  confirmCompatibility: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  rejectComponent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  rejectBag: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  unreserve: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  unissue: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createRequisitionControllers(deps: {
  requisitions: RequisitionService;
  crossmatch: CrossmatchService;
  issue: IssueService;
  patients: PatientRepo;
}): RequisitionControllers {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        if (typeof req.query.status === 'string') {
          req.query.status = req.query.status.toUpperCase();
        }
        const q = ValidateRequisition.listQuery(req);
        const data = await deps.requisitions.list(q);
        const enrichedItems = await Promise.all(data.items.map(enrichRequisition));
        res.json({
          success: true,
          data: enrichedItems,
          pagination: { total: data.total, page: data.page, pages: data.pages },
          requestId: req.id,
        });
      } catch (e) {
        next(e);
      }
    },

    async createPatient(req, res, next) {
      try {
        const body = ValidateRequisition.createPatient(req);
        const created = await deps.patients.create(body, actor(req));
        res.status(201).json({ success: true, data: created, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const actorId = actor(req);

        // Normalize requestedComponents into the strict enum shape the
        // validator expects — must run before ValidateRequisition.createBody.
        req.body.requestedComponents = normalizeRequestedComponents(req.body.requestedComponents);

        // Auto-create a patient if details were sent inline as body.patient.
        if (!req.body.patientId && req.body.patient) {
          const p = req.body.patient;
          const patientPublicId =
            'PAT-' + new Types.ObjectId().toHexString().slice(-6).toUpperCase();

          let dob: Date | undefined;
          if (p.age) {
            const ageNum = Number(p.age);
            if (!isNaN(ageNum)) {
              dob = new Date();
              if (p.ageUnit === 'DAYS') {
                dob.setDate(dob.getDate() - ageNum);
              } else {
                dob.setFullYear(dob.getFullYear() - ageNum);
              }
            }
          }

          // The patient's own blood group must come from the patient card
          // itself, never from requestedComponents[0] — that's the product
          // being ordered, which is frequently NOT the patient's own type
          // (e.g. a universal-donor O-negative unit requested for an
          // A-positive patient). Falling back to the requested product's
          // group here previously fed a wrong "patient" blood type into
          // the incompatible-crossmatch auto-replacement logic.
          const createdPatient = await deps.patients.create(
            {
              patientPublicId,
              name: p.name || 'Unnamed Patient',
              address: p.address,
              dob,
              sex: p.sex || 'M',
              medicalRecordNumber: p.mrn,
              aboGroup: p.aboGroup,
              rhFactor: p.rhFactor,
              specialNeeds: Array.isArray(p.specialNeeds) ? p.specialNeeds : [],
            },
            actorId,
          );
          req.body.patientId = createdPatient.id;
        }

        if (!req.body.clinicianName && req.body.doctorName) {
          req.body.clinicianName = req.body.doctorName;
        }

        const body = ValidateRequisition.createBody(req);
        const created = await deps.requisitions.create(body, actorId);
        const enriched = await enrichRequisition(created);
        res.status(201).json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const actorId = actor(req);
        const { id } = ValidateRequisition.idParam(req);

        req.body.requestedComponents = normalizeRequestedComponents(req.body.requestedComponents);

        const body = ValidateRequisition.updateBody(req);
        const updated = await deps.requisitions.update(id, body, actorId);
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async match(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const result = await deps.requisitions.match(id, actor(req));

        if (result.shortages.length > 0) {
          if (result.partial) {
            const enrichedReq = await enrichRequisition(result.requisition);
            res.json({
              success: true,
              data: { requisition: enrichedReq, shortages: result.shortages },
              requestId: req.id,
            });
          } else {
            throw new ConflictError('Insufficient compatible stock to fully match request', {
              shortages: result.shortages,
            });
          }
        }

        const enrichedReq = await enrichRequisition(result.requisition);
        res.json({
          success: true,
          data: { requisition: enrichedReq, shortages: [] },
          requestId: req.id,
        });
      } catch (e) {
        next(e);
      }
    },

    async approve(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const data = await deps.requisitions.approve(id, actor(req));
        const enriched = await enrichRequisition(data);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async complete(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const data = await deps.requisitions.complete(id, actor(req));
        const enriched = await enrichRequisition(data);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const data = await deps.requisitions.get(id);
        const enriched = await enrichRequisition(data);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async reject(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const body = ValidateRequisition.rejectBody(req);
        const reason = body.rejectionReason || body.reason || '';
        const data = await deps.requisitions.reject(id, reason, actor(req));
        const enriched = await enrichRequisition(data);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async crossmatch(req, res, next) {
      try {
        const body = ValidateCrossmatch.performBody(req);
        const data = await deps.crossmatch.perform(body, actor(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async issue(req, res, next) {
      try {
        const body = ValidateIssue.issueBody(req);
        // Medical-officer override of the crossmatch gate (issuing an
        // incompatible / uncrossmatched RBC unit) is a distinct authorised
        // action — it needs `crossmatch:override`, not just `unit:issue`.
        // The reason + authorisedBy are still recorded by issue.service.
        if (body.override && req.user && !req.user.isFullAccess) {
          if (!req.user.permissions.includes('crossmatch:override')) {
            throw new ForbiddenError(
              'Issuing with a crossmatch override requires the crossmatch:override permission (medical-officer authorisation).',
            );
          }
        }
        const data = await deps.issue.issue(body, actor(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async issueAll(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { unitIds, issuedAt } = ValidateRequisition.issueAllBody(req);
        const results = await deps.requisitions.issueAll(id, unitIds, actor(req), issuedAt);
        res.status(201).json({ success: true, data: results, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async updateCrossmatchLegacy(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const body = ValidateRequisition.updateCrossmatchLegacyBody(req);
        const updated = await deps.requisitions.updateCrossmatchLegacy(id, body, actor(req));
        const enriched = await enrichRequisition(updated);
        res.status(200).json({
          success: true,
          message:
            body.crossmatchStatus === 'compatible'
              ? 'Crossmatch marked as compatible'
              : 'Crossmatch incompatible — unit released, replacement attempted',
          data: enriched,
        });
      } catch (e) {
        next(e);
      }
    },

    async availableUnits(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { componentType, aboGroup } = ValidateRequisition.availableUnitsQuery(req);
        const data = await deps.requisitions.availableUnits(id, componentType, aboGroup);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async swapMatchedUnit(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { fromUnitId, toUnitId } = ValidateRequisition.swapMatchedUnitBody(req);
        const updated = await deps.requisitions.swapMatchedUnit(
          id,
          fromUnitId,
          toUnitId,
          actor(req),
        );
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async setRecipientGrouping(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const body = ValidateRequisition.recipientGroupingBody(req);
        const updated = await deps.requisitions.setRecipientGrouping(id, body, actor(req));
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async setMatchedUnitGrouping(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { unitId, grouping } = ValidateRequisition.matchedUnitGroupingBody(req);
        const updated = await deps.requisitions.setMatchedUnitGrouping(
          id,
          unitId,
          grouping,
          actor(req),
        );
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async confirmCompatibility(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { unitId, confirmed } = ValidateRequisition.confirmCompatibilityBody(req);
        const updated = await deps.requisitions.confirmCompatibility(
          id,
          unitId,
          confirmed,
          actor(req),
        );
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async rejectComponent(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { componentType, reason } = ValidateRequisition.rejectComponentBody(req);
        const updated = await deps.requisitions.rejectComponent(
          id,
          componentType,
          reason,
          actor(req),
        );
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async rejectBag(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { unitId, reason } = ValidateRequisition.rejectBagBody(req);
        const updated = await deps.requisitions.rejectBag(id, unitId, reason, actor(req));
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async unreserve(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { unitId, reason } = ValidateRequisition.unreserveBody(req);
        const updated = await deps.requisitions.unreserve(id, unitId, reason, actor(req));
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async unissue(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { unitIds, reason } = ValidateRequisition.unissueBody(req);
        const updated = await deps.requisitions.unissueUnits(id, unitIds, reason, actor(req));
        const enriched = await enrichRequisition(updated);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}

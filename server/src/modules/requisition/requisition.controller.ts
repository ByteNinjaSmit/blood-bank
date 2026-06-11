import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { ValidateRequisition } from '@/modules/requisition/requisition.validator';
import { ValidateCrossmatch } from '@/modules/crossmatch/crossmatch.validator';
import { ValidateIssue } from '@/modules/issue/issue.validator';
import { UnauthorizedError } from '@/shared/errors';
import type { RequisitionService } from '@/modules/requisition/requisition.service';
import type { CrossmatchService } from '@/modules/crossmatch/crossmatch.service';
import type { IssueService } from '@/modules/issue/issue.service';
import type { PatientRepo } from '@/modules/patient/patient.repository';

export interface RequisitionControllers {
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  createPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  match: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  approve: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  complete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  reject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  crossmatch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  issue: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  issueAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

async function enrichRequisition(reqDto: any): Promise<any> {
  if (!reqDto) return reqDto;
  const matchedUnits = reqDto.matchedUnits || [];
  const unitIds = matchedUnits.map((mu: any) => mu.unitId);
  const units = await BloodUnitModel.find({ unitId: { $in: unitIds }, deletedAt: null }).lean();
  const unitMap = new Map(units.map(u => [u.unitId, u]));

  const matchedInventory = matchedUnits.map((mu: any) => {
    const unit = unitMap.get(mu.unitId);
    if (!unit) return null;
    return {
      inventoryId: {
        _id: unit.unitId,
        bagNo: {
          bagNo: unit.donationId,
          bloodGroup: unit.aboGroup,
          rh: unit.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
        },
        componentId: {
          componentType: unit.componentType === 'PRBC' ? 'RBC' : unit.componentType === 'PLATELET_CONCENTRATE' ? 'Platelet' : unit.componentType === 'CRYOPRECIPITATE' ? 'Cryo' : unit.componentType,
          expiryDate: unit.expiresAt ? unit.expiresAt.toISOString() : '',
        }
      },
      compatibilityType: mu.compatibilityType.toLowerCase(),
      crossmatchRequired: mu.crossmatchRequired,
      crossmatchStatus: mu.crossmatchStatus.toLowerCase(),
      reservedAt: mu.reservedAt,
    };
  }).filter(Boolean);

  let hospitalDoc = null;
  if (reqDto.hospitalId && mongoose.Types.ObjectId.isValid(reqDto.hospitalId)) {
    hospitalDoc = await mongoose.model('Hospital').findById(reqDto.hospitalId).select('name').lean() as any;
  }

  let patientDoc = null;
  if (reqDto.patientId && mongoose.Types.ObjectId.isValid(reqDto.patientId)) {
    patientDoc = await mongoose.model('Patient').findById(reqDto.patientId).lean() as any;
  }

  let age = '';
  if (patientDoc?.dob) {
    const birthDate = new Date(patientDoc.dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    age = String(calculatedAge);
  }

  return {
    ...reqDto,
    matchedInventory,
    hospitalId: hospitalDoc ? { _id: reqDto.hospitalId, name: hospitalDoc.name } : reqDto.hospitalId,
    patient: patientDoc ? {
      name: patientDoc.name,
      age: age,
      sex: patientDoc.sex,
      mrn: patientDoc.medicalRecordNumber,
    } : undefined,
  };
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
        const q = ValidateRequisition.listQuery(req);
        const data = await deps.requisitions.list(q);
        const enrichedItems = await Promise.all(data.items.map(enrichRequisition));
        res.json({ success: true, data: enrichedItems, pagination: { total: data.total, page: data.page, pages: data.pages }, requestId: req.id });
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
        const body = ValidateRequisition.createBody(req);
        const created = await deps.requisitions.create(body, actor(req));
        const enriched = await enrichRequisition(created);
        res.status(201).json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async match(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const result = await deps.requisitions.match(id, actor(req));
        const enrichedReq = await enrichRequisition(result.requisition);
        res.json({ success: true, data: { requisition: enrichedReq, shortages: result.shortages }, requestId: req.id });
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
        const { reason } = ValidateRequisition.rejectBody(req);
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
        const data = await deps.issue.issue(body, actor(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async issueAll(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const requisition = await deps.requisitions.get(id);
        const results = [];
        for (const unit of requisition.matchedUnits) {
          const resUnit = await deps.issue.issue({
            requisitionId: id,
            unitId: unit.unitId,
          }, actor(req));
          results.push(resUnit);
        }
        await deps.requisitions.setStatus(id, 'ISSUED', actor(req));
        res.status(201).json({ success: true, data: results, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}

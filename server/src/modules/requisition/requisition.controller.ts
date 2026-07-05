import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import { PatientModel } from '@/modules/patient/patient.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { UserModel } from '@/modules/user/user.model';
import { ValidateRequisition } from '@/modules/requisition/requisition.validator';
import { ValidateCrossmatch } from '@/modules/crossmatch/crossmatch.validator';
import { ValidateIssue } from '@/modules/issue/issue.validator';
import { UnauthorizedError } from '@/shared/errors';
import type { RequisitionService } from '@/modules/requisition/requisition.service';
import type { CrossmatchService } from '@/modules/crossmatch/crossmatch.service';
import type { IssueService } from '@/modules/issue/issue.service';
import type { PatientRepo } from '@/modules/patient/patient.repository';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { generateRequisitionExcel } from '@/modules/requisition/requisition.excel';
import {
  compatibleAboGroups,
  requiresCrossmatch,
  strictness as getStrictness,
} from '@/shared/compatibility/abo-rh';
import type { AboGroup, RhFactor } from '@/shared/enums';

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
  getCompatibilityInfoLegacy: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateCrossmatchLegacy: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  exportExcel: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

async function enrichRequisition(reqDto: any): Promise<any> {
  if (!reqDto) return reqDto;
  const matchedUnits = reqDto.matchedUnits || [];
  const unitIds = matchedUnits.map((mu: any) => mu.unitId);
  const units = await BloodUnitModel.find({ unitId: { $in: unitIds }, deletedAt: null }).lean();
  const unitMap = new Map(units.map(u => [u.unitId, u]));

  const donationIds = units.map(u => u.donationId).filter(Boolean);
  const donations = await DonationModel.find({ donationId: { $in: donationIds } }).select('donationId bagNo segmentNo collectedAt donor').lean() as any[];
  const donationMap = new Map(donations.map(d => [d.donationId, d]));

  const donorIds = donations.map(d => d.donor).filter(Boolean);
  const donors = await DonorModel.find({ _id: { $in: donorIds } }).select('_id name').lean() as any[];
  const donorMap = new Map(donors.map(d => {
    const fullName = d.name ? [d.name.firstName, d.name.middleName, d.name.lastName].filter(Boolean).join(' ') : 'Unknown';
    return [d._id.toString(), fullName];
  }));

  const matchedInventory = matchedUnits.map((mu: any) => {
    const unit = unitMap.get(mu.unitId);
    if (!unit) return null;
    const donation = donationMap.get(unit.donationId);
    return {
      inventoryId: {
        _id: unit.unitId,
        bagNo: {
          bagNo: donation?.bagNo || unit.donationId,
          bloodGroup: unit.aboGroup,
          rh: unit.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
          donorName: donation?.donor ? donorMap.get(donation.donor.toString()) || 'Unknown' : 'Unknown',
          collectedAt: donation?.collectedAt ? donation.collectedAt.toISOString() : null,
          segmentNo: donation?.segmentNo || unit.unitDin || unit.unitId || '—',
        },
        componentId: {
          componentType: unit.componentType === 'PRBC' ? 'RBC' : unit.componentType === 'PLATELET_CONCENTRATE' ? 'Platelet' : unit.componentType === 'CRYOPRECIPITATE' ? 'Cryo' : unit.componentType,
          expiryDate: unit.expiresAt ? unit.expiresAt.toISOString() : '',
        },
        status: unit.status,
      },
      compatibilityType: mu.compatibilityType.toLowerCase(),
      crossmatchRequired: mu.crossmatchRequired,
      crossmatchStatus: mu.crossmatchStatus.toLowerCase(),
      reservedAt: mu.reservedAt,
    };
  }).filter(Boolean);

  let hospitalDoc = null;
  if (reqDto.hospitalId && mongoose.Types.ObjectId.isValid(reqDto.hospitalId)) {
    hospitalDoc = await HospitalModel.findById(reqDto.hospitalId).select('name').lean() as any;
  }

  let patientDoc = null;
  if (reqDto.patientId && mongoose.Types.ObjectId.isValid(reqDto.patientId)) {
    patientDoc = await PatientModel.findById(reqDto.patientId).lean() as any;
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

  const patientData = reqDto.patient || (patientDoc ? {
    name: patientDoc.name,
    age: age,
    sex: patientDoc.sex,
    mrn: patientDoc.medicalRecordNumber,
  } : undefined);

  // Map requestedComponents to frontend structure
  const requestedComponents = (reqDto.requestedComponents || []).map((rc: any) => ({
    componentType: rc.componentType === 'PRBC' ? 'RBC' : rc.componentType === 'PLATELET_CONCENTRATE' ? 'Platelet' : rc.componentType === 'CRYOPRECIPITATE' ? 'Cryo' : rc.componentType,
    units: rc.units,
    bloodGroup: rc.aboGroup,
    rh: rc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
    urgency: rc.urgency?.toLowerCase() === 'routine' ? 'regular' : rc.urgency?.toLowerCase(),
  }));

  let rejectedByDoc = null;
  if (reqDto.rejectedBy && mongoose.Types.ObjectId.isValid(reqDto.rejectedBy)) {
    rejectedByDoc = await UserModel.findById(reqDto.rejectedBy).select('name username').lean() as any;
  }

  return {
    ...reqDto,
    _id: reqDto.id || reqDto._id || '',
    requestId: reqDto.requisitionId,
    doctorName: reqDto.doctorName || reqDto.clinicianName,
    medicalOfficerSignature: reqDto.medicalOfficerSignature || '',
    hospitalSeal: reqDto.hospitalSeal || '',
    requestedComponents,
    matchedInventory,
    status: reqDto.status?.toLowerCase(),
    hospitalId: hospitalDoc ? { _id: reqDto.hospitalId, name: hospitalDoc.name } : reqDto.hospitalId,
    patient: patientData,
    rejectedBy: rejectedByDoc ? {
      _id: reqDto.rejectedBy,
      name: rejectedByDoc.name ? [rejectedByDoc.name.first, rejectedByDoc.name.last].filter(Boolean).join(' ') : (rejectedByDoc.username || '')
    } : reqDto.rejectedBy,
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
        if (typeof req.query.status === 'string') {
          req.query.status = req.query.status.toUpperCase();
        }
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
        const actorId = actor(req);

        // Normalize requestedComponents
        const requestedComponents = (req.body.requestedComponents || []).map((rc: any) => {
          let componentType = rc.componentType || 'PRBC';
          if (componentType === 'RBC') componentType = 'PRBC';
          if (componentType === 'Platelet') componentType = 'PLATELET_CONCENTRATE';
          if (componentType === 'Cryo') componentType = 'CRYOPRECIPITATE';

          const aboGroup = rc.aboGroup || rc.bloodGroup || 'O';

          let rhFactor = rc.rhFactor || rc.rh || 'POSITIVE';
          if (typeof rhFactor === 'string') {
            const upper = rhFactor.toUpperCase();
            if (upper === 'POSITIVE' || upper === 'POS') rhFactor = 'POSITIVE';
            else if (upper === 'NEGATIVE' || upper === 'NEG') rhFactor = 'NEGATIVE';
            else rhFactor = 'POSITIVE';
          }

          let urgency = rc.urgency || 'ROUTINE';
          if (typeof urgency === 'string') {
            const upper = urgency.toUpperCase();
            if (upper === 'REGULAR' || upper === 'ROUTINE') urgency = 'ROUTINE';
            else if (upper === 'URGENT') urgency = 'URGENT';
            else if (upper === 'EMERGENCY') urgency = 'EMERGENCY';
            else urgency = 'ROUTINE';
          }

          return {
            componentType,
            units: Number(rc.units || 1),
            aboGroup,
            rhFactor,
            urgency,
          };
        });

        // Auto create patient if details are sent directly in body.patient
        if (!req.body.patientId && req.body.patient) {
          const p = req.body.patient;
          const patientPublicId = 'PAT-' + new mongoose.Types.ObjectId().toHexString().slice(-6).toUpperCase();

          let dob: Date | undefined = undefined;
          if (p.age) {
            const ageNum = Number(p.age);
            if (!isNaN(ageNum)) {
              dob = new Date();
              dob.setFullYear(dob.getFullYear() - ageNum);
            }
          }

          const firstComp = requestedComponents[0];
          const aboGroup = firstComp?.aboGroup;
          const rhFactor = firstComp?.rhFactor;

          const createdPatient = await deps.patients.create({
            patientPublicId,
            name: p.name || 'Unnamed Patient',
            dob,
            sex: p.sex || 'M',
            medicalRecordNumber: p.mrn,
            aboGroup,
            rhFactor,
            specialNeeds: [],
          }, actorId);

          req.body.patientId = createdPatient.id;
        }

        // Map doctorName to clinicianName
        if (!req.body.clinicianName && req.body.doctorName) {
          req.body.clinicianName = req.body.doctorName;
        }

        // Set normalized requestedComponents back to req.body
        req.body.requestedComponents = requestedComponents;

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
        const { id } = req.params;

        // Normalize requestedComponents
        const requestedComponents = (req.body.requestedComponents || []).map((rc: any) => {
          let componentType = rc.componentType || 'PRBC';
          if (componentType === 'RBC') componentType = 'PRBC';
          if (componentType === 'Platelet') componentType = 'PLATELET_CONCENTRATE';
          if (componentType === 'Cryo') componentType = 'CRYOPRECIPITATE';

          const aboGroup = rc.aboGroup || rc.bloodGroup || 'O';

          let rhFactor = rc.rhFactor || rc.rh || 'POSITIVE';
          if (typeof rhFactor === 'string') {
            const upper = rhFactor.toUpperCase();
            if (upper === 'POSITIVE' || upper === 'POS') rhFactor = 'POSITIVE';
            else if (upper === 'NEGATIVE' || upper === 'NEG') rhFactor = 'NEGATIVE';
            else rhFactor = 'POSITIVE';
          }

          let urgency = rc.urgency || 'ROUTINE';
          if (typeof urgency === 'string') {
            const upper = urgency.toUpperCase();
            if (upper === 'REGULAR' || upper === 'ROUTINE') urgency = 'ROUTINE';
            else if (upper === 'URGENT') urgency = 'URGENT';
            else if (upper === 'EMERGENCY') urgency = 'EMERGENCY';
            else urgency = 'ROUTINE';
          }

          return {
            componentType,
            units: Number(rc.units || 1),
            aboGroup,
            rhFactor,
            urgency,
          };
        });

        // Update patient if details are sent directly in body.patient
        if (req.body.patientId && req.body.patient) {
          const p = req.body.patient;
          let dob: Date | undefined = undefined;
          if (p.age) {
            const ageNum = Number(p.age);
            if (!isNaN(ageNum)) {
              dob = new Date();
              dob.setFullYear(dob.getFullYear() - ageNum);
            }
          }
          await PatientModel.findByIdAndUpdate(req.body.patientId, {
            name: p.name || 'Unnamed Patient',
            dob,
            sex: p.sex || 'M',
            medicalRecordNumber: p.mrn,
          });
        }

        // Map doctorName to clinicianName
        const clinicianName = req.body.clinicianName || req.body.doctorName || '';
        const doctorName = req.body.doctorName || clinicianName;

        const updatedDoc = await RequisitionModel.findByIdAndUpdate(
          id,
          {
            hospitalId: new mongoose.Types.ObjectId(req.body.hospitalId),
            clinicianName,
            doctorName,
            requiredAt: req.body.requiredAt ? new Date(req.body.requiredAt) : undefined,
            medicalOfficerSignature: req.body.medicalOfficerSignature,
            hospitalSeal: req.body.hospitalSeal,
            requestedComponents,
            updatedBy: new mongoose.Types.ObjectId(actorId),
          },
          { new: true }
        ).lean();

        if (!updatedDoc) {
          res.status(404).json({ success: false, message: 'Requisition not found' });
          return;
        }

        const enriched = await enrichRequisition(updatedDoc);
        res.json({ success: true, data: enriched, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async match(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const result = await deps.requisitions.match(id, actor(req));

        // Check if there are any shortages in result.shortages
        const shortageKeys = Object.keys(result.shortages || {});
        if (shortageKeys.length > 0) {
          // Format the shortages map back to the array of objects the frontend expects
          const requisition = await RequisitionModel.findById(id).lean() as any;
          const formattedShortages = [];

          for (const key of shortageKeys) {
            // key is e.g. "PRBC-OPOSITIVE"
            const rc = requisition?.requestedComponents?.find((c: any) => {
              const keyPrefix = `${c.componentType}-${c.aboGroup}${c.rhFactor}`;
              return key === keyPrefix;
            });

            if (rc) {
              const compType = rc.componentType === 'PRBC' ? 'RBC' : rc.componentType === 'PLATELET_CONCENTRATE' ? 'Platelet' : rc.componentType === 'CRYOPRECIPITATE' ? 'Cryo' : rc.componentType;
              const missingCount = result.shortages[key] || 0;
              const requiredCount = rc.units;
              const availableCount = Math.max(0, requiredCount - missingCount);

              formattedShortages.push({
                componentType: compType,
                bloodGroup: rc.aboGroup,
                rh: rc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
                required: requiredCount,
                available: availableCount,
                compatibleGroupsSearched: [rc.aboGroup],
              });
            }
          }

          // For multi-component requests: if some units were matched, return 200 with shortages (partial success)
          // For single-component requests: return 409 (full failure)
          const isMultiComponent = Array.isArray(requisition?.requestedComponents) && requisition.requestedComponents.length > 1;
          const hasAnyMatch = Array.isArray(result.requisition?.matchedUnits) && result.requisition.matchedUnits.length > 0;

          if (isMultiComponent && hasAnyMatch) {
            // Partial match — some components reserved, some unavailable
            const enrichedReq = await enrichRequisition(result.requisition);
            res.json({ success: true, data: { requisition: enrichedReq, shortages: formattedShortages }, requestId: req.id });
          } else {
            // Single component shortage or complete shortage — full failure
            res.status(409).json({
              success: false,
              message: 'Insufficient compatible stock to fully match request',
              data: { shortages: formattedShortages },
            });
          }
          return;
        }

        const enrichedReq = await enrichRequisition(result.requisition);
        res.json({ success: true, data: { requisition: enrichedReq, shortages: [] }, requestId: req.id });
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
        const data = await deps.issue.issue(body, actor(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async issueAll(req, res, next) {
      try {
        const { id } = ValidateRequisition.idParam(req);
        const { unitIds } = req.body;
        const requisition = await deps.requisitions.get(id);
        const results = [];
        
        const targetUnits = Array.isArray(unitIds) && unitIds.length > 0
          ? requisition.matchedUnits.filter(u => unitIds.includes(u.unitId))
          : requisition.matchedUnits;

        for (const unit of targetUnits) {
          const resUnit = await deps.issue.issue({
            requisitionId: id,
            unitId: unit.unitId,
          }, actor(req));
          results.push(resUnit);
        }

        const matchedUnitIds = requisition.matchedUnits.map(mu => mu.unitId);
        const matchedUnitsInDb = await BloodUnitModel.find({ unitId: { $in: matchedUnitIds } });
        const allIssued = matchedUnitsInDb.every(u => u.status === 'ISSUED');

        if (allIssued) {
          await deps.requisitions.setStatus(id, 'COMPLETED', actor(req));
        } else {
          await deps.requisitions.setStatus(id, 'APPROVED', actor(req));
        }

        res.status(201).json({ success: true, data: results, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async getCompatibilityInfoLegacy(req, res, next) {
      try {
        const { componentType, bloodGroup, rh, plateletCompatibilityMode } = req.query as {
          componentType?: string;
          bloodGroup?: string;
          rh?: string;
          plateletCompatibilityMode?: 'UNIVERSAL' | 'MAJOR' | 'MINOR';
        };

        if (!componentType) {
          res.status(400).json({
            success: false,
            message: 'componentType query param is required',
          });
          return;
        }

        // Map componentType to backend enum
        let compType: any = componentType;
        if (componentType === 'RBC') compType = 'PRBC';
        else if (componentType === 'Platelet') compType = 'PLATELET_CONCENTRATE';
        else if (componentType === 'Cryo') compType = 'CRYOPRECIPITATE';

        // Map bloodGroup to backend enum
        const aboGroup: AboGroup = (bloodGroup || 'O') as AboGroup;

        // Map rh to backend enum
        let rhFactor: RhFactor = 'POSITIVE';
        if (rh) {
          const upper = rh.toUpperCase();
          if (upper === 'NEGATIVE' || upper === 'NEG') {
            rhFactor = 'NEGATIVE';
          }
        }

        const groups = compatibleAboGroups(aboGroup, compType, plateletCompatibilityMode);
        const reqXm = requiresCrossmatch(compType);
        const strict = getStrictness(compType);

        let rhRule = 'Rh factor preferred or ignored.';
        if (compType === 'PRBC' || compType === 'WHOLE_BLOOD') {
          rhRule = 'Rh-negative recipients must receive Rh-negative units; Rh-positive recipients can receive either.';
        }

        res.status(200).json({
          success: true,
          data: {
            compatibleDonorGroups: groups,
            rhRule,
            crossmatchRequired: reqXm,
            strictness: strict.toLowerCase(),
          },
        });
      } catch (err) {
        next(err);
      }
    },

    async updateCrossmatchLegacy(req, res, next) {
      try {
        const { id } = req.params;
        const { inventoryId, crossmatchStatus } = req.body as {
          inventoryId?: string;
          crossmatchStatus?: string;
        };

        if (!inventoryId || !crossmatchStatus || !['compatible', 'incompatible'].includes(crossmatchStatus)) {
          res.status(400).json({
            success: false,
            message: 'Provide inventoryId and crossmatchStatus (compatible | incompatible)',
          });
          return;
        }

        const actorId = actor(req);

        // Find the requisition
        const request = await RequisitionModel.findById(id);
        if (!request) {
          res.status(404).json({ success: false, message: 'Request not found' });
          return;
        }

        if (!['MATCHED', 'APPROVED'].includes(request.status)) {
          res.status(400).json({
            success: false,
            message: 'Crossmatch can only be updated for matched or approved requests',
          });
          return;
        }

        // Find the matched unit entry
        const miEntry = request.matchedUnits.find(
          (mu: any) => mu.unitId === inventoryId
        );
        if (!miEntry) {
          res.status(404).json({
            success: false,
            message: "Inventory item not found in this request's matched inventory",
          });
          return;
        }
        if (!miEntry.crossmatchRequired) {
          res.status(400).json({
            success: false,
            message: 'Crossmatch is not required for this component type',
          });
          return;
        }

        if (crossmatchStatus === 'compatible') {
          // Perform standard compatible crossmatch
          await deps.crossmatch.perform(
            {
              requisitionId: request.id,
              unitId: inventoryId,
              method: 'IS',
              result: 'COMPATIBLE',
            },
            actorId,
          );
        } else {
          // Perform standard incompatible crossmatch to release unit properly
          await deps.crossmatch.perform(
            {
              requisitionId: request.id,
              unitId: inventoryId,
              method: 'IS',
              result: 'INCOMPATIBLE',
            },
            actorId,
          );

          // Fetch fresh requisition state, filter out the incompatible unit
          const updatedReq = await RequisitionModel.findById(id);
          if (updatedReq) {
            updatedReq.matchedUnits = updatedReq.matchedUnits.filter(
              (mu: any) => mu.unitId !== inventoryId
            ) as any;

            // Fetch patient info to know recipient ABO/Rh
            const patient = await PatientModel.findById(request.patientId).lean() as any;
            const patientAbo = patient?.aboGroup || 'O';
            const patientRh = patient?.rhFactor || 'POSITIVE';

            // Find released unit's details
            const releasedUnit = await BloodUnitModel.findOne({ unitId: inventoryId });
            if (releasedUnit) {
              const compType = releasedUnit.componentType;
              const compatibleGroups = compatibleAboGroups(patientAbo, compType);

              let rhFilter: any = {};
              if (
                ['PRBC', 'WHOLE_BLOOD', 'LEUKOREDUCED_PRBC', 'WASHED_PRBC', 'IRRADIATED_PRBC'].includes(compType) &&
                patientRh === 'NEGATIVE'
              ) {
                rhFilter = { rhFactor: 'NEGATIVE' };
              } else {
                rhFilter = { rhFactor: { $in: ['POSITIVE', 'NEGATIVE'] } };
              }

              const alreadyMatchedIds = updatedReq.matchedUnits.map((mu: any) => mu.unitId);
              const now = new Date();

              const replacements = await BloodUnitModel.aggregate([
                {
                  $match: {
                    status: 'RELEASED',
                    unitId: { $nin: alreadyMatchedIds },
                    componentType: compType,
                    aboGroup: { $in: compatibleGroups },
                    ...rhFilter,
                    expiresAt: { $gte: now },
                    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
                  },
                },
                {
                  $addFields: {
                    _matchPriority: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ['$aboGroup', patientAbo] },
                            { $eq: ['$rhFactor', patientRh] },
                          ],
                        },
                        0,
                        1,
                      ],
                    },
                  },
                },
                { $sort: { _matchPriority: 1, expiresAt: 1, createdAt: 1 } },
                { $limit: 1 },
              ]);

              if (replacements.length > 0) {
                const rep = replacements[0];
                const isExact = rep.aboGroup === patientAbo && rep.rhFactor === patientRh;
                const needsXm = requiresCrossmatch(compType);

                // Reserve replacement
                const repUpd = await BloodUnitModel.updateOne(
                  { unitId: rep.unitId, status: 'RELEASED' },
                  {
                    $set: {
                      status: 'RESERVED',
                      reservedFor: updatedReq._id,
                      reservedAt: now,
                    },
                    $push: {
                      statusHistory: {
                        from: 'RELEASED',
                        to: 'RESERVED',
                        event: 'RESERVE',
                        actor: new mongoose.Types.ObjectId(actorId),
                        at: now,
                        reason: `Auto-replacement for incompatible crossmatch on unit ${inventoryId}`,
                      },
                    },
                  }
                );

                if (repUpd.modifiedCount === 1) {
                  updatedReq.matchedUnits.push({
                    unitId: rep.unitId,
                    componentType: compType,
                    compatibilityType: isExact ? 'EXACT' : 'COMPATIBLE',
                    crossmatchRequired: needsXm,
                    crossmatchStatus: needsXm ? 'PENDING' : 'NOT_REQUIRED',
                    reservedAt: now,
                  });
                }
              }
            }
            await updatedReq.save();
          }
        }

        // Return updated requisition enriched
        const finalReq = await RequisitionModel.findById(id);
        const enriched = await enrichRequisition(finalReq);
        res.status(200).json({
          success: true,
          message: crossmatchStatus === 'compatible'
            ? 'Crossmatch marked as compatible'
            : 'Crossmatch incompatible — unit released, replacement attempted',
          data: enriched,
        });
      } catch (err) {
        next(err);
      }
    },

    async exportExcel(req, res, next) {
      try {
        const actorId = actor(req);
        const user = await UserModel.findById(actorId).lean();
        const userName = user
          ? [user.name?.first, user.name?.last].filter(Boolean).join(' ') || user.email
          : 'System User';

        const filters = {
          search: req.query.search,
          status: req.query.status,
          hospitalId: req.query.hospitalId,
          from: req.query.from,
          to: req.query.to,
          exportAll: req.query.exportAll,
        };

        const workbook = await generateRequisitionExcel(filters, userName);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=Blood_Request_Management_Report.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
      } catch (e) {
        next(e);
      }
    },
  };
}

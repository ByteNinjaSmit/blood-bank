import type { NextFunction, Request, Response } from 'express';
import { ValidateDonation } from '@/modules/donation/donation.validator';
import type { DonationService } from '@/modules/donation/donation.service';
import { UnauthorizedError } from '@/shared/errors';

export interface DonationControllers {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  restore: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  permanentDelete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  createInward: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  linkDonor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  saveMedicalHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  finalizeInward: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  listIncomplete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createDonationControllers(service: DonationService): DonationControllers {
  const actorIdOrThrow = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async create(req, res, next) {
      try {
        let body = req.body;
        if (body.collectionDate || body.medicalExamination || body.rh) {
          const legacy = body;
          let bloodPressure: { systolic: number; diastolic: number } | undefined = undefined;
          if (legacy.medicalExamination?.bp) {
            const parts = String(legacy.medicalExamination.bp).split('/');
            if (parts.length === 2 && parts[0] && parts[1]) {
              const systolic = parseInt(parts[0], 10);
              const diastolic = parseInt(parts[1], 10);
              if (!isNaN(systolic) && !isNaN(diastolic)) {
                bloodPressure = { systolic, diastolic };
              }
            }
          }

          const mapYesNo = (val: unknown): boolean | undefined => {
            if (val === 'Yes') return true;
            if (val === 'No') return false;
            return undefined;
          };

          const medicalExam = legacy.medicalExamination
            ? {
                weightKg:
                  legacy.medicalExamination.weightKg !== undefined
                    ? Number(legacy.medicalExamination.weightKg)
                    : undefined,
                hbGdl:
                  legacy.medicalExamination.hb !== undefined
                    ? Number(legacy.medicalExamination.hb)
                    : undefined,
                temperatureCelsius:
                  legacy.medicalExamination.tempC !== undefined
                    ? Number(legacy.medicalExamination.tempC)
                    : undefined,
                pulseBpm:
                  legacy.medicalExamination.pulse !== undefined
                    ? Number(legacy.medicalExamination.pulse)
                    : undefined,
                bloodPressure,
                hasPedalOedema: mapYesNo(legacy.medicalExamination.pedalOedema),
                oxygenSaturationPercent:
                  legacy.medicalExamination.o2Level !== undefined
                    ? Number(legacy.medicalExamination.o2Level)
                    : undefined,
                hasLymphadenopathy: mapYesNo(legacy.medicalExamination.lymphadenopathy),
                hasCyanosis: mapYesNo(legacy.medicalExamination.cyanosis),
                systemicExamNotes: legacy.medicalExamination.systematicExam,
                skinClearAtPhlebotomy: mapYesNo(
                  legacy.medicalExamination.skinDiseaseFreeAtPhlebotomy,
                ),
                armsFreeOfPunctureScars: mapYesNo(
                  legacy.medicalExamination.armsFreeFromPunctureScars,
                ),
                volumeMl:
                  legacy.medicalExamination.volumeGmMl !== undefined
                    ? Number(legacy.medicalExamination.volumeGmMl)
                    : undefined,
              }
            : undefined;

          const questionnaireFlags: Record<string, boolean> = {};
          if (legacy.medicalQuestions) {
            for (const [key, val] of Object.entries(legacy.medicalQuestions)) {
              questionnaireFlags[key] = val === 'Yes';
            }
          }

          const rhFactor =
            legacy.rh === 'Positive' || legacy.rh === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
          const VALID_DONATION_TYPES = [
            'WHOLE_BLOOD',
            'PLASMAPHERESIS',
            'DOUBLE_RED_CELL',
            'AUTOLOGOUS',
            'DIRECTED',
            'REPLACEMENT',
          ];
          const donationType = VALID_DONATION_TYPES.includes(legacy.donationType)
            ? legacy.donationType
            : 'WHOLE_BLOOD';

          const typeOfBag = legacy.typeOfBag || 'SB';
          const volume = legacy.medicalExamination?.volumeGmMl
            ? Number(legacy.medicalExamination.volumeGmMl)
            : typeOfBag === 'SB'
              ? 350
              : 450;
          const unitTemplates = [{ componentType: 'WB', volumeMl: volume }];

          const rawCampId = legacy.campId ?? legacy.siteId;
          const campId = rawCampId && rawCampId !== 'null' ? rawCampId : undefined;

          req.body = {
            donor: legacy.donor,
            donationType,
            collectedAt: legacy.collectionDate ? new Date(legacy.collectionDate) : new Date(),
            campId,
            medicalExam,
            donorFitness: legacy.donorFitness
              ? {
                  isFit: Boolean(legacy.donorFitness.isFit),
                  rejectionReason: legacy.donorFitness.rejectionReason || undefined,
                }
              : { isFit: true },
            questionnaireFlags,
            bloodGroup: legacy.bloodGroup,
            rhFactor,
            unitTemplates,
            typeOfBag,
            notes: legacy.notes,
            bagNo: legacy.bagNo,
            segmentNo: legacy.segmentNo,
            lotNo: legacy.lotNo,
          };
        }

        const validatedBody = ValidateDonation.createBody(req);
        const created = await service.register(validatedBody, actorIdOrThrow(req));
        res.status(201).json({ success: true, data: created, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async list(req, res, next) {
      try {
        const query = ValidateDonation.listQuery(req);
        const result = await service.list(query);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const found = await service.get(id);
        res.json({ success: true, data: found, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const body = ValidateDonation.updateBody(req);
        const actorId = actorIdOrThrow(req);
        const result = await service.update(id, body, actorId);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async remove(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const { reason } = ValidateDonation.deleteReasonBody(req);
        const actorId = actorIdOrThrow(req);
        const result = await service.remove(id, actorId, reason);
        res.status(200).json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async restore(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const actorId = actorIdOrThrow(req);
        const result = await service.restore(id, actorId);
        res.status(200).json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async permanentDelete(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const { reason } = ValidateDonation.deleteReasonBody(req);
        const actorId = actorIdOrThrow(req);
        await service.permanentDelete(id, actorId, reason);
        res.status(204).end();
      } catch (e) {
        next(e);
      }
    },

    async createInward(req, res, next) {
      try {
        const body = ValidateDonation.createInwardBody(req);
        const created = await service.createInward(body, actorIdOrThrow(req));
        res.status(201).json({ success: true, data: created, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async linkDonor(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const body = ValidateDonation.linkDonorBody(req);
        const result = await service.linkDonor(id, body, actorIdOrThrow(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async saveMedicalHistory(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const body = ValidateDonation.medicalHistoryBody(req);
        const result = await service.saveMedicalHistory(id, body, actorIdOrThrow(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async finalizeInward(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const body = ValidateDonation.finalizeInwardBody(req);
        const result = await service.finalizeInward(id, body, actorIdOrThrow(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async listIncomplete(req, res, next) {
      try {
        const query = ValidateDonation.listIncompleteQuery(req);
        const result = await service.listIncomplete(query);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}

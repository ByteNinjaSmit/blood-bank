import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ValidateInventory } from '@/modules/inventory/inventory.validator';
import type { InventoryService } from '@/modules/inventory/inventory.service';
import { PatientModel } from '@/modules/patient/patient.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { selectUnits } from '@/shared/compatibility/fefo';
import { classify, compatibleAboGroups } from '@/shared/compatibility/abo-rh';
import { UnauthorizedError } from '@/shared/errors';
import { invalidate } from '@/core/cache';

function dateStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

function rand(): string {
  return new mongoose.Types.ObjectId().toHexString().slice(-6).toUpperCase();
}

function itTypeToLegacy(type: string): string {
  if (type === 'PRBC') return 'RBC';
  if (type === 'PLATELET_CONCENTRATE') return 'Platelet';
  if (type === 'CRYOPRECIPITATE') return 'Cryo';
  return type;
}

export interface InventoryControllers {
  select: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  reserve: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  summary: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  nearExpiry: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createInventoryControllers(service: InventoryService): InventoryControllers {
  return {
    async select(req, res, next) {
      try {
        const q = ValidateInventory.selectQuery(req);
        const result = await service.selectFefo(q);
        res.json({
          success: true,
          data: {
            selected: result.selected.map((s) => ({
              unitId: s.unit.unitId,
              componentType: s.unit.componentType,
              aboGroup: s.unit.aboGroup,
              rhFactor: s.unit.rhFactor,
              expiresAt: s.unit.expiresAt.toISOString(),
              compatibilityType: s.compatibilityType,
            })),
            shortage: result.shortage,
          },
          requestId: req.id,
        });
      } catch (e) {
        next(e);
      }
    },

    async reserve(req, res, next) {
      try {
        const body = ValidateInventory.reserveBody(req);
        const actorId = req.user?.id;
        if (!actorId) throw new UnauthorizedError();
        const actorObjId = new mongoose.Types.ObjectId(actorId);

        // 1. Create Patient
        const patientPublicId = `PA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const dob = new Date();
        dob.setFullYear(dob.getFullYear() - body.patient.age);

        const patient = await PatientModel.create({
          patientPublicId,
          name: body.patient.name,
          dob,
          sex: body.patient.sex,
          createdBy: actorObjId,
          updatedBy: actorObjId,
        });

        // 2. Map items/requestedComponents
        const requestedComponents = body.items.map((it) => {
          let compType = it.componentType;
          if (compType === 'RBC') compType = 'PRBC';
          else if (compType === 'Platelet') compType = 'PLATELET_CONCENTRATE';
          else if (compType === 'Cryo') compType = 'CRYOPRECIPITATE';

          let rh = it.rh;
          if (rh === 'Positive') rh = 'POSITIVE';
          else if (rh === 'Negative') rh = 'NEGATIVE';

          return {
            componentType: compType,
            units: it.units,
            aboGroup: it.bloodGroup,
            rhFactor: rh,
            urgency: 'ROUTINE',
          };
        });

        // 3. Create Requisition
        const requisitionId = `RQ-${dateStamp()}-${rand()}`;
        const requisition = await RequisitionModel.create({
          requisitionId,
          hospitalId: new mongoose.Types.ObjectId(body.hospitalId),
          patientId: patient._id,
          clinicianName: 'Reserve Wizard',
          requiredAt: body.reservedUntil,
          requestedComponents,
          status: 'PENDING',
          createdBy: actorObjId,
          updatedBy: actorObjId,
        });

        // 4. Check for shortages
        const shortages = [];
        for (const rc of requestedComponents) {
          const aboGroups = [...compatibleAboGroups(rc.aboGroup as any, rc.componentType as any)];

          const candidates = await BloodUnitModel.find({
            componentType: rc.componentType,
            status: 'RELEASED',
            aboGroup: { $in: aboGroups },
            deletedAt: null,
          }).sort({ expiresAt: 1 }).lean();

          const formattedCandidates = candidates.map(c => ({
            unitId: c.unitId,
            componentType: c.componentType as any,
            aboGroup: c.aboGroup as any,
            rhFactor: c.rhFactor as any,
            expiresAt: c.expiresAt,
            specialAttributes: new Set(c.specialAttributes || []),
            status: c.status,
          }));

          const selection = selectUnits(formattedCandidates as any, {
            recipient: { aboGroup: rc.aboGroup as any, rhFactor: rc.rhFactor as any },
            component: rc.componentType as any,
            specialNeeds: [],
            unitsRequired: rc.units,
          });

          if (selection.shortage > 0) {
            shortages.push({
              componentType: itTypeToLegacy(rc.componentType),
              required: rc.units,
              available: selection.selected.length,
            });
          }
        }

        if (shortages.length > 0) {
          // Clean up the created patient/requisition if we're aborting due to shortage
          await RequisitionModel.deleteOne({ _id: requisition._id });
          await PatientModel.deleteOne({ _id: patient._id });

          res.status(200).json({
            success: false,
            error: 'Insufficient stock to reserve all items',
            errorData: {
              data: { shortages }
            }
          });
          return;
        }

        // 5. Perform actual reservation
        const resultItems = [];
        const matched = [];

        for (const rc of requestedComponents) {
          const aboGroups = [...compatibleAboGroups(rc.aboGroup as any, rc.componentType as any)];
          const candidates = await BloodUnitModel.find({
            componentType: rc.componentType,
            status: 'RELEASED',
            aboGroup: { $in: aboGroups },
            deletedAt: null,
          }).sort({ expiresAt: 1 }).lean();

          const formattedCandidates = candidates.map(c => ({
            unitId: c.unitId,
            componentType: c.componentType as any,
            aboGroup: c.aboGroup as any,
            rhFactor: c.rhFactor as any,
            expiresAt: c.expiresAt,
            specialAttributes: new Set(c.specialAttributes || []),
            status: c.status,
          }));

          const selection = selectUnits(formattedCandidates as any, {
            recipient: { aboGroup: rc.aboGroup as any, rhFactor: rc.rhFactor as any },
            component: rc.componentType as any,
            specialNeeds: [],
            unitsRequired: rc.units,
          });

          for (const sel of selection.selected) {
            const nextStatus = 'RESERVED';
            const unitDoc = await BloodUnitModel.findOneAndUpdate(
              { unitId: sel.unit.unitId },
              {
                status: nextStatus,
                reservedFor: requisition._id,
                reservedAt: new Date(),
                reservedUntil: body.reservedUntil,
                updatedBy: actorObjId,
                $push: {
                  statusHistory: {
                    from: 'RELEASED',
                    to: nextStatus,
                    event: 'RESERVE',
                    actor: actorObjId,
                    at: new Date(),
                    reason: `Reserved for requisition ${requisitionId} via Reserve Wizard`,
                  },
                },
              },
              { new: true }
            ).lean();

            if (!unitDoc) continue;

            matched.push({
              unitId: sel.unit.unitId,
              componentType: rc.componentType,
              compatibilityType: classify(
                { aboGroup: rc.aboGroup as any, rhFactor: rc.rhFactor as any },
                { aboGroup: sel.unit.aboGroup as any, rhFactor: sel.unit.rhFactor as any },
              ),
              crossmatchRequired: false,
              crossmatchStatus: 'NOT_REQUIRED',
            });

            const donDoc = await mongoose.model('Donation').findOne({ donationId: unitDoc.donationId, deletedAt: null }).select('bagNo').lean() as any;
            const finalBagNo = donDoc?.bagNo || unitDoc.donationId;

            resultItems.push({
              _id: unitDoc._id.toString(),
              bagNo: finalBagNo,
              bag: {
                bagNo: finalBagNo,
                bloodGroup: unitDoc.aboGroup,
                rh: unitDoc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
              },
              component: {
                componentType: itTypeToLegacy(unitDoc.componentType),
                expiryDate: unitDoc.expiresAt.toISOString(),
              }
            });
          }
        }

        // Update Requisition with matched units
        await RequisitionModel.updateOne(
          { _id: requisition._id },
          {
            status: 'MATCHED',
            matchedUnits: matched,
          }
        );

        void invalidate('inventory:*');

        res.status(200).json({
          success: true,
          data: {
            matchedCount: resultItems.length,
            items: resultItems,
          },
          requestId: req.id,
        });

      } catch (e) {
        next(e);
      }
    },

    async summary(req, res, next) {
      try {
        const data = await service.stockSummary();
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async nearExpiry(req, res, next) {
      try {
        const { days } = ValidateInventory.nearExpiryQuery(req);
        const data = await service.nearExpiry(days);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}

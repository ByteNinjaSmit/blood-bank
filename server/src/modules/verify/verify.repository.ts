// Read-only lookups for the public unit-verification page (QR scan
// target). Only the safe field subset lives here — no donor, patient,
// or requisition identity is ever selected out of these documents.

import { BloodUnitModel } from '@/modules/unit/unit.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';

export interface PublicUnitDetails {
  unitId: string;
  componentType: string;
  aboGroup: string;
  rhFactor: string;
  status: string;
  collectedAt: string;
  expiresAt: string;
  issuingHospitalName: string | null;
}

export interface VerifyRepo {
  findPublicUnitDetails(unitId: string): Promise<PublicUnitDetails | null>;
}

const ISSUED_STATUSES = new Set(['ISSUED', 'TRANSFUSED']);

export function createVerifyRepo(): VerifyRepo {
  return {
    async findPublicUnitDetails(unitId) {
      const unit = await BloodUnitModel.findOne(
        { unitId, deletedAt: null },
        {
          unitId: 1,
          componentType: 1,
          aboGroup: 1,
          rhFactor: 1,
          status: 1,
          collectedAt: 1,
          expiresAt: 1,
          issuedTo: 1,
        },
      ).lean();
      if (!unit) return null;

      let issuingHospitalName: string | null = null;
      if (ISSUED_STATUSES.has(unit.status) && unit.issuedTo) {
        const issue = await IssueModel.findById(unit.issuedTo, { requisitionId: 1 }).lean();
        if (issue?.requisitionId) {
          const requisition = await RequisitionModel.findById(issue.requisitionId, {
            hospitalId: 1,
          }).lean();
          if (requisition?.hospitalId) {
            const hospital = await HospitalModel.findById(requisition.hospitalId, {
              name: 1,
            }).lean();
            issuingHospitalName = hospital?.name ?? null;
          }
        }
      }

      return {
        unitId: unit.unitId,
        componentType: unit.componentType,
        aboGroup: unit.aboGroup,
        rhFactor: unit.rhFactor,
        status: unit.status,
        collectedAt: unit.collectedAt.toISOString(),
        expiresAt: unit.expiresAt.toISOString(),
        issuingHospitalName,
      };
    },
  };
}

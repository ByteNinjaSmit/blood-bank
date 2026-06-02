// Lookback repository. Read-only cross-collection traversal used when a
// donor turns TTI-reactive: trace every prior donation -> units ->
// issues -> transfusions -> recipients. Designed to be cheap (indexed
// lookups, small fan-out per donor).

import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { TransfusionModel } from '@/modules/transfusion/transfusion.model';
import { PatientModel } from '@/modules/patient/patient.model';

export interface LookbackTrace {
  donorId: string;
  donationIds: string[];
  unitIds: string[];
  inStockUnitIds: string[]; // still RELEASED/RESERVED/CROSSMATCHED — recall now
  issuedUnitIds: string[];
  recipients: Array<{ patientId: string; patientName: string; unitId: string }>;
}

export interface LookbackRepo {
  traceByDonor(donorId: string): Promise<LookbackTrace>;
  traceByDonation(donationId: string): Promise<LookbackTrace>;
}

const IN_STOCK = ['RELEASED', 'RESERVED', 'CROSSMATCHED'];

export function createLookbackRepo(): LookbackRepo {
  async function buildTrace(donorId: string, donationIds: string[]): Promise<LookbackTrace> {
    const units = await BloodUnitModel.find({ donationId: { $in: donationIds } })
      .select('unitId status')
      .lean();
    const unitIds = units.map((u) => u.unitId);
    const inStockUnitIds = units.filter((u) => IN_STOCK.includes(u.status)).map((u) => u.unitId);

    const issues = await IssueModel.find({ unitId: { $in: unitIds } })
      .select('unitId patientId')
      .lean();
    const issuedUnitIds = issues.map((i) => i.unitId);

    // Resolve recipient names (prefer transfusion's patient, fall back to issue).
    const patientIds = Array.from(new Set(issues.map((i) => i.patientId.toString())));
    const patients = await PatientModel.find({
      _id: { $in: patientIds.map((id) => new Types.ObjectId(id)) },
    })
      .select('name')
      .lean();
    const nameById = new Map(patients.map((p) => [p._id.toString(), p.name as string]));

    // Confirm which were actually transfused (highest-priority recall).
    const transfusions = await TransfusionModel.find({ unitId: { $in: unitIds } })
      .select('unitId')
      .lean();
    const transfusedSet = new Set(transfusions.map((t) => t.unitId));

    const recipients = issues
      .filter((i) => transfusedSet.has(i.unitId) || issuedUnitIds.includes(i.unitId))
      .map((i) => ({
        patientId: i.patientId.toString(),
        patientName: nameById.get(i.patientId.toString()) ?? 'unknown',
        unitId: i.unitId,
      }));

    return {
      donorId,
      donationIds,
      unitIds,
      inStockUnitIds,
      issuedUnitIds,
      recipients,
    };
  }

  return {
    async traceByDonor(donorId) {
      const donations = await DonationModel.find({ donor: new Types.ObjectId(donorId) })
        .select('donationId')
        .lean();
      const donationIds = donations.map((d) => d.donationId);
      return buildTrace(donorId, donationIds);
    },

    async traceByDonation(donationId) {
      const donation = await DonationModel.findOne({ donationId }).select('donor').lean();
      const donorId = donation?.donor?.toString() ?? '';
      // Trace the whole donor (all prior donations), not just this one.
      if (donorId) {
        const donations = await DonationModel.find({ donor: donation!.donor })
          .select('donationId')
          .lean();
        return buildTrace(
          donorId,
          donations.map((d) => d.donationId),
        );
      }
      return buildTrace(donorId, [donationId]);
    },
  };
}

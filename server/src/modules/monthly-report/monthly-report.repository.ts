// Read-only aggregation layer for the month-end statutory report. Pulls
// from existing clinical/procurement collections instead of duplicating
// data — this module owns no Mongoose model of its own.

import { DonorModel } from '@/modules/donor/donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { CampModel } from '@/modules/camp/camp.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { DonorCardModel } from '@/modules/donor-card/donor-card.model';
import { BagStockModel } from '@/modules/bag-stock/bag-stock.model';
import { ChemicalModel, ChemicalStockLotModel } from '@/modules/chemical-inventory/chemical-inventory.model';
import { createChemicalInventoryRepo } from '@/modules/chemical-inventory/chemical-inventory.repository';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import {
  PRODUCTS, DISCARD_LABEL, TTI_DISCARD_LABEL, DISEASE_KEYWORDS, REAGENT_CANONICAL, ELISA_CANONICAL,
  GROUP_LABELS, STORAGE_CENTRE_PATTERN, toProductLabel, toGroupLabel, emptyGroupTally,
  buildEntityBreakdown, ageAt, matchIndication,
} from './monthly-report.mappers';
import { createMonthlyReportMethods2 } from './monthly-report.methods2';


export interface MonthlyReportRepo {
  getCampsCount(from: Date, to: Date): Promise<number>;
  getCollectionStats(from: Date, to: Date): Promise<any>;
  getComponentsIssuedByHospital(from: Date, to: Date): Promise<any>;
  getDiscardsByReason(from: Date, to: Date): Promise<any>;
  getRepeatedDonors(from: Date, to: Date): Promise<any>;
  getDonorTestingTotals(from: Date, to: Date): Promise<any>;
  getTtiTesting(from: Date, to: Date): Promise<any>;
  getRejectedDonors(from: Date, to: Date): Promise<any>;
  getStockLedger(from: Date, to: Date): Promise<any>;
  getBloodGroupCollection(from: Date, to: Date): Promise<any>;
  getIssueByIndication(from: Date, to: Date): Promise<any>;
  getDonorCardsIssued(from: Date, to: Date): Promise<any>;
  getChemicalStock(month: number, year: number): Promise<any>;
  getBagStock(): Promise<any>;
  getCampWiseStats(from: Date, to: Date): Promise<any>;
  getBulkTransferStats(from: Date, to: Date): Promise<any>;
}

export function createMonthlyReportRepo(): MonthlyReportRepo {
  const chemicalRepo = createChemicalInventoryRepo();

  return {
    async getCampsCount(from, to) {
      return CampModel.countDocuments({
        $or: [
          { dateFrom: { $lt: to }, dateTo: { $gte: from } },
          { createdAt: { $gte: from, $lt: to } },
        ],
      });
    },

    async getCollectionStats(from, to) {
      const donations = await DonationModel.find({
        collectedAt: { $gte: from, $lt: to },
        deletedAt: null,
      })
        .select('donor donationType campId collectedAt')
        .populate('donor', 'sex')
        .lean();

      const blank = () => ({ male: 0, female: 0, total: 0 });
      const inCamps = blank();
      const inBloodBank = blank();
      let voluntary = 0;
      let replacement = 0;

      for (const d of donations as any[]) {
        const sex = d.donor?.sex;
        const bucket = d.campId ? inCamps : inBloodBank;
        bucket.total += 1;
        if (sex === 'M') bucket.male += 1;
        else if (sex === 'F') bucket.female += 1;
        if (d.donationType === 'REPLACEMENT') replacement += 1;
        else voluntary += 1;
      }

      const grandTotal = {
        male: inCamps.male + inBloodBank.male,
        female: inCamps.female + inBloodBank.female,
        total: inCamps.total + inBloodBank.total,
      };

      return { inCamps, inBloodBank, grandTotal, voluntary, replacement };
    },

    async getComponentsIssuedByHospital(from, to) {
      // Sourced from Requisition.matchedUnits rather than the Issue collection:
      // Issue.requisitionId is stamped with a throwaway ObjectId for units
      // issued directly from inventory (not reserved against a requisition),
      // which breaks the hospital join. Requisition is the reliable link.
      const requisitions = await RequisitionModel.find({
        status: { $in: ['ISSUED', 'COMPLETED'] },
        updatedAt: { $gte: from, $lt: to },
        deletedAt: null,
      })
        .select('hospitalId matchedUnits')
        .populate('hospitalId', 'name')
        .lean();

      if (requisitions.length === 0) return { hospitals: [], storageCentres: [] };

      const unitIdSet = [
        ...new Set((requisitions as any[]).flatMap((r) => (r.matchedUnits || []).map((m: any) => m.unitId))),
      ];
      const units = unitIdSet.length
        ? await BloodUnitModel.find({ unitId: { $in: unitIdSet } })
            .select('unitId aboGroup rhFactor')
            .lean()
        : [];
      const groupByUnit = new Map<string, string>();
      for (const u of units as any[]) groupByUnit.set(u.unitId, toGroupLabel(u.aboGroup, u.rhFactor));

      const hospitalEntries: Array<{ entity: string; product: string; group: string }> = [];
      const storageEntries: Array<{ entity: string; product: string; group: string }> = [];

      for (const r of requisitions as any[]) {
        const entity = r.hospitalId?.name ?? 'Unknown Hospital';
        const target = STORAGE_CENTRE_PATTERN.test(entity) ? storageEntries : hospitalEntries;
        for (const m of r.matchedUnits || []) {
          target.push({
            entity,
            product: toProductLabel(m.componentType),
            group: groupByUnit.get(m.unitId) ?? 'Unknown',
          });
        }
      }

      return {
        hospitals: buildEntityBreakdown(hospitalEntries),
        storageCentres: buildEntityBreakdown(storageEntries),
      };
    },

    async getDiscardsByReason(from, to) {
      // Mirrors the /discard register: only units actually marked DISCARDED
      // (not EXPIRED-but-never-discarded), dated by the DISCARDED entry in
      // statusHistory rather than the document's generic updatedAt.
      const candidates = await BloodUnitModel.find({ status: 'DISCARDED' })
        .select('donationId discardReason componentType statusHistory updatedAt')
        .lean();

      const discarded = (candidates as any[]).filter((u) => {
        const entry = [...(u.statusHistory || [])].reverse().find((h: any) => h.to === 'DISCARDED');
        const at = entry?.at ? new Date(entry.at) : new Date(u.updatedAt);
        return at >= from && at < to;
      });

      if (discarded.length === 0) return { rows: [] };

      const ttiCase = discarded.filter((u: any) => u.discardReason === 'TTI_POSITIVE');
      const donationIds = [...new Set(ttiCase.map((u: any) => u.donationId))];
      const ttiResults = donationIds.length
        ? await TtiResultModel.find({ donationId: { $in: donationIds } })
            .select('donationId tests')
            .lean()
        : [];
      const reactiveTestByDonation = new Map<string, string[]>();
      for (const r of ttiResults as any[]) {
        const reactive = (r.tests || [])
          .filter((t: any) => t.result === 'REACTIVE')
          .map((t: any) => t.testName);
        reactiveTestByDonation.set(r.donationId, reactive);
      }

      const counts: Record<string, { quantity: number; byProduct: Record<string, number> }> = {};
      const bump = (label: string, product: string) => {
        counts[label] ??= { quantity: 0, byProduct: {} };
        counts[label].quantity += 1;
        counts[label].byProduct[product] = (counts[label].byProduct[product] ?? 0) + 1;
      };

      for (const unit of discarded as any[]) {
        const product = toProductLabel(unit.componentType);
        if (unit.discardReason === 'TTI_POSITIVE') {
          const reactiveTests = reactiveTestByDonation.get(unit.donationId) ?? [];
          if (reactiveTests.length === 0) {
            bump('Other', product);
            continue;
          }
          for (const test of reactiveTests) {
            bump(TTI_DISCARD_LABEL[test] ?? test, product);
          }
        } else {
          bump(DISCARD_LABEL[unit.discardReason] ?? 'Other', product);
        }
      }

      const rows = Object.entries(counts).map(([reason, v]) => ({
        reason,
        quantity: v.quantity,
        byProduct: v.byProduct,
      }));
      return { rows };
    },

    async getRepeatedDonors(from, to) {
      const donations = await DonationModel.find({
        collectedAt: { $gte: from, $lt: to },
        deletedAt: null,
      })
        .select('donor collectedAt')
        .lean();

      const donorIds = [...new Set(donations.map((d: any) => String(d.donor)))];
      if (donorIds.length === 0) return { male: 0, female: 0, total: 0 };

      const priorDonorIds = new Set(
        (
          await DonationModel.find({
            donor: { $in: donorIds },
            collectedAt: { $lt: from },
            deletedAt: null,
          })
            .distinct('donor')
        ).map(String),
      );

      const repeatedInPeriod = new Set(
        (donations as any[]).filter((d) => priorDonorIds.has(String(d.donor))).map((d) => String(d.donor)),
      );
      if (repeatedInPeriod.size === 0) return { male: 0, female: 0, total: 0 };

      const donors = await DonorModel.find({ _id: { $in: [...repeatedInPeriod] } })
        .select('sex')
        .lean();
      let male = 0;
      let female = 0;
      for (const d of donors as any[]) {
        if (d.sex === 'M') male += 1;
        else if (d.sex === 'F') female += 1;
      }
      return { male, female, total: repeatedInPeriod.size };
    },

    async getDonorTestingTotals(from, to) {
      const donations = await DonationModel.find({
        collectedAt: { $gte: from, $lt: to },
        deletedAt: null,
      })
        .select('donor')
        .populate('donor', 'sex')
        .lean();
      let male = 0;
      let female = 0;
      for (const d of donations as any[]) {
        if (d.donor?.sex === 'M') male += 1;
        else if (d.donor?.sex === 'F') female += 1;
      }
      return { male, female, total: donations.length };
    },

    async getTtiTesting(from, to) {
      const donations = await DonationModel.find({
        collectedAt: { $gte: from, $lt: to },
        deletedAt: null,
      })
        .select('donationId')
        .lean();
      const donationIds = donations.map((d: any) => d.donationId);
      if (donationIds.length === 0) return { rows: [] };

      const results = await TtiResultModel.find({ donationId: { $in: donationIds } })
        .select('tests')
        .lean();

      const tally: Record<string, { tested: number; positive: number }> = {};
      for (const r of results as any[]) {
        for (const t of r.tests || []) {
          tally[t.testName] ??= { tested: 0, positive: 0 };
          const entry = tally[t.testName]!;
          entry.tested += 1;
          if (t.result === 'REACTIVE') entry.positive += 1;
        }
      }
      const rows = Object.entries(tally).map(([test, v]) => ({ test, ...v }));
      return { rows };
    },

    async getRejectedDonors(from, to) {
      // Deferral is the system's actual record of a donor being turned away —
      // raised by the eligibility check during donation creation (questionnaire/
      // vitals), by a reactive TTI result, by lookback, or manually.
      const deferrals = await DeferralModel.find({
        createdAt: { $gte: from, $lt: to },
      })
        .select('donor reason source createdAt')
        .populate('donor', 'sex dob')
        .lean();

      const buckets: Record<string, { male: number; female: number; total: number }> = {
        'Low Hb': { male: 0, female: 0, total: 0 },
        Underweight: { male: 0, female: 0, total: 0 },
        Underage: { male: 0, female: 0, total: 0 },
        'TTI Reactive': { male: 0, female: 0, total: 0 },
        Medical: { male: 0, female: 0, total: 0 },
        Other: { male: 0, female: 0, total: 0 },
      };

      for (const d of deferrals as any[]) {
        const sex = d.donor?.sex;
        const text = String(d.reason ?? '').toLowerCase();
        const age = d.donor?.dob ? ageAt(new Date(d.donor.dob), new Date(d.createdAt)) : null;

        let bucket = 'Other';
        if (text.includes('hb') || text.includes('haemoglobin') || text.includes('hemoglobin')) bucket = 'Low Hb';
        else if (text.includes('underweight') || text.includes('weight')) bucket = 'Underweight';
        else if (text.includes('underage') || text.includes('minor') || text.includes('age')) bucket = 'Underage';
        else if (age !== null && age < 18) bucket = 'Underage';
        else if (d.source === 'TTI_REACTIVE') bucket = 'TTI Reactive';
        else if (d.source === 'QUESTIONNAIRE' || d.source === 'VITALS') bucket = 'Medical';

        const entry = buckets[bucket]!;
        entry.total += 1;
        if (sex === 'M') entry.male += 1;
        else if (sex === 'F') entry.female += 1;
      }

      const rows = Object.entries(buckets)
        .filter(([, v]) => v.total > 0)
        .map(([reason, v]) => ({ reason, ...v }));
      const total = rows.reduce((a, r) => a + r.total, 0);
      return { rows, total };
    },

    async getStockLedger(from, to) {
      const rows: any[] = [];
      for (const product of PRODUCTS) {
        const filterBase = { componentType: product, deletedAt: null };

        const [createdBefore, issuedBefore, discardedBefore, collection, issued, discard] = await Promise.all([
          BloodUnitModel.countDocuments({ ...filterBase, collectedAt: { $lt: from } }),
          BloodUnitModel.countDocuments({ ...filterBase, issuedAt: { $lt: from } }),
          BloodUnitModel.countDocuments({
            ...filterBase,
            status: { $in: ['DISCARDED', 'EXPIRED'] },
            updatedAt: { $lt: from },
          }),
          BloodUnitModel.countDocuments({ ...filterBase, collectedAt: { $gte: from, $lt: to } }),
          BloodUnitModel.countDocuments({ ...filterBase, issuedAt: { $gte: from, $lt: to } }),
          BloodUnitModel.countDocuments({
            ...filterBase,
            status: { $in: ['DISCARDED', 'EXPIRED'] },
            updatedAt: { $gte: from, $lt: to },
          }),
        ]);

        const opening = Math.max(0, createdBefore - issuedBefore - discardedBefore);
        const closing = Math.max(0, opening + collection - issued - discard);
        rows.push({ product, opening, collection, issued, discard, closing });
      }
      return { rows };
    },

    async getBloodGroupCollection(from, to) {
      const donations = await DonationModel.find({
        collectedAt: { $gte: from, $lt: to },
        deletedAt: null,
      })
        .select('donor')
        .populate('donor', 'bloodGroup rh')
        .lean();

      const labels = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const counts: Record<string, number> = Object.fromEntries(labels.map((l) => [l, 0]));
      for (const d of donations as any[]) {
        const group = d.donor?.bloodGroup;
        const rh = d.donor?.rh;
        if (!group || !rh) continue;
        const label = `${group}${rh === 'POSITIVE' ? '+' : '-'}`;
        if (label in counts) counts[label] = (counts[label] ?? 0) + 1;
      }
      const rows = labels.map((label) => ({ group: label, units: counts[label] ?? 0 }));
      const total = rows.reduce((a, r) => a + r.units, 0);
      return { rows, total };
    },

    async getIssueByIndication(from, to) {
      // Clinical-indication issues (Thalassemia / Sickle Cell Anaemia / Other)
      // go through the direct BloodUnit.clinicalIndicationPatient flow, not a
      // requisition — so they never appear in IssueModel and must be counted
      // separately from the free-text-matched grid below.
      const diseaseUnits = await BloodUnitModel.find({
        issuedAt: { $gte: from, $lt: to },
        'clinicalIndicationPatient.firstName': { $exists: true, $nin: [null, ''] },
      })
        .select('clinicalIndicationPatient')
        .lean();

      const emptyBucket = () => ({ count: 0, byBloodGroup: {} as Record<string, number> });
      const structuredDiseaseCounts = {
        thalassemia: emptyBucket(),
        sickleCellAnaemia: emptyBucket(),
      };
      for (const u of diseaseUnits as any[]) {
        const disease = u.clinicalIndicationPatient?.disease;
        if (disease !== 'THALASSEMIA' && disease !== 'SICKLE_CELL_ANAEMIA') continue;
        const bucket = disease === 'THALASSEMIA' ? structuredDiseaseCounts.thalassemia : structuredDiseaseCounts.sickleCellAnaemia;
        bucket.count += 1;
        const bg = u.clinicalIndicationPatient?.bloodGroup || 'Unknown';
        bucket.byBloodGroup[bg] = (bucket.byBloodGroup[bg] ?? 0) + 1;
      }

      const issues = await IssueModel.find({
        issuedAt: { $gte: from, $lt: to },
        returnedAt: { $exists: false },
      })
        .select('requisitionId unitId')
        .lean();
      if (issues.length === 0) return { rows: [], structuredDiseaseCounts };

      const reqIds = [...new Set(issues.map((i) => String(i.requisitionId)))];
      const unitIdSet = [...new Set(issues.map((i) => i.unitId))];
      const [requisitions, units] = await Promise.all([
        RequisitionModel.find({ _id: { $in: reqIds } })
          .select('patient.indication patient.diagnosis')
          .lean(),
        BloodUnitModel.find({ unitId: { $in: unitIdSet } })
          .select('unitId componentType')
          .lean(),
      ]);

      const indicationByReq = new Map<string, string>();
      for (const r of requisitions as any[]) {
        const text = r.patient?.indication || r.patient?.diagnosis || '';
        indicationByReq.set(String(r._id), text ? matchIndication(text) : 'Blood Supply Units');
      }
      const componentByUnit = new Map<string, string>();
      for (const u of units as any[]) componentByUnit.set(u.unitId, toProductLabel(u.componentType));

      const grid: Record<string, Record<string, number>> = {};
      for (const issue of issues as any[]) {
        const indication = indicationByReq.get(String(issue.requisitionId)) ?? 'Blood Supply Units';
        const product = componentByUnit.get(issue.unitId) ?? 'Other';
        grid[indication] ??= {};
        grid[indication][product] = (grid[indication][product] ?? 0) + 1;
      }

      const rows = Object.entries(grid).map(([indication, byProduct]) => ({ indication, byProduct }));
      return { rows, structuredDiseaseCounts };
    },

    async getDonorCardsIssued(from, to) {
      const cards = await DonorCardModel.find({ createdAt: { $gte: from, $lt: to } })
        .select('requisitionId')
        .lean();
      const totalCount = cards.length;
      if (totalCount === 0) return { totalCount: 0, breakdown: [] };

      const reqIds = cards.map((c) => c.requisitionId);
      const issues = await IssueModel.find({ requisitionId: { $in: reqIds } }).select('unitId').lean();
      const unitIds = [...new Set(issues.map((i) => i.unitId))];
      if (unitIds.length === 0) return { totalCount, breakdown: [] };

      const units = await BloodUnitModel.find({ unitId: { $in: unitIds } })
        .select('componentType aboGroup rhFactor')
        .lean();

      const grid = new Map<string, number>();
      for (const u of units as any[]) {
        const rh = u.rhFactor === 'NEGATIVE' ? 'Negative' : 'Positive';
        const key = `${toProductLabel(u.componentType)}|${u.aboGroup}|${rh}`;
        grid.set(key, (grid.get(key) ?? 0) + 1);
      }

      const breakdown = [...grid.entries()].map(([key, count]) => {
        const [componentType, bloodGroup, rh] = key.split('|');
        return { componentType, bloodGroup, rh, count };
      });

      return { totalCount, breakdown };
    },

    ...createMonthlyReportMethods2({ chemicalRepo }),
  };
}

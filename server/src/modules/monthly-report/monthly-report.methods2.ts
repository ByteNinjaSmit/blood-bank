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
import {
  ChemicalModel,
  ChemicalStockLotModel,
} from '@/modules/chemical-inventory/chemical-inventory.model';
import type { ChemicalInventoryRepo } from '@/modules/chemical-inventory/chemical-inventory.repository';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import {
  PRODUCTS,
  DISCARD_LABEL,
  TTI_DISCARD_LABEL,
  DISEASE_KEYWORDS,
  REAGENT_CANONICAL,
  ELISA_CANONICAL,
  GROUP_LABELS,
  STORAGE_CENTRE_PATTERN,
  toProductLabel,
  toGroupLabel,
  emptyGroupTally,
  buildEntityBreakdown,
  ageAt,
  matchIndication,
} from './monthly-report.mappers';

export function createMonthlyReportMethods2({
  chemicalRepo,
}: {
  chemicalRepo: ChemicalInventoryRepo;
}) {
  return {
    async getChemicalStock(month: number, year: number) {
      const monthly = await chemicalRepo.getMonthlyStockReport(month, year);
      const chemicals = await ChemicalModel.find({ deletedAt: null })
        .select('name unitType createdAt')
        .lean();

      const findMonthly = (name: string) =>
        monthly.find((m: any) => m.chemicalName.toLowerCase() === name.toLowerCase());

      // Prefer an exact match on the canonical label; several legacy/duplicate
      // chemical records can share a substring (e.g. "Anti-D" vs "Anti-D (Rh)",
      // "HIV ELISA" vs "HIV ELISA Kit") so a loose substring match alone can
      // silently pick a stale, stock-less record. Fall back to substring
      // matching only when there's no exact name match, and among substring
      // matches prefer the most recently created record.
      const findChemical = (terms: string[], label: string) => {
        const candidates = (chemicals as any[]).filter((c) =>
          terms.some((t) => c.name.toLowerCase().includes(t.toLowerCase())),
        );
        if (candidates.length === 0) return undefined;
        const exact = candidates.find((c) => c.name.toLowerCase() === label.toLowerCase());
        if (exact) return exact;
        return candidates.reduce(
          (best, c) => (c.createdAt > best.createdAt ? c : best),
          candidates[0],
        );
      };

      async function buildRow(label: string, terms: string[]) {
        const chem = findChemical(terms, label);
        if (!chem) return { label, configured: false };
        const stats = findMonthly(chem.name);
        const lots = await ChemicalStockLotModel.find({ chemicalId: chem._id, deletedAt: null })
          .select(
            'lotNumber batchNumber qtyAvailable qtyInUse qtyConsumed expiryDate packType unitsPerPack openBoxUnitsRemaining',
          )
          .lean();
        const batches = (lots as any[]).map((l) => ({
          lotNumber: l.lotNumber,
          batchNumber: l.batchNumber,
          used: l.qtyConsumed,
          remaining: l.qtyAvailable + l.qtyInUse,
          expiryDate: l.expiryDate,
          packType: l.packType,
          unitsPerPack: l.unitsPerPack,
          openBoxUnitsRemaining: l.openBoxUnitsRemaining,
        }));
        const isVialTracked = (lots as any[]).some(
          (l) => l.packType === 'VIALS' || l.packType === 'BOX',
        );
        const openBoxVialsRemaining = (lots as any[]).reduce(
          (sum, l) => sum + (l.openBoxUnitsRemaining ?? 0),
          0,
        );
        const unitsPerPack = (lots as any[]).find((l) => l.unitsPerPack)?.unitsPerPack ?? null;
        return {
          label,
          configured: true,
          chemicalName: chem.name,
          unitType: chem.unitType,
          opening: stats?.openingStock ?? 0,
          received: stats?.purchased ?? 0,
          used: stats?.consumed ?? 0,
          damage: stats?.expired ?? 0,
          closing: stats?.closingStock ?? 0,
          isVialTracked,
          unitsPerPack,
          openBoxVialsRemaining,
          batches,
        };
      }

      const reagentRows = await Promise.all(
        REAGENT_CANONICAL.map((name) => buildRow(name, [name])),
      );
      const elisaRows = await Promise.all(ELISA_CANONICAL.map((k) => buildRow(k.label, k.terms)));

      return { reagentRows, elisaRows };
    },

    async getBagStock() {
      const bags = await BagStockModel.find({ deletedAt: null })
        .select('bagType batchNumber openingStock receivedQty issuedQty damagedQty discardedQty')
        .lean();

      const byType: Record<string, any[]> = {};
      for (const b of bags as any[]) {
        byType[b.bagType] ??= [];
        const closing =
          b.openingStock + b.receivedQty - b.issuedQty - b.damagedQty - b.discardedQty;
        byType[b.bagType]!.push({
          batchNumber: b.batchNumber,
          opening: b.openingStock,
          received: b.receivedQty,
          used: b.issuedQty,
          damage: b.damagedQty,
          discarded: b.discardedQty,
          closing,
        });
      }
      const rows = Object.entries(byType).map(([bagType, batches]) => ({
        bagType,
        opening: batches.reduce((a, x) => a + x.opening, 0),
        received: batches.reduce((a, x) => a + x.received, 0),
        used: batches.reduce((a, x) => a + x.used, 0),
        damage: batches.reduce((a, x) => a + x.damage, 0),
        closing: batches.reduce((a, x) => a + x.closing, 0),
        batches,
      }));
      return { rows };
    },

    async getCampWiseStats(from: Date, to: Date) {
      const camps = await CampModel.find({
        $or: [
          { dateFrom: { $lt: to }, dateTo: { $gte: from } },
          { createdAt: { $gte: from, $lt: to } },
        ],
      })
        .select('name dateFrom dateTo')
        .lean();

      if (camps.length === 0) return { rows: [] };

      const campIds = camps.map((c) => c._id);

      const [donations, units] = await Promise.all([
        DonationModel.find({
          campId: { $in: campIds },
          collectedAt: { $gte: from, $lt: to },
          deletedAt: null,
        })
          .select('donor campId')
          .populate('donor', 'sex')
          .lean(),
        BloodUnitModel.find({
          campId: { $in: campIds },
          collectedAt: { $gte: from, $lt: to },
        })
          .select('campId aboGroup rhFactor componentType')
          .lean(),
      ]);

      const blankGender = () => ({ male: 0, female: 0, other: 0, total: 0 });
      const blankGroups = () =>
        Object.fromEntries(GROUP_LABELS.map((g) => [g, 0])) as Record<string, number>;
      const blankProducts = () =>
        Object.fromEntries(PRODUCTS.map((p) => [p, 0])) as Record<string, number>;

      const donorSetByCamp = new Map<string, Set<string>>();
      const genderByCamp = new Map<string, ReturnType<typeof blankGender>>();
      const donationCountByCamp = new Map<string, number>();
      const donorToCamps = new Map<string, Set<string>>();

      for (const d of donations as any[]) {
        const cid = String(d.campId);
        const donorId = String(d.donor?._id ?? d.donor);
        const sex = d.donor?.sex;

        if (!donorSetByCamp.has(cid)) donorSetByCamp.set(cid, new Set());
        donorSetByCamp.get(cid)!.add(donorId);

        if (!donorToCamps.has(donorId)) donorToCamps.set(donorId, new Set());
        donorToCamps.get(donorId)!.add(cid);

        donationCountByCamp.set(cid, (donationCountByCamp.get(cid) ?? 0) + 1);

        if (!genderByCamp.has(cid)) genderByCamp.set(cid, blankGender());
        const gender = genderByCamp.get(cid)!;
        gender.total += 1;
        if (sex === 'M') gender.male += 1;
        else if (sex === 'F') gender.female += 1;
        else gender.other += 1;
      }

      const groupCountsByCamp = new Map<string, Record<string, number>>();
      const productCountsByCamp = new Map<string, Record<string, number>>();

      for (const u of units as any[]) {
        const cid = String(u.campId);
        if (!groupCountsByCamp.has(cid)) groupCountsByCamp.set(cid, blankGroups());
        if (!productCountsByCamp.has(cid)) productCountsByCamp.set(cid, blankProducts());

        const groupLabel = toGroupLabel(u.aboGroup, u.rhFactor);
        const groups = groupCountsByCamp.get(cid)!;
        if (groupLabel in groups) groups[groupLabel] = (groups[groupLabel] ?? 0) + 1;

        const product = toProductLabel(u.componentType);
        const products = productCountsByCamp.get(cid)!;
        products[product] = (products[product] ?? 0) + 1;
      }

      // Deferral has no direct camp link — approximate by matching deferrals
      // raised (during the period) against donors who donated at that camp
      // during the period. See missingDataNotes in the service layer.
      const allDonorIds = [...donorToCamps.keys()];
      const deferralCountByCamp = new Map<string, number>();
      if (allDonorIds.length > 0) {
        const deferrals = await DeferralModel.find({
          donor: { $in: allDonorIds },
          createdAt: { $gte: from, $lt: to },
        })
          .select('donor')
          .lean();

        for (const d of deferrals as any[]) {
          const donorId = String(d.donor);
          const campsForDonor = donorToCamps.get(donorId);
          if (!campsForDonor) continue;
          for (const cid of campsForDonor) {
            deferralCountByCamp.set(cid, (deferralCountByCamp.get(cid) ?? 0) + 1);
          }
        }
      }

      const rows = camps
        .map((camp: any) => {
          const cid = String(camp._id);
          return {
            campName: camp.name,
            donorCount: donorSetByCamp.get(cid)?.size ?? 0,
            donationCount: donationCountByCamp.get(cid) ?? 0,
            deferralCount: deferralCountByCamp.get(cid) ?? 0,
            gender: genderByCamp.get(cid) ?? blankGender(),
            groupCounts: groupCountsByCamp.get(cid) ?? blankGroups(),
            productCounts: productCountsByCamp.get(cid) ?? blankProducts(),
          };
        })
        .sort((a, b) => a.campName.localeCompare(b.campName));

      return { rows };
    },

    async getBulkTransferStats(from: Date, to: Date) {
      const transfers = await BulkTransferModel.find({
        transferDate: { $gte: from, $lt: to },
        deletedAt: null,
      })
        .select('transferType bloodBankName transferDate items')
        .sort({ transferDate: 1 })
        .lean();

      const rows = (transfers as any[]).map((t) => ({
        transferType: t.transferType,
        bloodBankName: t.bloodBankName,
        transferDate: t.transferDate ? new Date(t.transferDate).toISOString() : '',
        bagCount: (t.items || []).length,
        breakdown: Object.entries(
          (t.items || []).reduce((acc: Record<string, number>, it: any) => {
            const key = `${it.componentType}|${it.bloodGroup}`;
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {}),
        ).map(([key, count]) => {
          const [componentType, bloodGroup] = key.split('|');
          return { componentType, bloodGroup, count };
        }),
      }));

      const totals = rows.reduce(
        (acc, r) => {
          if (r.transferType === 'GIVE_LOAN') {
            acc.givenCount += 1;
            acc.givenBags += r.bagCount;
          } else {
            acc.takenCount += 1;
            acc.takenBags += r.bagCount;
          }
          return acc;
        },
        { givenCount: 0, givenBags: 0, takenCount: 0, takenBags: 0 },
      );

      // Aggregate component x blood-group totals across the period, split by
      // given vs taken, so the report can show "what was sent/received, how much".
      const byTypeAndGroup = (transferType: 'GIVE_LOAN' | 'TAKE_LOAN') => {
        const tally: Record<string, number> = {};
        for (const t of transfers as any[]) {
          if (t.transferType !== transferType) continue;
          for (const it of t.items || []) {
            const key = `${it.componentType}|${it.bloodGroup}`;
            tally[key] = (tally[key] ?? 0) + 1;
          }
        }
        return Object.entries(tally).map(([key, count]) => {
          const [componentType, bloodGroup] = key.split('|');
          return { componentType, bloodGroup, count };
        });
      };

      const breakdown = {
        given: byTypeAndGroup('GIVE_LOAN'),
        taken: byTypeAndGroup('TAKE_LOAN'),
      };

      return { rows, totals, breakdown };
    },
  };
}

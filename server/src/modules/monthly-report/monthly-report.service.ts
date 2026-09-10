import { childLogger } from '@/core/logger';
import type { MonthlyReportRepo } from './monthly-report.repository';
import type { MonthlyReportInputRepo } from '@/modules/monthly-report-input/monthly-report-input.repository';

const log = childLogger({ module: 'monthly-report-service' });

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const NOT_TRACKED =
  'Not tracked in system — no matching field/module exists in the current data model.';
const PARTIAL_NOTE =
  'Derived automatically from an existing free-text field, not a dedicated tracked category — verify before statutory submission.';

export interface MonthlyReportDeps {
  repo: MonthlyReportRepo;
  inputs: MonthlyReportInputRepo;
}

export function createMonthlyReportService(deps: MonthlyReportDeps) {
  return {
    async getReport(month: number, year: number) {
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 1);
      const label = `${MONTH_NAMES[month - 1]} ${year}`;

      const [
        campsCount,
        collection,
        componentsIssued,
        discards,
        repeatedDonors,
        donorTesting,
        ttiTesting,
        rejectedDonors,
        stockLedger,
        bloodGroupCollection,
        issueByIndication,
        donorCards,
        chemicalStock,
        bagStock,
        campWise,
        bulkTransferStats,
        storageTransferStats,
        savedInput,
      ] = await Promise.all([
        deps.repo.getCampsCount(from, to),
        deps.repo.getCollectionStats(from, to),
        deps.repo.getComponentsIssuedByHospital(from, to),
        deps.repo.getDiscardsByReason(from, to),
        deps.repo.getRepeatedDonors(from, to),
        deps.repo.getDonorTestingTotals(from, to),
        deps.repo.getTtiTesting(from, to),
        deps.repo.getRejectedDonors(from, to),
        deps.repo.getStockLedger(from, to),
        deps.repo.getBloodGroupCollection(from, to),
        deps.repo.getIssueByIndication(from, to),
        deps.repo.getDonorCardsIssued(from, to),
        deps.repo.getChemicalStock(month, year),
        deps.repo.getBagStock(),
        deps.repo.getCampWiseStats(from, to),
        deps.repo.getBulkTransferStats(from, to),
        deps.repo.getStorageTransferStats(from, to),
        deps.inputs.findByPeriod(month, year),
      ]);

      // Voluntary Donor Cards Issued must equal the total donor count for the
      // period (every donor — inhouse and camp — receives a card), not the
      // count of DonorCard records created by the hospital-side requisition flow.
      const donorCardsWithTotal = { ...donorCards, totalCount: collection.grandTotal.total };

      const missingDataNotes: Array<{ item: string; note: string }> = [
        {
          item: 'Voluntary vs. replacement collection split',
          note: 'Inferred from donation type (REPLACEMENT vs. all other donation types) — not a dedicated voluntary/replacement flag.',
        },
        ...(savedInput ? [] : [{ item: 'Donor counselling count', note: NOT_TRACKED }]),
        {
          item: 'Blood bags given to blood storage centres',
          note: 'Identified by hospital records whose name contains "storage" (e.g. "SJS Storage") — there is no dedicated storage-centre entity type. Add a hospital record for each centre if none appear below.',
        },
        { item: 'Blood bags issued by disease category', note: PARTIAL_NOTE },
        {
          item: 'Rejected donors by reason',
          note: "Sourced from Deferral records (the system's actual donor-rejection log) and bucketed by keyword match on the deferral reason text / deferral source — verify before statutory submission.",
        },
        ...(savedInput ? [] : [{ item: 'ICTC referral counts', note: NOT_TRACKED }]),
        {
          item: 'Component issue by clinical indication (free-text categories)',
          note: PARTIAL_NOTE,
        },
        {
          item: 'Camp-wise deferral count',
          note: 'Deferral records have no direct camp link in the data model — approximated by matching deferrals raised in the period to donors who donated at that camp during the period.',
        },
      ];

      for (const label2 of [...chemicalStock.reagentRows, ...chemicalStock.elisaRows]) {
        if (!label2.configured) {
          missingDataNotes.push({
            item: `${label2.label} stock`,
            note: 'Not configured in system — no matching Chemical master record found under Chemical Inventory.',
          });
        }
      }

      log.info({ month, year }, 'monthly report generated');

      return {
        period: {
          month,
          year,
          from: from.toISOString(),
          to: new Date(to.getTime() - 1).toISOString(),
          label,
        },
        collection: { ...collection, campsCount },
        componentsIssued: { hospitals: componentsIssued.hospitals },
        discards,
        repeatedDonors,
        donorCounselling: savedInput
          ? { available: true, count: savedInput.donorCounsellingCount }
          : { available: false, note: NOT_TRACKED },
        bulkTransfer: { available: true, ...bulkTransferStats },
        bagsToStorageCentres: { centres: storageTransferStats.centres },
        rejectedDonors,
        donorTesting,
        ttiTesting,
        ictcReferral: savedInput
          ? { available: true, counts: savedInput.ictcReferral }
          : { available: false, note: NOT_TRACKED },
        stockLedger,
        donorCards: donorCardsWithTotal,
        bloodGroupCollection,
        issueByIndication,
        chemicalStock,
        bagStock,
        campWise,
        missingDataNotes,
      };
    },
  };
}

export type MonthlyReportService = ReturnType<typeof createMonthlyReportService>;

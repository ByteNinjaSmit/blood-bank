// Yearly statutory report — reuses the monthly-report aggregation layer
// (every repo method already accepts an arbitrary from/to window) so the
// two reports never drift apart. Only the chemical stock ledger is
// month-scoped upstream (opening/closing balances are computed per
// calendar month), so it's rolled up here by summing the 12 monthly
// snapshots for the year instead of re-querying with a year-wide window.

import { childLogger } from '@/core/logger';
import type { MonthlyReportRepo } from '@/modules/monthly-report/monthly-report.repository';
import type { MonthlyReportInputRepo } from '@/modules/monthly-report-input/monthly-report-input.repository';

const log = childLogger({ module: 'yearly-report-service' });

const NOT_TRACKED =
  'Not tracked in system — no matching field/module exists in the current data model.';
const PARTIAL_NOTE =
  'Derived automatically from an existing free-text field, not a dedicated tracked category — verify before statutory submission.';

export interface YearlyReportDeps {
  repo: MonthlyReportRepo;
  inputs: MonthlyReportInputRepo;
}

function mergeChemicalRows(monthlySnapshots: any[][]) {
  // Every snapshot has the same labels in the same order (driven by the
  // fixed REAGENT_CANONICAL / ELISA_CANONICAL lists), so rows can be
  // merged positionally.
  const rowCount = monthlySnapshots[0]?.length ?? 0;
  const merged: any[] = [];
  for (let i = 0; i < rowCount; i++) {
    const monthRows = monthlySnapshots.map((snap) => snap[i]);
    const configured = monthRows.find((r) => r?.configured);
    if (!configured) {
      merged.push({ label: monthRows[0]?.label, configured: false });
      continue;
    }
    const firstConfigured = monthRows.find((r) => r?.configured);
    const lastConfigured = [...monthRows].reverse().find((r) => r?.configured);
    merged.push({
      label: configured.label,
      configured: true,
      chemicalName: configured.chemicalName,
      unitType: configured.unitType,
      opening: firstConfigured?.opening ?? 0,
      received: monthRows.reduce((sum, r) => sum + (r?.received ?? 0), 0),
      used: monthRows.reduce((sum, r) => sum + (r?.used ?? 0), 0),
      damage: monthRows.reduce((sum, r) => sum + (r?.damage ?? 0), 0),
      closing: lastConfigured?.closing ?? 0,
      isVialTracked: lastConfigured?.isVialTracked ?? false,
      unitsPerPack: lastConfigured?.unitsPerPack ?? null,
      openBoxVialsRemaining: lastConfigured?.openBoxVialsRemaining ?? 0,
      batches: lastConfigured?.batches ?? [],
    });
  }
  return merged;
}

export function createYearlyReportService(deps: YearlyReportDeps) {
  return {
    async getReport(year: number) {
      const from = new Date(year, 0, 1);
      const to = new Date(year + 1, 0, 1);
      const label = `${year}`;

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
        bagStock,
        campWise,
        bulkTransferStats,
        savedInputs,
        storageTransferStats,
        chemicalStockByMonth,
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
        deps.repo.getBagStock(),
        deps.repo.getCampWiseStats(from, to),
        deps.repo.getBulkTransferStats(from, to),
        deps.inputs.findAllByYear(year),
        deps.repo.getStorageTransferStats(from, to),
        Promise.all(
          Array.from({ length: 12 }, (_, i) => deps.repo.getChemicalStock(i + 1, year)),
        ),
      ]);

      // Voluntary Donor Cards Issued must equal the total donor count for the
      // period (every donor — inhouse and camp — receives a card).
      const donorCardsWithTotal = { ...donorCards, totalCount: collection.grandTotal.total };

      const reagentRows = mergeChemicalRows(chemicalStockByMonth.map((m) => m.reagentRows));
      const elisaRows = mergeChemicalRows(chemicalStockByMonth.map((m) => m.elisaRows));
      const chemicalStock = { reagentRows, elisaRows };

      const donorCounsellingTotal = savedInputs.reduce((a, i) => a + i.donorCounsellingCount, 0);
      const ictcTotals = savedInputs.reduce(
        (a, i) => ({
          hiv: a.hiv + i.ictcReferral.hiv,
          hbsag: a.hbsag + i.ictcReferral.hbsag,
          hcv: a.hcv + i.ictcReferral.hcv,
          vdrl: a.vdrl + i.ictcReferral.vdrl,
          malaria: a.malaria + i.ictcReferral.malaria,
        }),
        { hiv: 0, hbsag: 0, hcv: 0, vdrl: 0, malaria: 0 },
      );
      const monthsWithInputs = savedInputs.length;

      const missingDataNotes: Array<{ item: string; note: string }> = [
        {
          item: 'Voluntary vs. replacement collection split',
          note: 'Inferred from donation type (REPLACEMENT vs. all other donation types) — not a dedicated voluntary/replacement flag.',
        },
        ...(monthsWithInputs === 0
          ? [{ item: 'Donor counselling count', note: NOT_TRACKED }]
          : monthsWithInputs < 12
            ? [
                {
                  item: 'Donor counselling count',
                  note: `Only ${monthsWithInputs} of 12 months have saved manual-input figures for ${year} — total is a partial-year sum. Fill in the missing months' Monthly Report inputs for a complete yearly figure.`,
                },
              ]
            : []),
        {
          item: 'Blood bags given to blood storage centres',
          note: 'Identified by hospital records whose name contains "storage" (e.g. "SJS Storage") — there is no dedicated storage-centre entity type. Add a hospital record for each centre if none appear below.',
        },
        { item: 'Blood bags issued by disease category', note: PARTIAL_NOTE },
        {
          item: 'Rejected donors by reason',
          note: "Sourced from Deferral records (the system's actual donor-rejection log) and bucketed by keyword match on the deferral reason text / deferral source — verify before statutory submission.",
        },
        ...(monthsWithInputs === 0
          ? [{ item: 'ICTC referral counts', note: NOT_TRACKED }]
          : monthsWithInputs < 12
            ? [
                {
                  item: 'ICTC referral counts',
                  note: `Only ${monthsWithInputs} of 12 months have saved manual-input figures for ${year} — total is a partial-year sum.`,
                },
              ]
            : []),
        {
          item: 'Component issue by clinical indication (free-text categories)',
          note: PARTIAL_NOTE,
        },
        {
          item: 'Camp-wise deferral count',
          note: 'Deferral records have no direct camp link in the data model — approximated by matching deferrals raised in the period to donors who donated at that camp during the period.',
        },
        {
          item: 'Chemical stock opening/closing balances',
          note: 'Opening balance is taken from January and closing balance from December of the selected year; received/used/damage figures are summed across all 12 months.',
        },
      ];

      for (const row of [...reagentRows, ...elisaRows]) {
        if (!row.configured) {
          missingDataNotes.push({
            item: `${row.label} stock`,
            note: 'Not configured in system — no matching Chemical master record found under Chemical Inventory.',
          });
        }
      }

      log.info({ year }, 'yearly report generated');

      return {
        period: {
          year,
          from: from.toISOString(),
          to: new Date(to.getTime() - 1).toISOString(),
          label,
        },
        collection: { ...collection, campsCount },
        componentsIssued: { hospitals: componentsIssued.hospitals },
        discards,
        repeatedDonors,
        donorCounselling:
          monthsWithInputs > 0
            ? { available: true, count: donorCounsellingTotal }
            : { available: false, note: NOT_TRACKED },
        bulkTransfer: { available: true, ...bulkTransferStats },
        bagsToStorageCentres: { centres: storageTransferStats.centres },
        rejectedDonors,
        donorTesting,
        ttiTesting,
        ictcReferral:
          monthsWithInputs > 0
            ? { available: true, counts: ictcTotals }
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

export type YearlyReportService = ReturnType<typeof createYearlyReportService>;

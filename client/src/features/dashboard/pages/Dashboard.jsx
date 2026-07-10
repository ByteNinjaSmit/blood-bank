import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomModal from "@/components/CustomModal";
import { apiClient } from "@/core/api-client";
import { downloadExcelReport, formatDate, buildExportMeta } from "@/utils/excelExportHelper";
import { toast } from "sonner";
import { Droplets, FileSpreadsheet, Loader2, RefreshCw, ClipboardCheck } from "lucide-react";
import { useDashboard } from "@/features/dashboard/queries";
import NotificationBell from "@/features/dashboard/components/NotificationBell";
import MonthlyReportInputsModal from "@/features/dashboard/components/MonthlyReportInputsModal";
import {
  SummaryStat,
  CampOverviewSection,
  ChemicalStockSection,
  BagStockSection,
  DonorCardSection,
  BulkTransferSection,
  DiseaseSection,
  StorageBreakdownSection,
  DiscardSection,
  DeferralReasonSection,
  DonorDonationSection,
  BloodBagOverviewSection,
  ComponentOverviewSection,
  InventoryOverviewSection,
  BloodGroupAvailabilitySection,
  ComponentAvailabilitySection,
  HospitalRequestOverviewSection,
  TestingSerologySection,
  CampKpiSection,
  ExceptionAlertsSection,
  OngoingCampsSection,
  BloodBagStatusTable,
} from "@/features/dashboard/components/DashboardSections";

const number = (v) => (typeof v === "number" ? v : 0);

const MATRIX_COMPONENTS = [
  { key: "RBC", label: "Red Blood Cells (RBC)", theme: "text-rose-700 bg-rose-50 border-rose-200" },
  { key: "FFP", label: "Fresh Frozen Plasma (FFP)", theme: "text-sky-700 bg-sky-50 border-sky-200" },
  { key: "Platelet", label: "Platelets (PLT)", theme: "text-amber-700 bg-amber-50 border-amber-200" },
  { key: "Cryo", label: "Cryoprecipitate (CRYO)", theme: "text-indigo-700 bg-indigo-50 border-indigo-200" },
];

const MATRIX_BLOOD_GROUPS = [
  { group: "A", rh: "Positive", label: "A+" },
  { group: "A", rh: "Negative", label: "A-" },
  { group: "B", rh: "Positive", label: "B+" },
  { group: "B", rh: "Negative", label: "B-" },
  { group: "AB", rh: "Positive", label: "AB+" },
  { group: "AB", rh: "Negative", label: "AB-" },
  { group: "O", rh: "Positive", label: "O+" },
  { group: "O", rh: "Negative", label: "O-" },
];

function table({ subtitle, headers, rows, alignments }) {
  return {
    subtitle,
    headers,
    alignments: alignments || headers.map((_, i) => (i === 0 ? "left" : "right")),
    rows,
  };
}

function buildDashboardSheets(data) {
  const totals = data?.stockOverview?.totals || {};
  const matrix = data?.stockOverview?.stockMatrix || [];
  const getMatrixStock = (compKey, group, rh) => {
    const match = matrix.find((x) => x.componentType === compKey && x.bloodGroup === group && x.rh === rh);
    return match ? number(match.count) : 0;
  };
  const matrixHeaders = ["Component Type", ...MATRIX_BLOOD_GROUPS.map((bg) => bg.label), "Total"];
  const matrixRows = MATRIX_COMPONENTS.map((comp) => {
    const counts = MATRIX_BLOOD_GROUPS.map((bg) => getMatrixStock(comp.key, bg.group, bg.rh));
    return [comp.label, ...counts, counts.reduce((a, b) => a + b, 0)];
  });

  const chemical = data?.chemicalStock || {};
  const bagStock = data?.bagStock || {};
  const bulkTransfer = data?.bulkTransfer || {};
  const diseasePatients = data?.diseasePatients || {};
  const storage = data?.storageBreakdown || [];
  const discards = data?.discards || {};
  const deferrals = data?.deferrals || [];
  const legacy = data?.legacyOverview || {};
  const hospitalRequisitions = data?.hospitalRequisitions || [];

  const sheets = [
    table({
      name: "Overview",
      subtitle: "Overall Totals",
      headers: ["Metric", "Value"],
      rows: [
        ["Donors", number(totals.donors)],
        ["Donations", number(totals.donations)],
        ["In-Stock Units", number(totals.inStock)],
        ["Reserved Units", number(totals.reserved)],
        ["Issued Units", number(totals.issued)],
        ["Discarded Units", number(totals.discarded)],
        ["Transfusions", number(totals.transfusions)],
      ],
      alignments: ["left", "right"],
    }),
    table({
      name: "Blood Stock Matrix",
      subtitle: "Real-Time Blood Stock Inventory Matrix (ABO / Rh)",
      headers: matrixHeaders,
      rows: matrixRows,
      alignments: matrixHeaders.map((_, i) => (i === 0 ? "left" : "center")),
    }),
    table({
      name: "Donor & Donation",
      subtitle: "Donor & Donation Overview",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Total Donors": legacy.donorDonation?.donors,
        "New Donors (30d)": legacy.donorDonation?.newDonors,
        "Total Donations": legacy.donorDonation?.donations,
        "In-House Donations": legacy.donorDonation?.donationsInHouse,
        "Camp Donations": legacy.donorDonation?.donationsCamp,
        "Male Donors": legacy.donorDonation?.maleDonors,
        "Female Donors": legacy.donorDonation?.femaleDonors,
        "Other Donors": legacy.donorDonation?.otherDonors,
        "First-Time Donors": legacy.donorDonation?.firstTimeDonors,
        "Repeat Donors": legacy.donorDonation?.repeatDonors,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Blood Bags & Components",
      subtitle: "Blood Bag & Component Overview",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Bags Collected": legacy.bloodBags?.bagsCollected,
        "Bags Tested": legacy.bloodBags?.bagsTested,
        "Bags Passed": legacy.bloodBags?.bagsPassed,
        "Bags Failed": legacy.bloodBags?.bagsFailed,
        "Bags Pending": legacy.bloodBags?.bagsPending,
        "Bags Quarantined": legacy.bloodBags?.bagsQuarantined,
        "Components Produced": legacy.components?.componentsProduced,
        "RBC Produced": legacy.components?.rbcProduced,
        "Platelet Produced": legacy.components?.pltProduced,
        "FFP Produced": legacy.components?.ffpProduced,
        "Cryo Produced": legacy.components?.cryoProduced,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Blood Group Availability",
      subtitle: "In-Stock Units by Blood Group",
      headers: ["Blood Group", "Units"],
      rows: [
        ["O+", number(legacy.bloodGroups?.Opos)],
        ["O-", number(legacy.bloodGroups?.Oneg)],
        ["A+", number(legacy.bloodGroups?.Apos)],
        ["A-", number(legacy.bloodGroups?.Aneg)],
        ["B+", number(legacy.bloodGroups?.Bpos)],
        ["B-", number(legacy.bloodGroups?.Bneg)],
        ["AB+", number(legacy.bloodGroups?.ABpos)],
        ["AB-", number(legacy.bloodGroups?.ABneg)],
      ],
    }),
    table({
      name: "Hospital Requests",
      subtitle: "Hospital Request Overview",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Total Requests": legacy.hospitalRequests?.totalRequests,
        "Pending Requests": legacy.hospitalRequests?.pendingRequests,
        "Matched Requests": legacy.hospitalRequests?.matchedRequests,
        "Approved Requests": legacy.hospitalRequests?.approvedRequests,
        "Issued Requests": legacy.hospitalRequests?.issuedRequests,
        "Completed Requests": legacy.hospitalRequests?.completedRequests,
        "Rejected Requests": legacy.hospitalRequests?.rejectedRequests,
        "Total Units Requested": legacy.hospitalRequests?.totalUnitsRequested,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Requisitions by Hospital",
      subtitle: "Per-Hospital Requisition Breakdown",
      headers: ["Hospital", "Total Requests", "Total Units"],
      rows: hospitalRequisitions.map((h) => [h.hospitalName, number(h.totalRequests), number(h.totalUnits)]),
    }),
    table({
      name: "Testing & Serology",
      subtitle: "Testing & Serology Overview",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Total Tests Performed": legacy.testingSerology?.testsTotal,
        "HIV Reactive": legacy.testingSerology?.hivPos,
        "HBsAg Reactive": legacy.testingSerology?.hbvPos,
        "HCV Reactive": legacy.testingSerology?.hcvPos,
        "VDRL Reactive": legacy.testingSerology?.vdrlPos,
        "MP Reactive": legacy.testingSerology?.mpPos,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Camp KPIs & Alerts",
      subtitle: "Camp Overview & Exception Alerts",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Camps Conducted": legacy.camps?.campsConducted,
        "Camp Donors": legacy.camps?.campDonors,
        "Camp Collections": legacy.camps?.campCollections,
        "Camp Serology Failures": legacy.camps?.campFailures,
        "Units Expiring Today": legacy.alerts?.expiringToday,
        "Tests Pending": legacy.alerts?.testsPending,
        "Bags Delayed Testing (>24h)": legacy.alerts?.delayedTesting,
        "Components Missing Expiry": legacy.alerts?.missingExpiry,
        "Inactive Donors (>6 months)": legacy.alerts?.inactiveDonors,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Ongoing Camps",
      subtitle: "Active/Ongoing Donation Camps",
      headers: ["Camp Name", "Address", "Donors", "Units", "Staff", "From", "To"],
      rows: (legacy.ongoingCamps || []).map((c) => [
        c.name, c.address, number(c.donorsCount), number(c.unitsCount), (c.staff || []).length,
        formatDate(c.dateFrom), formatDate(c.dateTo),
      ]),
      alignments: ["left", "left", "right", "right", "right", "center", "center"],
    }),
    table({
      name: "BloodBag Status",
      subtitle: "BloodBag Status Breakdown",
      headers: ["Status", "Count"],
      rows: (legacy.bloodbagStatusPie || []).map((s) => [s.status, number(s.value)]),
    }),
    table({
      name: "Chemical Low Stock",
      subtitle: "Chemicals at/below reorder level",
      headers: ["Chemical", "Available", "Reorder Level"],
      rows: (chemical.lowStockItems || []).map((c) => [c.name, number(c.available), number(c.reorderLevel)]),
    }),
    table({
      name: "Bag Stock",
      subtitle: "Bag Stock by Type",
      headers: ["Bag Type", "Closing Stock", "Received", "Issued", "Damaged", "Discarded"],
      rows: (bagStock.byType || []).map((t) => [t.bagType, number(t.totalClosingStock), number(t.totalReceived), number(t.totalIssued), number(t.totalDamaged), number(t.totalDiscarded)]),
    }),
    table({
      name: "Low Box Stock",
      subtitle: "Batches with 3 or fewer unopened boxes",
      headers: ["Batch", "Bag Type", "Boxes Left", "Expiry"],
      rows: (bagStock.lowBoxBatches || []).map((b) => [b.batchNumber, b.bagType, number(b.unopenedBoxes), formatDate(b.expiryDate)]),
    }),
    table({
      name: "Bulk Transfer",
      subtitle: "Loan Given / Taken",
      headers: ["Direction", "Total"],
      rows: [
        ["Given", number(bulkTransfer.given?.total)],
        ["Taken", number(bulkTransfer.taken?.total)],
      ],
    }),
    table({
      name: "Clinical Indication Disease",
      subtitle: "Component Issue by Clinical Indication / Disease",
      headers: ["Disease", "Blood Group", "Units"],
      rows: [
        ...(diseasePatients.thalassemia?.byBloodGroup || []).map((b) => ["Thalassemia", b.bloodGroup, number(b.count)]),
        ...(diseasePatients.sickleCellAnaemia?.byBloodGroup || []).map((b) => ["Sickle Cell Anaemia", b.bloodGroup, number(b.count)]),
        ...(diseasePatients.other?.byBloodGroup || []).map((b) => ["Other", b.bloodGroup, number(b.count)]),
      ],
    }),
    table({
      name: "Storage Breakdown",
      subtitle: "Units by storage location",
      headers: ["Storage Location", "Units"],
      rows: storage.map((s) => [s.location, number(s.count)]),
    }),
    table({
      name: "Discards",
      subtitle: "Bag-level discards by reason",
      headers: ["Reason", "Quantity", "Entries"],
      rows: (discards.bagLevel || []).map((d) => [d.reason, number(d.quantity), number(d.count)]),
    }),
    table({
      name: "Deferrals",
      subtitle: "Donor deferrals by reason",
      headers: ["Reason", "Count"],
      rows: deferrals.map((d) => [d.reason, number(d.count)]),
    }),
  ];

  return sheets.filter((s) => s.rows.length > 0);
}

/** Combines every dashboard table onto a single worksheet, stacked one below
 * another in the same order they appear on the page, so the exported file
 * mirrors what's actually shown on screen. */
function buildDashboardSheet(data, meta) {
  return {
    name: "Operational Dashboard",
    title: "SANJIVANI BLOOD BANK, KOPARGAON",
    subtitle: "Operational Dashboard — Full Snapshot",
    tables: buildDashboardSheets(data),
    ...meta,
  };
}

export default function Dashboard() {
  const { data: payload, isLoading, isError, error, refetch, isFetching } = useDashboard();
  const [exporting, setExporting] = React.useState(false);
  const [reportChecking, setReportChecking] = React.useState(false);
  const [openChemicalsWarning, setOpenChemicalsWarning] = React.useState(null); // null | array
  const [reportInputsOpen, setReportInputsOpen] = React.useState(false);
  const [reportPeriod, setReportPeriod] = React.useState(null); // { month, year }

  const handleExportExcel = async () => {
    if (!payload) {
      toast.error("Dashboard data is still loading");
      return;
    }
    setExporting(true);
    try {
      const meta = buildExportMeta({}, {});
      const sheet = buildDashboardSheet(payload, meta);
      await downloadExcelReport([sheet], `Dashboard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const lastFullMonthPeriod = () => {
    const today = new Date();
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthEnd = new Date(firstOfThisMonth.getTime() - 24 * 60 * 60 * 1000);
    return { month: lastMonthEnd.getMonth() + 1, year: lastMonthEnd.getFullYear() };
  };

  const handleCreateMonthlyReport = async () => {
    setReportChecking(true);
    try {
      const now = new Date();
      const res = await apiClient.get("/api/v2/chemical-inventory/reports/monthly", {
        params: { month: now.getMonth() + 1, year: now.getFullYear() },
      });
      const rows = res.data?.data || [];
      const open = rows.filter((r) => number(r.inUse) > 0);
      if (open.length > 0) {
        setOpenChemicalsWarning(open);
        return;
      }
      setOpenChemicalsWarning(null);
      setReportPeriod(lastFullMonthPeriod());
      setReportInputsOpen(true);
    } catch (e) {
      toast.error(e?.message || "Failed to check chemical stock status");
    } finally {
      setReportChecking(false);
    }
  };

  const totals = payload?.stockOverview?.totals || {};
  const matrix = payload?.stockOverview?.stockMatrix || [];
  const getMatrixStock = (compKey, group, rh) => {
    const match = matrix.find((x) => x.componentType === compKey && x.bloodGroup === group && x.rh === rh);
    return match ? number(match.count) : 0;
  };

  if (isLoading) {
    return (
      <div className="p-6 grid gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="h-80 rounded-xl bg-gray-100" />
          <div className="h-80 rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error?.message || "Failed to load dashboard"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header / Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-800 rounded-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Operational Dashboard</h1>
                <p className="text-gray-500 text-sm">Live overview of donors, stock, and issuance</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />}
                Export to Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreateMonthlyReport} disabled={reportChecking}>
                {reportChecking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-2 text-indigo-600" />}
                {reportChecking ? "Checking..." : "Create Monthly Report"}
              </Button>
              <NotificationBell />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High-level KPIs */}
      <Card className="border-slate-100 bg-slate-50/80 backdrop-blur-sm">
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <SummaryStat label="Donors" value={totals.donors} />
          <SummaryStat label="Donations" value={totals.donations} />
          <SummaryStat label="In-Stock Units" value={totals.inStock} />
          <SummaryStat label="Reserved Units" value={totals.reserved} />
          <SummaryStat label="Issued Units" value={totals.issued} />
          <SummaryStat label="Discarded Units" value={totals.discarded} />
          <SummaryStat label="Transfusions" value={totals.transfusions} />
        </CardContent>
      </Card>

      {/* Real-Time Blood Stock Inventory Matrix */}
      <Card className="border-slate-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-red-800 to-red-900 text-white rounded-t-xl py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-200" />
              Real-Time Blood Stock Inventory Matrix (ABO / Rh)
            </CardTitle>
            <Badge variant="outline" className="text-white border-red-300 text-xs">
              Status: Released / In-Stock
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component Type</th>
                  {MATRIX_BLOOD_GROUPS.map((bg) => (
                    <th key={bg.label} className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {bg.label}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-800 uppercase tracking-wider bg-gray-100">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {MATRIX_COMPONENTS.map((comp) => {
                  let rowTotal = 0;
                  return (
                    <tr key={comp.key} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">
                        <span className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold border ${comp.theme}`}>{comp.label}</span>
                      </td>
                      {MATRIX_BLOOD_GROUPS.map((bg) => {
                        const count = getMatrixStock(comp.key, bg.group, bg.rh);
                        rowTotal += count;
                        return (
                          <td key={bg.label} className="px-4 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs ${count > 0 ? `${comp.theme.split(" ")[0]} font-extrabold border` : "text-gray-300 border border-gray-100"}`}>
                              {count}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-center bg-gray-50/50 font-extrabold text-sm text-slate-800">{rowTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed overview (restored) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DonorDonationSection data={payload?.legacyOverview?.donorDonation} />
        <BloodBagOverviewSection data={payload?.legacyOverview?.bloodBags} />
        <ComponentOverviewSection data={payload?.legacyOverview?.components} />
        <InventoryOverviewSection data={payload?.legacyOverview?.inventory} />
        <BloodGroupAvailabilitySection data={payload?.legacyOverview?.bloodGroups} />
        <ComponentAvailabilitySection data={payload?.legacyOverview?.componentAvailability} />
        <HospitalRequestOverviewSection data={payload?.legacyOverview?.hospitalRequests} hospitals={payload?.hospitalRequisitions} />
        <TestingSerologySection data={payload?.legacyOverview?.testingSerology} />
        <CampKpiSection data={payload?.legacyOverview?.camps} />
        <ExceptionAlertsSection data={payload?.legacyOverview?.alerts} />
      </div>

      <OngoingCampsSection camps={payload?.legacyOverview?.ongoingCamps} />

      <BloodBagStatusTable data={payload?.legacyOverview?.bloodbagStatusPie} />

      {/* Operational sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CampOverviewSection data={payload?.campOverview} />
        <DonorCardSection data={payload?.donorCards} />
        <BulkTransferSection data={payload?.bulkTransfer} />
        <DiseaseSection data={payload?.diseasePatients} />
        <StorageBreakdownSection data={payload?.storageBreakdown} />
        <DiscardSection data={payload?.discards} />
        <DeferralReasonSection data={payload?.deferrals} />
      </div>

      {/* Chemical & Bag stock — moved to the bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChemicalStockSection data={payload?.chemicalStock} />
        <BagStockSection data={payload?.bagStock} />
      </div>

      <CustomModal
        open={Boolean(openChemicalsWarning)}
        title="Open Chemicals Must Be Closed First"
        onCancel={() => setOpenChemicalsWarning(null)}
        hideFooter
        size="lg"
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            The chemicals below are currently <strong>open / in-use</strong> and have not been fully consumed.
            Count physical stock and close them out via Chemical Inventory &rsaquo; Stock Usage before generating
            this month&apos;s report.
          </p>
          <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
            {(openChemicalsWarning || []).map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="font-medium">{c.chemicalName}</span>
                <span className="text-amber-700">{c.inUse} {c.unitType} in use</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpenChemicalsWarning(null)}>
              Close
            </Button>
            <Button size="sm" onClick={handleCreateMonthlyReport} disabled={reportChecking}>
              {reportChecking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Recheck
            </Button>
          </div>
        </div>
      </CustomModal>

      {reportPeriod && (
        <MonthlyReportInputsModal
          open={reportInputsOpen}
          onClose={() => setReportInputsOpen(false)}
          month={reportPeriod.month}
          year={reportPeriod.year}
          donorCountHint={number(payload?.legacyOverview?.donorDonation?.donors) * 2}
        />
      )}
    </div>
  );
}

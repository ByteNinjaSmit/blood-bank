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
  { key: "PRBC", label: "Packed Red Blood Cells (PRBC)", theme: "text-rose-700 bg-rose-50 border-rose-200" },
  { key: "FFP", label: "Fresh Frozen Plasma (FFP)", theme: "text-sky-700 bg-sky-50 border-sky-200" },
  { key: "RDP", label: "Random Donor Platelets (RDP)", theme: "text-amber-700 bg-amber-50 border-amber-200" },
  { key: "CRYO", label: "Cryoprecipitate (CRYO)", theme: "text-indigo-700 bg-indigo-50 border-indigo-200" },
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

function table({ name, subtitle, headers, rows, alignments }) {
  return {
    name,
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
        "PRBC Produced": legacy.components?.prbcProduced,
        "RDP Produced": legacy.components?.rdpProduced,
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
  const getPresetDates = (presetName) => {
    const today = new Date();
    // Set hours to local bounds
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    let from = new Date();
    let to = now;

    if (presetName === "today") {
      from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    } else if (presetName === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      from = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      to = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    } else if (presetName === "7d") {
      from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
    } else if (presetName === "1m") {
      from = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 0, 0, 0, 0);
    } else if (presetName === "yearly") {
      from = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
      return { from: null, to: null };
    }
    return { from, to };
  };

  const formatInputDate = (date) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [preset, setPreset] = React.useState("yearly");
  const initialDates = getPresetDates("yearly");
  const [customFrom, setCustomFrom] = React.useState(formatInputDate(initialDates.from));
  const [customTo, setCustomTo] = React.useState(formatInputDate(initialDates.to));

  const filters = React.useMemo(() => {
    if (preset && preset !== "custom") {
      const { from, to } = getPresetDates(preset);
      return {
        from: from ? from.toISOString() : undefined,
        to: to ? to.toISOString() : undefined,
      };
    }
    return {
      from: customFrom ? new Date(customFrom + "T00:00:00").toISOString() : undefined,
      to: customTo ? new Date(customTo + "T23:59:59").toISOString() : undefined,
    };
  }, [preset, customFrom, customTo]);

  const { data: payload, isLoading, isError, error, refetch, isFetching } = useDashboard(filters);
  const [exporting, setExporting] = React.useState(false);
  const [reportChecking, setReportChecking] = React.useState(false);
  const [openChemicalsWarning, setOpenChemicalsWarning] = React.useState(null); // null | array
  const [reportInputsOpen, setReportInputsOpen] = React.useState(false);
  const [reportPeriod, setReportPeriod] = React.useState(null); // { month, year }

  const handlePresetChange = (p) => {
    setPreset(p);
    const { from, to } = getPresetDates(p);
    setCustomFrom(formatInputDate(from));
    setCustomTo(formatInputDate(to));
  };

  const handleCustomFromChange = (e) => {
    setPreset("custom");
    setCustomFrom(e.target.value);
  };

  const handleCustomToChange = (e) => {
    setPreset("custom");
    setCustomTo(e.target.value);
  };

  const handleExportExcel = async () => {
    if (!payload) {
      toast.error("Dashboard data is still loading");
      return;
    }
    setExporting(true);
    try {
      const dateRangeStr =
        preset !== "custom"
          ? `${preset.toUpperCase()} (${formatDate(filters.from)} to ${formatDate(filters.to)})`
          : `Custom Range (${formatDate(filters.from)} to ${formatDate(filters.to)})`;

      const meta = buildExportMeta({}, {});
      const sheet = {
        ...buildDashboardSheet(payload, meta),
        subtitle: `Operational Dashboard — ${dateRangeStr}`,
      };
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
              <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                <Droplets className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Operational Dashboard</h1>
                <p className="text-gray-500 text-sm">Live overview of donors, stock, and issuance</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
                aria-label="Refresh"
                className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />}
                Export to Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreateMonthlyReport} disabled={reportChecking}>
                {reportChecking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-2 text-indigo-600" />}
                {reportChecking ? "Checking..." : "Create Monthly Report"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Filter Toolbar */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-2 uppercase tracking-wider">Date Filters:</span>
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7d", label: "7 Days" },
              { id: "1m", label: "1 Month" },
              { id: "yearly", label: "Yearly" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  preset === p.id
                    ? "bg-red-800 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Range:</span>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <input
                type="date"
                value={customFrom}
                onChange={handleCustomFromChange}
                className="bg-transparent border-none text-xs text-slate-700 outline-none px-2 py-1 font-medium focus:ring-0 focus:outline-none"
              />
              <span className="text-slate-400 text-xs px-1">to</span>
              <input
                type="date"
                value={customTo}
                onChange={handleCustomToChange}
                className="bg-transparent border-none text-xs text-slate-700 outline-none px-2 py-1 font-medium focus:ring-0 focus:outline-none"
              />
            </div>
            {preset === "custom" && (
              <button
                type="button"
                onClick={() => handlePresetChange("yearly")}
                className="text-xs text-red-800 hover:text-red-950 font-semibold px-2"
              >
                Clear
              </button>
            )}
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

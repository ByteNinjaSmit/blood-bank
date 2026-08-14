import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/core/api-client";
import { downloadExcelReport, formatDate, buildExportMeta } from "@/utils/excelExportHelper";
import { toast } from "sonner";
import { Droplets, FileSpreadsheet, Loader2, RefreshCw, ClipboardCheck, FileBarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  RequisitionIndicationSection,
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
import { number, MATRIX_COMPONENTS, MATRIX_BLOOD_GROUPS, buildDashboardSheet } from "@/features/dashboard/dashboardExcel";

export default function Dashboard() {
  const navigate = useNavigate();
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

  const handleCreateYearlyReport = () => {
    navigate(`/reports/yearly?year=${new Date().getFullYear()}`);
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
              <Button variant="outline" size="sm" onClick={handleCreateYearlyReport}>
                <FileBarChart className="w-4 h-4 mr-2 text-indigo-600" />
                Create Yearly Report
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
        <RequisitionIndicationSection data={payload?.requisitionIndications} />
        <StorageBreakdownSection data={payload?.storageBreakdown} />
        <DiscardSection data={payload?.discards} />
        <DeferralReasonSection data={payload?.deferrals} />
      </div>

      {/* Chemical & Bag stock — moved to the bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChemicalStockSection data={payload?.chemicalStock} />
        <BagStockSection data={payload?.bagStock} />
      </div>

      <Dialog open={Boolean(openChemicalsWarning)} onOpenChange={(o) => { if (!o) setOpenChemicalsWarning(null); }}>
        <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Open Chemicals Must Be Closed First</DialogTitle>
        </DialogHeader>
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
        </DialogContent>
      </Dialog>

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

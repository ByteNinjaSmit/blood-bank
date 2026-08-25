import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadExcelReport } from "@/utils/excelExportHelper";
import { useExecutiveMis } from "../queries";
import { formatDate, formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#f43f5e", "#ef4444"];

export default function ExecutiveMIS() {
  const [preset, setPreset] = useState("30d");
  const { data, isLoading, isError, error, refetch } = useExecutiveMis({ period: preset });

  const kpis = useMemo(() => data?.kpis || {}, [data]);
  const ratios = data?.ratios || {};
  const trends = useMemo(() => data?.trends || [], [data]);

  const donationsTrend = useMemo(() => trends.map((d) => ({ date: formatDate(d.date), value: number(d.value) })), [trends]);
  const kpiPieData = useMemo(() => [
    { name: "Donations", value: number(kpis.donationsMonth) },
    { name: "Issued", value: number(kpis.issuedMonth) },
    { name: "Stock", value: number(kpis.stock) },
    { name: "Discards", value: number(kpis.discardsMonth) },
  ], [kpis]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Executive MIS Dashboard", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [["KPI", "Value"]],
      body: [
        ["Donations Today", kpis.donationsToday], ["Donations This Month", kpis.donationsMonth],
        ["New Donors This Month", kpis.donorsMonth], ["Issued This Month", kpis.issuedMonth],
        ["Current Stock", kpis.stock], ["Camps This Month", kpis.campsMonth], ["Discards This Month", kpis.discardsMonth],
      ],
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Ratio", "Value"]],
      body: [["Issue per Donation", ratios.issuePerDonation], ["Discard Rate", ratios.discardRate + "%"]],
    });
    doc.save("executive_mis.pdf");
  };

  const exportExcel = () => {
    const rows = [
      ["Donations Today", kpis.donationsToday],
      ["Donations This Month", kpis.donationsMonth],
      ["New Donors This Month", kpis.donorsMonth],
      ["Issued This Month", kpis.issuedMonth],
      ["Current Stock", kpis.stock],
      ["Camps This Month", kpis.campsMonth],
      ["Discards This Month", kpis.discardsMonth],
      ["Issue per Donation", ratios.issuePerDonation],
      ["Discard Rate", ratios.discardRate + "%"],
    ];
    downloadExcelReport([{
      name: "Executive Summary",
      subtitle: "Executive Dashboard MIS Summary",
      headers: ["Metric", "Value"],
      rows,
    }], "executive_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Executive MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']"><BarChart3 className="w-6 h-6 text-white relative z-10 drop-shadow-sm" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Executive Dashboard MIS</CardTitle><p className="text-gray-500 text-sm">Top-level KPIs across donors, inventory and issues</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <select value={preset} onChange={(e) => setPreset(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm bg-white">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        <Kpi label="Donations Today" value={number(kpis.donationsToday)} tone="blue" />
        <Kpi label="Donations Month" value={number(kpis.donationsMonth)} tone="emerald" />
        <Kpi label="New Donors Month" value={number(kpis.donorsMonth)} tone="sky" />
        <Kpi label="Issued Month" value={number(kpis.issuedMonth)} tone="amber" />
        <Kpi label="Stock" value={number(kpis.stock)} tone="violet" />
        <Kpi label="Camps Month" value={number(kpis.campsMonth)} tone="rose" />
        <Kpi label="Discards Month" value={number(kpis.discardsMonth)} tone="red" />
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Donations Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ value: { label: "Donations", color: "#3b82f6" } }} className="h-full w-full">
                <AreaChart data={donationsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="exec-donations-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} fill="url(#exec-donations-fill)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">This Month at a Glance</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ChartContainer config={{}} className="h-full w-full">
                <PieChart>
                  <Pie data={kpiPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {kpiPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Key Ratios</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <RatioRow label="Issue per Donation" value={ratios.issuePerDonation} />
          <RatioRow label="Discard Rate" value={ratios.discardRate} suffix="%" />
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  const toneClass = useMemo(() => {
    switch (tone) {
      case "blue": return "text-blue-700 bg-blue-50";
      case "red": return "text-red-700 bg-red-50";
      case "emerald": return "text-emerald-700 bg-emerald-50";
      case "amber": return "text-amber-700 bg-amber-50";
      case "violet": return "text-violet-700 bg-violet-50";
      case "rose": return "text-rose-700 bg-rose-50";
      case "sky": return "text-sky-700 bg-sky-50";
      default: return "text-slate-700 bg-slate-50";
    }
  }, [tone]);
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`inline-flex items-baseline gap-1 text-xl font-semibold ${toneClass} px-3 py-1 rounded-lg w-fit`}><span>{number(value).toLocaleString()}</span></div>
      </CardContent>
    </Card>
  );
}

function RatioRow({ label, value, suffix }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}{suffix && <span className="text-xs ml-1">{suffix}</span>}</span>
    </div>
  );
}

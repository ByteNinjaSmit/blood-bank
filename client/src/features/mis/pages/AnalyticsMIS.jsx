import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadExcelReport } from "@/utils/excelExportHelper";
import { useAnalyticsMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);

export default function AnalyticsMIS() {
  const { data, isLoading, isError, error, refetch } = useAnalyticsMis();

  const lastMonth = useMemo(() => data?.lastMonth || {}, [data]);
  const forecast = useMemo(() => data?.forecast || {}, [data]);
  const currentStock = number(data?.currentStock);
  const shortageRisk = data?.shortageRisk || "Unknown";

  const chartData = useMemo(() => [
    { name: "Last Month", donations: lastMonth.donations, demand: lastMonth.issues },
    { name: "Forecast (Next Month)", donations: forecast.donations, demand: forecast.demand },
  ], [lastMonth, forecast]);

  const stockOutlookData = useMemo(() => [
    { name: "Current Stock", value: currentStock },
    { name: "Forecasted Demand", value: number(forecast.demand) },
  ], [currentStock, forecast]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Analytics & Forecast MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: [
        ["Last Month Donations", number(lastMonth.donations)],
        ["Last Month Issues", number(lastMonth.issues)],
        ["Forecast Donations", number(forecast.donations)],
        ["Forecast Demand", number(forecast.demand)],
        ["Current Stock", currentStock],
        ["Shortage Risk", shortageRisk],
      ],
    });
    doc.save("analytics_mis.pdf");
  };

  const exportExcel = () => {
    const rows = [
      ["Last Month Donations", number(lastMonth.donations)],
      ["Last Month Issues", number(lastMonth.issues)],
      ["Forecast Donations", number(forecast.donations)],
      ["Forecast Demand", number(forecast.demand)],
      ["Current Stock", currentStock],
      ["Shortage Risk", shortageRisk],
    ];
    downloadExcelReport([{
      name: "Analytics",
      subtitle: "Analytics & Forecast MIS",
      headers: ["Metric", "Value"],
      rows,
    }], "analytics_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Analytics MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']"><TrendingUp className="w-6 h-6 text-white relative z-10 drop-shadow-sm" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Analytics & Forecast MIS</CardTitle><p className="text-gray-500 text-sm">Predictive analysis and demand forecasting</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Last Month Donations" value={number(lastMonth.donations)} tone="emerald" />
        <Kpi label="Last Month Issues" value={number(lastMonth.issues)} tone="blue" />
        <Kpi label="Current Stock" value={currentStock} tone="violet" />
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Supply vs Demand Forecast</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ donations: { label: "Donations", color: "#22c55e" }, demand: { label: "Demand", color: "#3b82f6" } }} className="h-full w-full">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="donations" fill="#22c55e" radius={[4, 4, 0, 0]} name="Donations" />
                  <Bar dataKey="demand" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Demand" />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Stock vs Forecasted Demand</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ChartContainer config={{}} className="h-full w-full">
                <PieChart>
                  <Pie data={stockOutlookData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#f43f5e" />
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
        <CardHeader><CardTitle className="text-sm">Risk Assessment</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <h4 className="text-sm font-medium text-slate-500 mb-2">Shortage Risk</h4>
              <div className="flex items-center gap-3">
                <Badge variant={shortageRisk === "High" ? "destructive" : "default"} className="text-lg px-4 py-1">{shortageRisk}</Badge>
                <span className="text-gray-500 text-sm">
                  {shortageRisk === "High" ? "Projected demand exceeds current stock plus forecasted collection. Increase camp frequency." : "Supply levels are adequate for projected demand."}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  const toneClass = useMemo(() => {
    switch (tone) {
      case "emerald": return "text-emerald-700 bg-emerald-50";
      case "blue": return "text-blue-700 bg-blue-50";
      case "violet": return "text-violet-700 bg-violet-50";
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

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { Activity, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadExcelReport } from "@/utils/excelExportHelper";
import { useDonationMis } from "../queries";
import { formatDate, formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);

export default function DonationMIS() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data, isLoading, isError, error, refetch } = useDonationMis({ fromDate: fromDate || undefined, toDate: toDate || undefined });

  const summary = data?.summary || {};
  const breakdowns = data?.breakdowns || {};
  const trends = useMemo(() => data?.trends || [], [data]);

  const donationsTrend = useMemo(
    () => trends.map((d) => ({ date: formatDate(d.date), value: number(d.count) })),
    [trends]
  );
  const siteSeries = useMemo(
    () => (breakdowns.bySite || []).map((s) => ({ name: s._id || "In-house", value: number(s.count) })),
    [breakdowns.bySite]
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Donation MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: [["Total Donations", summary.total], ...(breakdowns.bySite || []).map(s => [s._id, s.count])],
    });
    const bgData = breakdowns.byBloodGroup?.map(g => [g._id, g.count]) || [];
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [["Blood Group", "Count"]], body: bgData });
    doc.save("donation_mis.pdf");
  };

  const exportExcel = () => {
    const summaryRows = [
      ["Total Donations", summary.total],
      ...(breakdowns.bySite || []).map(s => [s._id, s.count]),
      ...(breakdowns.byType || []).map(s => [s._id, s.count]),
    ];
    const bgRows = (breakdowns.byBloodGroup || []).map(g => [g._id, g.count]);
    downloadExcelReport([
      {
        name: "Summary",
        subtitle: "Donation MIS Summary",
        headers: ["Metric", "Value"],
        rows: summaryRows,
      },
      {
        name: "Blood Groups",
        subtitle: "Donation MIS - Blood Group Breakdown",
        headers: ["Blood Group", "Count"],
        rows: bgRows,
      },
    ], "donation_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Donation MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']"><Activity className="w-6 h-6 text-white relative z-10 drop-shadow-sm" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Donation MIS</CardTitle><p className="text-gray-500 text-sm">In-house vs camp donations, trends & peaks</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" title="Collected From" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" title="Collected To" />
            {(fromDate || toDate) && <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-xs text-red-700 hover:underline">Reset</button>}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Donations" value={number(summary.total)} tone="red" />
        {(breakdowns.bySite || []).map(s => <Kpi key={s._id} label={s._id} value={number(s.count)} tone="emerald" />)}
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Daily Donation Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ value: { label: "Donations", color: "#ef4444" } }} className="h-full w-full">
                <AreaChart data={donationsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="donations-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} fill="url(#donations-fill)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Camp vs In-house (Sites)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ value: { label: "Donations", color: "#0ea5e9" } }} className="h-full w-full">
                <BarChart data={siteSeries} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Blood Group Breakdown</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Blood Group</TableHead><TableHead className="text-right">Donations</TableHead></TableRow></TableHeader>
              <TableBody>
                {(breakdowns.byBloodGroup || []).map((row) => (
                  <TableRow key={row._id}><TableCell>{row._id || "Unknown"}</TableCell><TableCell className="text-right"><Badge variant="outline">{number(row.count)}</Badge></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Gender Summary</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Gender</TableHead><TableHead className="text-right">Donations</TableHead></TableRow></TableHeader>
              <TableBody>
                {(breakdowns.byGender || []).map((row) => (
                  <TableRow key={row._id || "Unknown"}><TableCell>{row._id || "Unknown"}</TableCell><TableCell className="text-right"><Badge variant="outline">{number(row.count)}</Badge></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Voluntary vs Replacement</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead className="text-right">Donations</TableHead></TableRow></TableHeader>
              <TableBody>
                {(breakdowns.byType || []).length > 0 ? (breakdowns.byType || []).map((row) => (
                  <TableRow key={row._id}><TableCell>{row._id === "REPLACEMENT" ? "Replacement" : "Voluntary"}</TableCell><TableCell className="text-right"><Badge variant="outline">{number(row.count)}</Badge></TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center text-slate-500">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  const toneClass = useMemo(() => {
    switch (tone) {
      case "red": return "text-red-700 bg-red-50";
      case "emerald": return "text-emerald-700 bg-emerald-50";
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

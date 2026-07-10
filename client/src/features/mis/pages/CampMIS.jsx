import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Tent, RefreshCw, FileText, FileSpreadsheet, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useCampMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function CampMIS() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data, isLoading, isError, error, refetch } = useCampMis({ fromDate: fromDate || undefined, toDate: toDate || undefined });
  const camps = data || [];

  const chartData = useMemo(() => camps.slice(0, 10).map(c => ({ name: c.name, collected: number(c.totalBags), discarded: number(c.discardedBags) })), [camps]);
  const donorShareData = useMemo(() => camps.slice(0, 8).map(c => ({ name: c.name, value: number(c.donorCount) })), [camps]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Camp MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [["Camp", "Location", "Donors", "Collected", "Discarded", "Failures"]],
      body: camps.map(c => [c.name, c.address, c.donorCount, c.totalBags, c.discardedBags, c.serologyFailures]),
    });
    doc.save("camp_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(camps.map(c => ({
      "Camp Name": c.name, "Location": c.address, "Donors": c.donorCount,
      "Collected Bags": c.totalBags, "Discarded Bags": c.discardedBags, "Serology Failures": c.serologyFailures,
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Camps");
    XLSX.writeFile(wb, "camp_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Camp MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700"><Tent className="w-5 h-5" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Camp MIS</CardTitle><p className="text-gray-500 text-sm">Camp performance, collection stats, and quality metrics</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" title="Camp Start From" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" title="Camp Start To" />
            {(fromDate || toDate) && <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-xs text-red-700 hover:underline">Reset</button>}
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Camps" value={camps.length} tone="slate" />
        <Kpi label="Total Donors" value={camps.reduce((a, c) => a + (c.donorCount || 0), 0)} tone="blue" />
        <Kpi label="Total Collection" value={camps.reduce((a, c) => a + (c.totalBags || 0), 0)} tone="indigo" />
        <Kpi label="Total Discards" value={camps.reduce((a, c) => a + (c.discardedBags || 0), 0)} tone="red" />
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Camps by Collection</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ChartContainer config={{ collected: { label: "Collected", color: "#6366f1" }, discarded: { label: "Discarded", color: "#ef4444" } }} className="h-full w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="collected" fill="#6366f1" radius={[4, 4, 0, 0]} name="Collected" />
                    <Bar dataKey="discarded" fill="#ef4444" radius={[4, 4, 0, 0]} name="Discarded" />
                  </BarChart>
                </ChartContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No camp data available</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Donor Share by Camp</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {donorShareData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie data={donorShareData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {donorShareData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              ) : <div className="text-slate-400 text-sm">No data available</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Camp Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camp Name</TableHead><TableHead>Location</TableHead>
                <TableHead className="text-right">Donors</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Discarded</TableHead>
                <TableHead className="text-right">Failures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {camps.length > 0 ? camps.map((camp, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{camp.name}</TableCell>
                  <TableCell className="text-slate-500 text-xs max-w-[200px] truncate" title={camp.address}>
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{camp.address}</div>
                  </TableCell>
                  <TableCell className="text-right"><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{number(camp.donorCount)}</Badge></TableCell>
                  <TableCell className="text-right"><Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">{number(camp.totalBags)}</Badge></TableCell>
                  <TableCell className="text-right text-red-600 text-xs font-medium">{number(camp.discardedBags)}</TableCell>
                  <TableCell className="text-right text-orange-600 text-xs font-medium">{number(camp.serologyFailures)}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No camps found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  const toneClass = useMemo(() => {
    switch (tone) {
      case "blue": return "text-blue-700 bg-blue-50";
      case "indigo": return "text-indigo-700 bg-indigo-50";
      case "red": return "text-red-700 bg-red-50";
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

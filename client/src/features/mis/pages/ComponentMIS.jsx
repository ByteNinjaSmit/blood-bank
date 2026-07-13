import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Layers, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { autoFitWorkbook } from "@/utils/xlsxStyleHelper";
import { useComponentMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];

export default function ComponentMIS() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data, isLoading, isError, error, refetch } = useComponentMis({ fromDate: fromDate || undefined, toDate: toDate || undefined });

  const production = data?.production || [];
  const ageing = data?.ageing || [];
  const status = data?.status || [];
  const bloodGroup = data?.bloodGroup || [];

  const productionData = useMemo(() => production.map(p => ({ name: p._id || "Unknown", value: p.count })), [production]);
  const ageingData = useMemo(() => ageing.map(a => ({ name: a._id, value: a.count })), [ageing]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Component MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, { startY: 30, head: [["Component", "Count", "Avg Volume"]], body: production.map(p => [p._id, p.count, number(p.avgVolume).toFixed(1) + " ml"]) });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [["Age Bucket", "Count"]], body: ageing.map(a => [a._id, a.count]) });
    doc.save("component_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(production.map(p => ({ Component: p._id, Count: p.count, AvgVolume: p.avgVolume }))), "Production");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ageing.map(a => ({ AgeBucket: a._id, Count: a.count }))), "Ageing");
    autoFitWorkbook(wb);
    XLSX.writeFile(wb, "component_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Component MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']"><Layers className="w-6 h-6 text-white relative z-10 drop-shadow-sm" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Component MIS</CardTitle><p className="text-gray-500 text-sm">Production, ageing analysis, and status tracking</p></div>
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

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Production Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {productionData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie data={productionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {productionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              ) : <div className="text-slate-400 text-sm">No data available</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Ageing Analysis (Days to Expiry)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {ageingData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Units", color: "#f59e0b" } }} className="h-full w-full">
                  <BarChart data={ageingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No ageing data available</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Detailed Production Stats</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Component</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Avg Volume</TableHead></TableRow></TableHeader>
              <TableBody>
                {production.length > 0 ? production.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row._id}</TableCell>
                    <TableCell className="text-right"><Badge variant="outline">{number(row.count)}</Badge></TableCell>
                    <TableCell className="text-right text-slate-600">{number(row.avgVolume).toFixed(1)} ml</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">No production data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
              <TableBody>
                {status.length > 0 ? status.map((row, idx) => (
                  <TableRow key={idx}><TableCell className="capitalize">{row._id}</TableCell><TableCell className="text-right"><Badge variant="secondary">{number(row.count)}</Badge></TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">No status data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">In-Stock by Blood Group</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Blood Group</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
              <TableBody>
                {bloodGroup.length > 0 ? bloodGroup.map((row, idx) => (
                  <TableRow key={idx}><TableCell>{row._id}</TableCell><TableCell className="text-right"><Badge variant="outline">{number(row.count)}</Badge></TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

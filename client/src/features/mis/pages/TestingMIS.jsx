import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { FlaskConical, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useSerologyMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#ef4444", "#22c55e", "#f59e0b", "#3b82f6"];

export default function TestingMIS() {
  const { data, isLoading, isError, error, refetch } = useSerologyMis();

  const failures = data?.failures || [];
  const overall = data?.overall || [];
  const reactiveRate = data?.reactiveRate ?? 0;
  const totalTests = data?.totalTests ?? 0;

  const failureData = useMemo(() => failures.map(f => ({ name: f._id || "Unknown", value: f.count })), [failures]);
  const overallData = useMemo(() => overall.map(o => ({ name: o._id || "Unknown", value: o.count })), [overall]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Serology MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, { startY: 30, head: [["Metric", "Value"]], body: [["Total Tests", totalTests], ["Reactive Rate", reactiveRate + "%"]] });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [["Test Type", "Positive Count"]], body: failures.map(f => [f._id, f.count]) });
    doc.save("serology_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(failures.map(f => ({ Test: f._id, PositiveCount: f.count }))), "Failures");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overall.map(o => ({ Status: o._id, Count: o.count }))), "Overall");
    XLSX.writeFile(wb, "serology_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Serology MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100 text-pink-700"><FlaskConical className="w-5 h-5" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Serology MIS</CardTitle><p className="text-gray-500 text-sm">Test results, failure analysis, and quality control</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi label="Total Tests Performed" value={totalTests} />
        <Kpi label="Reactive Rate" value={reactiveRate} suffix="%" plain />
        <Kpi label="Total Reactive Cases" value={failures.reduce((a, f) => a + (f.count || 0), 0)} />
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Overall Testing Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {overallData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie data={overallData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {overallData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              ) : <div className="text-slate-400 text-sm">No data available</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">TTI Failure Analysis (Positive Cases)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {failureData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Positive Cases", color: "#ef4444" } }} className="h-full w-full">
                  <BarChart data={failureData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No positive cases recorded</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Detailed Failure Report</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Test Type</TableHead><TableHead className="text-right">Positive Count</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {failures.length > 0 ? failures.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row._id}</TableCell>
                  <TableCell className="text-right"><Badge variant="destructive">{number(row.count)}</Badge></TableCell>
                  <TableCell className="text-right text-xs text-slate-500">Discard & Notify</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">No failures recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, suffix, plain }) {
  const display = plain ? value : number(value).toLocaleString();
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-pink-700 bg-pink-50 px-3 py-1 rounded-lg w-fit"><span>{display}{suffix}</span></div>
      </CardContent>
    </Card>
  );
}

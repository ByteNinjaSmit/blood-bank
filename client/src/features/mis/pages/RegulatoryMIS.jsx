import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Scale, RefreshCw, FileText, FileSpreadsheet, CheckCircle, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { autoFitWorkbook } from "@/utils/xlsxStyleHelper";
import { useRegulatoryMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#3b82f6", "#8b5cf6"];

export default function RegulatoryMIS() {
  const { data, isLoading, isError, error, refetch } = useRegulatoryMis();

  const testing = data?.testing || {};
  const testingByDisease = data?.testingByDisease || [];
  const funnelData = useMemo(() => [
    { name: "Collection", value: number(data?.collection) },
    { name: "Production", value: number(data?.production) },
    { name: "Issued", value: number(data?.issued) },
    { name: "Discarded", value: number(data?.discarded) },
  ], [data]);
  const diseaseData = useMemo(() => testingByDisease.map(d => ({ name: d.test, value: d.count })), [testingByDisease]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Regulatory MIS Report (NACO/FDA)", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: [
        ["Total Collection", number(data?.collection)],
        ["Total Production", number(data?.production)],
        ["Units Tested", number(testing.tested)],
        ["Reactive Units", number(testing.reactive)],
        ["Reactive Rate", (testing.reactiveRate || 0) + "%"],
        ["Units Issued", number(data?.issued)],
        ["Units Discarded", number(data?.discarded)],
      ],
    });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [["Disease/Test", "Reactive Count"]], body: testingByDisease.map(d => [d.test, d.count]) });
    doc.save("regulatory_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Metric: "Total Collection", Value: number(data?.collection) },
      { Metric: "Total Production", Value: number(data?.production) },
      { Metric: "Units Tested", Value: number(testing.tested) },
      { Metric: "Reactive Units", Value: number(testing.reactive) },
      { Metric: "Reactive Rate", Value: (testing.reactiveRate || 0) + "%" },
      { Metric: "Units Issued", Value: number(data?.issued) },
      { Metric: "Units Discarded", Value: number(data?.discarded) },
    ]), "Regulatory Data");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(testingByDisease.map(d => ({ Test: d.test, ReactiveCount: d.count }))), "By Disease");
    autoFitWorkbook(wb);
    XLSX.writeFile(wb, "regulatory_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Regulatory MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']"><Scale className="w-6 h-6 text-white relative z-10 drop-shadow-sm" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Regulatory MIS</CardTitle><p className="text-gray-500 text-sm">Compliance data for NACO/FDA reporting</p></div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Collection" value={data?.collection} icon={<CheckCircle className="w-4 h-4 text-blue-600" />} />
        <KpiCard label="Total Production" value={data?.production} icon={<CheckCircle className="w-4 h-4 text-indigo-600" />} />
        <KpiCard label="Units Issued" value={data?.issued} icon={<CheckCircle className="w-4 h-4 text-green-600" />} />
        <KpiCard label="Units Discarded" value={data?.discarded} icon={<AlertTriangle className="w-4 h-4 text-red-600" />} />
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Supply Chain Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ChartContainer config={{ value: { label: "Units", color: "#3b82f6" } }} className="h-full w-full">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">TTI Reactive Cases by Disease</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px] w-full flex items-center justify-center">
              {diseaseData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie data={diseaseData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                      {diseaseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              ) : <div className="text-slate-400 text-sm">No reactive cases recorded</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Detailed Compliance Report</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Units Tested</TableCell>
                <TableCell className="text-right">{number(testing.tested)}</TableCell>
                <TableCell className="text-right"><Badge variant="outline">Completed</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Reactive Units (TTI)</TableCell>
                <TableCell className="text-right">{number(testing.reactive)}</TableCell>
                <TableCell className="text-right"><Badge variant="destructive">Alert</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Reactive Rate</TableCell>
                <TableCell className="text-right">{testing.reactiveRate}%</TableCell>
                <TableCell className="text-right"><Badge variant="secondary">Monitor</Badge></TableCell>
              </TableRow>
              {testingByDisease.map((d) => (
                <TableRow key={d.test}>
                  <TableCell className="font-medium pl-6 text-slate-600">— {d.test} Reactive</TableCell>
                  <TableCell className="text-right">{d.count}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Lookback Required</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div><p className="text-sm font-medium text-slate-500">{label}</p><h3 className="text-2xl font-bold mt-1">{number(value).toLocaleString()}</h3></div>
        <div className="p-2 bg-slate-50 rounded-full">{icon}</div>
      </CardContent>
    </Card>
  );
}

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Building2, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useIssueMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function IssueMIS() {
  const { data, isLoading, isError, error, refetch } = useIssueMis();

  const issues = data?.issues || [];
  const hospitalWise = data?.hospitalWise || [];
  const totalIssued = data?.totalIssued ?? 0;

  const statusData = useMemo(() => issues.map(i => ({ name: i._id || "Unknown", value: i.count })), [issues]);
  const hospitalData = useMemo(() => hospitalWise.map(h => ({ name: h._id || "Unknown", value: h.count })), [hospitalWise]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Hospital Issue MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, { startY: 30, head: [["Request Status", "Count"]], body: issues.map(i => [i._id, i.count]) });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [["Hospital", "Units Issued"]], body: hospitalWise.map(h => [h._id, h.count]) });
    doc.save("issue_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(issues.map(i => ({ Status: i._id, Count: i.count }))), "Status");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hospitalWise.map(h => ({ Hospital: h._id, UnitsIssued: h.count }))), "Hospitals");
    XLSX.writeFile(wb, "issue_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Issue MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700"><Building2 className="w-5 h-5" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Hospital Issue MIS</CardTitle><p className="text-gray-500 text-sm">Blood requests, issuance status, and hospital utilization</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Kpi label="Total Units Issued" value={totalIssued} />
        <Kpi label="Hospitals Served" value={hospitalWise.length} />
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Request Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {statusData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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
          <CardHeader><CardTitle className="text-sm">Top Hospitals by Issuance</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {hospitalData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Units Issued", color: "#3b82f6" } }} className="h-full w-full">
                  <BarChart data={hospitalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No issuance data available</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Detailed Request Status</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
              <TableBody>
                {issues.length > 0 ? issues.map((row, idx) => (
                  <TableRow key={idx}><TableCell className="capitalize">{row._id}</TableCell><TableCell className="text-right"><Badge variant="secondary">{number(row.count)}</Badge></TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">No requests found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Hospital Utilization</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Hospital</TableHead><TableHead className="text-right">Units Issued</TableHead></TableRow></TableHeader>
              <TableBody>
                {hospitalWise.length > 0 ? hospitalWise.map((row, idx) => (
                  <TableRow key={idx}><TableCell className="font-medium">{row._id}</TableCell><TableCell className="text-right"><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{number(row.count)}</Badge></TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">No hospital data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg w-fit"><span>{number(value).toLocaleString()}</span></div>
      </CardContent>
    </Card>
  );
}

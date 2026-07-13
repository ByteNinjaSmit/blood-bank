import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Droplet, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { autoFitWorkbook } from "@/utils/xlsxStyleHelper";
import { useBagMis } from "../queries";
import { formatDate, formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ef4444", "#64748b"];

export default function BagMIS() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data, isLoading, isError, error, refetch } = useBagMis({ fromDate: fromDate || undefined, toDate: toDate || undefined });

  const register = data?.register || {};
  const stats = data?.stats || [];
  const byComponent = data?.byComponent || [];

  const statusData = useMemo(() => stats.map(s => ({ name: s._id || "Unknown", value: s.count })), [stats]);
  const componentData = useMemo(() => byComponent.map(c => ({ name: c._id || "Unknown", value: c.count })), [byComponent]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Blood Bag MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, { startY: 30, head: [["Status", "Count"]], body: stats.map(s => [s._id, s.count]) });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Bag No", "Donor ID", "Group", "Collected", "Status"]],
      body: (register.bags || []).map(b => [b.bagNo, b.donor?.donorId || "-", b.bloodGroup || "-", formatDate(b.collectionDate), b.status]),
    });
    doc.save("blood_bag_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.map(s => ({ Status: s._id, Count: s.count }))), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((register.bags || []).map(b => ({
      BagNo: b.bagNo, DonorID: b.donor?.donorId || "-", BloodGroup: b.bloodGroup || "-",
      Component: b.componentType, CollectionDate: formatDate(b.collectionDate), Status: b.status,
    }))), "Bags");
    autoFitWorkbook(wb);
    XLSX.writeFile(wb, "blood_bag_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Blood Bag MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-700 to-red-900 rounded-xl shadow-sm"><Droplet className="w-6 h-6 text-white" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Blood Bag MIS</CardTitle><p className="text-gray-500 text-sm">Tracking collection, testing, and processing status</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" title="Collected From" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" title="Collected To" />
            {(fromDate || toDate) && <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-xs text-red-700 hover:underline">Reset</button>}
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Bags" value={stats.reduce((a, s) => a + number(s.count), 0)} />
        {byComponent.map((c) => <Kpi key={c._id} label={c._id} value={number(c.count)} />)}
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
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

        <Card>
          <CardHeader><CardTitle className="text-sm">By Component Type</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {componentData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Bags", color: "#0088FE" } }} className="h-full w-full">
                  <BarChart data={componentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Blood Bags ({(register.bags || []).length} shown)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Bag No</TableHead><TableHead>Donor ID</TableHead><TableHead>Group</TableHead><TableHead>Component</TableHead><TableHead>Collected</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {(register.bags || []).length > 0 ? (register.bags || []).map((bag) => (
                <TableRow key={bag._id}>
                  <TableCell className="font-mono text-xs">{bag.bagNo}</TableCell>
                  <TableCell className="text-xs">{bag.donor?.donorId || "-"}</TableCell>
                  <TableCell><Badge variant="outline">{bag.bloodGroup || "?"}</Badge></TableCell>
                  <TableCell className="text-xs">{bag.componentType}</TableCell>
                  <TableCell className="text-xs text-slate-500">{formatDate(bag.collectionDate)}</TableCell>
                  <TableCell><StatusBadge status={bag.status} /></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No bags found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    COLLECTED: "bg-blue-100 text-blue-700",
    IN_TESTING: "bg-amber-100 text-amber-700",
    QUARANTINE: "bg-orange-100 text-orange-700",
    RELEASED: "bg-emerald-100 text-emerald-700",
    RESERVED: "bg-violet-100 text-violet-700",
    ISSUED: "bg-slate-100 text-slate-700",
    DISCARDED: "bg-red-50 text-red-600 border-red-200",
    EXPIRED: "bg-red-50 text-red-600 border-red-200",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function Kpi({ label, value }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-lg w-fit"><span>{number(value).toLocaleString()}</span></div>
      </CardContent>
    </Card>
  );
}

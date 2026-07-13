import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Trash2, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { autoFitWorkbook } from "@/utils/xlsxStyleHelper";
import { useDiscardMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#06b6d4", "#6366f1"];

export default function DiscardMIS() {
  const { data, isLoading, isError, error, refetch } = useDiscardMis();

  const discards = data?.discards || [];
  const typeWise = data?.typeWise || [];
  const totalDiscards = discards.reduce((a, d) => a + (d.count || 0), 0);

  const reasonData = useMemo(() => discards.map(d => ({ name: d._id || "Unknown", value: d.count })), [discards]);
  const typeData = useMemo(() => typeWise.map(t => ({ name: t._id || "Unknown", value: t.count })), [typeWise]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Discard MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, { startY: 30, head: [["Reason", "Count"]], body: discards.map(d => [d._id, d.count]) });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [["Type", "Count"]], body: typeWise.map(t => [t._id, t.count]) });
    doc.save("discard_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(discards.map(d => ({ Reason: d._id, Count: d.count }))), "Reasons");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(typeWise.map(t => ({ Type: t._id, Count: t.count }))), "Types");
    autoFitWorkbook(wb);
    XLSX.writeFile(wb, "discard_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Discard MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']"><Trash2 className="w-6 h-6 text-white relative z-10 drop-shadow-sm" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Discard MIS</CardTitle><p className="text-gray-500 text-sm">Waste management, discard reasons, and type analysis</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Kpi label="Total Discarded Units" value={totalDiscards} />
        <Kpi label="Distinct Reasons" value={discards.length} />
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Discard by Component Type</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {typeData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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
          <CardHeader><CardTitle className="text-sm">Discard Reasons</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {reasonData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Discards", color: "#ef4444" } }} className="h-full w-full">
                  <BarChart data={reasonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No discard data available</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Detailed Discard Report</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Reason</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
            <TableBody>
              {discards.length > 0 ? discards.map((row, idx) => (
                <TableRow key={idx}><TableCell className="font-medium">{row._id}</TableCell><TableCell className="text-right"><Badge variant="destructive">{number(row.count)}</Badge></TableCell></TableRow>
              )) : <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">No discards found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
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

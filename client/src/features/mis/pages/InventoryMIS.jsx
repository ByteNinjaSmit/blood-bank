import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Package, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { autoFitWorkbook } from "@/utils/xlsxStyleHelper";
import { useInventoryMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);

export default function InventoryMIS() {
  const { data, isLoading, isError, error, refetch } = useInventoryMis();
  const data_ = Array.isArray(data) ? data : [];
  const nearExpiry = data_[0]?.nearExpiryContext ?? 0;

  const summary = useMemo(() => {
    let total = 0;
    const byType = {};
    const byGroup = {};
    data_.forEach(item => {
      const count = Number(item.count) || 0;
      total += count;
      const type = item._id.type;
      byType[type] = (byType[type] || 0) + count;
      const group = `${item._id.group}${item._id.rh}`;
      byGroup[group] = (byGroup[group] || 0) + count;
    });
    return { total, byType, byGroup };
  }, [data_]);

  const chartData = useMemo(() => Object.entries(summary.byGroup).map(([name, value]) => ({ name, value })), [summary]);
  const typeChartData = useMemo(() => Object.entries(summary.byType).map(([name, value]) => ({ name, value })), [summary]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventory MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: [["Total Units In Stock", summary.total], ["Near Expiry (<=3 days)", nearExpiry], ...Object.entries(summary.byType).map(([k, v]) => [`Total ${k}`, v])],
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Blood Group", "Rh", "Component", "Count"]],
      body: data_.map(item => [item._id.group, item._id.rh, item._id.type, item.count]),
    });
    doc.save("inventory_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Metric: "Total Units", Value: summary.total },
      { Metric: "Near Expiry (<=3 days)", Value: nearExpiry },
      ...Object.entries(summary.byType).map(([k, v]) => ({ Metric: k, Value: v })),
    ]), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data_.map(item => ({
      BloodGroup: item._id.group, Rh: item._id.rh, Component: item._id.type, Count: item.count,
    }))), "Details");
    autoFitWorkbook(wb);
    XLSX.writeFile(wb, "inventory_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Inventory MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-700 to-red-900 rounded-xl shadow-sm"><Package className="w-6 h-6 text-white" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Inventory MIS</CardTitle><p className="text-gray-500 text-sm">Current stock levels by blood group and component</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Units In Stock" value={summary.total} tone="amber" />
        <Kpi label="Near Expiry (<=3 days)" value={nearExpiry} tone="red" />
        {Object.entries(summary.byType).map(([type, count]) => <Kpi key={type} label={type} value={count} tone="violet" />)}
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Stock by Blood Group</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ value: { label: "Units", color: "#f59e0b" } }} className="h-full w-full">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Stock by Component Type</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ value: { label: "Units", color: "#8b5cf6" } }} className="h-full w-full">
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Detailed Stock Report</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Blood Group</TableHead><TableHead>Rh Factor</TableHead><TableHead>Component Type</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
            <TableBody>
              {data_.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row._id.group}</TableCell>
                  <TableCell>{row._id.rh}</TableCell>
                  <TableCell>{row._id.type}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline" className="bg-slate-50">{number(row.count)}</Badge></TableCell>
                </TableRow>
              ))}
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
      case "amber": return "text-amber-800 bg-amber-50";
      case "red": return "text-red-700 bg-red-50";
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

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Package, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);

export default function InventoryMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/api/mis/inventory`, {
        withCredentials: true,
      });
      setData(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Inventory MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  // Process data for charts and tables
  const summary = useMemo(() => {
    let total = 0;
    const byType = {};
    const byGroup = {};

    data.forEach(item => {
      total += item.count;

      const type = item._id.type;
      byType[type] = (byType[type] || 0) + item.count;

      const group = `${item._id.group} ${item._id.rh}`;
      byGroup[group] = (byGroup[group] || 0) + item.count;
    });

    return { total, byType, byGroup };
  }, [data]);

  const chartData = useMemo(() => {
    return Object.entries(summary.byGroup).map(([name, value]) => ({ name, value }));
  }, [summary]);

  const typeChartData = useMemo(() => {
    return Object.entries(summary.byType).map(([name, value]) => ({ name, value }));
  }, [summary]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventory MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const summaryData = [
      ["Total Units In Stock", summary.total],
      ...Object.entries(summary.byType).map(([k, v]) => [`Total ${k}`, v])
    ];

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: summaryData,
    });

    const tableData = data.map(item => [
      item._id.group,
      item._id.rh,
      item._id.type,
      item.count
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Blood Group", "Rh", "Component", "Count"]],
      body: tableData,
    });

    doc.save("inventory_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      { Metric: "Total Units", Value: summary.total },
      ...Object.entries(summary.byType).map(([k, v]) => ({ Metric: k, Value: v }))
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const detailRows = data.map(item => ({
      BloodGroup: item._id.group,
      Rh: item._id.rh,
      Component: item._id.type,
      Count: item.count
    }));
    const wsDetails = XLSX.utils.json_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(wb, wsDetails, "Details");

    XLSX.writeFile(wb, "inventory_mis.xlsx");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-600">
            Error: {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Inventory MIS</CardTitle>
              <p className="text-sm text-slate-600">Current stock levels by blood group and component</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="w-4 h-4 mr-2 text-red-600" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
              Excel
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Units In Stock" value={summary.total} />
        {Object.entries(summary.byType).map(([type, count]) => (
          <Kpi key={type} label={type} value={count} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Stock by Blood Group</CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle className="text-sm">Stock by Component Type</CardTitle>
          </CardHeader>
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
        <CardHeader>
          <CardTitle className="text-sm">Detailed Stock Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood Group</TableHead>
                <TableHead>Rh Factor</TableHead>
                <TableHead>Component Type</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row._id.group}</TableCell>
                  <TableCell>{row._id.rh}</TableCell>
                  <TableCell>{row._id.type}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-slate-50">{number(row.count)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
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
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg w-fit">
          <span>{number(value).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

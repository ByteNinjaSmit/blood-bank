import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale, RefreshCw, FileText, FileSpreadsheet, CheckCircle, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);

export default function RegulatoryMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/api/mis/regulatory`, {
        withCredentials: true,
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Regulatory MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Regulatory MIS Report (NACO/FDA)", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const kpiData = [
      ["Total Collection", number(data?.collection)],
      ["Total Production", number(data?.production)],
      ["Units Tested", number(data?.testing?.tested)],
      ["Reactive Units", number(data?.testing?.reactive)],
      ["Reactive Rate", (data?.testing?.reactiveRate || 0) + "%"],
      ["Units Issued", number(data?.issued)],
      ["Units Discarded", number(data?.discarded)]
    ];

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: kpiData,
    });

    doc.save("regulatory_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const kpiData = [
      { Metric: "Total Collection", Value: number(data?.collection) },
      { Metric: "Total Production", Value: number(data?.production) },
      { Metric: "Units Tested", Value: number(data?.testing?.tested) },
      { Metric: "Reactive Units", Value: number(data?.testing?.reactive) },
      { Metric: "Reactive Rate", Value: (data?.testing?.reactiveRate || 0) + "%" },
      { Metric: "Units Issued", Value: number(data?.issued) },
      { Metric: "Units Discarded", Value: number(data?.discarded) }
    ];

    const ws = XLSX.utils.json_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, ws, "Regulatory Data");
    XLSX.writeFile(wb, "regulatory_mis.xlsx");
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
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Regulatory MIS</CardTitle>
              <p className="text-sm text-slate-600">Compliance data for NACO/FDA reporting</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Collection" value={data?.collection} icon={<CheckCircle className="w-4 h-4 text-blue-600" />} />
        <KpiCard label="Total Production" value={data?.production} icon={<CheckCircle className="w-4 h-4 text-indigo-600" />} />
        <KpiCard label="Units Issued" value={data?.issued} icon={<CheckCircle className="w-4 h-4 text-green-600" />} />
        <KpiCard label="Units Discarded" value={data?.discarded} icon={<AlertTriangle className="w-4 h-4 text-red-600" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detailed Compliance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Units Tested</TableCell>
                <TableCell className="text-right">{number(data?.testing?.tested)}</TableCell>
                <TableCell className="text-right"><Badge variant="outline">Completed</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Reactive Units (TTI)</TableCell>
                <TableCell className="text-right">{number(data?.testing?.reactive)}</TableCell>
                <TableCell className="text-right"><Badge variant="destructive">Alert</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Reactive Rate</TableCell>
                <TableCell className="text-right">{data?.testing?.reactiveRate}%</TableCell>
                <TableCell className="text-right"><Badge variant="secondary">Monitor</Badge></TableCell>
              </TableRow>
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
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="text-2xl font-bold mt-1">{number(value).toLocaleString()}</h3>
        </div>
        <div className="p-2 bg-slate-50 rounded-full">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

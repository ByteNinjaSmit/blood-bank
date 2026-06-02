import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Trash2, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#06b6d4", "#6366f1"];

export default function DiscardMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/api/mis/discards`, {
        withCredentials: true,
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Discard MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  const discards = data?.discards || [];
  const typeWise = data?.typeWise || [];

  const reasonData = useMemo(() => discards.map(d => ({ name: d._id || "Unknown", value: d.count })), [discards]);
  const typeData = useMemo(() => typeWise.map(t => ({ name: t._id || "Unknown", value: t.count })), [typeWise]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Discard MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const reasonTable = discards.map(d => [d._id, d.count]);
    autoTable(doc, {
      startY: 30,
      head: [["Reason", "Count"]],
      body: reasonTable,
    });

    const typeTable = typeWise.map(t => [t._id, t.count]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Type", "Count"]],
      body: typeTable,
    });

    doc.save("discard_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const reasonData = discards.map(d => ({ Reason: d._id, Count: d.count }));
    const wsReason = XLSX.utils.json_to_sheet(reasonData);
    XLSX.utils.book_append_sheet(wb, wsReason, "Reasons");

    const typeData = typeWise.map(t => ({ Type: t._id, Count: t.count }));
    const wsType = XLSX.utils.json_to_sheet(typeData);
    XLSX.utils.book_append_sheet(wb, wsType, "Types");

    XLSX.writeFile(wb, "discard_mis.xlsx");
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
            <div className="p-2 rounded-lg bg-red-100 text-red-700">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Discard MIS</CardTitle>
              <p className="text-sm text-slate-600">Waste management, discard reasons, and type analysis</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Discard by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {typeData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="text-slate-400 text-sm">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Discard Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {reasonData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Discards", color: "#ef4444" } }} className="h-full w-full">
                  <BarChart data={reasonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No discard data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detailed Discard Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discards.length > 0 ? (
                  discards.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row._id}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{number(row.count)}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">
                        High Priority
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      No discards found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

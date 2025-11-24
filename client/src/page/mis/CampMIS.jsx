import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Tent, RefreshCw, FileText, FileSpreadsheet, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);

export default function CampMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/api/mis/camps`, {
        withCredentials: true,
      });
      setData(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Camp MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  // Process data for charts
  const chartData = useMemo(() => {
    return data.slice(0, 10).map(camp => ({
      name: camp.name,
      collected: number(camp.totalBags),
      discarded: number(camp.discardedBags)
    }));
  }, [data]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Camp MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = data.map(camp => [
      camp.name,
      camp.address,
      new Date(camp.dateFrom).toLocaleDateString(),
      camp.totalBags,
      camp.discardedBags,
      camp.serologyFailures
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Camp Name", "Location", "Date", "Collected", "Discarded", "Failures"]],
      body: tableData,
    });

    doc.save("camp_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const wsData = data.map(camp => ({
      "Camp Name": camp.name,
      "Location": camp.address,
      "Date From": new Date(camp.dateFrom).toLocaleDateString(),
      "Date To": new Date(camp.dateTo).toLocaleDateString(),
      "Collected Bags": camp.totalBags,
      "Discarded Bags": camp.discardedBags,
      "Serology Failures": camp.serologyFailures
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Camps");
    XLSX.writeFile(wb, "camp_mis.xlsx");
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
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Tent className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Camp MIS</CardTitle>
              <p className="text-sm text-slate-600">Camp performance, collection stats, and quality metrics</p>
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Top Camps by Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ChartContainer config={{
                  collected: { label: "Collected", color: "#6366f1" },
                  discarded: { label: "Discarded", color: "#ef4444" }
                }} className="h-full w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="collected" fill="#6366f1" radius={[4, 4, 0, 0]} name="Collected" />
                    <Bar dataKey="discarded" fill="#ef4444" radius={[4, 4, 0, 0]} name="Discarded" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No camp data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Summary Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Total Camps</span>
              <span className="text-xl font-semibold text-slate-900">{data.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm text-indigo-700">Total Collection</span>
              <span className="text-xl font-semibold text-indigo-900">
                {number(data.reduce((acc, curr) => acc + (curr.totalBags || 0), 0)).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-red-700">Total Discards</span>
              <span className="text-xl font-semibold text-red-900">
                {number(data.reduce((acc, curr) => acc + (curr.discardedBags || 0), 0)).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Camp Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camp Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Discarded</TableHead>
                <TableHead className="text-right">Failures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((camp, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{camp.name}</TableCell>
                    <TableCell className="text-slate-500 text-xs max-w-[200px] truncate" title={camp.address}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {camp.address}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(camp.dateFrom).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {number(camp.totalBags)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-red-600 text-xs font-medium">
                      {number(camp.discardedBags)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 text-xs font-medium">
                      {number(camp.serologyFailures)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No camps found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

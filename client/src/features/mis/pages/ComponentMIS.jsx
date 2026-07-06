import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Layers, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];

export default function ComponentMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/api/mis/components`, {
        params: { fromDate: fromDate || undefined, toDate: toDate || undefined },
        withCredentials: true,
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Component MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, fromDate, toDate]);

  const production = data?.production || [];
  const ageing = data?.ageing || [];
  const status = data?.status || [];

  const productionData = useMemo(() => production.map(p => ({ name: p._id || "Unknown", value: p.count })), [production]);
  const ageingData = useMemo(() => ageing.map(a => ({ name: `${a._id} days`, value: a.count })), [ageing]);
  const statusData = useMemo(() => status.map(s => ({ name: s._id || "Unknown", value: s.count })), [status]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Component MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const prodData = production.map(p => [p._id, p.count, number(p.avgVolume).toFixed(1) + " ml"]);
    autoTable(doc, {
      startY: 30,
      head: [["Component", "Count", "Avg Volume"]],
      body: prodData,
    });

    const ageData = ageing.map(a => [`${a._id} days`, a.count]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Age Bucket", "Count"]],
      body: ageData,
    });

    doc.save("component_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const prodData = production.map(p => ({ Component: p._id, Count: p.count, AvgVolume: p.avgVolume }));
    const wsProd = XLSX.utils.json_to_sheet(prodData);
    XLSX.utils.book_append_sheet(wb, wsProd, "Production");

    const ageData = ageing.map(a => ({ AgeBucket: `${a._id} days`, Count: a.count }));
    const wsAge = XLSX.utils.json_to_sheet(ageData);
    XLSX.utils.book_append_sheet(wb, wsAge, "Ageing");

    XLSX.writeFile(wb, "component_mis.xlsx");
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
            <div className="p-2 rounded-lg bg-violet-100 text-violet-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Component MIS</CardTitle>
              <p className="text-sm text-slate-600">Production, ageing analysis, and status tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1.5 border rounded-md text-sm" title="Collected From" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1.5 border rounded-md text-sm" title="Collected To" />
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-xs text-red-700 hover:underline">Reset</button>
            )}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Production Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {productionData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie
                      data={productionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productionData.map((entry, index) => (
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
            <CardTitle className="text-sm">Ageing Analysis (Days in Stock)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {ageingData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Units", color: "#f59e0b" } }} className="h-full w-full">
                  <BarChart data={ageingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No ageing data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detailed Production Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Avg Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {production.length > 0 ? (
                  production.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row._id}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{number(row.count)}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {number(row.avgVolume).toFixed(1)} ml
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      No production data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.length > 0 ? (
                  status.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="capitalize">{row._id}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{number(row.count)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-slate-500">
                      No status data
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

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Droplet, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ef4444", "#64748b"];

export default function BagMIS() {
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
      const res = await axios.get(`${API}/api/mis/bags`, {
        params: { fromDate: fromDate || undefined, toDate: toDate || undefined },
        withCredentials: true,
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Blood Bag MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, fromDate, toDate]);

  const register = data?.register || {};
  const stats = data?.stats || [];

  const statusData = useMemo(() => stats.map(s => ({ name: s._id || "Unknown", value: s.count })), [stats]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Blood Bag MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const summaryData = stats.map(s => [s._id, s.count]);
    autoTable(doc, {
      startY: 30,
      head: [["Status", "Count"]],
      body: summaryData,
    });

    const bagRows = (register.bags || []).map(b => [
      b.bagNo,
      b.donor?.donorId || "-",
      b.bloodGroup || "-",
      new Date(b.collectionDate).toLocaleDateString(),
      b.status
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Bag No", "Donor ID", "Group", "Collected", "Status"]],
      body: bagRows,
    });

    doc.save("blood_bag_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = stats.map(s => ({ Status: s._id, Count: s.count }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const bagData = (register.bags || []).map(b => ({
      BagNo: b.bagNo,
      DonorID: b.donor?.donorId || "-",
      BloodGroup: b.bloodGroup || "-",
      CollectionDate: new Date(b.collectionDate).toLocaleDateString(),
      Status: b.status,
      Site: b.siteId?.name || "In-house"
    }));
    const wsBags = XLSX.utils.json_to_sheet(bagData);
    XLSX.utils.book_append_sheet(wb, wsBags, "Bags");

    XLSX.writeFile(wb, "blood_bag_mis.xlsx");
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
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Blood Bag MIS</CardTitle>
              <p className="text-sm text-slate-600">Tracking collection, testing, and processing status</p>
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
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {statusData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
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
            <CardTitle className="text-sm">Recent Blood Bags</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag No</TableHead>
                  <TableHead>Donor ID</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(register.bags || []).length > 0 ? (
                  (register.bags || []).map((bag) => (
                    <TableRow key={bag._id}>
                      <TableCell className="font-mono text-xs">{bag.bagNo}</TableCell>
                      <TableCell className="text-xs">{bag.donor?.donorId || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{bag.bloodGroup || "?"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(bag.collectionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={bag.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No bags found
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

function StatusBadge({ status }) {
  const styles = {
    collected: "bg-blue-100 text-blue-700",
    "component-separated": "bg-indigo-100 text-indigo-700",
    testing: "bg-amber-100 text-amber-700",
    passed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    issued: "bg-slate-100 text-slate-700",
    discarded: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Filter, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function DonorMIS() {
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
      const res = await axios.get(`${API}/api/mis/donors`, {
        params: { fromDate: fromDate || undefined, toDate: toDate || undefined },
        withCredentials: true,
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Donor MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, fromDate, toDate]);

  const stats = data?.stats || {};
  const behavior = data?.behavior || {};
  const register = data?.register || {};

  // Charts Data
  const genderData = useMemo(() => (stats.gender || []).map(g => ({ name: g._id || "Unknown", value: g.count })), [stats.gender]);
  const bgData = useMemo(() => (stats.bloodGroup || []).map(g => ({ name: g._id || "Unknown", value: g.count })), [stats.bloodGroup]);
  const ageData = useMemo(() => (stats.age || []).map(g => ({ name: g._id || "Unknown", value: g.count })), [stats.age]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Donor MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const kpiData = [
      ["Total Donors", stats.total],
      ["New This Month", stats.newThisMonth],
      ["Active Donors", stats.active],
      ["Repeat Rate", behavior.repeatPercentage + "%"]
    ];

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: kpiData,
    });

    const donorRows = (register.donors || []).map(d => [
      d.donorId,
      `${d.name.firstName} ${d.name.lastName}`,
      d.bloodGroup,
      d.sex,
      d.address?.city || ""
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["ID", "Name", "Group", "Sex", "City"]],
      body: donorRows,
    });

    doc.save("donor_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = [
      { Metric: "Total Donors", Value: stats.total },
      { Metric: "New This Month", Value: stats.newThisMonth },
      { Metric: "Active Donors", Value: stats.active },
      { Metric: "Repeat Rate", Value: behavior.repeatPercentage + "%" }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const donorData = (register.donors || []).map(d => ({
      ID: d.donorId,
      Name: `${d.name.firstName} ${d.name.lastName}`,
      BloodGroup: d.bloodGroup,
      Sex: d.sex,
      City: d.address?.city || "",
      Phone: d.phone
    }));
    const wsDonors = XLSX.utils.json_to_sheet(donorData);
    XLSX.utils.book_append_sheet(wb, wsDonors, "Donors");

    XLSX.writeFile(wb, "donor_mis.xlsx");
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
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Donor MIS</CardTitle>
              <p className="text-sm text-slate-600">Demographics, registration stats, and behavior</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1.5 border rounded-md text-sm" title="Registered From" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1.5 border rounded-md text-sm" title="Registered To" />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Donors" value={number(stats.total)} tone="blue" />
        <Kpi label="New This Month" value={number(stats.newThisMonth)} tone="emerald" />
        <Kpi label="Active Donors" value={number(stats.active)} tone="violet" />
        <Kpi label="Repeat Rate" value={behavior.repeatPercentage} suffix="%" tone="amber" plain />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {genderData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
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
            <CardTitle className="text-sm">Blood Group Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {bgData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Donors", color: "#ef4444" } }} className="h-full w-full">
                  <BarChart data={bgData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Donors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats.city || []).length > 0 ? (
                  (stats.city || []).map((row) => (
                    <TableRow key={row._id || "Unknown"}>
                      <TableCell>{row._id || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{number(row.count)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500">No data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {ageData.length > 0 ? (
                <ChartContainer config={{ value: { label: "Donors", color: "#8884d8" } }} className="h-full w-full">
                  <BarChart data={ageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Donors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Last Donation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(register.donors || []).length > 0 ? (
                (register.donors || []).slice(0, 10).map((donor) => (
                  <TableRow key={donor._id}>
                    <TableCell className="font-mono text-xs">{donor.donorId}</TableCell>
                    <TableCell className="font-medium">{donor.name?.firstName} {donor.name?.lastName}</TableCell>
                    <TableCell>
                      <Badge variant={donor.bloodGroup === "AB" ? "default" : "secondary"}>
                        {donor.bloodGroup} {donor.rh}
                      </Badge>
                    </TableCell>
                    <TableCell>{donor.sex}</TableCell>
                    <TableCell>{donor.address?.city}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "Never"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No donors found
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

function Kpi({ label, value, tone, plain, suffix }) {
  const toneClass = useMemo(() => {
    switch (tone) {
      case "blue": return "text-blue-700 bg-blue-50";
      case "emerald": return "text-emerald-700 bg-emerald-50";
      case "violet": return "text-violet-700 bg-violet-50";
      case "amber": return "text-amber-700 bg-amber-50";
      default: return "text-slate-700 bg-slate-50";
    }
  }, [tone]);

  const display = plain ? value : number(value).toLocaleString();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`inline-flex items-baseline gap-1 text-xl font-semibold ${toneClass} px-3 py-1 rounded-lg w-fit`}>
          <span>{display}{suffix}</span>
        </div>
      </CardContent>
    </Card>
  );
}

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useDonorMis } from "../queries";
import { formatDate, formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function DonorMIS() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data, isLoading, isError, error, refetch } = useDonorMis({ fromDate: fromDate || undefined, toDate: toDate || undefined });

  const stats = data?.stats || {};
  const behavior = data?.behavior || {};
  const register = data?.register || {};

  const genderData = useMemo(() => (stats.gender || []).map(g => ({ name: g._id || "Unknown", value: g.count })), [stats.gender]);
  const bgData = useMemo(() => (stats.bloodGroup || []).map(g => ({ name: g._id || "Unknown", value: g.count })), [stats.bloodGroup]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Donor MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: [
        ["Total Donors", stats.total],
        ["New This Month", stats.newThisMonth],
        ["Active Donors (last 90d)", stats.active],
        ["Repeat Donors", behavior.repeatDonors],
        ["Repeat Rate", behavior.repeatPercentage + "%"],
      ],
    });

    const donorRows = (register.donors || []).map(d => [
      d.donorId,
      `${d.name?.firstName || ""} ${d.name?.lastName || ""}`.trim(),
      d.bloodGroup,
      d.sex,
      d.address?.city || ""
    ]);
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [["ID", "Name", "Group", "Sex", "City"]], body: donorRows });
    doc.save("donor_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet([
      { Metric: "Total Donors", Value: stats.total },
      { Metric: "New This Month", Value: stats.newThisMonth },
      { Metric: "Active Donors (last 90d)", Value: stats.active },
      { Metric: "Repeat Donors", Value: behavior.repeatDonors },
      { Metric: "Repeat Rate", Value: behavior.repeatPercentage + "%" },
    ]);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const wsDonors = XLSX.utils.json_to_sheet((register.donors || []).map(d => ({
      ID: d.donorId,
      Name: `${d.name?.firstName || ""} ${d.name?.lastName || ""}`.trim(),
      BloodGroup: d.bloodGroup,
      Rh: d.rh,
      Sex: d.sex,
      City: d.address?.city || "",
      Phone: d.phone,
      LastDonation: d.lastDonationDate ? formatDate(d.lastDonationDate) : "",
    })));
    XLSX.utils.book_append_sheet(wb, wsDonors, "Donors");
    XLSX.writeFile(wb, "donor_mis.xlsx");
  };

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }
  if (isError) {
    return (
      <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
        Error: {error?.message || "Failed to load Donor MIS"}
        <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
      </CardContent></Card></div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700"><Users className="w-5 h-5" /></div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Donor MIS</CardTitle>
              <p className="text-gray-500 text-sm">Demographics, registration stats, and behavior</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" title="Registered From" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm" title="Registered To" />
            {(fromDate || toDate) && <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-xs text-red-700 hover:underline">Reset</button>}
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Total Donors" value={number(stats.total)} tone="blue" />
        <Kpi label="New This Month" value={number(stats.newThisMonth)} tone="emerald" />
        <Kpi label="Active (last 90d)" value={number(stats.active)} tone="violet" />
        <Kpi label="Repeat Donors" value={number(behavior.repeatDonors)} tone="amber" />
        <Kpi label="Repeat Rate" value={behavior.repeatPercentage} suffix="%" tone="rose" plain />
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Gender Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {genderData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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
          <CardHeader><CardTitle className="text-sm">Blood Group Distribution</CardTitle></CardHeader>
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
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional data as tables, not charts, to keep exactly 2 graphs on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Rh Factor</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Rh</TableHead><TableHead className="text-right">Donors</TableHead></TableRow></TableHeader>
              <TableBody>
                {(stats.rh || []).map((row) => (
                  <TableRow key={row._id || "Unknown"}>
                    <TableCell>{row._id === "POSITIVE" ? "Positive" : row._id === "NEGATIVE" ? "Negative" : "Unknown"}</TableCell>
                    <TableCell className="text-right"><Badge variant="outline">{number(row.count)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Age Distribution</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Age Group</TableHead><TableHead className="text-right">Donors</TableHead></TableRow></TableHeader>
              <TableBody>
                {(stats.age || []).length > 0 ? (stats.age || []).map((row) => (
                  <TableRow key={row._id}><TableCell>{row._id}</TableCell><TableCell className="text-right"><Badge variant="outline">{number(row.count)}</Badge></TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center text-slate-500">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top Cities</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>City</TableHead><TableHead className="text-right">Donors</TableHead></TableRow></TableHeader>
              <TableBody>
                {(stats.city || []).length > 0 ? (stats.city || []).map((row) => (
                  <TableRow key={row._id || "Unknown"}><TableCell>{row._id || "Unknown"}</TableCell><TableCell className="text-right"><Badge variant="outline">{number(row.count)}</Badge></TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center text-slate-500">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Top States</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(stats.state || []).length > 0 ? (stats.state || []).map((row) => (
              <Badge key={row._id || "Unknown"} variant="secondary" className="text-xs">{row._id || "Unknown"}: {number(row.count)}</Badge>
            )) : <span className="text-sm text-slate-500">No data</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Donors ({register.donors?.length || 0} shown)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Blood Group</TableHead>
                <TableHead>Gender</TableHead><TableHead>City</TableHead><TableHead>Phone</TableHead><TableHead>Last Donation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(register.donors || []).length > 0 ? (register.donors || []).map((donor) => (
                <TableRow key={donor._id || donor.donorId}>
                  <TableCell className="font-mono text-xs">{donor.donorId}</TableCell>
                  <TableCell className="font-medium">{donor.name?.firstName} {donor.name?.lastName}</TableCell>
                  <TableCell><Badge variant="secondary">{donor.bloodGroup} {donor.rh === "POSITIVE" ? "+" : donor.rh === "NEGATIVE" ? "-" : ""}</Badge></TableCell>
                  <TableCell>{donor.sex}</TableCell>
                  <TableCell>{donor.address?.city}</TableCell>
                  <TableCell className="text-xs">{donor.phone}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{donor.lastDonationDate ? formatDate(donor.lastDonationDate) : "Never"}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No donors found</TableCell></TableRow>}
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
      case "rose": return "text-rose-700 bg-rose-50";
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

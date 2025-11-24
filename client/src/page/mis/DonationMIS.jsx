import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { Activity, Filter, Calendar as CalendarIcon, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);

export default function DonationMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/api/mis/donations`, {
        withCredentials: true,
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Donation MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  const summary = data?.summary || {};
  const breakdowns = data?.breakdowns || {};
  const trends = data?.trends || [];

  const donationsTrend = useMemo(
    () => (trends || []).map((d) => ({ date: new Date(d.date).toLocaleDateString(), value: number(d.count) })),
    [trends]
  );

  const bgSeries = useMemo(
    () =>
      (breakdowns.byBloodGroup || []).map((g) => ({
        name: g._id || "Unknown",
        value: number(g.count),
      })),
    [breakdowns.byBloodGroup]
  );

  const siteSeries = useMemo(
    () =>
      (breakdowns.bySite || []).map((s) => ({
        name: s._id || "In-house",
        value: number(s.count),
      })),
    [breakdowns.bySite]
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Donation MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const summaryData = [
      ["Total Donations", summary.total],
      ...Object.entries(breakdowns.bySite || []).map(s => [s._id, s.count])
    ];

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: summaryData,
    });

    const bgData = breakdowns.byBloodGroup?.map(g => [g._id, g.count]) || [];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Blood Group", "Count"]],
      body: bgData,
    });

    doc.save("donation_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      { Metric: "Total Donations", Value: summary.total },
      ...(breakdowns.bySite || []).map(s => ({ Metric: s._id, Value: s.count }))
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const bgRows = breakdowns.byBloodGroup?.map(g => ({ BloodGroup: g._id, Count: g.count })) || [];
    const wsBG = XLSX.utils.json_to_sheet(bgRows);
    XLSX.utils.book_append_sheet(wb, wsBG, "Blood Groups");

    XLSX.writeFile(wb, "donation_mis.xlsx");
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
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Donation MIS</CardTitle>
              <p className="text-sm text-slate-600">In-house vs camp donations, trends & peaks</p>
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
        <Kpi label="Total Donations" value={number(summary.total)} tone="red" />
        {(breakdowns.bySite || []).map(s => (
          <Kpi key={s._id} label={s._id} value={number(s.count)} tone="emerald" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Donation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ value: { label: "Donations", color: "#ef4444" } }} className="h-full w-full">
                <AreaChart data={donationsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="donations-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    fill="url(#donations-fill)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Camp vs In-house (Sites)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ value: { label: "Donations", color: "#0ea5e9" } }} className="h-full w-full">
                <BarChart data={siteSeries} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Blood Group Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Blood Group</TableHead>
                  <TableHead className="text-right">Donations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdowns.byBloodGroup || []).map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{row._id || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{number(row.count)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gender Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right">Donations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdowns.byGender || []).map((row) => (
                  <TableRow key={row._id || "Unknown"}>
                    <TableCell>{row._id || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{number(row.count)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  const toneClass = useMemo(() => {
    switch (tone) {
      case "red":
        return "text-red-700 bg-red-50";
      case "emerald":
        return "text-emerald-700 bg-emerald-50";
      case "indigo":
        return "text-indigo-700 bg-indigo-50";
      case "amber":
        return "text-amber-700 bg-amber-50";
      case "sky":
        return "text-sky-700 bg-sky-50";
      default:
        return "text-slate-700 bg-slate-50";
    }
  }, [tone]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`inline-flex items-baseline gap-1 text-xl font-semibold ${toneClass} px-3 py-1 rounded-lg w-fit`}>
          <span>{number(value).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

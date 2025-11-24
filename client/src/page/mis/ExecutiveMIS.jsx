import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { BarChart3, Filter, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);

export default function ExecutiveMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [preset, setPreset] = useState("30d");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (preset === "all") {
        params.period = "all";
      } else if (["7d", "30d"].includes(preset)) {
        params.period = preset;
      } else {
        params.period = "30d";
      }
      const res = await axios.get(`${API}/api/mis/executive`, {
        params,
        withCredentials: true,
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Executive MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API, preset]);

  const kpis = data?.kpis || {};
  const ratios = data?.ratios || {};
  const trends = data?.trends || [];

  const donationsTrend = useMemo(
    () => (trends || []).map((d) => ({ date: d.date, value: number(d.value) })),
    [trends]
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Executive MIS Dashboard", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const kpiData = [
      ["Donations Today", kpis.donationsToday],
      ["Donations Month", kpis.donationsMonth],
      ["Issued Month", kpis.issuedMonth],
      ["Stock", kpis.stock],
      ["Camps Month", kpis.campsMonth],
      ["Discards Month", kpis.discardsMonth]
    ];

    autoTable(doc, {
      startY: 30,
      head: [["KPI", "Value"]],
      body: kpiData,
    });

    const ratioData = [
      ["Issue per Donation", ratios.issuePerDonation],
      ["Discard Rate", ratios.discardRate + "%"]
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Ratio", "Value"]],
      body: ratioData,
    });

    doc.save("executive_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = [
      { Metric: "Donations Today", Value: kpis.donationsToday },
      { Metric: "Donations Month", Value: kpis.donationsMonth },
      { Metric: "Issued Month", Value: kpis.issuedMonth },
      { Metric: "Stock", Value: kpis.stock },
      { Metric: "Camps Month", Value: kpis.campsMonth },
      { Metric: "Discards Month", Value: kpis.discardsMonth },
      { Metric: "Issue per Donation", Value: ratios.issuePerDonation },
      { Metric: "Discard Rate", Value: ratios.discardRate + "%" },
    ];

    const ws = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, "Executive Summary");
    XLSX.writeFile(wb, "executive_mis.xlsx");
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
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Executive Dashboard MIS</CardTitle>
              <p className="text-sm text-slate-600">Top-level KPIs across donors, inventory and issues</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Donations Today" value={number(kpis.donationsToday)} tone="blue" />
        <Kpi label="Donations Month" value={number(kpis.donationsMonth)} tone="emerald" />
        <Kpi label="Issued Month" value={number(kpis.issuedMonth)} tone="amber" />
        <Kpi label="Stock" value={number(kpis.stock)} tone="violet" />
        <Kpi label="Camps Month" value={number(kpis.campsMonth)} tone="rose" />
        <Kpi label="Discards Month" value={number(kpis.discardsMonth)} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Donations Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer config={{ value: { label: "Donations", color: "#3b82f6" } }} className="h-full w-full">
                <AreaChart data={donationsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="exec-donations-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    fill="url(#exec-donations-fill)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Ratios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RatioRow label="Issue per Donation" value={ratios.issuePerDonation} />
            <RatioRow label="Discard Rate" value={ratios.discardRate} suffix="%" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  const toneClass = useMemo(() => {
    switch (tone) {
      case "blue":
        return "text-blue-700 bg-blue-50";
      case "red":
        return "text-red-700 bg-red-50";
      case "emerald":
        return "text-emerald-700 bg-emerald-50";
      case "amber":
        return "text-amber-700 bg-amber-50";
      case "violet":
        return "text-violet-700 bg-violet-50";
      case "rose":
        return "text-rose-700 bg-rose-50";
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

function RatioRow({ label, value, suffix }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">
        {value}
        {suffix && <span className="text-xs ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

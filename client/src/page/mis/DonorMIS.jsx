import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Users, Filter, RefreshCw } from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);

export default function DonorMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear().toString());
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const params = { month, year };
        const res = await axios.get(`${API}/api/mis/donors`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Donor MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, month, year]);

  const summary = data?.summary || {};
  const monthly = data?.monthly || {};

  const genderSeries = useMemo(
    () => (summary.genderDistribution || []).map((g) => ({ name: g.sex || "Unknown", value: number(g.count) })),
    [summary.genderDistribution]
  );

  const bloodGroupSeries = useMemo(
    () =>
      (summary.bloodGroupDistribution || []).map((g) => ({
        name: `${g.bloodGroup || "?"} ${g.rh || ""}`.trim(),
        value: number(g.count),
      })),
    [summary.bloodGroupDistribution]
  );

  const ageSeries = useMemo(
    () => (summary.ageDistribution || []).map((a) => ({ name: a.bucket || "unknown", value: number(a.count) })),
    [summary.ageDistribution]
  );

  const monthLabel = useMemo(() => {
    const m = parseInt(month, 10) || 1;
    return `${new Date(2000, m - 1, 1).toLocaleString("default", { month: "short" })} ${year}`;
  }, [month, year]);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div>
              <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Donor MIS Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header & Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Donor MIS</CardTitle>
              <p className="text-sm text-slate-600">Monthly donor analytics and demographics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Period</span>
            </div>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {new Date(2000, i, 1).toLocaleString("default", { month: "short" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }).map((_, idx) => {
                  const y = now.getFullYear() - idx;
                  return (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => {
                setMonth(String(now.getMonth() + 1));
                setYear(String(now.getFullYear()));
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Total Donors" value={number(summary.totalDonors)} tone="orange" />
        <Kpi label="New This Month" value={number(summary.newDonorsThisMonth)} tone="emerald" />
        <Kpi label="Repeat Donors" value={number(summary.repeatDonors)} tone="sky" />
        <Kpi label="In-House Donors" value={number(summary.inHouseDonors)} tone="rose" />
        <Kpi label="Camp Donors" value={number(summary.campDonors)} tone="violet" />
        <Kpi label="First-time %" value={number(monthly.firstTimeDonorPercent)} suffix="%" tone="amber" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Donors", color: "#f97316" } }}>
              <BarChart data={genderSeries} barCategoryGap={16}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Blood Group Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Donors", color: "#ef4444" } }}>
              <BarChart data={bloodGroupSeries} barCategoryGap={8}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Age Buckets ({monthLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Donors", color: "#6366f1" } }}>
              <BarChart data={ageSeries} barCategoryGap={12}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location & Eligibility Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Location Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LocationTable title="State" rows={summary.location?.state || []} labelKey="state" />
            <LocationTable title="District" rows={summary.location?.district || []} labelKey="district" />
            <LocationTable title="City" rows={summary.location?.city || []} labelKey="city" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Eligibility Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Donors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary.eligibility || []).map((row) => (
                  <TableRow key={row.status || "unknown"}>
                    <TableCell className="capitalize">{row.status || "unknown"}</TableCell>
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

function Kpi({ label, value, suffix, tone }) {
  const toneClass = useMemo(() => {
    switch (tone) {
      case "orange":
        return "text-orange-700 bg-orange-50";
      case "emerald":
        return "text-emerald-700 bg-emerald-50";
      case "sky":
        return "text-sky-700 bg-sky-50";
      case "rose":
        return "text-rose-700 bg-rose-50";
      case "violet":
        return "text-violet-700 bg-violet-50";
      case "amber":
        return "text-amber-700 bg-amber-50";
      default:
        return "text-slate-700 bg-slate-50";
    }
  }, [tone]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`inline-flex items-baseline gap-1 text-2xl font-semibold ${toneClass} px-3 py-1 rounded-lg w-fit`}>
          <span>{number(value).toLocaleString()}</span>
          {suffix && <span className="text-xs">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function LocationTable({ title, rows, labelKey }) {
  if (!rows || rows.length === 0) {
    return null;
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/3">{title}</TableHead>
            <TableHead className="text-right">Donors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const key = row[labelKey] || "Unknown";
            return (
              <TableRow key={key}>
                <TableCell className="truncate max-w-[12rem]">{key}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{number(row.count)}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

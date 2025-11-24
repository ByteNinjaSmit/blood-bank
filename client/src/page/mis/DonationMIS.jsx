import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { Activity, Filter, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const number = (v) => (typeof v === "number" ? v : 0);

export default function DonationMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [preset, setPreset] = useState("30d");
  const [openCal, setOpenCal] = useState(false);
  const [range, setRange] = useState({ from: null, to: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const params = {};
        if (preset === "all") {
          params.period = "all";
        } else if (["7d", "30d"].includes(preset)) {
          params.period = preset;
        } else if (preset === "custom" && range?.from && range?.to) {
          const fromISO = new Date(range.from).toISOString().slice(0, 10);
          const toISO = new Date(range.to).toISOString().slice(0, 10);
          params.from = fromISO;
          params.to = toISO;
        } else {
          params.period = "30d";
        }
        const res = await axios.get(`${API}/api/mis/donations`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Donation MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset, range?.from, range?.to]);

  const summary = data?.summary || {};
  const breakdowns = data?.breakdowns || {};
  const trends = data?.trends || {};
  const peaks = data?.peaks || {};

  const donationsTrend = useMemo(
    () => (trends.daily || []).map((d) => ({ date: d.date, value: number(d.count) })),
    [trends.daily]
  );

  const bgSeries = useMemo(
    () =>
      (breakdowns.byBloodGroup || []).map((g) => ({
        name: `${g.bloodGroup || "?"} ${g.rh || ""}`.trim(),
        value: number(g.count),
      })),
    [breakdowns.byBloodGroup]
  );

  const siteSeries = useMemo(
    () =>
      (breakdowns.bySite || []).map((s) => ({
        name: s.siteName || "In-house",
        value: number(s.count),
      })),
    [breakdowns.bySite]
  );

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
            <CardTitle className="text-red-700">Donation MIS Error</CardTitle>
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
            <div className="p-2 rounded-lg bg-red-100 text-red-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Donation MIS</CardTitle>
              <p className="text-sm text-slate-600">In-house vs camp donations, trends & peaks</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Range</span>
            </div>
            {["7d", "30d", "all"].map((key) => (
              <Button
                key={key}
                size="sm"
                variant={preset === key ? "default" : "outline"}
                onClick={() => setPreset(key)}
              >
                {key}
              </Button>
            ))}
            <Popover open={openCal} onOpenChange={setOpenCal}>
              <PopoverTrigger asChild>
                <Button
                  variant={preset === "custom" ? "default" : "outline"}
                  size="sm"
                  className="ml-1"
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {range?.from && range?.to
                    ? `${new Date(range.from).toLocaleDateString()} – ${new Date(range.to).toLocaleDateString()}`
                    : "Pick range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2" align="start">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(r) => {
                    setRange(r || { from: null, to: null });
                    if (r?.from && r?.to) setPreset("custom");
                  }}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => {
                setPreset("30d");
                setRange({ from: null, to: null });
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Kpi label="Total Donations" value={number(summary.totalDonations)} tone="red" />
        <Kpi label="In-house" value={number(summary.inHouseDonations)} tone="emerald" />
        <Kpi label="Camp" value={number(summary.campDonations)} tone="indigo" />
        <Kpi label="Peak Hour" value={peaks.hourOfDay?.hour ?? "-"} tone="amber" plain />
        <Kpi label="Peak Day" value={peaks.dayOfWeek?.dayOfWeek ?? "-"} tone="sky" plain />
      </div>

      {/* Trends & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Donation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Donations", color: "#ef4444" } }}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Camp vs In-house (Sites)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Donations", color: "#0ea5e9" } }}>
              <BarChart data={siteSeries} barCategoryGap={12}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Blood Group & Rh Tables */}
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
                  <TableHead>Rh</TableHead>
                  <TableHead className="text-right">Donations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdowns.byBloodGroup || []).map((row) => (
                  <TableRow key={`${row.bloodGroup || "?"}-${row.rh || "?"}`}>
                    <TableCell>{row.bloodGroup || "Unknown"}</TableCell>
                    <TableCell>{row.rh || "Unknown"}</TableCell>
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
            <CardTitle className="text-sm">Gender & Rh Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">By Gender</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gender</TableHead>
                    <TableHead className="text-right">Donations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(breakdowns.byGender || []).map((row) => (
                    <TableRow key={row.sex || "Unknown"}>
                      <TableCell>{row.sex || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{number(row.count)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">By Rh</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rh</TableHead>
                    <TableHead className="text-right">Donations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(breakdowns.byRh || []).map((row) => (
                    <TableRow key={row.rh || "Unknown"}>
                      <TableCell>{row.rh || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{number(row.count)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone, plain }) {
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

  const display = plain ? value : number(value).toLocaleString();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`inline-flex items-baseline gap-1 text-xl font-semibold ${toneClass} px-3 py-1 rounded-lg w-fit`}>
          <span>{display}</span>
        </div>
      </CardContent>
    </Card>
  );
}

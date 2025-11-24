import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Droplets, Filter, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const number = (v) => (typeof v === "number" ? v : 0);

export default function BagMIS() {
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
        const res = await axios.get(`${API}/api/mis/bags`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Blood Bag MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset, range?.from, range?.to]);

  const summary = data?.summary || {};
  const statuses = data?.statuses || [];
  const breakdowns = data?.breakdowns || {};
  const testing = data?.testing || {};
  const technicianWise = data?.technicianWise || [];

  const statusSeries = useMemo(
    () => statuses.map((s) => ({ name: s.status || "unknown", value: number(s.count) })),
    [statuses]
  );

  const bgSeries = useMemo(
    () =>
      (breakdowns.byBloodGroup || []).map((g) => ({
        name: `${g.bloodGroup || "?"} ${g.rh || ""}`.trim(),
        value: number(g.count),
      })),
    [breakdowns.byBloodGroup]
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
            <CardTitle className="text-red-700">Blood Bag MIS Error</CardTitle>
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
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Blood Bag MIS</CardTitle>
              <p className="text-sm text-slate-600">Lifecycle, group mix and testing status</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Kpi label="Total Bags" value={number(summary.totalBags)} />
        <Kpi label="In-house Bags" value={number(summary.inHouseBags)} />
        <Kpi label="Camp Bags" value={number(summary.campBags)} />
        <Kpi label="Pending Testing" value={number(testing.pendingTesting)} />
        <Kpi label="Passed" value={number(testing.passedTesting)} />
        <Kpi label="Failed" value={number(testing.failedTesting)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Bags", color: "#0ea5e9" } }}>
              <BarChart data={statusSeries} barCategoryGap={12}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Blood Group Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Bags", color: "#f97316" } }}>
              <BarChart data={bgSeries} barCategoryGap={12}>
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

      {/* Technician table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Technician-wise Collection</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technician</TableHead>
                <TableHead className="text-right">Bags Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicianWise.map((t) => (
                <TableRow key={t.technicianId || "unknown"}>
                  <TableCell>
                    <div className="font-medium">
                      {t.name?.first || t.name?.last
                        ? `${t.name?.first || ""} ${t.name?.last || ""}`.trim()
                        : "Unknown"}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[12rem]">
                      {t.technicianId}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{number(t.count)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-sky-800 bg-sky-50 px-3 py-1 rounded-lg w-fit">
          <span>{number(value).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

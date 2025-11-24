import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { GiCampingTent } from "react-icons/gi";
import { Filter, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const number = (v) => (typeof v === "number" ? v : 0);

export default function CampMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [preset, setPreset] = useState("month");
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
        } else if (["7d", "30d", "month"].includes(preset)) {
          params.period = preset;
        } else if (preset === "custom" && range?.from && range?.to) {
          const fromISO = new Date(range.from).toISOString().slice(0, 10);
          const toISO = new Date(range.to).toISOString().slice(0, 10);
          params.from = fromISO;
          params.to = toISO;
        } else {
          params.period = "month";
        }
        const res = await axios.get(`${API}/api/mis/camps`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Camp MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset, range?.from, range?.to]);

  const register = data?.register || [];
  const kpis = data?.kpis || {};
  const ranking = data?.ranking || {};

  const perCampSeries = useMemo(
    () =>
      register.map((c) => ({
        name: c.name,
        donors: number(c.donorCount),
        bags: number(c.donationsCollected),
      })),
    [register]
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
            <CardTitle className="text-red-700">Camp MIS Error</CardTitle>
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
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <GiCampingTent className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Camp / Site MIS</CardTitle>
              <p className="text-sm text-slate-600">Camp performance, yield and wastage</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Range</span>
            </div>
            {["7d", "30d", "month", "all"].map((key) => (
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
                setPreset("month");
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
        <Kpi label="Total Camps" value={number(kpis.totalCamps)} />
        <Kpi label="Total Donors" value={number(kpis.totalDonors)} />
        <Kpi label="Total Bags" value={number(kpis.totalBags)} />
        <Kpi label="Total Components" value={number(kpis.totalComponents)} />
        <Kpi label="Avg Donors / Camp" value={number(kpis.avgDonorsPerCamp)} />
        <Kpi label="Avg Yield / Bag" value={number(kpis.avgYieldPerBag)} />
      </div>

      {/* Per-camp chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Donors & Bags per Camp</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ donors: { label: "Donors", color: "#22c55e" }, bags: { label: "Bags", color: "#0ea5e9" } }}
          >
            <BarChart data={perCampSeries} barCategoryGap={12}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="donors" fill="var(--color-donors)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="bags" fill="var(--color-bags)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Register table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Camp Register</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camp</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Donors</TableHead>
                <TableHead className="text-right">Bags</TableHead>
                <TableHead className="text-right">Components</TableHead>
                <TableHead className="text-right">Yield / Bag</TableHead>
                <TableHead className="text-right">Serology Fail %</TableHead>
                <TableHead className="text-right">Discard %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {register.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div className="font-medium truncate max-w-[10rem]">{c.name}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[12rem]">{c.address}</div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {c.dateFrom ? new Date(c.dateFrom).toLocaleDateString() : "-"} – {" "}
                    {c.dateTo ? new Date(c.dateTo).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{number(c.donorCount)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{number(c.donationsCollected)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{number(c.componentsPrepared)}</TableCell>
                  <TableCell className="text-right">{number(c.yieldPerBag).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{number(c.serologyFailurePercent).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{number(c.discardPercent).toFixed(1)}%</TableCell>
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
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg w-fit">
          <span>{number(value).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Droplets, Users, Package, ClipboardList, Activity, AlertTriangle, TrendingUp, Truck, Calendar as CalendarIcon, Filter } from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);

export default function Dashboard() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  // Filters: presets and custom range
  const [preset, setPreset] = useState("7d"); // 'all' | '1d' | '2d' | '7d' | '30d' | 'custom'
  const [openCal, setOpenCal] = useState(false);
  const [range, setRange] = useState({ from: null, to: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const params = {};
        if (preset === "all") {
          params.range = "all";
        } else if (["1d", "2d", "7d", "30d"].includes(preset)) {
          params.range = preset;
        } else if (preset === "custom" && range?.from && range?.to) {
          const from = new Date(range.from);
          const to = new Date(range.to);
          const toISO = to.toISOString().slice(0, 10);
          const fromISO = from.toISOString().slice(0, 10);
          params.from = fromISO;
          params.to = toISO;
        } else {
          params.range = "7d";
        }
        const res = await axios.get(`${API}/api/dashboard`, { withCredentials: true, params });
        if (!mounted) return;
        setPayload(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset, range?.from, range?.to]);

  const totals = payload?.totals || {};
  const trends = payload?.trends || {};

  const stockByComponent = useMemo(() => (payload?.stockByComponent || []).map((x) => ({ name: x.componentType, value: x.value })), [payload]);
  const nearExpiryByComponent = useMemo(() => (payload?.nearExpiryByComponent || []).map((x) => ({ name: x.componentType, value: x.value })), [payload]);

  const donationsTrend = trends?.donations || [];
  const issuedTrend = trends?.issued || [];
  const discardedTrend = trends?.discarded || [];

  // Compress long series for performance while keeping trend shape
  const MAX_POINTS = 180;
  const compress = (arr) => {
    if (!Array.isArray(arr)) return [];
    const n = arr.length;
    if (n <= MAX_POINTS) return arr;
    const step = Math.ceil(n / MAX_POINTS);
    return arr.filter((_, i) => i % step === 0);
  };
  const donationsTrendData = compress(donationsTrend);
  const issuedTrendData = compress(issuedTrend);
  const discardedTrendData = compress(discardedTrend);

  const requestsByStatus = (payload?.requests?.byStatus || []).map((x) => ({ name: x.status, value: x.value }));
  const totalUnitsRequested = number(payload?.requests?.totalUnitsRequested);

  const positivity = payload?.positivity || {};
  const positivitySeries = Object.entries(positivity).map(([test, counts]) => ({
    test,
    Positive: number(counts.Positive),
    Negative: number(counts.Negative),
    Indeterminate: number(counts.Indeterminate),
  }));

  const periodTotals = payload?.periodTotals || {};
  const nearExpiryTotal = number(payload?.nearExpiryTotal);
  const statusLabelMap = {
    collected: "Collected",
    "component-separated": "Separated",
    testing: "Testing",
    passed: "In Stock",
    failed: "Failed",
    quarantined: "Quarantined",
    issued: "Issued",
    discarded: "Discarded",
  };
  const bloodbagStatusPie = (payload?.bloodbagStatusPie || []).map((x) => ({ name: statusLabelMap[x.status] || x.status, value: x.value, key: x.status }));
  const componentMap = useMemo(() => {
    const m = {};
    for (const item of stockByComponent) m[item.name] = item.value;
    return m;
  }, [stockByComponent]);

  if (loading) {
    return (
      <div className="p-6 grid gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="h-80 rounded-xl bg-gray-100" />
          <div className="h-80 rounded-xl bg-gray-100" />
          <div className="h-80 rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filters Strip */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600 flex items-center gap-2"><Filter className="w-4 h-4"/>Quick Range</span>
            {[
              { key: "all", label: "All" },
              { key: "1d", label: "1d" },
              { key: "2d", label: "2d" },
              { key: "7d", label: "7d" },
              { key: "30d", label: "30d" },
            ].map((opt) => (
              <Button
                key={opt.key}
                variant={preset === opt.key ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset(opt.key)}
              >
                {opt.label}
              </Button>
            ))}
            <Popover open={openCal} onOpenChange={setOpenCal}>
              <PopoverTrigger asChild>
                <Button variant={preset === 'custom' ? "default" : "outline"} size="sm" className="ml-2">
                  <CalendarIcon className="w-4 h-4 mr-1"/> {range?.from && range?.to ? `${new Date(range.from).toLocaleDateString()} – ${new Date(range.to).toLocaleDateString()}` : "Pick range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2" align="start">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(r) => {
                    setRange(r || { from: null, to: null });
                    if (r?.from && r?.to) {
                      setPreset('custom');
                    }
                  }}
                  disabled={{ after: new Date() }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
      {/* KPI Cards (filtered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={Users} label="Donors" value={number(totals.donors)} color="text-orange-700" />
        <Kpi icon={Activity} label="Donations" value={number(totals.donations)} color="text-red-700" />
        <Kpi icon={Droplets} label="In Stock" value={number(totals.inStock)} color="text-rose-700" />
        <Kpi icon={ClipboardList} label="Reserved" value={number(totals.reserved)} color="text-amber-700" />
        <Kpi icon={Truck} label="Issued" value={number(totals.issued)} color="text-emerald-700" />
        <Kpi icon={Package} label="Discarded" value={number(totals.discarded)} color="text-slate-700" />
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <TrendCard title="Donations Trend" dataKey="value" data={donationsTrendData} color="var(--color-donations)" config={{ value: { label: "Donations", color: "#fb923c" } }} />
        <TrendCard title="Issued Trend" dataKey="value" data={issuedTrendData} color="var(--color-issued)" config={{ value: { label: "Issued", color: "#22c55e" } }} />
        <TrendCard title="Discarded Trend" dataKey="value" data={discardedTrendData} color="var(--color-discarded)" config={{ value: { label: "Discarded", color: "#94a3b8" } }} />
      </div>

      {/* Stock & Expiry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock by Component</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Units", color: "#ef4444" } }}>
              <BarChart data={stockByComponent} barCategoryGap={8}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" isAnimationActive={false} fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Near Expiry by Component</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Units", color: "#f59e0b" } }}>
              <BarChart data={nearExpiryByComponent} barCategoryGap={8}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" isAnimationActive={false} fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 text-sm text-slate-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Monitor near-expiry units to reduce wastage. Total: <span className="font-semibold ml-1">{nearExpiryTotal}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Requests", color: "#2563eb" } }}>
              <BarChart data={requestsByStatus} barCategoryGap={8}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" isAnimationActive={false} fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Total Units Requested</span>
                <Badge variant="secondary" className="text-blue-700">{totalUnitsRequested}</Badge>
              </div>
              <Progress className="mt-2" value={Math.min(100, totalUnitsRequested % 100)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Components Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Droplets} label="RBC (in stock)" value={number(componentMap.RBC || 0)} color="text-rose-700" />
        <Kpi icon={Droplets} label="FFP (in stock)" value={number(componentMap.FFP || 0)} color="text-sky-700" />
        <Kpi icon={Droplets} label="Platelet (in stock)" value={number(componentMap.Platelet || 0)} color="text-amber-700" />
        <Kpi icon={Droplets} label="Cryo (in stock)" value={number(componentMap.Cryo || 0)} color="text-indigo-700" />
      </div>

      {/* Positivity by Test */}
      {positivitySeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ Positive: { label: "Positive", color: "#dc2626" }, Negative: { label: "Negative", color: "#16a34a" }, Indeterminate: { label: "Indeterminate", color: "#64748b" } }}>
              <BarChart data={positivitySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="test" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="Positive" isAnimationActive={false} stackId="a" fill="var(--color-Positive)" />
                <Bar dataKey="Negative" isAnimationActive={false} stackId="a" fill="var(--color-Negative)" />
                <Bar dataKey="Indeterminate" isAnimationActive={false} stackId="a" fill="var(--color-Indeterminate)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* BloodBag Status Pie */}
      {bloodbagStatusPie.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>BloodBag Status (Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <PieChart>
                <Tooltip content={<ChartTooltipContent />} />
                <Pie data={bloodbagStatusPie} isAnimationActive={false} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                  {bloodbagStatusPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColor(entry.key || entry.name, index)} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-50 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-semibold text-slate-800">{value.toLocaleString()}</div>
          </div>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  );
}

function TrendCard({ title, data, dataKey, color, config }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${title}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} />
            <Tooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dot={false} isAnimationActive={false} dataKey={dataKey} stroke={color} fill={`url(#${title}-fill)`} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Color mapping for pie slices
function pieColor(status, i) {
  const map = {
    collected: "#3b82f6",
    "component-separated": "#6366f1",
    testing: "#06b6d4",
    passed: "#22c55e",
    failed: "#ef4444",
    quarantined: "#f59e0b",
    issued: "#10b981",
    discarded: "#64748b",
  };
  return map[status] || ["#a78bfa", "#34d399", "#f472b6", "#60a5fa", "#fcd34d", "#fca5a5"][i % 6];
}

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { BarChart3, Filter, RefreshCw } from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);

export default function ExecutiveMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [preset, setPreset] = useState("30d");

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
        } else {
          params.period = "30d";
        }
        const res = await axios.get(`${API}/api/mis/dashboard`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Executive MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset]);

  const kpis = data?.kpis || {};
  const ratios = data?.ratios || {};
  const trends = data?.trends || {};
  const testing = data?.testing || {};

  const donationsTrend = useMemo(
    () => (trends.donationsDaily || []).map((d) => ({ date: d.date, value: number(d.value) })),
    [trends.donationsDaily]
  );

  const positivityRows = useMemo(() => {
    const pos = testing.positivity || {};
    return Object.entries(pos).map(([test, values]) => ({
      test,
      positive: number(values.Positive),
      negative: number(values.Negative),
      indeterminate: number(values.Indeterminate),
    }));
  }, [testing.positivity]);

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
            <CardTitle className="text-red-700">Executive MIS Error</CardTitle>
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
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => {
                setPreset("30d");
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Kpi label="Donors" value={number(kpis.donors)} tone="blue" />
        <Kpi label="Donations" value={number(kpis.donations)} tone="red" />
        <Kpi label="In-house Donations" value={number(kpis.inHouseDonations)} tone="slate" />
        <Kpi label="Camp Donations" value={number(kpis.campDonations)} tone="emerald" />
        <Kpi label="Issued Units" value={number(kpis.issuedUnits)} tone="amber" />
        <Kpi label="Hospital Requests" value={number(kpis.hospitalRequests)} tone="violet" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Components In Stock" value={number(kpis.componentsInStock)} tone="emerald" />
        <Kpi label="Components Reserved" value={number(kpis.componentsReserved)} tone="sky" />
        <Kpi label="Components Issued" value={number(kpis.componentsIssued)} tone="amber" />
        <Kpi label="Components Discarded" value={number(kpis.componentsDiscarded)} tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Donations Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Donations", color: "#3b82f6" } }}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Ratios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RatioRow label="Donations per Donor" value={ratios.donationPerDonor} />
            <RatioRow label="Issues per Donation" value={ratios.issuePerDonation} />
            <RatioRow label="Component Discard Rate" value={ratios.discardRateComponents} suffix="%" />
            <RatioRow label="Donation Discard Rate" value={ratios.discardRateDonations} suffix="%" />
            <RatioRow label="Positivity Rate" value={ratios.positivityRate} suffix="%" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Testing Positivity Summary</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead className="text-right">Positive</TableHead>
                <TableHead className="text-right">Negative</TableHead>
                <TableHead className="text-right">Indeterminate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positivityRows.map((row) => (
                <TableRow key={row.test}>
                  <TableCell>{row.test}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{row.positive}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{row.negative}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{row.indeterminate}</Badge>
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
      case "sky":
        return "text-sky-700 bg-sky-50";
      case "slate":
        return "text-slate-700 bg-slate-50";
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
        {typeof value === "number" ? value.toFixed(2) : "-"}
        {suffix && <span className="text-xs ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

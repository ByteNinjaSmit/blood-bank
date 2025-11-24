import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { FlaskConical, Filter, RefreshCw } from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);

export default function TestingMIS() {
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
        const res = await axios.get(`${API}/api/mis/testing`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Testing MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset]);

  const summary = data?.summary || {};
  const statusSummary = data?.statusSummary || [];
  const technicianWise = data?.technicianWise || [];
  const positivity = data?.positivity || {};

  const positivityRows = useMemo(
    () =>
      Object.entries(positivity).map(([test, values]) => ({
        test,
        positive: number(values.Positive),
        negative: number(values.Negative),
        indeterminate: number(values.Indeterminate),
      })),
    [positivity]
  );

  const statusSeries = useMemo(
    () => statusSummary.map((x) => ({ name: x.status || "unknown", value: number(x.count) })),
    [statusSummary]
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
            <CardTitle className="text-red-700">Testing MIS Error</CardTitle>
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
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Testing / Serology MIS</CardTitle>
              <p className="text-sm text-slate-600">Testing load, positivity and technician activity</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Bags Tested" value={number(summary.totalBagsTested)} />
        <Kpi label="Total Tests" value={number(summary.totalTests)} />
        <Kpi label="Positive Tests" value={number(summary.totalPositiveTests)} />
        <Kpi label="Positivity %" value={number(summary.positivityRate)} suffix="%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bag Status (Collection)</CardTitle>
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
            <CardTitle className="text-sm">Technician-wise Testing</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead className="text-right">Tests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicianWise.map((t) => (
                  <TableRow key={t.technicianId || "unknown"}>
                    <TableCell>
                      <div className="font-medium">{t.name || t.technicianId || "Unknown"}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[12rem]">{t.technicianId}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{number(t.tests)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Positivity by Test</CardTitle>
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

function Kpi({ label, value, suffix }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg w-fit">
          <span>{number(value).toLocaleString()}</span>
          {suffix && <span className="text-xs">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

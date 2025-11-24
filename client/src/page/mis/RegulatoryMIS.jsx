import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { GiChemicalDrop } from "react-icons/gi";
import { Filter, RefreshCw } from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);

export default function RegulatoryMIS() {
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
        const res = await axios.get(`${API}/api/mis/regulatory`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Regulatory MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset]);

  const compliance = data?.compliance || {};
  const positivity = data?.positivity || {};
  const discardsByReason = data?.discardsByReason || [];
  const requestsByStatus = data?.requestsByStatus || [];
  const turnaround = data?.turnaround || {};

  const discardSeries = useMemo(
    () => discardsByReason.map((x) => ({ name: x.reason || "Unknown", value: number(x.count) })),
    [discardsByReason]
  );

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
            <CardTitle className="text-red-700">Regulatory MIS Error</CardTitle>
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
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <GiChemicalDrop className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Regulatory MIS</CardTitle>
              <p className="text-sm text-slate-600">Mandatory testing, positivity and discard patterns</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Donations" value={number(compliance.donationsTotal)} />
        <Kpi label="Bags Tested" value={number(compliance.totalBagsTested)} />
        <Kpi label="Full-panel Bags" value={number(compliance.fullPanelBags)} />
        <Kpi label="Full-panel %" value={number(compliance.fullPanelPercent)} suffix="%" />
        <Kpi label="Positivity %" value={number(compliance.positivityRate)} suffix="%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Discards by Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Discards", color: "#6366f1" } }}>
              <BarChart data={discardSeries} barCategoryGap={12}>
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
            <CardTitle className="text-sm">Hospital Requests by Status</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsByStatus.map((row) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Turnaround (Approval)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">
              Average time from request to approval for hospital requests.
            </p>
            <div className="inline-flex items-baseline gap-1 text-2xl font-semibold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-lg">
              <span>{number(turnaround.avgApprovalHours).toLocaleString()}</span>
              <span className="text-xs ml-1">hours</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, suffix }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-lg w-fit">
          <span>{number(value).toLocaleString()}</span>
          {suffix && <span className="text-xs">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

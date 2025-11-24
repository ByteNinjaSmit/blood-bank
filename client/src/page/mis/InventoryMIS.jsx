import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Package, Filter, RefreshCw } from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);

export default function InventoryMIS() {
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
        const res = await axios.get(`${API}/api/mis/inventory`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Inventory MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset]);

  const summary = data?.summary || {};
  const breakdowns = data?.breakdowns || {};

  const statusSeries = useMemo(
    () => (breakdowns.byStatus || []).map((x) => ({ name: x.status || "unknown", value: number(x.count) })),
    [breakdowns.byStatus]
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
            <CardTitle className="text-red-700">Inventory MIS Error</CardTitle>
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
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Inventory MIS</CardTitle>
              <p className="text-sm text-slate-600">Inventory lifecycle across statuses and components</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Kpi label="Total Units" value={number(summary.total)} />
        <Kpi label="In Stock" value={number(summary.inStock)} />
        <Kpi label="Reserved" value={number(summary.reserved)} />
        <Kpi label="Issued" value={number(summary.issued)} />
        <Kpi label="Discarded" value={number(summary.discarded)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Units", color: "#f59e0b" } }}>
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
            <CardTitle className="text-sm">Reserved by Hospital</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Reserved Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdowns.byHospitalReserved || []).map((row) => (
                  <TableRow key={row.hospitalId || row.name || "unknown"}>
                    <TableCell className="truncate max-w-[12rem]">{row.name || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{number(row.reservedUnits)}</Badge>
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
          <CardTitle className="text-sm">Component Type & Status</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(breakdowns.byComponentType || []).map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.componentType || "Unknown"}</TableCell>
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
  );
}

function Kpi({ label, value }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg w-fit">
          <span>{number(value).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

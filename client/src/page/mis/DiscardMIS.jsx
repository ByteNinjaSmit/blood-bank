import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { GiCardDiscard } from "react-icons/gi";
import { Filter, RefreshCw } from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);

export default function DiscardMIS() {
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
        const res = await axios.get(`${API}/api/mis/discards`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Discard MIS");
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

  const reasonSeries = useMemo(
    () => (breakdowns.byReason || []).map((x) => ({ name: x.reason || "Unknown", value: number(x.count) })),
    [breakdowns.byReason]
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
            <CardTitle className="text-red-700">Discard MIS Error</CardTitle>
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
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <GiCardDiscard className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Discard & Wastage MIS</CardTitle>
              <p className="text-sm text-slate-600">Discard reasons, types and sites</p>
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
        <Kpi label="Total Discards" value={number(summary.totalDiscards)} />
        <Kpi label="Bags Discarded" value={number(summary.bagsDiscarded)} />
        <Kpi label="Components Discarded" value={number(summary.componentsDiscarded)} />
        <Kpi label="Auto / Manual" value={`${number(summary.autoDiscards)} / ${number(summary.manualDiscards)}`} plain />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Discards by Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Discards", color: "#f97316" } }}>
              <BarChart data={reasonSeries} barCategoryGap={12}>
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
            <CardTitle className="text-sm">Discards by Item Type</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdowns.byItemType || []).map((row) => (
                  <TableRow key={row.itemType || "Unknown"}>
                    <TableCell>{row.itemType || "Unknown"}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">By Component & Site</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component Type</TableHead>
                  <TableHead className="text-right">Discards</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdowns.byComponentType || []).map((row) => (
                  <TableRow key={row.componentType || "Unknown"}>
                    <TableCell>{row.componentType || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{number(row.count)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">Discards</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(breakdowns.bySite || []).map((row) => (
                  <TableRow key={row.siteId || row.siteName || "unknown"}>
                    <TableCell className="truncate max-w-[12rem]">{row.siteName || "In-house"}</TableCell>
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
  );
}

function Kpi({ label, value, plain }) {
  const display = plain ? value : number(value).toLocaleString();
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="inline-flex items-baseline gap-1 text-xl font-semibold text-rose-800 bg-rose-50 px-3 py-1 rounded-lg w-fit">
          <span>{display}</span>
        </div>
      </CardContent>
    </Card>
  );
}

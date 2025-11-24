import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { IoIosSend } from "react-icons/io";
import { Filter, RefreshCw } from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);

export default function IssueMIS() {
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
        const res = await axios.get(`${API}/api/mis/issues`, {
          params,
          withCredentials: true,
        });
        if (!mounted) return;
        setData(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e.message || "Failed to load Issue MIS");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, preset]);

  const summary = data?.summary || {};
  const statuses = data?.statuses || [];
  const components = data?.components || [];
  const hospitals = data?.hospitals || [];
  const turnaround = data?.turnaround || {};

  const statusSeries = useMemo(
    () => statuses.map((x) => ({ name: x.status || "unknown", value: number(x.count) })),
    [statuses]
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
            <CardTitle className="text-red-700">Issue MIS Error</CardTitle>
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
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <IoIosSend className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Hospital Request & Issue MIS</CardTitle>
              <p className="text-sm text-slate-600">Requests, issues and turnaround</p>
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
        <Kpi label="Total Requests" value={number(summary.totalRequests)} />
        <Kpi label="Total Units Requested" value={number(summary.totalUnitsRequested)} />
        <Kpi label="Avg Approval (hrs)" value={number(turnaround.avgApprovalHours)} />
        <Kpi label="Avg Issue (hrs)" value={number(turnaround.avgIssueHours)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Requests by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Requests", color: "#0ea5e9" } }}>
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
            <CardTitle className="text-sm">Requests by Hospital</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hospitals.map((h) => (
                  <TableRow key={h.hospitalId || h.name || "unknown"}>
                    <TableCell className="truncate max-w-[12rem]">{h.name || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{number(h.count)}</Badge>
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
          <CardTitle className="text-sm">Units by Component</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Rh</TableHead>
                <TableHead className="text-right">Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((c, idx) => (
                <TableRow key={idx}>
                  <TableCell>{c.componentType || "Unknown"}</TableCell>
                  <TableCell>{c.bloodGroup || "Unknown"}</TableCell>
                  <TableCell>{c.rh || "Unknown"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{number(c.units)}</Badge>
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

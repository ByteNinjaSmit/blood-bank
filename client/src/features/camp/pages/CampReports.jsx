import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCampMis } from "@/features/mis/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { BarChart3, Tent, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const number = (v) => (typeof v === "number" ? v : 0);

export default function CampReports() {
  const navigate = useNavigate();
  const { data, isLoading: loading, error: queryError } = useCampMis();
  const camps = useMemo(() => data ?? [], [data]);
  const error = queryError?.message;

  const summary = useMemo(() => {
    const totalCamps = camps.length;
    const totalBags = camps.reduce((sum, c) => sum + number(c.totalBags), 0);
    const totalDiscards = camps.reduce((sum, c) => sum + number(c.discardedBags), 0);
    const totalFailures = camps.reduce((sum, c) => sum + number(c.serologyFailures), 0);
    const totalTested = camps.reduce((sum, c) => sum + number(c.testedBags), 0);
    const totalCampDonors = camps.reduce((sum, c) => sum + number(c.donorCount), 0);
    const totalStaffAssigned = camps.reduce((sum, c) => sum + number(c.staffCount), 0);
    const avgBagsPerCamp = totalCamps ? totalBags / totalCamps : 0;
    return {
      totalCamps,
      totalBags,
      totalDiscards,
      totalFailures,
      totalTested,
      totalCampDonors,
      totalStaffAssigned,
      avgBagsPerCamp,
    };
  }, [camps]);

  const chartData = useMemo(() => {
    return [...camps]
      .sort((a, b) => number(b.totalBags) - number(a.totalBags))
      .slice(0, 10)
      .map((camp) => ({
        name: camp.name,
        collected: number(camp.totalBags),
        discarded: number(camp.discardedBags),
      }));
  }, [camps]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-600 flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
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
            <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Camp Reports</CardTitle>
              <p className="text-gray-500 text-sm">
                Camp performance & reporting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/camp-listing")}
            >
              <Tent className="w-4 h-4 mr-2" />
              Camp Listing
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard label="Total Camps" value={summary.totalCamps} />
        <SummaryCard label="Total Collection" value={summary.totalBags} />
        <SummaryCard label="Total Discards" value={summary.totalDiscards} />
        <SummaryCard
          label="Avg Units per Camp"
          value={summary.avgBagsPerCamp}
          formatter={(v) => number(v).toFixed(1)}
        />
        <SummaryCard label="Total Camp Donors" value={summary.totalCampDonors} />
        <SummaryCard label="Total Staff Assigned" value={summary.totalStaffAssigned} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Top Camps by Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              {chartData.length > 0 ? (
                <ChartContainer
                  config={{
                    collected: { label: "Collected", color: "#6366f1" },
                    discarded: { label: "Discarded", color: "#ef4444" },
                  }}
                  className="h-full w-full"
                >
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="collected"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      name="Collected"
                    />
                    <Bar
                      dataKey="discarded"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      name="Discarded"
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No camp data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Ratios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <RatioRow
              label="Discard Rate"
              numerator={summary.totalDiscards}
              denominator={summary.totalBags}
            />
            <RatioRow
              label="Serology Failure Rate"
              numerator={summary.totalFailures}
              denominator={summary.totalTested}
            />
            <div className="mt-2 text-xs text-slate-500">
              Ratios are computed across all recorded camps.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Camp-wise Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Camp</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Date From</TableHead>
                  <TableHead>Date To</TableHead>
                  <TableHead className="text-right">Staff</TableHead>
                  <TableHead className="text-right">Donors</TableHead>
                  <TableHead className="text-right">Duration (d)</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Discarded</TableHead>
                  <TableHead className="text-right">Failures</TableHead>
                  <TableHead className="text-right">Tested</TableHead>
                  <TableHead className="text-right">TTI+ %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {camps.length > 0 ? (
                  camps.map((camp, idx) => (
                    <TableRow key={camp._id || idx}>
                      <TableCell className="font-medium">{camp.name}</TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[220px] truncate" title={camp.address}>
                        {camp.address}
                      </TableCell>
                      <TableCell className="text-xs">
                        {camp.dateFrom ? new Date(camp.dateFrom).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {camp.dateTo ? new Date(camp.dateTo).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-700">
                        {number(camp.staffCount)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-700">
                        {number(camp.donorCount)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-700">
                        {number(camp.durationDays)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          {number(camp.totalBags)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-red-600 text-xs font-medium">
                        {number(camp.discardedBags)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600 text-xs font-medium">
                        {number(camp.serologyFailures)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-700">
                        {number(camp.testedBags)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-900 tabular-nums">
                        {camp.testedBags
                          ? ((number(camp.serologyFailures) / number(camp.testedBags)) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate(`/camp-details?id=${camp._id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-slate-500 text-sm">
                      No camp records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, formatter }) {
  const display = formatter ? formatter(value) : number(value).toLocaleString();
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="text-2xl font-semibold text-slate-900">{display}</div>
      </CardContent>
    </Card>
  );
}

function RatioRow({ label, numerator, denominator }) {
  const pct = denominator ? (numerator / denominator) * 100 : 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900 tabular-nums">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

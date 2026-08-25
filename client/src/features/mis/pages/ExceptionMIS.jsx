import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertTriangle, RefreshCw, FileText, FileSpreadsheet, Clock, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadExcelReport } from "@/utils/excelExportHelper";
import { useAuditMis } from "../queries";
import { formatDateTime } from "@/lib/format-date";

const number = (v) => (typeof v === "number" ? v : 0);
const COLORS = ["#f97316", "#ef4444", "#a855f7", "#64748b"];

export default function ExceptionMIS() {
  const { data, isLoading, isError, error, refetch } = useAuditMis();

  const stuckInTesting = number(data?.stuckInTesting);
  const nearExpiry = number(data?.nearExpiry);
  const longQuarantine = number(data?.longQuarantine);
  const expiredNotDiscarded = number(data?.expiredNotDiscarded);
  const allClear = stuckInTesting === 0 && nearExpiry === 0 && longQuarantine === 0 && expiredNotDiscarded === 0;

  const rows = [
    { label: "Bags Stuck in Testing (>24h)", value: stuckInTesting, severity: "Medium", action: "Complete testing immediately" },
    { label: "Components Near Expiry (<=3 days)", value: nearExpiry, severity: "High", action: "Issue or discard before expiry" },
    { label: "Units in Quarantine (>7 days)", value: longQuarantine, severity: "Medium", action: "Follow up on TTI release decision" },
    { label: "Expired Units Not Yet Discarded", value: expiredNotDiscarded, severity: "High", action: "Process discard immediately" },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pieData = useMemo(() => rows.filter(r => r.value > 0).map(r => ({ name: r.label, value: r.value })), [stuckInTesting, nearExpiry, longQuarantine, expiredNotDiscarded]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const barData = useMemo(() => rows.map(r => ({ name: r.label.split(' (')[0], value: r.value })), [stuckInTesting, nearExpiry, longQuarantine, expiredNotDiscarded]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Exception & Audit MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
    autoTable(doc, { startY: 30, head: [["Exception Type", "Count"]], body: rows.map(r => [r.label, r.value]) });
    doc.save("exception_mis.pdf");
  };

  const exportExcel = () => {
    downloadExcelReport([{
      name: "Exceptions",
      subtitle: "Exception & Audit MIS",
      headers: ["Exception", "Count"],
      rows: rows.map(r => [r.label, r.value]),
    }], "exception_mis.xlsx");
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (isError) return (
    <div className="p-6"><Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-red-600">
      Error: {error?.message || "Failed to load Exception MIS"}
      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
    </CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']"><AlertTriangle className="w-6 h-6 text-white relative z-10 drop-shadow-sm" /></div>
            <div><CardTitle className="text-2xl font-bold text-gray-900">Exception & Audit MIS</CardTitle><p className="text-gray-500 text-sm">Quality control alerts and operational exceptions</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2 text-red-600" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />Excel</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-100"><Clock className="w-6 h-6 text-orange-700" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-900 mb-1">Bags Stuck in Testing</h3>
                <p className="text-xs text-orange-700 mb-3">Units in testing status for more than 24 hours</p>
                <div className="text-3xl font-bold text-orange-900">{stuckInTesting}</div>
                {stuckInTesting > 0 && <Badge variant="destructive" className="mt-3">Action Required</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-red-100"><Calendar className="w-6 h-6 text-red-700" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-900 mb-1">Components Near Expiry</h3>
                <p className="text-xs text-red-700 mb-3">In-stock components expiring within 3 days</p>
                <div className="text-3xl font-bold text-red-900">{nearExpiry}</div>
                {nearExpiry > 0 && <Badge variant="destructive" className="mt-3">Urgent</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exactly 2 charts on this page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Exception Share</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px] w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              ) : <div className="text-slate-400 text-sm">No exceptions right now</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Exception Counts</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ChartContainer config={{ value: { label: "Count", color: "#f97316" } }} className="h-full w-full">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Exception Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Exception Type</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Severity</TableHead><TableHead className="text-right">Recommended Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell className="text-right"><Badge variant={r.value > 0 ? "destructive" : "outline"}>{r.value}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={r.severity === "High" ? "bg-red-50 text-red-700 border-red-200" : "bg-orange-50 text-orange-700 border-orange-200"}>{r.severity}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-600">{r.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {allClear && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-green-900">All Clear!</h3>
              <p className="text-sm text-green-700">No exceptions or audit alerts at this time.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

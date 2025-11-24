import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, RefreshCw, FileText, FileSpreadsheet, Clock, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);

export default function ExceptionMIS() {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/api/mis/audit`, {
        withCredentials: true,
      });
      setData(res.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Exception MIS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Exception & Audit MIS Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const kpiData = [
      ["Bags Stuck in Testing (>24h)", number(data?.stuckInTesting)],
      ["Components Near Expiry (≤3 days)", number(data?.nearExpiry)]
    ];

    autoTable(doc, {
      startY: 30,
      head: [["Exception Type", "Count"]],
      body: kpiData,
    });

    doc.save("exception_mis.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const kpiData = [
      { Exception: "Bags Stuck in Testing (>24h)", Count: number(data?.stuckInTesting) },
      { Exception: "Components Near Expiry (≤3 days)", Count: number(data?.nearExpiry) }
    ];

    const ws = XLSX.utils.json_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, ws, "Exceptions");
    XLSX.writeFile(wb, "exception_mis.xlsx");
  };

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
          <CardContent className="p-6 text-red-600">
            Error: {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={fetchData}>Retry</Button>
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
            <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Exception & Audit MIS</CardTitle>
              <p className="text-sm text-slate-600">Quality control alerts and operational exceptions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="w-4 h-4 mr-2 text-red-600" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
              Excel
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <Clock className="w-6 h-6 text-orange-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-900 mb-1">Bags Stuck in Testing</h3>
                <p className="text-xs text-orange-700 mb-3">Units in testing status for more than 24 hours</p>
                <div className="text-3xl font-bold text-orange-900">{number(data?.stuckInTesting)}</div>
                {number(data?.stuckInTesting) > 0 && (
                  <Badge variant="destructive" className="mt-3">Action Required</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <Calendar className="w-6 h-6 text-red-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-900 mb-1">Components Near Expiry</h3>
                <p className="text-xs text-red-700 mb-3">In-stock components expiring within 3 days</p>
                <div className="text-3xl font-bold text-red-900">{number(data?.nearExpiry)}</div>
                {number(data?.nearExpiry) > 0 && (
                  <Badge variant="destructive" className="mt-3">Urgent</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Exception Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exception Type</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Severity</TableHead>
                <TableHead className="text-right">Recommended Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Bags Stuck in Testing (&gt;24h)</TableCell>
                <TableCell className="text-right">
                  <Badge variant={number(data?.stuckInTesting) > 0 ? "destructive" : "outline"}>
                    {number(data?.stuckInTesting)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Medium
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-slate-600">
                  Complete testing immediately
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Components Near Expiry (≤3 days)</TableCell>
                <TableCell className="text-right">
                  <Badge variant={number(data?.nearExpiry) > 0 ? "destructive" : "outline"}>
                    {number(data?.nearExpiry)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="destructive">High</Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-slate-600">
                  Issue or discard before expiry
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(number(data?.stuckInTesting) === 0 && number(data?.nearExpiry) === 0) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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

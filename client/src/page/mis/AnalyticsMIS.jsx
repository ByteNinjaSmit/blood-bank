import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from "recharts";
import { TrendingUp, RefreshCw, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const number = (v) => (typeof v === "number" ? v : 0);

export default function AnalyticsMIS() {
    const { API } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await axios.get(`${API}/api/mis/analytics`, {
                withCredentials: true,
            });
            setData(res.data?.data || null);
        } catch (e) {
            setError(e?.response?.data?.message || e.message || "Failed to load Analytics MIS");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [API]);

    const lastMonth = data?.lastMonth || {};
    const forecast = data?.forecast || {};

    const chartData = [
        { name: "Last Month", donations: lastMonth.donations, demand: lastMonth.issues },
        { name: "Forecast (Next Month)", donations: forecast.donations, demand: forecast.demand }
    ];

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Analytics & Forecast MIS Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

        const kpiData = [
            ["Last Month Donations", number(lastMonth.donations)],
            ["Last Month Demand", number(lastMonth.issues)],
            ["Forecast Donations", number(forecast.donations)],
            ["Forecast Demand", number(forecast.demand)],
            ["Shortage Risk", data?.shortageRisk || "Unknown"]
        ];

        autoTable(doc, {
            startY: 30,
            head: [["Metric", "Value"]],
            body: kpiData,
        });

        doc.save("analytics_mis.pdf");
    };

    const exportExcel = () => {
        const wb = XLSX.utils.book_new();

        const kpiData = [
            { Metric: "Last Month Donations", Value: number(lastMonth.donations) },
            { Metric: "Last Month Demand", Value: number(lastMonth.issues) },
            { Metric: "Forecast Donations", Value: number(forecast.donations) },
            { Metric: "Forecast Demand", Value: number(forecast.demand) },
            { Metric: "Shortage Risk", Value: data?.shortageRisk || "Unknown" }
        ];

        const ws = XLSX.utils.json_to_sheet(kpiData);
        XLSX.utils.book_append_sheet(wb, ws, "Analytics");
        XLSX.writeFile(wb, "analytics_mis.xlsx");
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
                        <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle>Analytics & Forecast MIS</CardTitle>
                            <p className="text-sm text-slate-600">Predictive analysis and demand forecasting</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Supply vs Demand Forecast</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ChartContainer config={{
                                donations: { label: "Donations", color: "#22c55e" },
                                demand: { label: "Demand", color: "#3b82f6" }
                            }} className="h-full w-full">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Bar dataKey="donations" fill="#22c55e" radius={[4, 4, 0, 0]} name="Donations" />
                                    <Bar dataKey="demand" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Demand" />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                <h4 className="text-sm font-medium text-slate-500 mb-2">Shortage Risk</h4>
                                <div className="flex items-center gap-3">
                                    <Badge variant={data?.shortageRisk === "High" ? "destructive" : "default"} className="text-lg px-4 py-1">
                                        {data?.shortageRisk || "Unknown"}
                                    </Badge>
                                    <span className="text-sm text-slate-600">
                                        {data?.shortageRisk === "High"
                                            ? "Projected demand exceeds supply. Increase camp frequency."
                                            : "Supply levels are adequate for projected demand."}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-green-50">
                                    <div className="text-xs text-green-700 mb-1">Projected Growth</div>
                                    <div className="text-2xl font-bold text-green-900">+5%</div>
                                </div>
                                <div className="p-4 rounded-lg bg-blue-50">
                                    <div className="text-xs text-blue-700 mb-1">Demand Trend</div>
                                    <div className="text-2xl font-bold text-blue-900">Stable</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

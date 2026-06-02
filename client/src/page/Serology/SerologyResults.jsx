import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Microscope, Search, Calendar, X, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CustomModal from "@/components/CustomModal";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SerologyResults = () => {
  const { API, authorizationToken } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [bags, setBags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    fromDate: "",
    toDate: ""
  });
  const [order, setOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [selectedBag, setSelectedBag] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchBags = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/api/serology/results`, {
        params: { 
          page, 
          limit, 
          search: filters.search || undefined, 
          status: filters.status === "all" ? undefined : filters.status,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          sortBy, 
          order 
        },
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setBags(data);
      setPagination(prev => ({ ...prev, ...(res.data?.pagination || {}) }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load results");
      setBags([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBags(1, pagination.limit);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [filters, order, sortBy]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "all", fromDate: "", toDate: "" });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchBags(newPage, pagination.limit);
  };

  const handleRowsPerPageChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, limit, page: 1 }));
    fetchBags(1, limit);
  };

  const statusBadge = (status) => {
    const cls =
      status === "passed" ? "bg-green-50 text-green-700 border-green-200" :
      status === "discarded" || status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
      "bg-amber-50 text-amber-700 border-amber-200";
    return <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{status}</span>;
  };

  const formatBlood = (group, rh) => {
    if (!group && !rh) return "-";
    const symbol = rh === "Positive" ? "+" : rh === "Negative" ? "-" : (rh || "");
    return `${group || ""} ${symbol}`.trim();
  };

  const handleViewDetails = (bag) => {
    setSelectedBag(bag);
    setShowDetails(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-red-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
                <Microscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Serology Results</h1>
                <p className="text-gray-600 mt-1">View finalized or recorded serology results</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Compact Filters Section */}
          <Card className="mb-4 border-red-50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search - Flexible Width */}
                <div className="flex-1 min-w-[240px] space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Search</label>
                  <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 w-3.5 h-3.5 transition-colors" />
                    <Input
                      placeholder="Search Bag Number..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="w-36 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Status</label>
                  <Select value={filters.status} onValueChange={(val) => handleFilterChange("status", val)}>
                    <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="discarded">Discarded</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* From Date */}
                <div className="w-36 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">From Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                    <Input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                      className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                    />
                  </div>
                </div>

                {/* To Date */}
                <div className="w-36 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">To Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                    <Input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange("toDate", e.target.value)}
                      className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                    />
                  </div>
                </div>

                {/* Compact Actions */}
                <div className="flex items-center gap-2 border-l border-gray-200 pl-3 pt-4">
                  {(filters.search || filters.status !== "all" || filters.fromDate || filters.toDate) && (
                    <button 
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                      title="Clear all filters"
                    >
                      <X className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b bg-gray-50/30">
              <div className="text-sm font-semibold text-gray-700">Results ({pagination.total})</div>
              <div className="flex items-center gap-2">
                <Select value={order} onValueChange={(val) => setOrder(val)}>
                  <SelectTrigger className="h-8 text-xs w-32 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => fetchBags(pagination.page)} variant="outline" size="sm" disabled={isLoading} className="h-8 px-2">
                  <Loader2 className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin" /> Loading results...
                        </div>
                      </td>
                    </tr>
                  ) : bags.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No results found.</td>
                    </tr>
                  ) : (
                    bags.map((bag, idx) => (
                      <tr key={`${bag.bagNo}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{bag.bagNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{bag.segmentNo || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatBlood(bag.bloodGroup, bag.rh)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{bag.collectionDate ? new Date(bag.collectionDate).toLocaleString() : "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{statusBadge(bag.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {Array.isArray(bag.testResults) && bag.testResults.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {bag.testResults.map((t, i) => {
                                const isPositive = String(t.result).toLowerCase() === "positive";
                                const chipCls = isPositive
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200";
                                return (
                                  <span
                                    key={i}
                                    className={`px-2 py-0.5 rounded-full text-xs border ${chipCls}`}
                                  >
                                    {t.test}: {t.result}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not tested</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(bag)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Section */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50/10">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <Select 
                    value={pagination.limit.toString()} 
                    onValueChange={handleRowsPerPageChange}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || isLoading}
                    className="h-8 text-xs"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {(() => {
                      const totalPages = pagination.totalPages;
                      const currentPage = pagination.page;
                      const pages = [];
                      
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, currentPage + 2);
                      
                      if (endPage - startPage < 4) {
                        if (startPage === 1) {
                          endPage = Math.min(totalPages, startPage + 4);
                        } else {
                          startPage = Math.max(1, endPage - 4);
                        }
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        if (i > 0 && i <= totalPages) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(i)}
                              disabled={isLoading}
                              className={`w-8 h-8 p-0 text-xs ${currentPage === i ? "bg-red-600 hover:bg-red-700" : ""}`}
                            >
                              {i}
                            </Button>
                          );
                        }
                      }
                      return pages;
                    })()}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || isLoading}
                    className="h-8 text-xs"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showDetails && selectedBag && (
          <CustomModal
            open={showDetails}
            title={`Bag ${selectedBag.bagNo} – Serology details`}
            description={selectedBag.status ? `Status: ${selectedBag.status}` : ""}
            onCancel={() => {
              setShowDetails(false);
              setSelectedBag(null);
            }}
            size="lg"
            hideFooter
          >
            <div className="space-y-4 text-sm text-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bag Information</p>
                  <p><span className="font-medium">Bag No:</span> {selectedBag.bagNo}</p>
                  <p><span className="font-medium">Segment No:</span> {selectedBag.segmentNo || "-"}</p>
                  <p><span className="font-medium">Blood Group:</span> {formatBlood(selectedBag.bloodGroup, selectedBag.rh)}</p>
                  <p>
                    <span className="font-medium">Collection Date:</span>{" "}
                    {selectedBag.collectionDate ? new Date(selectedBag.collectionDate).toLocaleString() : "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Summary</p>
                  <p>
                    <span className="font-medium">Status:</span> {selectedBag.status}{" "}
                    {statusBadge(selectedBag.status)}
                  </p>
                  {selectedBag.updatedAt && (
                    <p>
                      <span className="font-medium">Last Updated:</span>{" "}
                      {new Date(selectedBag.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-white/80 p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Test Results</p>
                {Array.isArray(selectedBag.testResults) && selectedBag.testResults.length > 0 ? (
                  <div className="divide-y text-sm">
                    {selectedBag.testResults.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-slate-800">{t.test}</p>
                          {t.notes && <p className="text-xs text-slate-500 mt-0.5">{t.notes}</p>}
                        </div>
                        {(() => {
                          const isPositive = String(t.result).toLowerCase() === "positive";
                          const chipCls = isPositive
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200";
                          return (
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${chipCls}`}>
                              {t.result}
                            </span>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No serology tests recorded for this bag.</p>
                )}
              </div>
            </div>
          </CustomModal>
        )}
      </div>
    </>
  );
};

export default SerologyResults;

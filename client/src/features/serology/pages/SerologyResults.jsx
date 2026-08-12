import { useEffect, useState } from "react";
import { apiClient } from "@/core/api-client";
import { Button } from "@/components/ui/button";
import { Loader2, Microscope, Calendar, X, ChevronLeft, ChevronRight, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format-date";
import { sortByBagNoAsc } from "@/lib/natural-sort";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportSerologyResults } from "@/utils/excelExportHelper";
import { ComponentDetailsModal } from "@/components/blood-components";
import SearchBox from "@/components/shared/SearchBox";
import SerologyDetailModal from "../components/SerologyDetailModal";
import { statusBadge, formatBlood } from "../components/serology-helpers";

const SerologyResults = () => {
  const { user } = useAuth();
  // Mirrors the backend gate on POST /api/serology/results/:id — only
  // these roles may save edits, and only while no component from this
  // bag has been issued (bag.canEdit, computed server-side).
  const canEditRole = user?.role === "system-admin" || user?.role === "lab-tech-serology";

  const [isLoading, setIsLoading] = useState(false);
  const [bags, setBags] = useState([]);
  const [excelLoading, setExcelLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResults, setEditedResults] = useState([]);
  const [editReason, setEditReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const mapSerologyForExport = (bagsList) => {
    return bagsList.map(bag => ({
      ...bag,
      bloodGroup: bag.bloodGroup ? `${bag.bloodGroup} ${bag.rh === 'Positive' || bag.rh === 'POSITIVE' ? '+' : bag.rh === 'Negative' || bag.rh === 'NEGATIVE' ? '-' : ''}`.trim() : '—',
      collectedAt: bag.collectionDate,
      tests: Array.isArray(bag.testResults) ? bag.testResults.map(t => ({ testName: t.test, result: t.result })) : [],
    }));
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let dataToExport = [];
      if (exportAll) {
        // Fetch all serology results without limit (up to 5000)
        const res = await apiClient.get(`/api/serology/results`, {
          params: {
            page: 1,
            limit: 5000,
            search: filters.search || undefined,
            status: filters.status === "all" ? undefined : filters.status,
            fromDate: filters.fromDate || undefined,
            toDate: filters.toDate || undefined,
            sortBy,
            order
          },
        });
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        dataToExport = mapSerologyForExport(data);
      } else {
        dataToExport = mapSerologyForExport(bags);
      }
      
      if (dataToExport.length === 0) {
        toast.info("No records to export");
        return;
      }
      
      await exportSerologyResults(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    fromDate: "",
    toDate: ""
  });
  const [order, setOrder] = useState("desc");
  const [sortBy] = useState("updatedAt");
  // Draft search text bound to the SearchBox; only committed into
  // filters.search (the actual fetch dependency) on explicit submit.
  const [searchInput, setSearchInput] = useState("");
  const [selectedBag, setSelectedBag] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showComponents, setShowComponents] = useState(false);

  const fetchBags = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/serology/results`, {
        params: {
          page,
          limit,
          search: filters.search || undefined,
          status: filters.status === "all" ? undefined : filters.status,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          sortBy,
          order: order === "bagAsc" ? "asc" : order
        },
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setBags(order === "bagAsc" ? sortByBagNoAsc(data) : data);
      setPagination(prev => ({ ...prev, ...(res.data?.pagination || {}) }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load results");
      setBags([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBags(1, pagination.limit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, order, sortBy]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput("");
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

  const handleViewDetails = (bag) => {
    setSelectedBag(bag);
    setIsEditing(false);
    setShowDetails(true);
  };

  const handleEditDetails = (bag) => {
    setSelectedBag(bag);
    setEditedResults((Array.isArray(bag.testResults) ? bag.testResults : []).map((t) => ({ ...t })));
    setEditReason("");
    setIsEditing(true);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedBag(null);
    setIsEditing(false);
    setEditedResults([]);
    setEditReason("");
    setShowComponents(false);
  };

  const setEditedResult = (index, result) => {
    setEditedResults((prev) => prev.map((t, i) => (i === index ? { ...t, result } : t)));
  };

  const handleSaveResults = async () => {
    if (!selectedBag) return;
    if (!editReason.trim()) {
      toast.error("Please enter a reason for this edit");
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post(`/api/serology/results/${selectedBag._id || selectedBag.bagNo}`, {
        testResults: editedResults.map(({ test, result }) => ({ test, result })),
        editReason: editReason.trim(),
      });
      toast.success("Serology results updated");
      handleCloseDetails();
      fetchBags(pagination.page, pagination.limit);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save results");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-red-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                  <Microscope className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">TTD Testing Results</h1>
                  <p className="text-gray-500 text-sm">View finalized or recorded TTD testing results</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
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
                  <SearchBox
                    placeholder="Search Bag Number..."
                    value={searchInput}
                    onChange={setSearchInput}
                    onSearch={() => handleFilterChange("search", searchInput)}
                    disabled={isLoading}
                    inputClassName="border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                  />
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
                      <SelectItem value="shadeness">Shadeness</SelectItem>
                      <SelectItem value="retest">TTI Retest</SelectItem>
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
                    <SelectItem value="bagAsc">Ascending Order</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => fetchBags(pagination.page)}
                  disabled={isLoading}
                  title="Refresh"
                  aria-label="Refresh"
                  className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edited</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin" /> Loading results...
                        </div>
                      </td>
                    </tr>
                  ) : bags.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">No results found.</td>
                    </tr>
                  ) : (
                    bags.map((bag, idx) => {
                      // Highlight the whole row when any TTI test is not
                      // negative (reactive / positive / indeterminate).
                      const hasReactive = Array.isArray(bag.testResults) && bag.testResults.some((t) => {
                        const n = String(t.result).toUpperCase();
                        return n && n !== "NEGATIVE" && n !== "PENDING" && n !== "-";
                      });
                      return (
                      <tr key={`${bag.bagNo}-${idx}`} className={hasReactive ? "bg-yellow-100 hover:bg-yellow-200/70" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div>{bag.bagNo}</div>
                          {bag.lastEditedAt && (
                            <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-2xs font-bold bg-orange-500 text-white border border-orange-600 uppercase tracking-wide">
                              Retest Done
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{bag.segmentNo || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatBlood(bag.bloodGroup, bag.rh)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(bag.collectionDate)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{statusBadge(bag.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {Array.isArray(bag.testResults) && bag.testResults.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {bag.testResults.map((t, i) => {
                                const normalized = String(t.result).toUpperCase();
                                const chipCls =
                                  normalized === "REACTIVE" || normalized === "POSITIVE"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : normalized === "NEGATIVE"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200";
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
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {bag.lastEditedAt ? (
                            <span title={bag.editReason || ""}>
                              Edited on {formatDateTime(bag.lastEditedAt)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(bag)}
                            >
                              View
                            </Button>
                            {canEditRole && bag.canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDetails(bag)}
                                className="border-blue-100 text-blue-700 hover:bg-blue-50"
                                title="Edit Results"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
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
          <SerologyDetailModal
            selectedBag={selectedBag}
            isEditing={isEditing}
            editedResults={editedResults}
            editReason={editReason}
            setEditReason={setEditReason}
            setEditedResult={setEditedResult}
            isSaving={isSaving}
            canEditRole={canEditRole}
            onClose={handleCloseDetails}
            onSave={handleSaveResults}
            onEdit={handleEditDetails}
            onViewComponents={() => setShowComponents(true)}
          />
        )}

        {selectedBag && (
          <ComponentDetailsModal
            isOpen={showComponents}
            onClose={() => setShowComponents(false)}
            componentId={selectedBag.donationId}
          />
        )}
      </div>
    </>
  );
};

export default SerologyResults;

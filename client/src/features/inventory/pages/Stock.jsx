import { useEffect, useState } from "react";
import { apiClient } from "@/core/api-client";
import { Button } from "@/components/ui/button";
import { Loader2, Boxes, ChevronLeft, ChevronRight, X, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStockSummary } from "@/features/inventory/queries";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import SearchBox from "@/components/shared/SearchBox";
import { exportStock } from "@/utils/excelExportHelper";
import { COMPONENT_TYPES } from "@/constants/component-types";
import ComponentStockLines from "@/components/shared/ComponentStockLines";
import StockViewModal from "../components/StockViewModal";
import StockPrintLabelModal from "../components/StockPrintLabelModal";

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const Stock = () => {
  const { data: stockSummaryData } = useStockSummary(true);

  const [isLoading, setIsLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [selectedPrintItem, setSelectedPrintItem] = useState(null);
  const [selectedViewItem, setSelectedViewItem] = useState(null);

  // filters
  const [componentType, setComponentType] = useState("");
  const [status, setStatus] = useState("in-stock");
  const [siteId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [rh, setRh] = useState("");
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");
  const [order, setOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("createdAt");
  const [source, setSource] = useState("all"); // all | own | loan
  const [ttiRetest, setTtiRetest] = useState(false);

  const buildParams = (page, limit) => ({
    page,
    limit,
    status,
    componentType: componentType || undefined,
    siteId: siteId || undefined,
    search: search || undefined,
    bloodGroup: bloodGroup || undefined,
    rh: rh || undefined,
    expiryFrom: expiryFrom || undefined,
    expiryTo: expiryTo || undefined,
    sortBy,
    order,
    // Always send explicitly — the backend only merges in loan-taken bags
    // when this page opts in; every other screen omits `source` entirely
    // and must keep seeing real BloodUnit-backed rows only.
    source,
    ttiRetest: ttiRetest || undefined,
  });

  const fetchRows = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/inventory`, {
        params: buildParams(page, limit),
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setPagination((p) => ({ ...p, ...(res.data?.pagination || {}) }));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch inventory");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let dataToExport = rows;
      if (exportAll) {
        toast.info("Fetching complete stock list for export...");
        const res = await apiClient.get(`/api/inventory`, {
          params: buildParams(1, 5000),
        });
        dataToExport = Array.isArray(res.data?.data) ? res.data.data : [];
      }
      await exportStock(dataToExport);
    } catch (e) {
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, componentType, siteId, search, bloodGroup, rh, expiryFrom, expiryTo, order, sortBy, source, ttiRetest]);

  return (
    <div className="min-h-screen bg-gray-50 uppercase tracking-tight">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <Boxes className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Stock</h1>
              <p className="text-gray-500 text-sm">Management Portal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ComponentStockLines stockSummary={stockSummaryData} />
        {/* Compact Filters Section */}
        <Card className="mb-4 border-red-100 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Search Bag Number</label>
                <SearchBox
                  placeholder="Enter Bag Number..."
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={() => { setSearch(searchInput); setPagination(p => ({ ...p, page: 1 })); }}
                  disabled={isLoading}
                  inputClassName="border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                />
              </div>

              {/* Component Type */}
              <div className="w-40 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Component Type</label>
                <Select value={componentType || "all"} onValueChange={(val) => {setComponentType(val === "all" ? "" : val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="All Components" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Components</SelectItem>
                    {COMPONENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="w-40 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Filter Status</label>
                <Select value={status} onValueChange={(val) => {setStatus(val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="quarantine">Quarantine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source (Own Stock vs Taken on Loan) */}
              <div className="w-40 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Source</label>
                <Select value={source} onValueChange={(val) => {setSource(val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bags</SelectItem>
                    <SelectItem value="own">Own Collection</SelectItem>
                    <SelectItem value="loan">Taken On Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Blood Group */}
              <div className="w-32 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Blood Group</label>
                <Select value={bloodGroup || "all"} onValueChange={(val) => {setBloodGroup(val === "all" ? "" : val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rh */}
              <div className="w-32 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Rh</label>
                <Select value={rh || "all"} onValueChange={(val) => {setRh(val === "all" ? "" : val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="All Rh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rh</SelectItem>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sort By</label>
                <Select value={sortBy} onValueChange={(val) => {setSortBy(val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="collectedAt">Collection Date</SelectItem>
                    <SelectItem value="expiresAt">Expiry Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sort Order</label>
                <Select value={order} onValueChange={(val) => {setOrder(val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry From */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Expiry From</label>
                <Input
                  type="date"
                  value={expiryFrom}
                  onChange={(e) => {setExpiryFrom(e.target.value); setPagination(p=>({...p,page:1}));}}
                  className="h-9 text-xs border-gray-200 bg-gray-50/50 shadow-none"
                />
              </div>

              {/* Expiry To */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Expiry To</label>
                <Input
                  type="date"
                  value={expiryTo}
                  onChange={(e) => {setExpiryTo(e.target.value); setPagination(p=>({...p,page:1}));}}
                  className="h-9 text-xs border-gray-200 bg-gray-50/50 shadow-none"
                />
              </div>

              {/* TTI Retest */}
              <div className="w-40 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">TTI Retest</label>
                <label className="flex items-center gap-2 h-9 px-3 border border-gray-200 rounded-lg bg-gray-50/50 text-xs font-medium text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ttiRetest}
                    onChange={(e) => { setTtiRetest(e.target.checked); setPagination(p=>({...p,page:1})); }}
                  />
                  Retest Only
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3 pt-4">
                <button
                  type="button"
                  onClick={() => fetchRows(pagination.page)}
                  disabled={isLoading}
                  title="Refresh"
                  aria-label="Refresh"
                  className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                {(search || componentType || status !== "in-stock" || bloodGroup || rh || expiryFrom || expiryTo || source !== "all" || ttiRetest) && (
                  <button
                    onClick={() => {
                      setSearch(""); setSearchInput(""); setComponentType(""); setStatus("in-stock");
                      setBloodGroup(""); setRh(""); setExpiryFrom(""); setExpiryTo("");
                      setSortBy("createdAt"); setOrder("desc"); setSource("all"); setTtiRetest(false);
                      setPagination(p=>({...p,page:1}));
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                    title="Clear all filters"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="text-sm font-semibold text-gray-700">Inventory Records ({pagination.total || 0})</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="pl-4 pr-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage / Destination</th>
                  <th className="pl-1 pr-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading stock...
                        </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                    <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-500 font-medium">
                        No inventory items found matching the selection.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r._id}
                      className={`transition-colors ${
                        r.status === "quarantine" ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-1.5">
                          {r?.bag?.bagNo || r.bagNo}
                          {r.source === 'LOAN' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">Loan</span>
                          )}
                        </div>
                        {r.ttiRetest && (
                          <div className="mt-1">
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500 text-white border border-orange-600">
                              TTI Retest Was Done
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.componentType}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.bag?.bloodGroup} {r?.bag?.rh}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {r?.bag?.donationDate ? (() => {
                          const d = new Date(r.bag.donationDate);
                          if (isNaN(d.getTime())) return '-';
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {r?.component?.expiryDate ? (() => {
                          const d = new Date(r.component.expiryDate);
                          if (isNaN(d.getTime())) return '-';
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })() : '-'}
                      </td>
                      <td className="pl-4 pr-1 py-3 text-sm">
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                r.status === "in-stock"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : r.status === "reserved"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : r.status === "quarantine"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : "bg-gray-50 text-gray-700 border-gray-100"
                            }`}
                        >
                            {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {r.status === "in-stock" || r.status === "quarantine"
                          ? (r.storageLocation || "Main Fridge")
                          : (r.hospital?.name || r.storageLocation || "—")}
                      </td>
                      <td className="pl-1 pr-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => setSelectedViewItem(r)}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold text-gray-700 hover:text-white hover:bg-gray-800 border-gray-200"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                          <Button
                            onClick={() => setSelectedPrintItem(r)}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold text-red-800 hover:text-white hover:bg-red-800 border-red-200"
                          >
                            Print Label
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Refined Pagination Footer */}
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
                  onValueChange={(val) => {
                    const newLimit = Number(val);
                    setPagination(p => ({ ...p, limit: newLimit, page: 1 }));
                    fetchRows(1, newLimit);
                  }}
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
                  onClick={() => {
                    const page = Math.max(1, pagination.page - 1);
                    setPagination(p => ({ ...p, page }));
                    fetchRows(page);
                  }}
                  disabled={pagination.page === 1 || isLoading}
                  className="h-8 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  PREV
                </Button>
                
                <div className="flex items-center gap-1">
                    {(() => {
                        const pages = [];
                        let startPage = Math.max(1, pagination.page - 2);
                        let endPage = Math.min(pagination.totalPages, pagination.page + 2);
                        
                        if (endPage - startPage < 4) {
                            if (startPage === 1) endPage = Math.min(pagination.totalPages, startPage + 4);
                            else startPage = Math.max(1, endPage - 4);
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                            if (i > 0 && i <= pagination.totalPages) {
                                pages.push(
                                    <Button
                                        key={i}
                                        variant={pagination.page === i ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setPagination(p => ({ ...p, page: i }));
                                            fetchRows(i);
                                        }}
                                        disabled={isLoading}
                                        className={`w-8 h-8 p-0 text-xs font-bold ${pagination.page === i ? "bg-red-600 hover:bg-red-700" : ""}`}
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
                  onClick={() => {
                    const page = Math.min(pagination.totalPages, pagination.page + 1);
                    setPagination(p => ({ ...p, page }));
                    fetchRows(page);
                  }}
                  disabled={pagination.page === pagination.totalPages || isLoading}
                  className="h-8 text-xs font-bold"
                >
                  NEXT
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      <StockViewModal item={selectedViewItem} onClose={() => setSelectedViewItem(null)} formatDate={formatDate} />

      {/* Print Preview Modal */}
      <StockPrintLabelModal item={selectedPrintItem} onClose={() => setSelectedPrintItem(null)} formatDate={formatDate} />
    </div>
  );
};

export default Stock;

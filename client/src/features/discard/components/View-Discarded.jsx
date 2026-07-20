import { useEffect } from "react"
import { useState } from "react"
import { AlertTriangle, Search, Calendar, X, ChevronLeft, ChevronRight, Loader2, Layers, Plus, RefreshCw } from "lucide-react"
import { apiClient } from "@/core/api-client"
import { useAuth } from "@/store/auth"
import DiscardTable from "./DiscardTable"
import DiscardDetailsModal from "./DiscardDetailsModal"
import CreateDiscardModal from "./CreateDiscardModal"
import ViewInspectionModal from "./ViewInspectionModal"
import BatchDiscardTable from "./BatchDiscardTable"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown"
import IframePreviewModal from "@/components/shared/IframePreviewModal"
import { exportProcurementDiscard } from "@/utils/excelExportHelper"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/format-date"

const ViewDiscarded = () => {
    const { API, authorizationToken } = useAuth();
    const [selectedItem, setSelectedItem] = useState(null)
    const [showBagDetails, setShowBagDetails] = useState(false)
    const [discardedItems, setDiscardedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [paginationData, setPaginationData] = useState();

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
      search: "",
      itemType: "all",
      fromDate: "",
      toDate: ""
    });
    const [sortBy] = useState("discardedAt");
    const [order, setOrder] = useState("desc");
    // const [sites, setSites] = useState([]);
    const [excelLoading, setExcelLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("unit");
    const [batchDiscards, setBatchDiscards] = useState([]);
    const [isBatchLoading, setIsBatchLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [selectedInspection, setSelectedInspection] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    const handleExportExcel = async (exportAll = false) => {
        try {
            setExcelLoading(true);
            let rawData = [];
            if (exportAll) {
                const response = await apiClient.get(`/api/discard/get-list`, {
                    params: {
                        page: 1,
                        limit: 5000,
                        search: filters.search || undefined,
                        itemType: filters.itemType === "all" ? undefined : filters.itemType,
                        fromDate: filters.fromDate || undefined,
                        toDate: filters.toDate || undefined,
                        sortBy,
                        order,
                    },
                });
                rawData = response?.data?.data || [];
            } else {
                rawData = discardedItems;
            }

            if (rawData.length === 0) {
                toast.info("No records to export");
                return;
            }

            // Map frontend naming/keys to what excelExportHelper expects
            const mappedData = rawData.map(r => ({
                bagNo: r.bagNo,
                componentId: r.componentId || r.componentNo,
                itemType: r.itemType,
                itemName: r.componentType || r.itemName || "—",
                reason: r.reason,
                discardedAt: r.discardedAt || r.createdAt
            }));

            await exportProcurementDiscard(mappedData);
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate Excel report");
        } finally {
            setExcelLoading(false);
        }
    };

    const getItems = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: rowsPerPage,
                search: filters.search || undefined,
                itemType: filters.itemType === "all" ? undefined : filters.itemType,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
                sortBy,
                order,
            };


            const response = await apiClient.get(`/api/discard/get-list`, {
                params,
            });

            if (response.status === 200) {
                setDiscardedItems(response.data.data || []);
                setPaginationData(response.data.pagination);
                setTotalPages(response.data?.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching discarded items:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getBatchDiscards = async () => {
        setIsBatchLoading(true);
        try {
            const response = await apiClient.get(`/api/v2/bag-inspection`, {
                params: { decision: 'REJECTED', pageSize: 200 },
            });
            setBatchDiscards(response.data?.data?.items || response.data?.data || []);
        } catch (e) {
            console.error("Failed to fetch batch discards", e);
        } finally {
            setIsBatchLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'batch') {
            getBatchDiscards();
        }
    }, [activeTab]);



    useEffect(() => {
        const timeoutId = setTimeout(() => {
          getItems();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [currentPage, rowsPerPage, filters, sortBy, order]);

    const handleFilterChange = (key, value) => {
      setFilters(prev => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    };

    const clearFilters = () => {
      setFilters({ search: "", itemType: "all", fromDate: "", toDate: "" });
      setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
      setCurrentPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
      setRowsPerPage(newLimit === "all" ? 5000 : parseInt(newLimit));
      setCurrentPage(1);
    };



    const handleViewDetails = (item) => {
        setSelectedItem(item)
    }


    const closeModal = () => {
        setSelectedItem(null)
        setShowBagDetails(false)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Compact Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                            <AlertTriangle className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">View Discarded Items</h1>
                            <p className="text-gray-500 text-sm">Management Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeTab === 'unit' && (
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-red-800 hover:bg-red-900 text-white font-semibold text-sm flex items-center gap-1.5 h-9"
                            >
                                <Plus className="w-4 h-4" /> Create Discard
                            </Button>
                        )}
                        <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-0 border-b border-gray-100 -mb-px">
                        {[
                            { key: 'unit', label: 'Blood Unit Discard', icon: AlertTriangle },
                            { key: 'batch', label: 'Batch Discard', icon: Layers },
                        ].map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.key
                                            ? 'border-red-800 text-red-800'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Container - Compact Spacing */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {activeTab === 'unit' ? (
                    <>
                        {/* Compact Filters Section */}
                        <Card className="mb-6 border-red-100 shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Search */}
                                    <div className="flex-1 min-w-[240px] space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Search Bag Number</label>
                                        <div className="relative group">
                                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 w-3.5 h-3.5 transition-colors" />
                                            <Input
                                                placeholder="Enter Bag Number..."
                                                value={filters.search}
                                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                                className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Item Type */}
                                    <div className="w-36 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Item Type</label>
                                        <Select value={filters.itemType} onValueChange={(val) => handleFilterChange("itemType", val)}>
                                            <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="Bag">Bags</SelectItem>
                                                <SelectItem value="Component">Components</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* From Date */}
                                    <div className="w-36 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">From Date</label>
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
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">To Date</label>
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

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 border-l border-gray-200 pl-3 pt-4">
                                        {(filters.search || filters.itemType !== "all" || filters.fromDate || filters.toDate) && (
                                            <button
                                                onClick={clearFilters}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                                                title="Clear all filters"
                                            >
                                                <X className="w-3 h-3" />
                                                Reset
                                            </button>
                                        )}
                                        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <div className="text-sm font-semibold text-gray-700">Discarded History ({paginationData?.total || 0})</div>
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
                                    <button
                                        type="button"
                                        onClick={() => getItems()}
                                        disabled={isLoading}
                                        title="Refresh"
                                        aria-label="Refresh"
                                        className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Table Section */}
                            <div className="overflow-x-auto">
                                <DiscardTable items={discardedItems} isLoading={isLoading} onView={handleViewDetails} />
                            </div>

                            {/* Refined Pagination Footer */}
                            <div className="flex items-center justify-between p-4 border-t bg-gray-50/10">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {((currentPage - 1) * rowsPerPage) + 1} to{" "}
                                        {Math.min(currentPage * rowsPerPage, paginationData?.totalFiltered || 0)} of{" "}
                                        {paginationData?.totalFiltered || 0} results
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Rows per page:</span>
                                        <Select
                                            value={rowsPerPage === 5000 ? "all" : rowsPerPage.toString()}
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
                                                <SelectItem value="all">All</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1 || isLoading}
                                            className="h-8 text-xs"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {(() => {
                                                const pages = [];
                                                let startPage = Math.max(1, currentPage - 2);
                                                let endPage = Math.min(totalPages, currentPage + 2);

                                                if (endPage - startPage < 4) {
                                                    if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
                                                    else startPage = Math.max(1, endPage - 4);
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
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages || isLoading}
                                            className="h-8 text-xs"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Cards (view-only) */}
                            <div className="md:hidden divide-y divide-red-100">
                                {discardedItems.map((item) => (
                                    <div key={item.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium text-slate-800">{item.bagNo}</div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.itemType === "Donation" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                                                {item.itemType}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            <div className="mb-1"><strong>Reason:</strong> {item.reason}</div>
                                            <div><strong>Discarded:</strong> {formatDateTime(item.discardedAt)}</div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <button
                                                onClick={() => handleViewDetails(item)}
                                                className="flex-1 border border-blue-200 text-blue-600 rounded-md py-2 text-sm hover:bg-blue-50"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <BatchDiscardTable
                        batchDiscards={batchDiscards}
                        isBatchLoading={isBatchLoading}
                        onRefresh={getBatchDiscards}
                        onViewReport={(ins) => {
                            setSelectedInspection(ins);
                            setShowViewModal(true);
                        }}
                    />
                )}
            </div>

            <DiscardDetailsModal
                selectedItem={selectedItem}
                showBagDetails={showBagDetails}
                onClose={closeModal}
                onToggleBagDetails={() => setShowBagDetails(!showBagDetails)}
            />

            <CreateDiscardModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={getItems}
                API={API}
                token={authorizationToken}
            />

            {showViewModal && selectedInspection && (
                <ViewInspectionModal
                    onClose={() => {
                        setShowViewModal(false);
                        setSelectedInspection(null);
                    }}
                    inspection={selectedInspection}
                    onViewReportImage={(url) => {
                        setPreviewUrl(url);
                        setPreviewTitle(`Lab Report Document: Batch ${selectedInspection.batchNumber}`);
                    }}
                />
            )}

            <IframePreviewModal
                isOpen={!!previewUrl}
                url={previewUrl}
                title={previewTitle}
                onClose={() => setPreviewUrl('')}
            />
        </div>
    )
}

export default ViewDiscarded;

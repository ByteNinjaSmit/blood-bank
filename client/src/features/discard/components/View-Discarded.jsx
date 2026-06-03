import React, { useEffect } from "react"
import { useState } from "react"
import { AlertTriangle, Search, Calendar, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import MasterLoader from "@/components/Loader"
import DiscardTable from "./DiscardTable"
import DiscardDetailsModal from "./DiscardDetailsModal"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Local button removed; table and modal handle their own buttons

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
    const [siteId, setSiteId] = useState("");
    const [sortBy, setSortBy] = useState("discardedAt");
    const [order, setOrder] = useState("desc");
    // const [sites, setSites] = useState([]);


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


            const response = await axios.get(`${API}/api/discard/get-list`, {
                headers: {
                    Authorization: authorizationToken,
                },
                params,
                withCredentials: true,
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
      setRowsPerPage(parseInt(newLimit));
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
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">View Discarded Items</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Management Portal</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container - Compact Spacing */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                            <Button onClick={getItems} variant="outline" size="sm" className="h-8 px-2" disabled={isLoading}>
                                <Loader2 className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                            </Button>
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
                                    value={rowsPerPage.toString()} 
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
                                    <div><strong>Discarded:</strong> {item.discardedAt}</div>
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
            </div>

            <DiscardDetailsModal
                selectedItem={selectedItem}
                showBagDetails={showBagDetails}
                onClose={closeModal}
                onToggleBagDetails={() => setShowBagDetails(!showBagDetails)}
            />
        </div>
    )
}

export default ViewDiscarded

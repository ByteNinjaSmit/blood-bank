import React, { useEffect } from "react"
import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import MasterLoader from "../Loader"
import Filters from "./Filters"
import RowsPerPageBar from "./RowsPerPageBar"
import DiscardTable from "./DiscardTable"
import DiscardDetailsModal from "./DiscardDetailsModal"

// Local button removed; table and modal handle their own buttons

const ViewDiscarded = () => {
    const { API, authorizationToken } = useAuth();
    const [selectedItem, setSelectedItem] = useState(null)
    const [showBagDetails, setShowBagDetails] = useState(false)
    const [discardedItems, setDiscardedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagignationData, setPagignationData] = useState();

    // Pagination (server-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // ------------
    // Filter
    // Filters
    const [itemType, setItemType] = useState("");
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
                itemType: itemType || undefined,
                // siteId: siteId || undefined,
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
                setPagignationData(response.data.pagination);
                setTotalPages(response.data?.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching discarded items:", error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        getItems();
    }, [API, currentPage, rowsPerPage, itemType, sortBy, order]);



    const handleViewDetails = (item) => {
        setSelectedItem(item)
    }


    const closeModal = () => {
        setSelectedItem(null)
        setShowBagDetails(false)
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-br from-red-800 via-red-700 to-red-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/15 rounded-xl backdrop-blur-md">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">View Discarded Items</h1>
                            <p className="text-red-100 mt-1">Manage discarded blood bags and components</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                    <div className="p-6 border-b border-red-100">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-semibold text-slate-800">Discarded Items</h2>
                            <div className="text-sm text-slate-600">Total: {pagignationData?.total || 0} | Filtered: {pagignationData?.totalFiltered || 0}</div>
                        </div>
                        <Filters
                            itemType={itemType}
                            setItemType={setItemType}
                            siteId={siteId}
                            setSiteId={setSiteId}
                            order={order}
                            setOrder={setOrder}
                            setSortBy={setSortBy}
                            setCurrentPage={setCurrentPage}
                            onReset={() => { setItemType(""); setSiteId(""); setOrder("desc"); setSortBy("discardedAt"); }}
                        />
                    </div>

                    <RowsPerPageBar rowsPerPage={rowsPerPage} onChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }} />

                    {/* Desktop Table */}
                    <DiscardTable items={discardedItems} isLoading={isLoading} onView={handleViewDetails} />
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-end p-4 border-t border-red-100 text-sm">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
                            >
                                Previous
                            </button>
                            <span className="text-slate-700">Page {currentPage} of {totalPages || 1}</span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className={`px-3 py-1 rounded-md ${currentPage === totalPages || totalPages === 0 ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
                            >
                                Next
                            </button>
                        </div>
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

import React, { useEffect } from "react"
import { useState } from "react"
import { ArrowLeft, Eye, Edit, Trash2, X, Calendar, AlertTriangle, User } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import MasterLoader from "../Loader"

const Button = ({ children, onClick, variant = "default", size = "default", className = "", ...props }) => {
    const baseClasses =
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
    const variants = {
        default: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-red-200 text-red-600 hover:bg-red-50",
        destructive: "bg-red-600 text-white hover:bg-red-700",
    }
    const sizes = {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-sm",
        lg: "h-11 px-8",
    }

    return (
        <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>
            {children}
        </button>
    )
}

const ViewDiscarded = () => {
    const { API, authorizationToken } = useAuth();
    const [selectedItem, setSelectedItem] = useState(null)
    const [showBagDetails, setShowBagDetails] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null })
    const [discardedItems, setDiscardedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagignationData, setPagignationData] = useState();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);


    // Get items for current page
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = discardedItems.slice(indexOfFirstItem, indexOfLastItem);

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
                console.log("Discarded items fetched:", response.data);
                setDiscardedItems(response.data.data);
                setPagignationData(response.data.pagination);

                // Update pagination info from backend
                setTotalPages(response.data.pagination.totalPages);
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


    //IMPLEMENT THIS IN BACKEND discard-model.js

    const handleEdit = (item) => {
        console.log("Edit item:", item)
        // Add edit functionality here
    }

    const handleDelete = (item) => {
        setDeleteConfirm({ show: true, item })
    }

    const confirmDelete = () => {
        if (deleteConfirm.item) {
            console.log("Delete item:", deleteConfirm.item)
            // Implement actual delete functionality here
            setDeleteConfirm({ show: false, item: null })
        }
    }

    const cancelDelete = () => {
        setDeleteConfirm({ show: false, item: null })
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
                    <div className="p-6 border-b border-red-100 flex gap-3">
                        <h2 className="text-xl font-semibold text-slate-800">Discarded Items</h2>
                        <p className="text-slate-600 mt-1">Total: {pagignationData?.total} items</p>
                        <p className="text-slate-600 mt-1">Filtered: {pagignationData?.totalFiltered} items</p>
                        
                    </div>
                    {/* Filters Section */}
                    <div className="flex flex-col sm:flex-row gap-4 p-6 border-b border-red-100 bg-red-50/30">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Item Type</label>
                            <select
                                value={itemType}
                                onChange={(e) => {
                                    setItemType(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                                <option value="">All</option>
                                <option value="Donation">Donation</option>
                                <option value="Component">Component</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
                            <select
                                value={siteId}
                                onChange={(e) => {
                                    setSiteId(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                                <option value="">All</option>
                            </select>
                        </div>


                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
                            <select
                                value={order}
                                onChange={(e) => {
                                    setOrder(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                                <option value="desc">Newest First</option>
                                <option value="asc">Oldest First</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setItemType("");
                                    setSiteId("");
                                    setOrder("desc");
                                    setSortBy("discardedAt");
                                    setCurrentPage(1);
                                }}
                                className="bg-gray-100 border border-gray-300 text-slate-700 rounded-md px-4 py-2 hover:bg-gray-200"
                            >
                                Reset
                            </button>
                        </div>
                    </div>


                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-red-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Bag No</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Component No</th>
                                    <th className="px-6 py-4 text-left text-sm text-wrap font-semibold text-slate-800">Component Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Item Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Reason</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Discarded Date</th>
                                    <th className="px-6 py-4 text-middle text-sm font-semibold text-slate-800">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-100">
                                {discardedItems?.map((item) => (
                                    <tr key={item.id} className="hover:bg-red-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.bagNo}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{item?.componentId}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{item?.componentType}</td>

                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${item.itemType === "Donation" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {item.itemType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{item.reason}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.discardedAt}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleViewDetails(item)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleEdit(item)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <div className="relative">
                                                    {/* <button
                                                        onClick={() => handleDelete(item)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button> */}
                                                    {deleteConfirm.show && deleteConfirm.item?.id === item.id && (
                                                        <div className="absolute top-8 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 min-w-48">
                                                            <p className="text-sm text-gray-700 mb-3">Do you want to Delete it?</p>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={confirmDelete}
                                                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                                >
                                                                    Yes
                                                                </button>
                                                                <button
                                                                    onClick={cancelDelete}
                                                                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                                                >
                                                                    No
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Pagination Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-red-100 text-sm">
                            <div className="flex items-center gap-2">
                                <span>Rows per page:</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={handleRowsPerPageChange}
                                    className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
                                >
                                    {[5, 10, 20, 50].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 mt-3 sm:mt-0">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-red-600 hover:bg-red-50"
                                        }`}
                                >
                                    Previous
                                </button>

                                <span className="text-slate-700">
                                    Page {currentPage} of {totalPages || 1}
                                </span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages || totalPages === 0
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-red-600 hover:bg-red-50"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-red-100">
                        {discardedItems.map((item) => (
                            <div key={item.id} className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-slate-800">{item.bagNo}</div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${item.itemType === "Donation" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                            }`}
                                    >
                                        {item.itemType}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-600">
                                    <div className="mb-1">
                                        <strong>Reason:</strong> {item.reason}
                                    </div>
                                    <div>
                                        <strong>Discarded:</strong> {item.discardedAt}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        onClick={() => handleViewDetails(item)}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                    </Button>
                                    <Button
                                        onClick={() => handleEdit(item)}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                    <div className="relative">
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {deleteConfirm.show && deleteConfirm.item?.id === item.id && (
                                            <div className="absolute top-8 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 min-w-48">
                                                <p className="text-sm text-gray-700 mb-3">Do you want to Delete it?</p>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={confirmDelete}
                                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        onClick={cancelDelete}
                                                        className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* View Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-red-100">
                            <h3 className="text-xl font-semibold text-slate-800">Item Details</h3>
                            <Button
                                onClick={closeModal}
                                variant="outline"
                                size="sm"
                                className="text-slate-500 hover:text-slate-700 bg-transparent"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Bag Number</label>
                                        <div className="mt-1 text-slate-800 font-medium">{selectedItem.bagNo}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Item Type</label>
                                        <div className="mt-1">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${selectedItem.itemType === "Donation"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {selectedItem.itemType}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Item ID</label>
                                        <div className="mt-1 text-slate-800">{selectedItem.itemId}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Site ID</label>
                                        <div className="mt-1 text-slate-800">{selectedItem.siteId}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Discarded Date</label>
                                        <div className="mt-1 text-slate-800 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            {selectedItem.discardedAt}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Created Date</label>
                                        <div className="mt-1 text-slate-800">{new Date(selectedItem.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Discard Reason</label>
                                <div className="mt-1 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-slate-800">{selectedItem.reason}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-red-100 pt-6">
                                <Button
                                    onClick={() => setShowBagDetails(!showBagDetails)}
                                    variant="outline"
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    {showBagDetails ? "Hide Bag Details" : "View Bag Details"}
                                </Button>
                                {showBagDetails && (
                                    <div className="mt-4 max-h-64 overflow-y-auto bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="p-4 space-y-4">
                                            {/* Bag Information */}
                                            <h4 className="font-semibold text-slate-800 border-b border-slate-300 pb-2">
                                                Bag Information
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-slate-600">Bag Number:</span>
                                                    <div className="text-slate-800">{selectedItem.bagNo}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Segment ID:</span>
                                                    <div className="text-slate-800">{selectedItem.segmentId}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Collection Date:</span>
                                                    <div className="text-slate-800">{selectedItem.collectionDate}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Expiry Date:</span>
                                                    <div className="text-slate-800">{selectedItem.expiryDate}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Status:</span>
                                                    <div className="text-slate-800">{selectedItem.status}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Initial Vitals:</span>
                                                    <div className="text-slate-800">
                                                        BP: {selectedItem.initialVitals?.bp}, HB: {selectedItem.initialVitals?.hb},
                                                        Weight: {selectedItem.initialVitals?.weightKg}kg, Pulse: {selectedItem.initialVitals?.pulse}BPM,
                                                        Temp: {selectedItem.initialVitals?.tempC}°C
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Donor Information */}
                                            <h4 className="font-semibold text-slate-800 border-b border-slate-300 pb-2 mt-4">
                                                Donor Information
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-slate-600">Donor ID:</span>
                                                    <div className="text-slate-800">{selectedItem.donorId}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">First Name:</span>
                                                    <div className="text-slate-800">{selectedItem.firstName}</div>
                                                </div>
                                                {selectedItem.middleName && (
                                                    <div>
                                                        <span className="font-medium text-slate-600">Middle Name:</span>
                                                        <div className="text-slate-800">{selectedItem.middleName}</div>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-medium text-slate-600">Last Name:</span>
                                                    <div className="text-slate-800">{selectedItem.lastName}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">DOB:</span>
                                                    <div className="text-slate-800">{selectedItem.dob}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Sex:</span>
                                                    <div className="text-slate-800">{selectedItem.sex}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Phone:</span>
                                                    <div className="text-slate-800">{selectedItem.phone}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Email:</span>
                                                    <div className="text-slate-800">{selectedItem.email}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Blood Group:</span>
                                                    <div className="text-slate-800">{selectedItem.bloodGroup}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">RH Factor:</span>
                                                    <div className="text-slate-800">{selectedItem.rh}</div>
                                                </div>
                                            </div>

                                            {/* Component Information */}
                                            {selectedItem.componentType && (
                                                <>
                                                    <h4 className="font-semibold text-slate-800 border-b border-slate-300 pb-2 mt-4">
                                                        Component Information
                                                    </h4>
                                                    <div className="text-sm text-slate-800">
                                                        <div>
                                                            <span className="font-medium text-slate-600">Component Type:</span>{" "}
                                                            {selectedItem.componentType}
                                                        </div>
                                                        <div className="mt-1">
                                                            <span className="font-medium text-slate-600">Test Results:</span>
                                                            <div className="mt-1 p-2 bg-green-50 rounded border border-green-200">
                                                                {selectedItem.testResults}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ViewDiscarded

import React, { useEffect } from "react"
import { useState } from "react"
import { ArrowLeft, Eye, Edit, Trash2, X, Calendar, AlertTriangle, User } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"

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

const ViewDiscarded = ({ onBack }) => {
    const { API, authorizationToken } = useAuth();
    const [selectedItem, setSelectedItem] = useState(null)
    const [showBagDetails, setShowBagDetails] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null })

    const [discardedItems] = useState([
        {
            id: "1",
            itemType: "Donation",
            itemId: "DON001",
            bagNo: "BG001",
            reason: "Expired blood bag",
            discardedAt: "2024-01-15",
            siteId: "SITE001",
            createdAt: "2024-01-15T10:30:00Z",
        },
        {
            id: "2",
            itemType: "Component",
            itemId: "COMP002",
            bagNo: "BG002",
            reason: "Contamination detected",
            discardedAt: "2024-01-14",
            siteId: "SITE002",
            createdAt: "2024-01-14T14:20:00Z",
        },
        {
            id: "3",
            itemType: "Donation",
            itemId: "DON003",
            bagNo: "BG003",
            reason: "Storage temperature breach",
            discardedAt: "2024-01-13",
            siteId: "SITE001",
            createdAt: "2024-01-13T09:15:00Z",
        },
    ])

    const getItems = async () => {
        try {
            const response = await axios.get(`${API}/api/discard/get-list`, {
                headers: {
                    Authorization: authorizationToken,
                }, withCredentials: true,
            });

            if (response.status == 200) {
                console.log("Discarded items fetched:", response.data)
            }
        } catch (error) {
            console.error("Error fetching discarded items:", error)
        }
    }

    useEffect(() => {
        getItems();
    }, [API])

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
    // Mock donor data for demonstration [remove it later]
    const mockDonorData = {
        segmentId: "SEG123456",
        collectionDate: "2024-01-10",
        expiryDate: "2024-02-10",
        initialVitals: { hb: 13.5, weightKg: 70, pulse: 72, tempC: 36.6, bp: "120/80" },
        status: "Discarded",
        donorId: "D001",
        firstName: "John",
        middleName: "Michael",
        lastName: "Doe",
        uid: "UID123456789",
        dob: "1990-05-15",
        sex: "Male",
        phone: "+1-555-0123",
        email: "john.doe@email.com",
        bloodGroup: "O",
        rh: "Positive",
        testResults: "All tests passed - HIV: Negative, HBV: Negative, HCV: Negative, Syphilis: Negative",
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-br from-red-800 via-red-700 to-red-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            onClick={onBack}
                            variant="outline"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </div>
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
                        <h2 className="text-xl font-semibold text-slate-800">Discarded Items</h2>
                        <p className="text-slate-600 mt-1">Total: {discardedItems.length} items</p>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-red-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Bag No</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Item Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Reason</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Discarded Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-100">
                                {discardedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-red-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.bagNo}</td>
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                    //                             segmentId: "SEG123456",
                                    // collectionDate: "2024-01-10",
                                    // expiryDate: "2024-02-10",
                                    // initialVitals: { hb: 13.5, weightKg: 70, pulse: 72, tempC: 36.6, bp: "120/80" },
                                    // status: "Discarded",
                                    <div className="mt-4 max-h-64 overflow-y-auto bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="p-4 space-y-4">
                                            <h4 className="font-semibold text-slate-800 border-b border-slate-300 pb-2">Bag Information</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-slate-600">Segment ID:</span>
                                                    <div className="text-slate-800">{mockDonorData.segmentId}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Collection Date:</span>
                                                    <div className="text-slate-800">{mockDonorData.collectionDate}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Expiry Date:</span>
                                                    <div className="text-slate-800">{mockDonorData.expiryDate}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Status:</span>
                                                    <div className="text-slate-800">{mockDonorData.status}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Initial Vitals:</span>
                                                    <div className="text-slate-800">BP: {mockDonorData.initialVitals.bp}, HB: {mockDonorData.initialVitals.hb}, Weight: {mockDonorData.initialVitals.weightKg}kg, Pulse:{mockDonorData.initialVitals.pulse}BPM, Temp: {mockDonorData.initialVitals.tempC}°C</div>
                                                </div>
                                            </div>

                                            <h4 className="font-semibold text-slate-800 border-b border-slate-300 pb-2">Donor Information</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-slate-600">Donor ID:</span>
                                                    <div className="text-slate-800">{mockDonorData.donorId}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">UID:</span>
                                                    <div className="text-slate-800">{mockDonorData.uid}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">First Name:</span>
                                                    <div className="text-slate-800">{mockDonorData.firstName}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Middle Name:</span>
                                                    <div className="text-slate-800">{mockDonorData.middleName}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Last Name:</span>
                                                    <div className="text-slate-800">{mockDonorData.lastName}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Date of Birth:</span>
                                                    <div className="text-slate-800">{mockDonorData.dob}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Sex:</span>
                                                    <div className="text-slate-800">{mockDonorData.sex}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Phone:</span>
                                                    <div className="text-slate-800">{mockDonorData.phone}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Email:</span>
                                                    <div className="text-slate-800">{mockDonorData.email}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">Blood Group:</span>
                                                    <div className="text-slate-800">{mockDonorData.bloodGroup}</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600">RH Factor:</span>
                                                    <div className="text-slate-800">{mockDonorData.rh}</div>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-slate-300">
                                                <span className="font-medium text-slate-600">Test Results:</span>
                                                <div className="text-slate-800 mt-1 p-2 bg-green-50 rounded border border-green-200">
                                                    {mockDonorData.testResults}
                                                </div>
                                            </div>
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

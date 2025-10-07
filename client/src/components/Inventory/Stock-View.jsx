
import { useState } from "react"
import { ArrowLeft, Eye, Edit, Trash2, X, Download, Droplets } from "lucide-react"
// import * as XLSX from "xlsx"

const ViewStock = ({ onBack }) => {
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null })

  const stockItems = [
    {
      id: "1",
      componentId: "comp_001",
      bagNo: "BG001",
      bloodGroup: "A",
      rh: "Positive",
      componentType: "Whole Blood",
      volumeMl: 450,
      expiryDate: "2024-12-31",
      status: "in-stock",
      siteId: "site_001",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      componentId: "comp_002",
      bagNo: "BG002",
      bloodGroup: "O",
      rh: "Negative",
      componentType: "Plasma",
      volumeMl: 250,
      expiryDate: "2024-11-30",
      status: "reserved",
      reservedFor: "req_001",
      hospitalName: "City General Hospital",
      siteId: "site_001",
      createdAt: "2024-01-20",
    },
    {
      id: "3",
      componentId: "comp_003",
      bagNo: "BG003",
      bloodGroup: "B",
      rh: "Positive",
      componentType: "Red Blood Cells",
      volumeMl: 300,
      expiryDate: "2024-10-15",
      status: "issued",
      reservedFor: "req_002",
      hospitalName: "Metro Medical Center",
      siteId: "site_001",
      createdAt: "2024-01-25",
    },
  ]

  const filteredItems = stockItems.filter(
    (item) =>
      item.bagNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.componentType.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleView = (item) => {
    setSelectedItem(item)
  }

  const handleEdit = (item) => {
    console.log("Edit item:", item)
    // Implement edit functionality
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

  const getStatusColor = (status) => {
    switch (status) {
      case "in-stock":
        return "bg-green-100 text-green-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      case "issued":
        return "bg-blue-100 text-blue-800"
      case "discarded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getForValue = (item) => {
    if (item.status === "reserved" || item.status === "issued") {
      return item.hospitalName || "Unknown Hospital"
    }
    return "N/A"
  }

  const handleExport = () => {
    const rows = filteredItems.map((i) => ({
      "Bag No": i.bagNo,
      "Blood Group": i.bloodGroup,
      RH: i.rh,
      "Component Type": i.componentType,
      "Volume (ml)": i.volumeMl,
      "Expiry Date": i.expiryDate,
      Status: i.status,
      "Reserved For": i.reservedFor || "",
      "Hospital Name": i.hospitalName || "",
      "Site ID": i.siteId,
      "Created At": i.createdAt,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Stock")
    XLSX.writeFile(wb, "stock.xlsx")
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-orange-200 text-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center cursor-pointer gap-3 text-orange-800 border border-orange-300 hover:bg-orange-50 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Inventory
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Left section with icon + heading */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
                <p className="text-gray-600 mt-1">View and manage blood inventory stock</p>
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex gap-2">
              {/* Export button */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                title="Export to Excel"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by bag number, blood group, or component type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Bag No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Blood Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">RH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Component Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Volume (ml)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Reserved For
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.bagNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bloodGroup}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.rh}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.componentType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.volumeMl}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getForValue(item)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(item)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
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
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.bagNo}</h3>
                  <p className="text-sm text-gray-600">
                    {item.bloodGroup} {item.rh}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                >
                  {item.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Component:</span>
                  <span className="text-gray-900">{item.componentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume:</span>
                  <span className="text-gray-900">{item.volumeMl} ml</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expiry:</span>
                  <span className="text-gray-900">{new Date(item.expiryDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reserved For:</span>
                  <span className="text-gray-900">{getForValue(item)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleView(item)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-300 rounded hover:bg-red-50"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <div className="relative">
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-300 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg font-medium">No stock items found</p>
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Stock Item Details</h2>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bag Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedItem.bagNo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Component ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedItem.componentId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedItem.bloodGroup}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RH Factor</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedItem.rh}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Component Type</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedItem.componentType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Volume (ml)</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedItem.volumeMl}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Status Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(selectedItem.status)}`}
                    >
                      {selectedItem.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">For</label>
                    <p className="mt-1 text-sm text-gray-900">{getForValue(selectedItem)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedItem.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedItem.siteId}</p>
                  </div>
                  {selectedItem.reservedFor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reserved For ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedItem.reservedFor}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewStock

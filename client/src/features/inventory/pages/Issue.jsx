import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, PackageCheck, Plus, Trash2, Warehouse, MapPin } from "lucide-react";
import { toast } from "sonner";
import CustomModal from "@/components/CustomModal";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportIssues } from "@/utils/excelExportHelper";

const MultiBagSelect = ({ availableBags, selectedBags, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleBag = (bagId) => {
    const isSelected = selectedBags.includes(bagId);
    let newSelected;
    if (isSelected) {
      newSelected = selectedBags.filter(id => id !== bagId);
    } else {
      newSelected = [...selectedBags, bagId];
    }
    onChange(newSelected);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 text-left border rounded-md text-sm bg-white flex items-center justify-between shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 border-gray-300"
      >
        <span className="truncate">
          {selectedBags.length === 0 ? "Select blood bags..." : `${selectedBags.length} bag(s) selected`}
        </span>
        <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="mt-2 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md p-2 space-y-1 shadow-inner">
          {availableBags.length === 0 ? (
            <div className="text-xs text-gray-500 p-2 text-center">No bags available in stock</div>
          ) : (
            availableBags.map((bag) => {
              const isChecked = selectedBags.includes(bag._id);
              return (
                <label
                  key={bag._id}
                  className={`flex items-center gap-2 p-2 rounded hover:bg-red-50 cursor-pointer text-sm transition-colors duration-150 ${
                    isChecked ? "bg-red-50 text-red-900 font-bold" : "text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBag(bag._id)}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <div className="flex flex-col">
                    <span>Bag: {bag.bagNo} ({bag.component?.componentType || '—'})</span>
                    <span className="text-xs text-gray-400">Exp: {bag.component?.expiryDate ? new Date(bag.component.expiryDate).toLocaleDateString() : '—'}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const Issue = () => {
  const { API, authorizationToken, user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [storageOpen, setStorageOpen] = useState(false);
  const [storageLocation, setStorageLocation] = useState("SJS [Kopargaon]");
  const [otherLocationName, setOtherLocationName] = useState("");
  const [dispatchType, setDispatchType] = useState("STORAGE"); // STORAGE | THALASSEMIA
  const [patientDetails, setPatientDetails] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    age: "",
    sex: "M",
    bloodGroup: "A+",
  });
  const [storageBags, setStorageBags] = useState([{ componentType: "RBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [excelLoading, setExcelLoading] = useState(false);

  const mapIssuesForExport = (data) => {
    return data.map(r => ({
      bagNo: r?.bag?.bagNo || r.bagNo,
      componentType: r?.component?.componentType,
      bloodGroup: r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh === 'Positive' ? '+' : r.bag.rh === 'Negative' ? '-' : ''}`.trim() : '—',
      volumeMl: r?.component?.volumeMl,
      expiryDate: r?.component?.expiryDate,
      issuedToHospital: r?.hospital?.name || '—',
      issuedBy: r?.issuedBy || '—',
      issuedAt: r?.issuedAt || r?.updatedAt,
    }));
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let dataToExport = [];
      if (exportAll) {
        // Fetch all issued/matching items without limit (up to 5000)
        const res = await axios.get(`${API}/api/inventory`, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
          params: {
            page: 1,
            limit: 5000,
            status,
            componentType: componentType || undefined,
            search: search || undefined,
            sortBy,
            order,
          },
        });
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        dataToExport = mapIssuesForExport(data);
      } else {
        dataToExport = mapIssuesForExport(rows);
      }

      if (dataToExport.length === 0) {
        toast.info("No items to export");
        return;
      }

      await exportIssues(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  // filters
  const [componentType, setComponentType] = useState("");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("createdAt");

  const [selected, setSelected] = useState({});
  const [status, setStatus] = useState('issued');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const fetchRows = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/api/inventory`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
        params: {
          page,
          limit,
          status,
          componentType: componentType || undefined,
          search: search || undefined,
          sortBy,
          order,
        },
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

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const allSelectedIds = Object.keys(selected).filter((id) => selected[id]);

  const issue = async () => {
    if (allSelectedIds.length === 0) return toast.warning("Select items to issue");
    try {
      setIsLoading(true);
      await axios.post(`${API}/api/inventory/issue`, {
        inventoryIds: allSelectedIds,
        userId: user?._id || user?.id,
      }, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      toast.success("Issued selected items");
      setSelected({});
      fetchRows(pagination.page);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to issue");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableUnits = async () => {
    setLoadingAvailable(true);
    try {
      const res = await axios.get(`${API}/api/inventory`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
        params: {
          page: 1,
          limit: 5000,
          status: 'in-stock', // gets RELEASED units
        },
      });
      setAvailableUnits(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      toast.error("Failed to fetch available blood units for storage");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleSendToStorage = async () => {
    const isThalassemia = dispatchType === "THALASSEMIA";
    let locationVal = null;
    if (!isThalassemia) {
      locationVal = storageLocation === 'Others' ? otherLocationName.trim() : storageLocation;
      if (!locationVal) {
        return toast.warning("Please specify a storage location");
      }
    } else {
      if (!patientDetails.firstName.trim() || !patientDetails.lastName.trim()) {
        return toast.warning("Please enter Thalassemia patient first name and last name");
      }
      if (!patientDetails.age || isNaN(Number(patientDetails.age))) {
        return toast.warning("Please enter a valid age");
      }
    }

    const bagsPayload = [];
    storageBags.forEach(comp => {
      comp.groups.forEach(group => {
        if (group.selectedBags && group.selectedBags.length > 0) {
          bagsPayload.push({
            bloodGroup: group.bloodGroup,
            bagIds: group.selectedBags,
          });
        }
      });
    });

    if (bagsPayload.length === 0) {
      return toast.warning("Please select at least one blood bag to send to storage");
    }

    try {
      setIsLoading(true);
      await axios.post(`${API}/api/inventory/send-to-storage`, {
        location: storageLocation,
        otherLocationName: otherLocationName.trim(),
        bags: bagsPayload,
        userId: user?._id || user?.id,
        dispatchType,
        thalassemiaPatient: isThalassemia ? {
          ...patientDetails,
          firstName: patientDetails.firstName.trim(),
          middleName: patientDetails.middleName.trim(),
          lastName: patientDetails.lastName.trim(),
          address: patientDetails.address.trim(),
          age: Number(patientDetails.age),
        } : null,
      }, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });

      toast.success(isThalassemia ? "Issued to Thalassemia patient successfully" : "Blood bags sent to storage successfully");
      setStorageOpen(false);
      setStorageLocation("SJS [Kopargaon]");
      setOtherLocationName("");
      setDispatchType("STORAGE");
      setPatientDetails({
        firstName: "",
        middleName: "",
        lastName: "",
        address: "",
        age: "",
        sex: "M",
        bloodGroup: "A+",
      });
      setStorageBags([{ componentType: "RBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }]);
      fetchRows(pagination.page);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to issue blood units");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, componentType, search, order, sortBy]);

  const openView = (item) => { setViewItem(item); setViewOpen(true); };
  const closeView = () => { setViewOpen(false); setViewItem(null); };
  const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
              <PackageCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Issue Stock</h1>
              <p className="text-gray-600 mt-1">Issue previously reserved components</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setStorageOpen(true); fetchAvailableUnits(); }} className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-sm flex items-center gap-1.5 h-10 px-4 rounded-lg">
              <Warehouse className="w-4 h-4" /> Send to Storage
            </Button>
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">Total: {pagination.total || 0}</div>
              <div className="text-xs text-gray-500">Selected: <span className="font-medium">{allSelectedIds.length}</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Status</label>
                <select value={status} onChange={(e)=>{setStatus(e.target.value); setPagination(p=>({...p,page:1}));}} className="h-10 px-3 border rounded-md text-sm">
                  <option value="issued">Issued</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Component</label>
                <select value={componentType} onChange={(e)=>{setComponentType(e.target.value); setPagination(p=>({...p,page:1}));}} className="h-10 px-3 border rounded-md text-sm">
                  <option value="">All</option>
                  <option value="RBC">RBC</option>
                  <option value="FFP">FFP</option>
                  <option value="Platelet">Platelet</option>
                  <option value="Cryo">Cryo</option>
                </select>
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-xs text-gray-600 mb-1">Search Bag No</label>
                <input value={search} onChange={(e)=>{setSearch(e.target.value); setPagination(p=>({...p,page:1}));}} className="h-10 px-3 border rounded-md text-sm" placeholder="Bag ID" />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Order</label>
                <select value={order} onChange={(e)=>{setOrder(e.target.value); setPagination(p=>({...p,page:1}));}} className="h-10 px-3 border rounded-md text-sm">
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={()=>fetchRows(pagination.page)} variant="outline" size="sm" className="h-10" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                </Button>
                <Button onClick={issue} size="sm" className="h-10" disabled={isLoading || allSelectedIds.length===0 || status!== 'reserved'}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Issue (${allSelectedIds.length})`}
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No items found.</td></tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={!!selected[r._id]} onChange={() => toggle(r._id)} disabled={status!== 'reserved'} />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r?.bag?.bagNo || r.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.componentType}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.bag?.bloodGroup} {r?.bag?.rh}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.volumeMl} mL</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => openView(r)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setPagination(p => ({ ...p, limit: newLimit, page: 1 }));
                  fetchRows(1, newLimit);
                }}
                className="border rounded-md px-2 py-1"
              >
                {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <button
                onClick={() => {
                  const page = Math.max(1, (pagination.page || 1) - 1);
                  setPagination(p => ({ ...p, page }));
                  fetchRows(page);
                }}
                disabled={(pagination.page || 1) === 1}
                className={`px-3 py-1 rounded-md ${((pagination.page || 1) === 1) ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
              >
                Previous
              </button>
              <span className="text-slate-700">Page {pagination.page || 1} of {pagination.totalPages || 1}</span>
              <button
                onClick={() => {
                  const page = Math.min(pagination.totalPages || 1, (pagination.page || 1) + 1);
                  setPagination(p => ({ ...p, page }));
                  fetchRows(page);
                }}
                disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
                className={`px-3 py-1 rounded-md ${((pagination.page || 1) >= (pagination.totalPages || 1)) ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <CustomModal open={viewOpen} onCancel={closeView} title={status === 'issued' ? 'Issued Component Details' : 'Reserved Component Details'} size="lg" hideFooter>
        {viewItem && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600">Bag No</div>
                <div className="font-medium">{viewItem?.bag?.bagNo || viewItem?.bagNo}</div>
              </div>
              <div>
                <div className="text-gray-600">Component</div>
                <div className="font-medium">{viewItem?.component?.componentType} • {viewItem?.component?.volumeMl} mL</div>
              </div>
              <div>
                <div className="text-gray-600">Blood Group</div>
                <div className="font-medium">{viewItem?.bag ? `${viewItem.bag.bloodGroup} ${viewItem.bag.rh}` : '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Expiry</div>
                <div className="font-medium">{viewItem?.component?.expiryDate ? new Date(viewItem.component.expiryDate).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-medium capitalize">{viewItem?.status}</div>
              </div>
              {viewItem?.storageLocation ? (
                <div>
                  <div className="text-gray-600">Storage Location</div>
                  <div className="font-medium text-red-800">{viewItem.storageLocation}</div>
                </div>
              ) : viewItem?.thalassemiaPatient ? (
                <div>
                  <div className="text-gray-600">Recipient Category</div>
                  <div className="font-medium text-red-850 font-bold">Thalassemia Recipient</div>
                </div>
              ) : viewItem?.hospital && (
                <div>
                  <div className="text-gray-600">Hospital</div>
                  <div className="font-medium">{viewItem.hospital?.name}</div>
                </div>
              )}
              {viewItem?.thalassemiaPatient && (
                <div className="md:col-span-2 p-3 bg-red-50/50 rounded-lg border border-red-100">
                  <div className="text-xs font-bold text-red-850 uppercase mb-2">Thalassemia Patient Recipient</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Name</div>
                      <div className="font-bold text-gray-800">
                        {viewItem.thalassemiaPatient.firstName} {viewItem.thalassemiaPatient.middleName} {viewItem.thalassemiaPatient.lastName}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Age / Sex</div>
                      <div className="font-bold text-gray-800">
                        {viewItem.thalassemiaPatient.age} Yrs / {viewItem.thalassemiaPatient.sex}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Patient Group</div>
                      <div className="font-bold text-gray-800">{viewItem.thalassemiaPatient.bloodGroup}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Address</div>
                      <div className="font-bold text-gray-800">{viewItem.thalassemiaPatient.address || '—'}</div>
                    </div>
                  </div>
                </div>
              )}
              {((viewItem?.request && viewItem.request.patient) || viewItem?.reservedPatientName) && (
                <div className="md:col-span-2">
                  <div className="text-gray-600">Patient</div>
                  <div className="font-medium">
                    {viewItem?.request?.patient
                      ? `${viewItem.request.patient.name} • ${viewItem.request.patient.age}/${viewItem.request.patient.sex}`
                      : `${viewItem.reservedPatientName} • ${viewItem.reservedPatientAge}/${viewItem.reservedPatientSex}`}
                  </div>
                </div>
              )}
              {viewItem?.reservedAt && (
                <div>
                  <div className="text-gray-600">Reserved At</div>
                  <div className="font-medium">{fmt(viewItem.reservedAt)}</div>
                </div>
              )}
              {viewItem?.issuedAt && (
                <div>
                  <div className="text-gray-600">Issued At</div>
                  <div className="font-medium">{fmt(viewItem.issuedAt)}</div>
                </div>
              )}
              {viewItem?.issuedBy && (
                <div>
                  <div className="text-gray-600">Issued By</div>
                  <div className="font-medium">{String(viewItem.issuedBy)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CustomModal>

      <CustomModal open={storageOpen} onCancel={() => setStorageOpen(false)} title={dispatchType === "THALASSEMIA" ? "Thalassemia Patient Issue Form" : "Send to Storage Form"} size="xl" hideFooter>
        <div className="space-y-6 text-sm p-2">
          
          <div className="flex flex-col md:w-1/2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              Select Dispatch / Issue Type
            </label>
            <select
              value={dispatchType}
              onChange={(e) => setDispatchType(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
            >
              <option value="STORAGE">Send to Storage</option>
              <option value="THALASSEMIA">Thalassemia Patient Issue</option>
            </select>
          </div>

          {dispatchType === "STORAGE" ? (
            <>
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex gap-3 items-start animate-fadeIn">
                <Warehouse className="w-5 h-5 text-red-800 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm">Direct Storage Dispatch</h3>
                  <p className="text-gray-600 text-xs mt-0.5">Select available blood units to transfer directly to external storage locations.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    Target Storage Location
                  </label>
                  <select
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                  >
                    <option value="SJS [Kopargaon]">SJS [Kopargaon]</option>
                    <option value="Anand [Vaijapur]">Anand [Vaijapur]</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {storageLocation === "Others" && (
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Other Location Name
                    </label>
                    <input
                      type="text"
                      value={otherLocationName}
                      onChange={(e) => setOtherLocationName(e.target.value)}
                      className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                      placeholder="Enter custom storage location name"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200 animate-fadeIn">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Thalassemia Patient Recipient Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">First Name</label>
                  <input
                    type="text"
                    value={patientDetails.firstName}
                    onChange={(e) => setPatientDetails({ ...patientDetails, firstName: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Middle Name</label>
                  <input
                    type="text"
                    value={patientDetails.middleName}
                    onChange={(e) => setPatientDetails({ ...patientDetails, middleName: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter middle name"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Last Name</label>
                  <input
                    type="text"
                    value={patientDetails.lastName}
                    onChange={(e) => setPatientDetails({ ...patientDetails, lastName: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Age (Years)</label>
                  <input
                    type="number"
                    value={patientDetails.age}
                    onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="e.g. 24"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Sex</label>
                  <select
                    value={patientDetails.sex}
                    onChange={(e) => setPatientDetails({ ...patientDetails, sex: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="O">Other (O)</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Patient Blood Group</label>
                  <select
                    value={patientDetails.bloodGroup}
                    onChange={(e) => {
                      const bg = e.target.value;
                      setPatientDetails({ ...patientDetails, bloodGroup: bg });
                      // Set default group for the first selection row to match patient's group!
                      if (storageBags.length === 1 && storageBags[0].groups.length === 1 && storageBags[0].groups[0].selectedBags.length === 0) {
                        const newBags = [...storageBags];
                        newBags[0].groups[0].bloodGroup = bg;
                        setStorageBags(newBags);
                      }
                    }}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Address</label>
                  <input
                    type="text"
                    value={patientDetails.address}
                    onChange={(e) => setPatientDetails({ ...patientDetails, address: e.target.value })}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                    placeholder="Enter patient address"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Blood Bag Selection By Component</h4>
              <Button
                type="button"
                onClick={() => setStorageBags([...storageBags, { componentType: "RBC", groups: [{ bloodGroup: "A+", selectedBags: [] }] }])}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Component Section
              </Button>
            </div>

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
              {storageBags.map((comp, compIndex) => (
                <div key={compIndex} className="p-5 border rounded-xl bg-white shadow-sm border-gray-200 flex flex-col gap-4 relative">
                  
                  {/* Component Row Header */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Component Type</span>
                      <select
                        value={comp.componentType}
                        onChange={(e) => {
                          const newBags = [...storageBags];
                          newBags[compIndex].componentType = e.target.value;
                          // Reset bags in nested groups since component type changed
                          newBags[compIndex].groups = newBags[compIndex].groups.map(g => ({ ...g, selectedBags: [] }));
                          setStorageBags(newBags);
                        }}
                        className="h-9 px-3 border rounded-md text-xs bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
                      >
                        <option value="RBC">RBC (PRBC)</option>
                        <option value="FFP">FFP</option>
                        <option value="Platelet">Platelet (PLATELET_CONCENTRATE)</option>
                        <option value="Cryo">Cryo (CRYOPRECIPITATE)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          const newBags = [...storageBags];
                          newBags[compIndex].groups.push({ bloodGroup: "A+", bagType: "All", selectedBags: [] });
                          setStorageBags(newBags);
                        }}
                        variant="outline"
                        size="xs"
                        className="text-xs text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1 py-1 px-2.5 h-8 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Blood Group
                      </Button>

                      {storageBags.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setStorageBags(storageBags.filter((_, idx) => idx !== compIndex))}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                          title="Remove Component Section"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Groups List */}
                  <div className="space-y-4 pl-2 border-l-2 border-red-100">
                    {comp.groups.map((group, groupIndex) => {
                      // Filter available units to match this blood group AND component type AND bag type
                      const matchingAvailableBags = availableUnits.filter(u => {
                        const unitBg = `${u.bag?.bloodGroup}${u.bag?.rh === 'Positive' ? '+' : '-'}`;
                        
                        let unitComp = u.component?.componentType;
                        // Map database componentType names
                        if (unitComp === 'PRBC' || unitComp === 'RBC') unitComp = 'RBC';
                        else if (unitComp === 'FFP') unitComp = 'FFP';
                        else if (unitComp === 'PLATELET_CONCENTRATE' || unitComp === 'Platelet') unitComp = 'Platelet';
                        else if (unitComp === 'CRYOPRECIPITATE' || unitComp === 'Cryo') unitComp = 'Cryo';

                        const matchesBgAndComp = unitBg === group.bloodGroup && unitComp === comp.componentType;
                        if (!matchesBgAndComp) return false;

                        if (group.bagType && group.bagType !== "All") {
                          return u.typeOfBag === group.bagType;
                        }
                        return true;
                      });

                      // Get segment numbers for selected bags in this group
                      const selectedDetails = group.selectedBags.map(id => availableUnits.find(u => u._id === id)).filter(Boolean);

                      return (
                        <div key={groupIndex} className="p-3 border rounded-lg bg-slate-50/50 flex flex-col gap-2 relative">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-2 flex flex-col">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Blood Group</label>
                              <select
                                value={group.bloodGroup}
                                onChange={(e) => {
                                  const newBags = [...storageBags];
                                  newBags[compIndex].groups[groupIndex].bloodGroup = e.target.value;
                                  newBags[compIndex].groups[groupIndex].selectedBags = []; // reset bags when group changes
                                  setStorageBags(newBags);
                                }}
                                className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                              >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                  <option key={bg} value={bg}>{bg}</option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2 flex flex-col">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Bag Type</label>
                              <select
                                value={group.bagType || "All"}
                                onChange={(e) => {
                                  const newBags = [...storageBags];
                                  newBags[compIndex].groups[groupIndex].bagType = e.target.value;
                                  newBags[compIndex].groups[groupIndex].selectedBags = []; // reset bags when type changes
                                  setStorageBags(newBags);
                                }}
                                className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                              >
                                <option value="All">All Types</option>
                                <option value="SB">Single (SB)</option>
                                <option value="DB">Double (DB)</option>
                                <option value="TB">Triple (TB)</option>
                                <option value="QB">Quadruple (QB)</option>
                              </select>
                            </div>

                            <div className="md:col-span-7 flex flex-col">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Select Bags</label>
                              <MultiBagSelect
                                availableBags={matchingAvailableBags}
                                selectedBags={group.selectedBags}
                                onChange={(selectedIds) => {
                                  const newBags = [...storageBags];
                                  newBags[compIndex].groups[groupIndex].selectedBags = selectedIds;
                                  setStorageBags(newBags);
                                }}
                              />
                            </div>

                            <div className="md:col-span-1 flex justify-end">
                              {comp.groups.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newBags = [...storageBags];
                                    newBags[compIndex].groups = newBags[compIndex].groups.filter((_, idx) => idx !== groupIndex);
                                    setStorageBags(newBags);
                                  }}
                                  variant="outline"
                                  size="xs"
                                  className="h-9 w-9 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                                  title="Remove Blood Group"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {selectedDetails.length > 0 && (
                            <div className="mt-1 p-2 bg-white rounded-lg border border-slate-100 shadow-inner">
                              <div className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Loaded Segment Numbers:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedDetails.map(bag => (
                                  <span key={bag._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-805 text-xs border border-red-100 font-medium">
                                    <span className="font-extrabold">{bag.bagNo}</span>
                                    <span className="text-red-200">|</span>
                                    <span>Seg: <strong className="font-extrabold">{bag.segmentNo}</strong></span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-6">
            <Button onClick={() => setStorageOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button
              onClick={handleSendToStorage}
              disabled={isLoading || loadingAvailable}
              className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-6 shadow-md transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Dispatching...
                </>
              ) : (
                "Send to Storage"
              )}
            </Button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default Issue;

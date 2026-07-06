import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, PackageCheck, Plus, Trash2, Warehouse, MapPin, Eye } from "lucide-react";
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
  const [sentDate, setSentDate] = useState(new Date().toISOString().split('T')[0]);
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

  // ── Storage tabs state ──────────────────────────────
  const [mainTab, setMainTab] = useState('issue'); // 'issue' | 'storage' | 'thalassemia'
  const [storageSubTab, setStorageSubTab] = useState('SJS'); // 'SJS' | 'Anand'
  const [storageBagRows, setStorageBagRows] = useState([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageViewOpen, setStorageViewOpen] = useState(false);
  const [storageViewItem, setStorageViewItem] = useState(null);
  const [expandedDates, setExpandedDates] = useState(new Set()); // dates open in accordion

  // ── Thalassemia tab state ────────────────────────────
  const [thalRows, setThalRows] = useState([]);
  const [thalLoading, setThalLoading] = useState(false);
  const [thalViewOpen, setThalViewOpen] = useState(false);
  const [thalViewItem, setThalViewItem] = useState(null);
  const [thalPagination, setThalPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

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
        sentDate: isThalassemia ? null : sentDate,
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
      setSentDate(new Date().toISOString().split('T')[0]);
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

  const fetchStorageBags = async (location = storageSubTab) => {
    setStorageLoading(true);
    setExpandedDates(new Set()); // reset expanded on location change
    try {
      const res = await axios.get(`${API}/api/inventory`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
        params: { page: 1, limit: 500, status: 'issued', storageLocation: location, sortBy: 'issuedAt', order: 'desc' },
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setStorageBagRows(data);
      // Auto-expand the most recent date group
      if (data.length > 0) {
        const latestDate = new Date(data[0].issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        setExpandedDates(new Set([latestDate]));
      }
    } catch (e) {
      toast.error('Failed to fetch storage bags');
      setStorageBagRows([]);
    } finally {
      setStorageLoading(false);
    }
  };

  const toggleDateGroup = (dateKey) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  // Group storage bags by sent date
  const storageBagsByDate = React.useMemo(() => {
    const groups = {};
    storageBagRows.forEach(r => {
      const dateKey = r.issuedAt
        ? new Date(r.issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Unknown Date';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(r);
    });
    // Return as sorted array (most recent first)
    return Object.entries(groups).sort((a, b) => {
      const da = a[1][0]?.issuedAt ? new Date(a[1][0].issuedAt) : 0;
      const db = b[1][0]?.issuedAt ? new Date(b[1][0].issuedAt) : 0;
      return db - da;
    });
  }, [storageBagRows]);

  useEffect(() => {
    if (mainTab === 'storage') fetchStorageBags(storageSubTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab, storageSubTab]);

  const fetchThalassemia = async (page = thalPagination.page, limit = thalPagination.limit) => {
    setThalLoading(true);
    try {
      const res = await axios.get(`${API}/api/inventory`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
        params: { page, limit, status: 'issued', dispatchType: 'THALASSEMIA', sortBy: 'issuedAt', order: 'desc' },
      });
      setThalRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setThalPagination(p => ({ ...p, ...(res.data?.pagination || {}), page }));
    } catch (e) {
      toast.error('Failed to fetch thalassemia records');
      setThalRows([]);
    } finally {
      setThalLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'thalassemia') fetchThalassemia(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab]);

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

        {/* ── Main tab bar ─────────────────────────────────── */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {[
              { key: 'issue', label: 'Issue Stock', icon: <PackageCheck className="w-4 h-4" /> },
              { key: 'storage', label: 'Storage', icon: <Warehouse className="w-4 h-4" /> },
              { key: 'thalassemia', label: 'Thalassemia Patients', icon: <MapPin className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  mainTab === tab.key
                    ? 'border-red-700 text-red-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Storage tab ──────────────────────────────────── */}
        {mainTab === 'storage' && (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            {/* Sub-tabs */}
            <div className="flex gap-0 border-b border-gray-200 bg-gray-50">
              {[
                { key: 'SJS', label: 'SJS — Kopargaon' },
                { key: 'Anand', label: 'Anand' },
              ].map(sub => (
                <button
                  key={sub.key}
                  onClick={() => setStorageSubTab(sub.key)}
                  className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                    storageSubTab === sub.key
                      ? 'border-red-700 text-red-700 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 bg-gray-50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
              <div className="ml-auto flex items-center pr-4">
                <button
                  onClick={() => fetchStorageBags(storageSubTab)}
                  className="text-xs text-gray-500 hover:text-red-700 flex items-center gap-1"
                >
                  {storageLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '↻'} Refresh
                </button>
              </div>
            </div>

            {/* Summary bar */}
            <div className="px-5 py-2.5 border-b bg-gray-50/60 flex items-center gap-2 text-sm text-gray-600">
              <Warehouse className="w-3.5 h-3.5 text-gray-400" />
              Total bags sent to <strong className="text-gray-800">{storageSubTab}</strong>:
              <span className="font-semibold text-red-700">{storageBagRows.length}</span>
              {storageBagsByDate.length > 0 && (
                <span className="text-gray-400 ml-1">· {storageBagsByDate.length} date group{storageBagsByDate.length > 1 ? 's' : ''}</span>
              )}
            </div>

            {/* Accordion table header (always visible) */}
            <div className="overflow-x-auto">
              {storageLoading ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Loading storage records…</p>
                </div>
              ) : storageBagsByDate.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  No bags sent to {storageSubTab} yet.
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  {/* Column header */}
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-8 px-4 py-3"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Sent</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bags Count</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Components</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageBagsByDate.map(([dateKey, bags]) => {
                      const isOpen = expandedDates.has(dateKey);
                      const componentSummary = [...new Set(bags.map(b => b?.component?.componentType).filter(Boolean))].join(', ') || '—';
                      return (
                        <React.Fragment key={dateKey}>
                          {/* Date accordion header row */}
                          <tr
                            onClick={() => toggleDateGroup(dateKey)}
                            className={`border-b cursor-pointer select-none transition-colors ${isOpen ? 'bg-red-50 border-red-100' : 'bg-white hover:bg-gray-50'}`}
                          >
                            <td className="px-4 py-3.5 text-gray-400">
                              <span className={`inline-block transition-transform duration-200 text-xs ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-gray-800">{dateKey}</td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                {bags.length} bag{bags.length > 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-gray-500 text-xs">{componentSummary}</td>
                            <td className="px-4 py-3.5 text-right text-xs text-gray-400 pr-5">
                              {isOpen ? 'Collapse ▲' : 'Expand ▼'}
                            </td>
                          </tr>

                          {/* Expanded detail rows */}
                          {isOpen && (
                            <tr>
                              <td colSpan={5} className="p-0 border-b border-gray-200">
                                <div className="bg-gray-50/80 border-t border-gray-100">
                                  <table className="min-w-full text-sm">
                                    <thead>
                                      <tr className="bg-gray-100/80 border-b border-gray-200">
                                        <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bag No</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Segment No</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Group</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Volume</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent Date</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {bags.map(r => {
                                        const rh = r?.bag?.rh === 'Positive' ? '+' : r?.bag?.rh === 'Negative' ? '-' : r?.bag?.rh || '';
                                        return (
                                          <tr key={r._id} className="bg-white hover:bg-red-50/20 transition-colors">
                                            <td className="px-6 py-3 font-mono font-bold text-gray-800 text-xs">{r?.bag?.bagNo || r.bagNo || '—'}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.segmentNo || '—'}</td>
                                            <td className="px-4 py-3 text-gray-700 font-medium">{r?.component?.componentType || '—'}</td>
                                            <td className="px-4 py-3 font-bold text-gray-800">{r?.bag?.bloodGroup}{rh}</td>
                                            <td className="px-4 py-3 text-gray-600">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{r.issuedAt ? new Date(r.issuedAt).toLocaleString() : '—'}</td>
                                            <td className="px-4 py-3">
                                              <button
                                                onClick={() => { setStorageViewItem(r); setStorageViewOpen(true); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-xs font-medium transition-colors"
                                              >
                                                <Eye className="w-3.5 h-3.5" /> View
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Thalassemia Patients tab ─────────────────────── */}
        {mainTab === 'thalassemia' && (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-700" />
                <span className="font-semibold text-gray-800 text-sm">Thalassemia Patient Records</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Total: {thalPagination.total || thalRows.length}</span>
                <button
                  onClick={() => fetchThalassemia(1)}
                  className="text-xs text-gray-500 hover:text-red-700 flex items-center gap-1"
                >
                  {thalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '↻'} Refresh
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age / Sex</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Blood Group</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bag No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Group</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued At</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {thalLoading ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" /> Loading…
                    </td></tr>
                  ) : thalRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                      No thalassemia patient records found.
                    </td></tr>
                  ) : thalRows.map(r => {
                    const p = r.thalassemiaPatient || {};
                    const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || '—';
                    const rh = r?.bag?.rh === 'Positive' ? '+' : r?.bag?.rh === 'Negative' ? '-' : r?.bag?.rh || '';
                    return (
                      <tr key={r._id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-800">{fullName}</td>
                        <td className="px-4 py-3 text-gray-600">{p.age || '—'} / {p.sex || '—'}</td>
                        <td className="px-4 py-3 font-bold text-gray-800">{p.bloodGroup || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{r?.bag?.bagNo || r.bagNo || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{r?.component?.componentType || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{r?.bag?.bloodGroup}{rh}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.issuedAt ? new Date(r.issuedAt).toLocaleString() : '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setThalViewItem(r); setThalViewOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-xs font-medium transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Thalassemia pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-600">
              <span>Page {thalPagination.page || 1} of {thalPagination.totalPages || 1}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={thalPagination.page <= 1}
                  onClick={() => { const p = Math.max(1, (thalPagination.page || 1) - 1); fetchThalassemia(p); }}
                  className="px-3 py-1 rounded-md disabled:text-gray-300 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
                >Previous</button>
                <button
                  disabled={thalPagination.page >= thalPagination.totalPages}
                  onClick={() => { const p = (thalPagination.page || 1) + 1; fetchThalassemia(p); }}
                  className="px-3 py-1 rounded-md disabled:text-gray-300 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
                >Next</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Issue Stock tab ──────────────────────────────── */}
        {mainTab === 'issue' && (
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">Total: {pagination.total || 0}</div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No items found.</td></tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm font-bold text-gray-900">{r?.bag?.bagNo || r.bagNo}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">{r?.segmentNo || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.componentType}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.bag?.bloodGroup} {r?.bag?.rh}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.volumeMl} mL</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r?.issuedAt ? new Date(r.issuedAt).toLocaleDateString() : '—'}</td>
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
        )}
      </div>
      <CustomModal open={viewOpen} onCancel={closeView} title={status === 'issued' ? 'Issued Component Details' : 'Reserved Component Details'} size="lg" hideFooter>
        {viewItem && (
          <div className="space-y-5 text-sm">
            {/* Donor & Collection Section */}
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3">Donor & Collection Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Donor Name</div>
                  <div className="font-bold text-gray-800">{viewItem?.bag?.donorName || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Donation Date</div>
                  <div className="font-semibold text-gray-850">
                    {viewItem?.bag?.donationDate ? new Date(viewItem.bag.donationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Segment No</div>
                  <div className="font-mono text-gray-700">{viewItem?.bag?.segmentNo || viewItem?.segmentNo || '—'}</div>
                </div>
              </div>
            </div>

            {/* Component & Bag Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">Component & Bag Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Bag No</div>
                  <div className="font-bold text-gray-800 font-mono">{viewItem?.bag?.bagNo || viewItem?.bagNo || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Component Type</div>
                  <div className="font-bold text-gray-800">
                    {viewItem?.component?.componentType || '—'} {viewItem?.component?.volumeMl ? `• ${viewItem.component.volumeMl} mL` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                  <div className="font-bold text-red-700 text-base">
                    {viewItem?.bag ? `${viewItem.bag.bloodGroup} ${viewItem.bag.rh === 'Positive' ? '+' : viewItem.bag.rh === 'Negative' ? '-' : viewItem.bag.rh}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Expiry Date</div>
                  <div className="font-semibold text-gray-800">
                    {viewItem?.component?.expiryDate ? new Date(viewItem.component.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Requisition & Issuance Section */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Requisition & Issuance Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Current Status</div>
                  <div className="font-bold text-gray-800 uppercase">{viewItem?.status || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Issue / Dispatch Date</div>
                  <div className="font-bold text-gray-800">
                    {viewItem?.issuedAt ? new Date(viewItem.issuedAt).toLocaleString() : '—'}
                  </div>
                </div>
                {viewItem?.storageLocation ? (
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Storage Location</div>
                    <div className="font-bold text-red-800 flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5" /> {viewItem.storageLocation}
                    </div>
                  </div>
                ) : viewItem?.thalassemiaPatient ? (
                  <div className="md:col-span-2">
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Thalassemia Patient Recipient</div>
                    <div className="bg-white border border-red-100 rounded-lg p-3 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-gray-400">Name</div>
                        <div className="font-bold text-gray-800">
                          {viewItem.thalassemiaPatient.firstName} {viewItem.thalassemiaPatient.middleName} {viewItem.thalassemiaPatient.lastName}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Age / Sex</div>
                        <div className="font-bold text-gray-850">
                          {viewItem.thalassemiaPatient.age} Yrs / {viewItem.thalassemiaPatient.sex}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {viewItem?.hospital?.name && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Hospital / Facility</div>
                        <div className="font-semibold text-gray-800">{viewItem.hospital.name}</div>
                      </div>
                    )}
                    {((viewItem?.request && viewItem.request.patient) || viewItem?.reservedPatientName) && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Patient</div>
                        <div className="font-semibold text-gray-800">
                          {viewItem?.request?.patient
                            ? `${viewItem.request.patient.name} (${viewItem.request.patient.age}/${viewItem.request.patient.sex})`
                            : `${viewItem.reservedPatientName} (${viewItem.reservedPatientAge}/${viewItem.reservedPatientSex})`}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {viewItem?.reservedAt && (
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Reserved At</div>
                    <div className="text-gray-700">{new Date(viewItem.reservedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
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

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Sent Date
                  </label>
                  <input
                    type="date"
                    value={sentDate}
                    onChange={(e) => setSentDate(e.target.value)}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                  />
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

      {/* ── Storage Bag View Modal ──────────────────────── */}
      <CustomModal open={storageViewOpen} onCancel={() => { setStorageViewOpen(false); setStorageViewItem(null); }} title="Storage Bag Details" size="lg" hideFooter>
        {storageViewItem && (() => {
          const r = storageViewItem;
          const rh = r?.bag?.rh === 'Positive' ? '+' : r?.bag?.rh === 'Negative' ? '-' : r?.bag?.rh || '';
          return (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Bag No</div>
                  <div className="font-bold text-gray-800">{r?.bag?.bagNo || r.bagNo || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Segment No</div>
                  <div className="font-mono text-gray-700">{r.segmentNo || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Component</div>
                  <div className="font-semibold text-gray-800">{r?.component?.componentType || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                  <div className="font-bold text-gray-800">{r?.bag?.bloodGroup}{rh}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Volume</div>
                  <div className="text-gray-700">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Expiry Date</div>
                  <div className="text-gray-700">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Storage Location</div>
                  <div className="font-semibold text-gray-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-600" />{r.storageLocation || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Sent At</div>
                  <div className="text-gray-700">{r.issuedAt ? new Date(r.issuedAt).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Type of Bag</div>
                  <div className="text-gray-700">{r.typeOfBag || '—'}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* ── Thalassemia Patient View Modal ──────────────── */}
      <CustomModal open={thalViewOpen} onCancel={() => { setThalViewOpen(false); setThalViewItem(null); }} title="Thalassemia Patient Details" size="lg" hideFooter>
        {thalViewItem && (() => {
          const r = thalViewItem;
          const p = r.thalassemiaPatient || {};
          const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || '—';
          const rh = r?.bag?.rh === 'Positive' ? '+' : r?.bag?.rh === 'Negative' ? '-' : r?.bag?.rh || '';
          const req = r.requisition;
          return (
            <div className="space-y-5 text-sm">
              {/* Patient details section */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Patient Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Full Name</div>
                    <div className="font-bold text-gray-800 text-base">{fullName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                    <div className="font-bold text-red-700 text-base">{p.bloodGroup || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Age</div>
                    <div className="font-semibold text-gray-800">{p.age ? `${p.age} years` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Sex</div>
                    <div className="font-semibold text-gray-800">{p.sex || '—'}</div>
                  </div>
                  {p.address && (
                    <div className="md:col-span-2">
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Address</div>
                      <div className="text-gray-700">{p.address}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Blood bag details section */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">Blood Bag Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Bag No</div>
                    <div className="font-bold text-gray-800 font-mono">{r?.bag?.bagNo || r.bagNo || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Segment No</div>
                    <div className="font-mono text-gray-700">{r.segmentNo || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Component</div>
                    <div className="font-semibold text-gray-800">{r?.component?.componentType || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                    <div className="font-bold text-gray-800">{r?.bag?.bloodGroup}{rh}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Volume</div>
                    <div className="text-gray-700">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Expiry Date</div>
                    <div className="text-gray-700">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Type of Bag</div>
                    <div className="text-gray-700">{r.typeOfBag || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Issued At</div>
                    <div className="text-gray-700">{r.issuedAt ? new Date(r.issuedAt).toLocaleString() : '—'}</div>
                  </div>
                </div>
              </div>

              {/* Requisition details if present */}
              {req && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Requisition Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Requisition ID</div>
                      <div className="font-mono font-bold text-gray-800">{req.requisitionId || '—'}</div>
                    </div>
                    {req.doctorName && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Doctor / Clinician</div>
                        <div className="text-gray-700">{req.doctorName}</div>
                      </div>
                    )}
                    {req.requiredAt && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Required At</div>
                        <div className="text-gray-700">{new Date(req.requiredAt).toLocaleString()}</div>
                      </div>
                    )}
                    {req.patient && (
                      <div className="md:col-span-2">
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Requisition Patient</div>
                        <div className="text-gray-700">{req.patient.name || '—'} · {req.patient.age ? `${req.patient.age} yrs` : ''} {req.patient.sex || ''}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </CustomModal>
    </div>
  );
};

export default Issue;

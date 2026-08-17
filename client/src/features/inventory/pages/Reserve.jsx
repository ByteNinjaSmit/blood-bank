import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Hand, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { COMPONENT_TYPES, SEX_TYPES } from "@/features/requisition/pages/constants";
import ReasonForChangeModal from "@/components/shared/ReasonForChangeModal";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import SearchBox from "@/components/shared/SearchBox";
import { exportReserve } from "@/utils/excelExportHelper";
import ReserveDetailModal from "../components/ReserveDetailModal";

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTimeDMY = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
};

const Reserve = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [excelLoading, setExcelLoading] = useState(false);

  const mapReserveForExport = (data) => {
    return data.map(r => ({
      bagNo: r?.bag?.bagNo || r.bagNo,
      componentType: r?.component?.componentType,
      bloodGroup: r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh === 'Positive' ? '+' : r.bag.rh === 'Negative' ? '-' : ''}`.trim() : '—',
      volumeMl: r?.component?.volumeMl,
      expiryDate: r?.component?.expiryDate,
      reservedForHospital: r?.hospital?.name || '—',
      reservedUntil: r?.reservedUntil,
      patientName: r?.reservedPatientName || '—',
      patientAge: r?.reservedPatientAge ?? '—',
      patientSex: r?.reservedPatientSex || '—',
    }));
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let dataToExport = [];
      if (exportAll) {
        // Fetch all reserved items without limit (up to 5000)
        const res = await apiClient.get(`/api/inventory`, {
          params: {
            page: 1,
            limit: 5000,
            status: 'reserved',
            // No purpose filter — export the same set the list shows.
            componentType: componentType || undefined,
            search: search || undefined,
            bloodGroup: bloodGroup || undefined,
            sortBy,
            order,
          },
        });
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        dataToExport = mapReserveForExport(data);
      } else {
        dataToExport = mapReserveForExport(rows);
      }

      if (dataToExport.length === 0) {
        toast.info("No items to export");
        return;
      }

      await exportReserve(dataToExport);
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
  const [searchInput, setSearchInput] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [order, setOrder] = useState("desc");
  const [sortBy] = useState("createdAt");

  const [unreserveModalOpen, setUnreserveModalOpen] = useState(false);
  const [targetUnreserveId, setTargetUnreserveId] = useState(null);
  const [selectedReserve, setSelectedReserve] = useState(null);
  const [expandedRequisitions, setExpandedRequisitions] = useState(new Set());

  // Group the current page's reserved bags by their requisition so staff
  // can see, at a glance, everything reserved against a single request.
  const groupByRequisition = (list) => {
    const groups = new Map();
    for (const r of list) {
      const key = r?.requisition?.requisitionId || r?.requisition?._id || r?.requisitionId || 'unassigned';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    return Array.from(groups.entries());
  };

  const toggleRequisitionGroup = (key) => {
    setExpandedRequisitions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fetchRows = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/inventory`, {
        params: {
          page,
          limit,
          status: 'reserved',
          // No purpose filter: show every currently-reserved bag regardless
          // of whether it came from the Reserve wizard or a normal
          // requisition — reservation now happens as soon as a requisition
          // is created+matched, so those bags must show here too.
          componentType: componentType || undefined,
          search: search || undefined,
          bloodGroup: bloodGroup || undefined,
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

  const triggerUnreserveConfirm = (id) => {
    setTargetUnreserveId(id);
    setUnreserveModalOpen(true);
  };

  const handleUnreserveConfirm = async (reason) => {
    if (!targetUnreserveId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.post(`/api/inventory/unreserve`, {
        inventoryIds: [targetUnreserveId],
        reason,
        userId: user?._id,
      });
      if (res.data?.success) {
        toast.success("Blood bag successfully unreserved and returned to stock.");
        fetchRows(pagination.page);
        setUnreserveModalOpen(false);
      } else {
        toast.error(res.data?.message || "Failed to unreserve blood bag.");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Error unreserving blood bag.");
    } finally {
      setIsLoading(false);
      setTargetUnreserveId(null);
    }
  };

  const handleAdd = () => {
    navigate('/inventory/reserve/new');
  };

  useEffect(() => {
    fetchRows(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentType, search, bloodGroup, order, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <Hand className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reserved Stock</h1>
              <p className="text-gray-500 text-sm">Viewing only currently reserved components</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">Total: {pagination.total || 0}</div>
              <div />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Component</label>
                <select value={componentType} onChange={(e)=>{setComponentType(e.target.value); setPagination(p=>({...p,page:1}));}} className="h-10 px-3 border rounded-md text-sm">
                  <option value="">All</option>
                  {COMPONENT_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Blood Group</label>
                <select value={bloodGroup} onChange={(e)=>{setBloodGroup(e.target.value); setPagination(p=>({...p,page:1}));}} className="h-10 px-3 border rounded-md text-sm">
                  <option value="">All</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-xs text-gray-600 mb-1">Search Bag No</label>
                <SearchBox
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={() => { setSearch(searchInput); setPagination(p=>({...p,page:1})); }}
                  placeholder="Bag ID"
                  disabled={isLoading}
                  inputClassName="h-10"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Order</label>
                <select value={order} onChange={(e)=>{setOrder(e.target.value); setPagination(p=>({...p,page:1}));}} className="h-10 px-3 border rounded-md text-sm">
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
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
                <Button onClick={handleAdd} size="sm" className="h-10" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add Reservation`}
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requisition</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved For</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No items found.</td></tr>
                ) : (
                  groupByRequisition(rows).map(([reqKey, group]) => {
                    const isOpen = expandedRequisitions.has(reqKey);
                    const first = group[0];
                    return (
                      <React.Fragment key={reqKey}>
                        <tr
                          onClick={() => toggleRequisitionGroup(reqKey)}
                          className={`cursor-pointer select-none transition-colors ${isOpen ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-3.5 text-gray-400">
                            <span className={`inline-block transition-transform duration-200 text-xs ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{first?.requisition?.requisitionId || reqKey}</span>
                              {first?.reservedUntil && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                  Reserved Until: {formatDateTimeDMY(first.reservedUntil)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-700">{first?.hospital?.name || '—'}</td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              {group.length} bag{group.length > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right text-xs text-gray-400 pr-5">
                            {isOpen ? 'Collapse ▲' : 'Expand ▼'}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={5} className="p-0 border-b border-gray-200">
                              <div className="bg-gray-50/80 border-t border-gray-100 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100/80 border-b border-gray-200">
                                      <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bag No</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Volume</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reserved Until</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Age</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Sex</th>
                                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {group.map((r) => (
                                      <tr key={r._id} className="bg-white hover:bg-orange-50/20 transition-colors">
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{r?.bag?.bagNo || r.bagNo}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.componentType}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{r?.bag?.bloodGroup} {r?.bag?.rh}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatDateDMY(r?.component?.expiryDate)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatDateDMY(r?.reservedUntil)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{r?.reservedPatientName || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{(r?.reservedPatientAge ?? '') !== '' ? r.reservedPatientAge : '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{(() => {
                                          const sex = r?.reservedPatientSex;
                                          const found = (SEX_TYPES || []).find(s => s.value === sex);
                                          return found ? found.label : (sex || '—');
                                        })()}</td>
                                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap space-x-2">
                                          <button
                                            onClick={() => setSelectedReserve(r)}
                                            className="px-2.5 py-1 text-xs font-semibold text-orange-800 hover:text-white border border-orange-200 hover:bg-orange-800 rounded transition-all duration-150"
                                          >
                                            View
                                          </button>
                                          <button
                                            onClick={() => triggerUnreserveConfirm(r._id)}
                                            disabled={isLoading}
                                            className="px-2.5 py-1 text-xs font-semibold text-red-700 hover:text-white border border-red-200 hover:bg-red-600 rounded transition-all duration-150 disabled:opacity-50"
                                          >
                                            Unreserve
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
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

      <ReasonForChangeModal
        isOpen={unreserveModalOpen}
        title="Confirm Unreservation"
        message="Are you sure you want to unreserve this blood bag? It will be returned to the active inventory stock."
        actionLabel="Yes, Unreserve"
        fieldLabel="Reason for Unreserving"
        submitting={isLoading}
        onConfirm={handleUnreserveConfirm}
        onClose={() => {
          setUnreserveModalOpen(false);
          setTargetUnreserveId(null);
        }}
      />

      <ReserveDetailModal
        reserve={selectedReserve}
        onClose={() => setSelectedReserve(null)}
        formatDateDMY={formatDateDMY}
        formatDateTimeDMY={formatDateTimeDMY}
      />
    </div>
  );
};

export default Reserve;


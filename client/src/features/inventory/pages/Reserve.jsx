import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Hand, X } from "lucide-react";
import { toast } from "sonner";
import { COMPONENT_TYPES, SEX_TYPES } from "@/features/requisition/pages/constants";
import CustomModal from "@/components/CustomModal";

const Reserve = () => {
  const { API, authorizationToken, user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // filters
  const [componentType, setComponentType] = useState("");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("createdAt");

  const [selected, setSelected] = useState({});
  const [unreserveModalOpen, setUnreserveModalOpen] = useState(false);
  const [targetUnreserveId, setTargetUnreserveId] = useState(null);
  const [selectedReserve, setSelectedReserve] = useState(null);

  const fetchRows = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/api/inventory`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
        params: {
          page,
          limit,
          status: 'reserved',
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

  const triggerUnreserveConfirm = (id) => {
    setTargetUnreserveId(id);
    setUnreserveModalOpen(true);
  };

  const handleUnreserveConfirm = async () => {
    if (!targetUnreserveId) return;
    setUnreserveModalOpen(false);
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/inventory/unreserve`,
        { inventoryIds: [targetUnreserveId], userId: user?._id },
        {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        }
      );
      if (res.data?.success) {
        toast.success("Blood bag successfully unreserved and returned to stock.");
        fetchRows(pagination.page);
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
  }, [componentType, search, order, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
            <Hand className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reserved Stock</h1>
            <p className="text-gray-600 mt-1">Viewing only currently reserved components</p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">Total: {pagination.total || 0}</div>
              <div />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Component</label>
                <select value={componentType} onChange={(e)=>{setComponentType(e.target.value); setPagination(p=>({...p,page:1}));}} className="h-10 px-3 border rounded-md text-sm">
                  <option value="">All</option>
                  {COMPONENT_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
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
                <Button onClick={handleAdd} size="sm" className="h-10" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add`}
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved For</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved Until</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Age</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Sex</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan="11" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="11" className="px-4 py-8 text-center text-gray-500">No items found.</td></tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r?.bag?.bagNo || r.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.componentType}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.bag?.bloodGroup} {r?.bag?.rh}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.volumeMl} mL</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.hospital?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.reservedUntil ? new Date(r.reservedUntil).toLocaleDateString() : '—'}</td>
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

      <CustomModal
        open={unreserveModalOpen}
        title="Confirm Unreservation"
        description="Are you sure you want to unreserve this blood bag? It will be returned to the active inventory stock."
        confirmText="Yes, Unreserve"
        cancelText="Cancel"
        confirmVariant="danger"
        size="sm"
        onConfirm={handleUnreserveConfirm}
        onCancel={() => {
          setUnreserveModalOpen(false);
          setTargetUnreserveId(null);
        }}
      />

      {selectedReserve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-orange-100 bg-orange-50/20">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Reservation & Requisition Details</h3>
                <p className="text-xs text-orange-850 font-semibold uppercase tracking-wider mt-0.5">
                  Requisition ID: {selectedReserve.requisition?.requisitionId || 'N/A'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedReserve(null)}
                className="p-1 rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Card 1: Requisition Metadata */}
              <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-orange-900 border-b pb-1.5 uppercase tracking-wide">
                  Hospital & Clinician Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500">Hospital:</span>
                    <div className="text-slate-800 mt-0.5 font-medium">{selectedReserve.hospital?.name || '—'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Doctor / Clinician Name:</span>
                    <div className="text-slate-800 mt-0.5 font-medium">{selectedReserve.requisition?.doctorName || '—'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Reserved Until:</span>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      {selectedReserve.reservedUntil ? new Date(selectedReserve.reservedUntil).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Patient Information */}
              <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-orange-900 border-b pb-1.5 uppercase tracking-wide">
                  Patient Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500">Patient Name:</span>
                    <div className="text-slate-800 mt-0.5 font-semibold">{selectedReserve.requisition?.patient?.name || selectedReserve.reservedPatientName || '—'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Age & Sex:</span>
                    <div className="text-slate-800 mt-0.5 font-semibold">
                      {selectedReserve.requisition?.patient?.age || selectedReserve.reservedPatientAge || '—'} yrs / {(() => {
                        const sex = selectedReserve.requisition?.patient?.sex || selectedReserve.reservedPatientSex;
                        return sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : sex === 'O' ? 'Other' : '—';
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Medical Record Number (MRN):</span>
                    <div className="text-slate-800 mt-0.5 font-medium">{selectedReserve.requisition?.patient?.mrn || '—'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Haemoglobin (Hb):</span>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      {selectedReserve.requisition?.patient?.hb ? `${selectedReserve.requisition.patient.hb} g/dL` : '—'}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-gray-500">Diagnosis / Indication:</span>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      {selectedReserve.requisition?.patient?.diagnosis || '—'} 
                      {selectedReserve.requisition?.patient?.indication ? ` (${selectedReserve.requisition.patient.indication})` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Clinical / Obstetric History */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* History of Previous Transfusions */}
                <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs text-orange-900 border-b pb-1.5 uppercase tracking-wide">
                    Transfusion History
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-gray-500">Previous Transfusions:</span>
                      <div className="text-slate-800 font-medium">
                        {selectedReserve.requisition?.patient?.history?.previousTransfusions ?? 0}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500">Approximate Date:</span>
                      <div className="text-slate-800 font-medium">
                        {selectedReserve.requisition?.patient?.history?.approximateDate || '—'}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500">Presence of Reaction:</span>
                      <div className="text-slate-800 font-semibold text-orange-700">
                        {selectedReserve.requisition?.patient?.history?.presenceOfReaction || 'None'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pregnancy History */}
                {selectedReserve.requisition?.patient?.sex === 'F' ? (
                  <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
                    <h4 className="font-bold text-xs text-orange-900 border-b pb-1.5 uppercase tracking-wide">
                      Pregnancy History
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-gray-500">No. of Pregnancies:</span>
                        <div className="text-slate-800 font-medium">
                          {selectedReserve.requisition?.patient?.pregnancy?.numPregnancies ?? 0}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-500">No. of Miscarriages:</span>
                        <div className="text-slate-800 font-medium">
                          {selectedReserve.requisition?.patient?.pregnancy?.numMiscarriages ?? 0}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-500">Haemolytic Newborns:</span>
                        <div className="text-slate-800 font-medium">
                          {selectedReserve.requisition?.patient?.pregnancy?.numChildrenWithHemolyticDisease ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center text-xs">
                    <span className="font-semibold text-gray-400">Pregnancy History Blocked</span>
                    <p className="text-[10px] text-gray-400 mt-1">Not applicable for male/other sex patients.</p>
                  </div>
                )}
              </div>

              {/* Card 4: Reserved Component Details */}
              <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-orange-900 border-b pb-1.5 uppercase tracking-wide">
                  Reserved Component Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500">Bag Number:</span>
                    <div className="text-slate-800 mt-0.5 font-bold">{selectedReserve.bagNo}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Component Type:</span>
                    <div className="text-slate-800 mt-0.5 font-bold">{selectedReserve.component?.componentType}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Blood Group / Rh:</span>
                    <div className="text-slate-800 mt-0.5 font-bold">
                      {selectedReserve.bag?.bloodGroup} {selectedReserve.bag?.rh}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Volume:</span>
                    <div className="text-slate-800 mt-0.5 font-medium">{selectedReserve.component?.volumeMl} mL</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Expiry Date:</span>
                    <div className="text-slate-800 mt-0.5 font-semibold text-red-700">
                      {selectedReserve.component?.expiryDate ? new Date(selectedReserve.component.expiryDate).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Authorization Details */}
              <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-orange-900 border-b pb-1.5 uppercase tracking-wide">
                  Authorization & Hospital Seal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500">Medical Officer Signature:</span>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      {selectedReserve.requisition?.medicalOfficerSignature || '—'}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Hospital Seal Code:</span>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      {selectedReserve.requisition?.hospitalSeal || '—'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-gray-150 bg-gray-50 flex justify-end">
              <Button onClick={() => setSelectedReserve(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reserve;


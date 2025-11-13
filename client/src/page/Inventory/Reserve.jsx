import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Hand } from "lucide-react";
import { toast } from "sonner";
import { COMPONENT_TYPES, SEX_TYPES } from "@/page/requisition/constants";

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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan="10" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="10" className="px-4 py-8 text-center text-gray-500">No items found.</td></tr>
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
    </div>
  );
};

export default Reserve;


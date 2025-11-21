import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import requisitionApi from '@/services/requisitionApi';
import hospitalApi from '@/services/hospitalApi';
import { toast } from 'sonner';
import Modal from '@/components/shared/Modal';

const STATUS = ['pending', 'matched', 'approved', 'issued', 'completed', 'rejected'];

export default function RequisitionList() {
  const navigate = useNavigate();
  const { authorizationToken } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    hospitalId: '',
    from: '',
    to: '',
    sortBy: 'updatedAt',
    order: 'desc',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

  useEffect(() => {
    hospitalApi.initialize(authorizationToken);
    requisitionApi.initialize(authorizationToken);

    (async () => {
      const resp = await hospitalApi.getHospitals({ limit: 200 });
      const list = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
          ? resp.data
          : [];
      setHospitals(list);
    })();
  }, [authorizationToken]);

  const fetchList = async () => {
    setLoading(true);
    const params = { ...filters, page, limit };
    try {
      const res = await requisitionApi.listRequests(params);
      if (!res.success) {
        toast.error(res.error || 'Failed to load requisitions');
        setLoading(false);
        return;
      }
      const items = Array.isArray(res.data) ? res.data : [];
      setData(items);
      const pg = res.raw?.pagination || { total: items.length, page, limit };
      setTotal(pg.total || items.length);
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const applyFilters = () => {
    setPage(1);
    fetchList();
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '', hospitalId: '', from: '', to: '', sortBy: 'updatedAt', order: 'desc' });
    setPage(1);
    fetchList();
  };

  const callAction = async (id, action) => {
    try {
      let res;
      if (action === 'match') res = await requisitionApi.match(id);
      if (action === 'approve') res = await requisitionApi.approve(id);
      if (action === 'issue') res = await requisitionApi.issue(id);
      if (action === 'complete') res = await requisitionApi.complete(id);
      if (action === 'reject') res = await requisitionApi.reject(id);
      if (!res?.success) return toast.error(res?.error || 'Action failed');
      toast.success(action.charAt(0).toUpperCase() + action.slice(1) + 'd');
      fetchList();
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const can = (row, act) => {
    const s = row.status;
    if (act === 'match') return s === 'pending';
    if (act === 'approve') return s === 'matched';
    if (act === 'issue') return s === 'approved' || s === 'matched';
    if (act === 'complete') return s === 'issued';
    if (act === 'reject') return ['pending', 'matched', 'approved'].includes(s);
    return false;
  };

  const openView = async (row) => {
    try {
      setViewLoading(true);
      setViewOpen(true);
      const res = await requisitionApi.getRequest(row._id);
      if (!res.success) {
        toast.error(res.error || 'Failed to load requisition');
        setViewDoc(null);
        return;
      }
      setViewDoc(res.data);
    } catch (e) {
      toast.error('Network error');
    } finally {
      setViewLoading(false);
    }
  };
  const closeView = () => { setViewOpen(false); setViewDoc(null); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Requisition List</h1>
          <p className="text-gray-600 text-sm">Filter, paginate, and manage requests</p>
        </div>
      <Modal isOpen={viewOpen} onClose={closeView} title="Requisition Details" size="xl">
        {!viewDoc || viewLoading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600">Request ID</div>
                <div className="font-medium">{viewDoc.requestId}</div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-medium capitalize">{viewDoc.status}</div>
              </div>
              <div>
                <div className="text-gray-600">Hospital</div>
                <div className="font-medium">{viewDoc.hospitalId?.name}</div>
              </div>
              <div>
                <div className="text-gray-600">Requested At</div>
                <div className="font-medium">{fmt(viewDoc.requestedAt)}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="text-gray-600">Patient</div>
                <div className="font-medium">{viewDoc.patient?.name} • {viewDoc.patient?.age}/{viewDoc.patient?.sex} • MRN: {viewDoc.patient?.mrn || '—'}</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Requested Components</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-2">Component</th>
                      <th className="p-2">Units</th>
                      <th className="p-2">Group</th>
                      <th className="p-2">Rh</th>
                      <th className="p-2">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDoc.requestedComponents?.map((c, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{c.componentType}</td>
                        <td className="p-2">{c.units}</td>
                        <td className="p-2">{c.bloodGroup}</td>
                        <td className="p-2">{c.rh}</td>
                        <td className="p-2 capitalize">{c.urgency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Matched/Reserved Inventory</h4>
              {viewDoc?.matchedInventory?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="p-2">Inventory ID</th>
                        <th className="p-2">Component</th>
                        <th className="p-2">Bag No</th>
                        <th className="p-2">Blood</th>
                        <th className="p-2">Reserved At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDoc.matchedInventory.map((mi, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{typeof mi.inventoryId === 'object' ? mi.inventoryId?._id : mi.inventoryId}</td>
                          <td className="p-2">{mi?.inventoryId?.componentId?.componentType || '—'}</td>
                          <td className="p-2">{mi?.inventoryId?.bagNo?.bagNo || '—'}</td>
                          <td className="p-2">{mi?.inventoryId?.bagNo ? `${mi.inventoryId.bagNo.bloodGroup} ${mi.inventoryId.bagNo.rh}` : '—'}</td>
                          <td className="p-2">{mi?.reservedAt ? fmt(mi.reservedAt) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">No matched inventory yet.</div>
              )}
            </div>
          </div>
        )}
      </Modal>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Search</label>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Request ID or Patient name" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                <option value="">All</option>
                {STATUS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Hospital</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.hospitalId} onChange={(e) => setFilters((p) => ({ ...p, hospitalId: e.target.value }))}>
                <option value="">All</option>
                {Array.isArray(hospitals) && hospitals.map((h) => (<option key={h._id} value={h._id}>{h.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">From</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">To</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <button type="button" onClick={applyFilters} className="px-4 py-2 rounded-lg bg-orange-800 text-white hover:bg-orange-900" disabled={loading}>Apply</button>
              <button type="button" onClick={resetFilters} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" disabled={loading}>Reset</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Rows</label>
              <select className="px-2 py-1 border rounded" value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10) || 10)}>
                {[10, 20, 50, 100].map(n => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-3 border-b">Request ID</th>
                  <th className="p-3 border-b">Hospital</th>
                  <th className="p-3 border-b">Patient</th>
                  <th className="p-3 border-b">Requested At</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">Loading…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No requisitions found</td></tr>
                ) : (
                  data.map((row) => (
                    <tr key={row._id} className="border-t">
                      <td className="p-3 font-medium">{row.requestId}</td>
                      <td className="p-3">{row.hospitalId?.name || '—'}</td>
                      <td className="p-3">{row.patient?.name} ({row.patient?.age}/{row.patient?.sex})</td>
                      <td className="p-3">{row.requestedAt ? new Date(row.requestedAt).toLocaleString() : '—'}</td>
                      <td className="p-3 capitalize">{row.status}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openView(row)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">View</button>
                          <button onClick={() => navigate(`/requisition/${row._id}`)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">Manage</button>
                          <button disabled={!can(row, 'match')} onClick={() => callAction(row._id, 'match')} className={`px-3 py-1 rounded ${can(row,'match') ? 'bg-orange-800 hover:bg-orange-900 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Match</button>
                          <button disabled={!can(row, 'approve')} onClick={() => callAction(row._id, 'approve')} className={`px-3 py-1 rounded ${can(row,'approve') ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Approve</button>
                          <button disabled={!can(row, 'issue')} onClick={() => callAction(row._id, 'issue')} className={`px-3 py-1 rounded ${can(row,'issue') ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Issue</button>
                          <button disabled={!can(row, 'complete')} onClick={() => callAction(row._id, 'complete')} className={`px-3 py-1 rounded ${can(row,'complete') ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Complete</button>
                          <button disabled={!can(row, 'reject')} onClick={() => callAction(row._id, 'reject')} className={`px-3 py-1 rounded ${can(row,'reject') ? 'border border-red-200 text-red-700 hover:bg-red-50' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t bg-gray-50">
            <div className="text-sm text-gray-600">Page {page} of {totalPages} • Total {total}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import requisitionApi from '@/services/requisitionApi';
import hospitalApi from '@/services/hospitalApi';
import { toast } from 'sonner';
import CustomModal from '@/components/CustomModal';

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
  const [selected, setSelected] = useState({});
  const [searchInput, setSearchInput] = useState('');

  const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');
  const statusClass = (s) => (
    s === 'pending' ? 'bg-gray-100 text-gray-700' :
    s === 'matched' ? 'bg-amber-100 text-amber-800' :
    s === 'approved' ? 'bg-blue-100 text-blue-800' :
    s === 'issued' ? 'bg-green-100 text-green-800' :
    s === 'completed' ? 'bg-purple-100 text-purple-800' :
    s === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
  );

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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((p) => ({ ...p, search: searchInput }));
      setPage(1);
      fetchList();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

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

  const toggle = (id) => setSelected((m) => ({ ...m, [id]: !m[id] }));
  const allSelectedIds = Object.keys(selected).filter((id) => selected[id]);
  const clearSelection = () => setSelected({});

  const bulkAction = async (action) => {
    if (allSelectedIds.length === 0) return;
    const rows = data.filter((r) => allSelectedIds.includes(r._id));
    const allowed = rows.filter((r) => can(r, action)).map((r) => r._id);
    if (allowed.length === 0) {
      toast.error('No selected rows are eligible for this action');
      return;
    }
    try {
      await Promise.allSettled(allowed.map(async (id) => {
        let res;
        if (action === 'match') res = await requisitionApi.match(id);
        if (action === 'approve') res = await requisitionApi.approve(id);
        if (action === 'issue') res = await requisitionApi.issue(id);
        if (action === 'complete') res = await requisitionApi.complete(id);
        if (action === 'reject') res = await requisitionApi.reject(id);
        return res;
      }));
      toast.success(`Bulk ${action} attempted for ${allowed.length} item(s)`);
      clearSelection();
      fetchList();
    } catch (e) {
      toast.error('Bulk action failed');
    }
  };

  const exportCsv = () => {
    const cols = ['Request ID','Hospital','Patient','Age','Sex','Requested At','Status'];
    const rows = data.map((r) => [
      r.requestId,
      r.hospitalId?.name || '',
      r.patient?.name || '',
      r.patient?.age ?? '',
      r.patient?.sex || '',
      r.requestedAt ? new Date(r.requestedAt).toISOString() : '',
      r.status
    ]);
    const csv = ['\uFEFF' + cols.join(','), ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'requisitions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const setSort = (col) => {
    setFilters((p) => ({ ...p, sortBy: col, order: p.sortBy === col && p.order === 'desc' ? 'asc' : 'desc' }));
    setPage(1);
    fetchList();
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
      <CustomModal open={viewOpen} onCancel={closeView} title="Requisition Details" size="lg" hideFooter>
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
            {viewDoc.status === 'rejected' && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
                This request has been rejected. No further actions (match, approve, issue, complete) are allowed.
              </div>
            )}
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
      </CustomModal>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Search</label>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Request ID or Patient name" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
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
              <button type="button" onClick={exportCsv} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" disabled={loading}>Export CSV</button>
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
          {allSelectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 border-b bg-amber-50 text-sm">
              <div className="text-amber-900">Selected: {allSelectedIds.length}</div>
              <div className="flex gap-2">
                <button onClick={() => bulkAction('approve')} className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white">Approve</button>
                <button onClick={() => bulkAction('issue')} className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-white">Issue</button>
                <button onClick={() => bulkAction('complete')} className="px-3 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white">Complete</button>
                <button onClick={() => bulkAction('reject')} className="px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">Reject</button>
                <button onClick={clearSelection} className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Clear</button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-3 border-b w-10">
                    <input type="checkbox" aria-label="Select all" onChange={(e) => {
                      const checked = e.target.checked; const map = {};
                      if (checked) data.forEach((r) => { map[r._id] = true; });
                      setSelected(map);
                    }} />
                  </th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('requestId')}>Request ID</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('hospitalId')}>Hospital</th>
                  <th className="p-3 border-b">Patient</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('requestedAt')}>Requested At</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('status')}>Status</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">Loading…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">No requisitions found</td></tr>
                ) : (
                  data.map((row) => (
                    <tr key={row._id} className="border-t">
                      <td className="p-3"><input type="checkbox" checked={!!selected[row._id]} onChange={() => toggle(row._id)} /></td>
                      <td className="p-3 font-medium">{row.requestId}</td>
                      <td className="p-3">{row.hospitalId?.name || '—'}</td>
                      <td className="p-3">{row.patient?.name} ({row.patient?.age}/{row.patient?.sex})</td>
                      <td className="p-3">{row.requestedAt ? new Date(row.requestedAt).toLocaleString() : '—'}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(row.status)}`}>{row.status}</span></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openView(row)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">View</button>
                          {row.status !== 'rejected' && (
                            <>
                              <button onClick={() => navigate(`/requisition/${row._id}`)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">Manage</button>
                              <button disabled={!can(row, 'match')} onClick={() => callAction(row._id, 'match')} className={`px-3 py-1 rounded ${can(row,'match') ? 'bg-orange-800 hover:bg-orange-900 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Match</button>
                              <button disabled={!can(row, 'approve')} onClick={() => callAction(row._id, 'approve')} className={`px-3 py-1 rounded ${can(row,'approve') ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Approve</button>
                              <button disabled={!can(row, 'issue')} onClick={() => callAction(row._id, 'issue')} className={`px-3 py-1 rounded ${can(row,'issue') ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Issue</button>
                              <button disabled={!can(row, 'complete')} onClick={() => callAction(row._id, 'complete')} className={`px-3 py-1 rounded ${can(row,'complete') ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Complete</button>
                              <button disabled={!can(row, 'reject')} onClick={() => callAction(row._id, 'reject')} className={`px-3 py-1 rounded ${can(row,'reject') ? 'border border-red-200 text-red-700 hover:bg-red-50' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Reject</button>
                            </>
                          )}
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

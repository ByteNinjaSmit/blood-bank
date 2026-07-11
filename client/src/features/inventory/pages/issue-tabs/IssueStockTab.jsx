import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Issue Stock tab: the issued/reserved blood-unit ledger with filters +
// paginated table. Presentational — filter state + data live in the page.
export default function IssueStockTab({
  status, setStatus,
  componentType, setComponentType,
  bloodGroup, setBloodGroup,
  search, setSearch,
  expiryFrom, setExpiryFrom,
  expiryTo, setExpiryTo,
  order, setOrder,
  pagination, setPagination,
  rows,
  isLoading,
  fetchRows,
  onView,
}) {
  const resetPage = () => setPagination(p => ({ ...p, page: 1 }));

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">Total: {pagination.total || 0}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Status</label>
            <select value={status} onChange={(e)=>{setStatus(e.target.value); resetPage();}} className="h-10 px-3 border rounded-md text-sm">
              <option value="issued">Issued</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Component</label>
            <select value={componentType} onChange={(e)=>{setComponentType(e.target.value); resetPage();}} className="h-10 px-3 border rounded-md text-sm">
              <option value="">All</option>
              <option value="RBC">RBC</option>
              <option value="FFP">FFP</option>
              <option value="Platelet">Platelet</option>
              <option value="Cryo">Cryo</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Blood Group</label>
            <select value={bloodGroup} onChange={(e)=>{setBloodGroup(e.target.value); resetPage();}} className="h-10 px-3 border rounded-md text-sm">
              <option value="">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Search Bag No</label>
            <input value={search} onChange={(e)=>{setSearch(e.target.value); resetPage();}} className="h-10 px-3 border rounded-md text-sm" placeholder="Bag ID" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Expiry From</label>
            <input type="date" value={expiryFrom} onChange={(e)=>{setExpiryFrom(e.target.value); resetPage();}} className="h-10 px-3 border rounded-md text-sm" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Expiry To</label>
            <input type="date" value={expiryTo} onChange={(e)=>{setExpiryTo(e.target.value); resetPage();}} className="h-10 px-3 border rounded-md text-sm" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Order</label>
            <select value={order} onChange={(e)=>{setOrder(e.target.value); resetPage();}} className="h-10 px-3 border rounded-md text-sm">
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={()=>fetchRows(pagination.page)} variant="outline" size="sm" className="h-10" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage / Destination</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-500">No items found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-bold text-gray-900">{r?.bag?.bagNo || r.bagNo}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{r?.segmentNo || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.componentType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r?.bag?.bloodGroup} {r?.bag?.rh}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.expiryDate ? new Date(r.component.expiryDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r?.issuedAt ? new Date(r.issuedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r?.storageLocation || r?.hospital?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => onView(r)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">View</button>
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
  );
}

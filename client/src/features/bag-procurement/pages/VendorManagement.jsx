import { useState } from 'react';
import { Truck, Plus, X, CheckCircle, Ban, Trash2, Users, Search } from 'lucide-react';
import {
  useVendorList,
  useCreateVendor,
  useUpdateVendor,
  useUpdateVendorStatus,
  useDeleteVendor,
} from '../queries';

const STATUS_BADGE = {
  APPROVED:    'bg-green-50 text-green-700 border-green-200',
  PENDING:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  SUSPENDED:   'bg-orange-50 text-orange-700 border-orange-200',
  BLACKLISTED: 'bg-red-50 text-red-700 border-red-200',
};

const EMPTY_FORM = {
  vendorName: '', contactPerson: '', phone: '', email: '',
  address: '', city: '', state: '', pincode: '',
  drugLicenseNo: '', gstNo: '', manufacturerName: '',
  contractStartDate: '', contractEndDate: '',
};

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value ?? 0}</span>
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

function VendorDrawer({ onClose, editVendor }) {
  const [form, setForm] = useState(editVendor ?? EMPTY_FORM);
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = editVendor
      ? updateVendor.mutateAsync({ id: editVendor._id, data: form })
      : createVendor.mutateAsync(form);
    action.then(onClose).catch(() => {});
  };

  const busy = createVendor.isPending || updateVendor.isPending;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800">
          <h2 className="text-base font-semibold text-white">
            {editVendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Vendor Name *</label>
              <input required value={form.vendorName} onChange={set('vendorName')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Manufacturer</label>
              <input value={form.manufacturerName} onChange={set('manufacturerName')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contact Person</label>
              <input value={form.contactPerson} onChange={set('contactPerson')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Phone</label>
              <input value={form.phone} onChange={set('phone')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={set('email')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Address</label>
              <input value={form.address} onChange={set('address')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">City</label>
              <input value={form.city} onChange={set('city')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">State</label>
              <input value={form.state} onChange={set('state')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Pincode</label>
              <input value={form.pincode} onChange={set('pincode')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Drug License No *</label>
              <input required value={form.drugLicenseNo} onChange={set('drugLicenseNo')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">GST No</label>
              <input value={form.gstNo} onChange={set('gstNo')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contract Start</label>
              <input type="date" value={form.contractStartDate} onChange={set('contractStartDate')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contract End</label>
              <input type="date" value={form.contractEndDate} onChange={set('contractEndDate')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-800 rounded-lg hover:bg-orange-900 disabled:opacity-60">
              {busy ? 'Saving…' : editVendor ? 'Update Vendor' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function VendorManagement() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [search, setSearch] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const { data, isLoading } = useVendorList({ search: search || undefined, approvalStatus: approvalStatus || undefined });
  const updateStatus = useUpdateVendorStatus();
  const deleteVendor = useDeleteVendor();

  const vendors = data?.items ?? data?.vendors ?? (Array.isArray(data) ? data : []);

  const stats = {
    total:      vendors.length,
    approved:   vendors.filter((v) => v.status === 'APPROVED').length,
    pending:    vendors.filter((v) => v.status === 'PENDING').length,
    suspended:  vendors.filter((v) => v.status === 'SUSPENDED').length,
  };

  const handleStatus = (id, status) => updateStatus.mutate({ id, status });
  const handleDelete = (id) => { if (window.confirm('Remove this vendor?')) deleteVendor.mutate(id); };
  const openEdit = (v) => { setEditVendor(v); setShowDrawer(true); };
  const closeDrawer = () => { setShowDrawer(false); setEditVendor(null); };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vendor Management</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Blood Bag Suppliers</p>
            </div>
          </div>
          <button
            onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Vendors" value={stats.total} color="text-gray-900" />
          <StatCard label="Approved" value={stats.approved} color="text-green-700" />
          <StatCard label="Pending" value={stats.pending} color="text-yellow-600" />
          <StatCard label="Suspended" value={stats.suspended} color="text-orange-600" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor name, license or GST..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <select
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
          {(search || approvalStatus) && (
            <button
              onClick={() => { setSearch(''); setApprovalStatus(''); }}
              className="px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 rounded-lg font-medium"
            >
              Reset
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-gray-50/50">
            <Users className="w-4 h-4 text-orange-700" />
            <span className="text-sm font-semibold text-gray-700">All Vendors ({vendors.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Vendor Name', 'Manufacturer', 'Drug License No', 'GST No', 'Status', 'Contract End', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : vendors.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : vendors.map((v) => (
                  <tr key={v._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.vendorName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.manufacturerName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{v.drugLicenseNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{v.gstNo || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(v.contractEndDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(v)}
                          className="px-2.5 py-1 text-xs font-medium text-orange-700 border border-orange-200 rounded-md hover:bg-orange-50">
                          Edit
                        </button>
                        {v.status !== 'APPROVED' && (
                          <button onClick={() => handleStatus(v._id, 'APPROVED')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {v.status === 'APPROVED' && (
                          <button onClick={() => handleStatus(v._id, 'SUSPENDED')}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-md" title="Suspend">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(v._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <VendorDrawer onClose={closeDrawer} editVendor={editVendor} />}
    </div>
  );
}

import { useState } from 'react';
import { Truck, Plus, CheckCircle, Ban, Trash2, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  useVendorList,
  useCreateVendor,
  useUpdateVendor,
  useUpdateVendorStatus,
  useDeleteVendor,
} from '../queries';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import SearchBox from '@/components/shared/SearchBox';
import { exportVendors } from '@/utils/excelExportHelper';
import { useEditWithReason } from '@/hooks/useEditWithReason';
import { useDeleteWithReason } from '@/hooks/useDeleteWithReason';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_BADGE = {
  APPROVED:    'bg-green-50 text-green-700 border-green-200',
  PENDING:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  SUSPENDED:   'bg-orange-50 text-orange-700 border-orange-200',
  BLACKLISTED: 'bg-red-50 text-red-700 border-red-200',
};

const EMPTY_FORM = {
  name: '', contactPerson: '', contactPhone: '', email: '',
  address: '', drugLicenseNo: '', gstNo: '', manufacturer: '',
  contractStart: '', contractEnd: '',
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

  const { wrappedSave, EditReasonDialog } = useEditWithReason({
    onSave: (data, editReason) =>
      updateVendor.mutateAsync({ id: editVendor?._id, data, editReason }).then(onClose),
    title: 'Confirm Vendor Changes',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editVendor) {
      wrappedSave(form);
    } else {
      createVendor.mutateAsync(form).then(onClose).catch(() => {});
    }
  };

  const busy = createVendor.isPending || updateVendor.isPending;
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Vendor Name *</label>
              <input required value={form.name} onChange={set('name')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Manufacturer *</label>
              <input required value={form.manufacturer} onChange={set('manufacturer')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contact Person *</label>
              <input required value={form.contactPerson} onChange={set('contactPerson')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Phone *</label>
              <input required value={form.contactPhone} onChange={set('contactPhone')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={set('email')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Address *</label>
              <input required value={form.address} onChange={set('address')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Drug License No *</label>
              <input required value={form.drugLicenseNo} onChange={set('drugLicenseNo')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">GST No *</label>
              <input required value={form.gstNo} onChange={set('gstNo')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contract Start</label>
              <input type="date" value={form.contractStart} onChange={set('contractStart')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Contract End</label>
              <input type="date" value={form.contractEnd} onChange={set('contractEnd')}
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
      </DialogContent>
      {EditReasonDialog}
    </Dialog>
  );
}

export default function VendorManagement() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const { data, isLoading, refetch, isFetching } = useVendorList({ search: search || undefined, approvalStatus: approvalStatus || undefined });
  const updateStatus = useUpdateVendorStatus();
  const deleteVendor = useDeleteVendor();

  const vendors = data?.items ?? data?.vendors ?? (Array.isArray(data) ? data : []);

  const stats = {
    total:      vendors.length,
    approved:   vendors.filter((v) => v.approvalStatus === 'APPROVED').length,
    pending:    vendors.filter((v) => v.approvalStatus === 'PENDING').length,
    suspended:  vendors.filter((v) => v.approvalStatus === 'SUSPENDED').length,
  };

  const handleStatus = (id, status) => updateStatus.mutate({ id, status });
  const { requestDelete, DeleteReasonDialog } = useDeleteWithReason({
    onDelete: (vendor, reason) => deleteVendor.mutateAsync({ id: vendor._id, reason }),
    title: 'Delete Vendor',
    message: 'This vendor and its purchase orders, goods receipts, and unused stock will be moved to the Recycle Bin. Stock already issued for collection is preserved and marked affected, not deleted.',
  });
  const openEdit = (v) => { setEditVendor(v); setShowDrawer(true); };
  const closeDrawer = () => { setShowDrawer(false); setEditVendor(null); };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const [excelLoading, setExcelLoading] = useState(false);
  const handleExportExcel = async () => {
    if (vendors.length === 0) {
      toast.info('No vendors to export');
      return;
    }
    try {
      setExcelLoading(true);
      await exportVendors(vendors);
    } catch (e) {
      toast.error('Failed to generate Excel report');
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <Truck className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
              <p className="text-gray-500 text-sm">Blood Bag Suppliers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
            <button
              onClick={() => setShowDrawer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
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
            <SearchBox
              value={searchInput}
              onChange={setSearchInput}
              onSearch={() => setSearch(searchInput)}
              placeholder="Search vendor name, license or GST..."
              inputClassName="focus:ring-orange-400 focus:border-orange-400"
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
              onClick={() => { setSearch(''); setSearchInput(''); setApprovalStatus(''); }}
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
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.manufacturer || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{v.drugLicenseNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{v.gstNo || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.approvalStatus} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(v.contractEnd)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(v)}
                          className="px-2.5 py-1 text-xs font-medium text-orange-700 border border-orange-200 rounded-md hover:bg-orange-50">
                          Edit
                        </button>
                        {v.approvalStatus !== 'APPROVED' && (
                          <button onClick={() => handleStatus(v._id, 'APPROVED')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {v.approvalStatus === 'APPROVED' && (
                          <button onClick={() => handleStatus(v._id, 'SUSPENDED')}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-md" title="Suspend">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => requestDelete(v)}
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
      {DeleteReasonDialog}
    </div>
  );
}

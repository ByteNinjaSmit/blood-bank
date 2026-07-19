import React, { useState } from 'react';
import { Plus, X, Search, Truck, RefreshCw } from 'lucide-react';
import { useSupplierList, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../queries';
import { toast } from 'sonner';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';

export default function Suppliers() {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', gstNumber: '', address: '',
  });
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  const { data: suppliers, isLoading, isFetching, refetch } = useSupplierList();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const handleEditClick = (sup) => {
    setEditingSupplierId(sup._id);
    setForm({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      gstNumber: sup.gstNumber || '',
      address: sup.address || '',
    });
    setShowAddDrawer(true);
  };

  const handleCloseDrawer = () => {
    setForm({ name: '', contactPerson: '', phone: '', email: '', gstNumber: '', address: '' });
    setEditingSupplierId(null);
    setShowAddDrawer(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      gstNumber: form.gstNumber.trim(),
      address: form.address.trim(),
    };

    if (editingSupplierId) {
      updateSupplier.mutateAsync({ id: editingSupplierId, data: payload }).then(() => {
        toast.success('Supplier updated successfully!');
        handleCloseDrawer();
      }).catch((err) => {
        toast.error(err.message || 'Failed to update supplier');
      });
    } else {
      createSupplier.mutateAsync(payload).then(() => {
        toast.success('Supplier registered successfully!');
        handleCloseDrawer();
      }).catch((err) => {
        toast.error(err.message || 'Failed to create supplier');
      });
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    deleteSupplier.mutateAsync(id).then(() => {
      toast.success('Supplier removed successfully');
    }).catch((err) => {
      toast.error(err.message || 'Failed to delete supplier');
    });
  };

  const filteredSuppliers = (suppliers || []).filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.gstNumber && s.gstNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <Truck className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Master</h1>
            <p className="text-gray-500 text-sm">Chemical suppliers</p>
          </div>
        </div>
        <div className="flex gap-3 self-start">
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
          <button
            onClick={() => {
              setEditingSupplierId(null);
              setShowAddDrawer(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white text-sm font-semibold rounded-lg hover:bg-red-900 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, contact, GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Supplier Name', 'Contact Person', 'Phone / Email', 'GST Number', 'Address', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">Loading suppliers...</td></tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">No suppliers registered.</td></tr>
              ) : filteredSuppliers.map((sup) => (
                <tr key={sup._id} className="hover:bg-red-50/10 transition-colors">
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">{sup.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{sup.contactPerson || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span>{sup.phone || '—'}</span>
                      <span className="text-xs text-gray-400">{sup.email || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-700">{sup.gstNumber || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 max-w-xs truncate">{sup.address || '—'}</td>
                  <td className="px-5 py-3 text-sm">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleEditClick(sup)}
                        className="text-xs text-blue-600 hover:text-blue-900 font-semibold"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDelete(sup._id)}
                        className="text-xs text-red-600 hover:text-red-900 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddDrawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCloseDrawer} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-red-800 text-white">
              <h2 className="text-base font-bold">{editingSupplierId ? 'Edit Chemical Supplier' : 'Register Chemical Supplier'}</h2>
              <button onClick={handleCloseDrawer} className="text-red-100 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Supplier Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} placeholder="e.g. Tulip Diagnostics" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Contact Person</label>
                <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className={fieldClass} placeholder="e.g. John Tulip" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Phone Number</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} placeholder="e.g. sales@tulip.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">GST Number</label>
                <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className={fieldClass} placeholder="e.g. 27TULIP1234A1Z9" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Address</label>
                <textarea rows="3" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fieldClass} placeholder="Address lines..." />
              </div>
              <div className="pt-4 border-t flex gap-3 justify-end">
                <button type="button" onClick={handleCloseDrawer} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 disabled:opacity-60">
                  {editingSupplierId ? (updateSupplier.isPending ? 'Updating…' : 'Update Supplier') : (createSupplier.isPending ? 'Registering…' : 'Register Supplier')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

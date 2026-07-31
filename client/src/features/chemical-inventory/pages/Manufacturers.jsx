import React, { useState } from 'react';
import { Plus, X, Search, Factory, RefreshCw } from 'lucide-react';
import { useManufacturerList, useCreateManufacturer, useDeleteManufacturer } from '../queries';
import { toast } from 'sonner';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';

export default function Manufacturers() {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mfgName, setMfgName] = useState('');
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  const { data: manufacturers, isLoading, isFetching, refetch } = useManufacturerList();
  const createManufacturer = useCreateManufacturer();
  const deleteManufacturer = useDeleteManufacturer();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mfgName.trim()) return;

    createManufacturer.mutateAsync({
      name: mfgName.trim(),
    }).then(() => {
      toast.success('Manufacturer registered successfully!');
      setMfgName('');
      setShowAddDrawer(false);
    }).catch((err) => {
      toast.error(err.message || 'Failed to create manufacturer');
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this manufacturer?')) return;
    deleteManufacturer.mutateAsync(id).then(() => {
      toast.success('Manufacturer removed successfully');
    }).catch((err) => {
      toast.error(err.message || 'Failed to delete manufacturer');
    });
  };

  const filteredMfgs = (manufacturers || []).filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <Factory className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manufacturer Master</h1>
            <p className="text-gray-500 text-sm">Chemical manufacturers</p>
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
            onClick={() => setShowAddDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white text-sm font-semibold rounded-lg hover:bg-red-900 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Manufacturer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by manufacturer name..."
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
                {['Manufacturer Name', 'Created Date', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={3} className="py-12 text-center text-sm text-gray-500">Loading manufacturers...</td></tr>
              ) : filteredMfgs.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-sm text-gray-500">No manufacturers registered.</td></tr>
              ) : filteredMfgs.map((mfg) => (
                <tr key={mfg._id} className="hover:bg-red-50/10 transition-colors">
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">{mfg.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {mfg.createdAt ? new Date(mfg.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <button
                      onClick={() => handleDelete(mfg._id)}
                      className="text-xs text-red-600 hover:text-red-900 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddDrawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAddDrawer(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-red-800 text-white">
              <h2 className="text-base font-bold">Register Chemical Manufacturer</h2>
              <button onClick={() => setShowAddDrawer(false)} className="text-red-100 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange} className="flex-1 p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Manufacturer Name *</label>
                <input required value={mfgName} onChange={(e) => setMfgName(e.target.value)} className={fieldClass} placeholder="e.g. Bio-Rad" />
              </div>
              <div className="pt-4 border-t flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAddDrawer(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createManufacturer.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 disabled:opacity-60">
                  {createManufacturer.isPending ? 'Registering…' : 'Register Manufacturer'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

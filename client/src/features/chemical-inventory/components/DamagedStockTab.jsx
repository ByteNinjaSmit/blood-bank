import React, { useState } from 'react';
import { Plus, AlertTriangle, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useLotList, useDamageList, useCreateDamage, useUpdateDamage, useDeleteDamage } from '../queries';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportDamagedChemicalStock } from '@/utils/excelExportHelper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

function lotLabel(lot) {
  const name = lot.chemicalId?.name || 'Unknown chemical';
  return `${name} — Batch ${lot.batchNumber} (Lot ${lot.lotNumber}) — Available: ${lot.qtyAvailable}`;
}

function RegisterDamageModal({ isOpen, onClose, lots, onSubmit, isPending }) {
  const [lotId, setLotId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const selectedLot = lots.find((l) => l._id === lotId);
  const maxQty = selectedLot?.qtyAvailable ?? 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lotId) {
      toast.error('Please select a chemical');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (qty > maxQty) {
      toast.error(`Only ${maxQty} units available for this chemical`);
      return;
    }
    if (!reason.trim()) {
      toast.error('Please enter a reason');
      return;
    }
    onSubmit({ lotId, quantity: qty, reason: reason.trim() }, () => {
      setLotId('');
      setQuantity('');
      setReason('');
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register Damaged Chemical</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Chemical *</label>
          <select
            required
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">Select chemical in stock...</option>
            {lots.map((lot) => (
              <option key={lot._id} value={lot._id}>{lotLabel(lot)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
            Quantity Damaged * {selectedLot ? `(max ${maxQty})` : ''}
          </label>
          <input
            required
            type="number"
            min="1"
            max={maxQty || undefined}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Reason *</label>
          <textarea
            required
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Broken vial, cold-chain excursion, expired during storage..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <DialogFooter className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-800 hover:bg-red-900 rounded-lg shadow-sm transition-colors disabled:opacity-60"
          >
            {isPending ? 'Saving...' : 'Register Damage'}
          </button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDamageModal({ damage, onClose, onSubmit, isPending }) {
  const [quantity, setQuantity] = useState(damage ? String(damage.quantity) : '');
  const [reason, setReason] = useState(damage?.reason || '');

  if (!damage) return null;

  const maxQty = (damage.lotId?.qtyAvailable ?? 0) + damage.quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (qty > maxQty) {
      toast.error(`Quantity cannot exceed ${maxQty} (current stock + this record's quantity)`);
      return;
    }
    if (!reason.trim()) {
      toast.error('Please enter a reason');
      return;
    }
    onSubmit(damage._id, { quantity: qty, reason: reason.trim() });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Damage Record</DialogTitle>
          <p className="text-xs text-gray-500">{damage.chemicalId?.name} — Lot {damage.lotId?.lotNumber}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Quantity Damaged * (max {maxQty})</label>
          <input
            required
            type="number"
            min="1"
            max={maxQty}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Reason *</label>
          <textarea
            required
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <DialogFooter className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-800 hover:bg-red-900 rounded-lg shadow-sm transition-colors disabled:opacity-60"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DamagedStockTab() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingDamage, setEditingDamage] = useState(null);

  const { data: lotsData } = useLotList({});
  const { data: damages, isLoading, isFetching, refetch } = useDamageList();

  const createDamage = useCreateDamage();
  const updateDamage = useUpdateDamage();
  const deleteDamage = useDeleteDamage();

  // Only lots that currently have available stock can have damage registered against them.
  const availableLots = (lotsData?.items || []).filter(
    (lot) => lot.qtyAvailable > 0 && new Date(lot.expiryDate) > new Date()
  );

  const handleRegister = (payload, resetForm) => {
    createDamage.mutateAsync(payload)
      .then(() => {
        toast.success('Damage registered and stock reduced');
        resetForm();
        setShowRegisterModal(false);
      })
      .catch((err) => toast.error(err.message || 'Failed to register damage'));
  };

  const handleUpdate = (id, patch) => {
    updateDamage.mutateAsync({ id, data: patch })
      .then(() => {
        toast.success('Damage record updated');
        setEditingDamage(null);
      })
      .catch((err) => toast.error(err.message || 'Failed to update damage record'));
  };

  const handleDelete = (damage) => {
    if (!window.confirm(`Delete this damage record for ${damage.chemicalId?.name}? ${damage.quantity} units will be restored to stock.`)) {
      return;
    }
    deleteDamage.mutateAsync(damage._id)
      .then(() => toast.success('Damage record deleted — stock restored'))
      .catch((err) => toast.error(err.message || 'Failed to delete damage record'));
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

  const formatUser = (user) => {
    if (!user) return '—';
    const fullName = [user.name?.first, user.name?.last].filter(Boolean).join(' ');
    return fullName || user.email || '—';
  };

  const [excelLoading, setExcelLoading] = useState(false);
  const handleExportExcel = async () => {
    const items = damages || [];
    if (items.length === 0) {
      toast.info('No damage records to export');
      return;
    }
    try {
      setExcelLoading(true);
      await exportDamagedChemicalStock(items);
    } catch (e) {
      toast.error('Failed to generate Excel report');
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
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
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-800 text-white text-sm font-semibold rounded-lg hover:bg-red-900 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Register Damage
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Chemical', 'Lot / Batch', 'Quantity', 'Reason', 'Date', 'Registered By', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">Loading damage register...</td></tr>
              ) : (damages || []).length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No damaged stock recorded.</td></tr>
              ) : (damages || []).map((d) => (
                <tr key={d._id} className="hover:bg-red-50/10 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-50 rounded-lg text-red-700 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-gray-900">{d.chemicalId?.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    <div className="flex flex-col">
                      <span><span className="font-semibold">Lot:</span> {d.lotId?.lotNumber || '—'}</span>
                      <span><span className="font-semibold">Batch:</span> {d.lotId?.batchNumber || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                      {d.quantity} units
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 max-w-[220px] truncate" title={d.reason}>{d.reason}</td>
                  <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDate(d.damagedDate)}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{formatUser(d.createdBy)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingDamage(d)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit damage record"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete damage record (restores stock)"
                      >
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

      <RegisterDamageModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        lots={availableLots}
        onSubmit={handleRegister}
        isPending={createDamage.isPending}
      />

      <EditDamageModal
        damage={editingDamage}
        onClose={() => setEditingDamage(null)}
        onSubmit={handleUpdate}
        isPending={updateDamage.isPending}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, AlertCircle } from 'lucide-react';

// Reject a single component (or, with the bag-scoped props, a single bag) of
// a requisition — the rest continues. Shows what's being rejected and
// requires a reason.
export default function ComponentRejectModal({
  isOpen, onClose, onConfirm, component, bagCount = 0, submitting = false,
  title = 'Reject Component',
  confirmDescription = 'This drops the component from the requisition; the remaining components continue.',
  confirmLabel = 'Reject Component',
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A rejection reason is mandatory.');
      return;
    }
    onConfirm(reason.trim());
  };

  const rhSign = component?.rh === 'Positive' ? '+' : component?.rh === 'Negative' ? '−' : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-950 text-xs">
          <div className="text-red-600 flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Confirm rejection</p>
            <p className="text-red-700/90 mt-0.5">
              {confirmDescription}
            </p>
          </div>
        </div>

        {component && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Component</span><strong className="text-gray-900">{component.componentType}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Blood group</span><strong className="text-gray-900">{component.bloodGroup}{rhSign}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Units requested</span><strong className="text-gray-900">{component.units}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Bags proposed</span><strong className="text-gray-900">{bagCount}</strong></div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Reason for Rejection <span className="text-red-600 font-bold">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            placeholder="e.g. Units failed visual inspection, patient no longer needs this component..."
            className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 transition-all outline-none resize-none ${
              error ? 'border-red-300 focus:ring-red-150 focus:border-red-500' : 'border-gray-250 focus:ring-slate-150 focus:border-slate-800'
            }`}
            disabled={submitting}
          />
          {error && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 rounded-xl transition-all shadow-sm cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !reason.trim()}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-all shadow-md shadow-red-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Rejecting...' : confirmLabel}
          </button>
        </div>
      </form>
      </DialogContent>
    </Dialog>
  );
}

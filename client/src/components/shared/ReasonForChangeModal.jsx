import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

/**
 * Generic "Reason for Change" confirmation dialog, generalized from
 * RejectRequestModal for reuse across edit/delete/status-change flows
 * that don't already capture a reason of their own (e.g. requisition
 * reject, bag-discard, and component patchBag have dedicated reason
 * fields already and should NOT also use this — map their existing
 * field into the audit `reason` instead, to avoid double-prompting).
 */
const ReasonForChangeModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Change',
  actionLabel = 'Confirm',
  message,
  fieldLabel = 'Reason for Change',
  required = true,
  submitting = false,
}) => {
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
    if (required && !reason.trim()) {
      setError('A reason is mandatory for this action.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-950 text-xs">
            <div className="text-amber-600 flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-amber-800/90">{message}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            {fieldLabel} {required && <span className="text-red-600 font-bold">*</span>}
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            placeholder="Describe the reason for this change..."
            className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 transition-all outline-none resize-none ${
              error
                ? 'border-red-300 focus:ring-red-150 focus:border-red-500'
                : 'border-gray-250 focus:ring-slate-150 focus:border-slate-800'
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 rounded-xl transition-all shadow-sm cursor-pointer"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 active:bg-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || (required && !reason.trim())}
          >
            {submitting ? 'Saving...' : actionLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReasonForChangeModal;

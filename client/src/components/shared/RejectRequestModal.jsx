import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

const RejectRequestModal = ({
  isOpen,
  onClose,
  onConfirm,
  requestId,
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
    if (!reason.trim()) {
      setError('A rejection reason is mandatory.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Requisition Request" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-950 text-xs">
          <div className="text-red-600 flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Confirm Rejection</p>
            <p className="text-red-700/90 mt-0.5">
              Rejecting request <strong className="font-mono text-red-900">{requestId}</strong> will release all reserved inventory and cancel the requisition. This action cannot be undone.
            </p>
          </div>
        </div>

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
            placeholder="Type the specific reason for rejecting this requisition (e.g. Insufficient inventory, patient matching error, signature mismatch...)"
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
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || !reason.trim()}
          >
            {submitting ? 'Rejecting...' : 'Reject Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectRequestModal;

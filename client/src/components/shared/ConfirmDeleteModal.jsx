import { AlertTriangle } from 'lucide-react';

/**
 * Small delete-confirmation dialog used across the procurement screens.
 * Previously copy-pasted into three page files (rule #5) — now shared.
 */
export default function ConfirmDeleteModal({ isOpen, title, message, onConfirm, onClose }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0 animate-bounce">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title || 'Delete Confirmation'}</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{message || 'Are you sure you want to delete this?'}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';

/**
 * Small delete-confirmation dialog used across the procurement screens.
 * Previously copy-pasted into three page files (rule #5) — now shared.
 */
export default function ConfirmDeleteModal({ isOpen, title, message, onConfirm, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0 animate-bounce">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-gray-900">{title || 'Delete Confirmation'}</DialogTitle>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{message || 'Are you sure you want to delete this?'}</p>
          </div>
        </div>
        <DialogFooter className="mt-6">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

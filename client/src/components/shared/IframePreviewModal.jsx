import { X } from 'lucide-react';

/**
 * Document/image preview overlay used across the procurement and discard
 * screens. Renders an <img> for image URLs and an <iframe> for PDFs.
 * Previously copy-pasted into four page files (rule #5) — now shared.
 */
export default function IframePreviewModal({ isOpen, url, title, onClose }) {
  if (!isOpen || !url) return null;
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || !url.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900">{title || 'Document Viewer'}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-4 overflow-auto">
          {isImage ? (
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-gray-200"
            />
          ) : (
            <iframe
              src={url}
              title={title}
              className="w-full h-full border-0 rounded-lg bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

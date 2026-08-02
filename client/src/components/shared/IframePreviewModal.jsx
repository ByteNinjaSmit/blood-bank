import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Document/image preview overlay used across the procurement and discard
 * screens. Renders an <img> for image URLs and an <iframe> for PDFs.
 * Previously copy-pasted into four page files (rule #5) — now shared.
 */
export default function IframePreviewModal({ isOpen, url, title, onClose }) {
  if (!isOpen || !url) return null;
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || !url.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-base font-bold text-gray-900">{title || 'Document Viewer'}</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}

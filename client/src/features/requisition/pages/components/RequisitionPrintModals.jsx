import { createPortal } from 'react-dom';
import RequisitionPrintTemplate from './RequisitionPrintTemplate';
import RequisitionLabelTemplate from './RequisitionLabelTemplate';
import RequisitionPrintService from '@/services/requisitionPrintService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function RequisitionPrintModals({
  printDoc, printType, printReportPage, setPrintType, setPrintDoc,
  selectedPrintLabelDoc, setSelectedPrintLabelDoc, selectedPrintReportDoc, setSelectedPrintReportDoc, printReport,
}) {
  return (
    <>
      {printDoc && createPortal(
        <div id="requisition-receipt-print-wrapper" className="hidden print:block">
          {printType === 'label' ? (
            <RequisitionLabelTemplate doc={printDoc} />
          ) : (
            <RequisitionPrintTemplate doc={printDoc} printPage={printReportPage} />
          )}
        </div>,
        document.body
      )}

      {/* Requisition Label Print Preview Modal */}
      <Dialog open={!!selectedPrintLabelDoc} onOpenChange={(open) => { if (!open) setSelectedPrintLabelDoc(null); }}>
        <DialogContent className="sm:max-w-2xl no-print flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>Requisition Label Print Preview</DialogTitle>
          </DialogHeader>

          {/* Wrapper to contain the CSS scaled label preview on screen */}
          <div
            className="flex items-center justify-center overflow-hidden my-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50"
            style={{
              width: '11.5cm',
              height: '14.5cm',
            }}
          >
            {selectedPrintLabelDoc && <RequisitionLabelTemplate doc={selectedPrintLabelDoc} isPreview={true} />}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6 w-full justify-end">
            <button
              onClick={() => setSelectedPrintLabelDoc(null)}
              className="px-5 py-2 text-xs font-bold border border-gray-300 rounded-lg hover:bg-gray-50 bg-white text-gray-700 shadow-none transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setPrintType('label');
                setPrintDoc(selectedPrintLabelDoc);
                setSelectedPrintLabelDoc(null);
                setTimeout(() => {
                  RequisitionPrintService.print('label');
                }, 100);
              }}
              className="px-6 py-2 text-xs font-bold bg-red-800 hover:bg-red-900 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              Print Label
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Requisition Issue Report Print Preview Modal (shows both pages before printing) */}
      <Dialog open={!!selectedPrintReportDoc} onOpenChange={(open) => { if (!open) setSelectedPrintReportDoc(null); }}>
        <DialogContent className="sm:max-w-4xl no-print flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>Issue Report Print Preview</DialogTitle>
          </DialogHeader>

          {/* Scrollable preview of both pages, stacked with a visual gap between them */}
          <div className="w-full max-h-[65vh] overflow-y-auto border border-dashed border-gray-200 rounded-lg bg-gray-50/50 p-4">
            {selectedPrintReportDoc && <RequisitionPrintTemplate doc={selectedPrintReportDoc} isPreview={true} />}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6 w-full justify-end flex-wrap">
            <button
              onClick={() => setSelectedPrintReportDoc(null)}
              className="px-5 py-2 text-xs font-bold border border-gray-300 rounded-lg hover:bg-gray-50 bg-white text-gray-700 shadow-none transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => printReport(selectedPrintReportDoc, 1)}
              className="px-5 py-2 text-xs font-bold border border-red-200 text-red-800 hover:bg-red-50 rounded-lg shadow-sm transition-colors"
            >
              Print Page 1 Only
            </button>
            <button
              onClick={() => printReport(selectedPrintReportDoc, 2)}
              className="px-5 py-2 text-xs font-bold border border-red-200 text-red-800 hover:bg-red-50 rounded-lg shadow-sm transition-colors"
            >
              Print Page 2 Only
            </button>
            <button
              onClick={() => printReport(selectedPrintReportDoc, 'both')}
              className="px-6 py-2 text-xs font-bold bg-red-800 hover:bg-red-900 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              Print Both Pages
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

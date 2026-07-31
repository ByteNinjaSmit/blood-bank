import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import RequisitionPrintTemplate from './RequisitionPrintTemplate';
import RequisitionLabelTemplate from './RequisitionLabelTemplate';
import RequisitionPrintService from '@/services/requisitionPrintService';

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
      {selectedPrintLabelDoc && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-xs no-print select-none py-8"
          onClick={() => setSelectedPrintLabelDoc(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col items-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPrintLabelDoc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              Requisition Label Print Preview
            </h3>

            {/* Wrapper to contain the CSS scaled label preview on screen */}
            <div
              className="flex items-center justify-center overflow-hidden my-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50"
              style={{
                width: '11.5cm',
                height: '14.5cm',
              }}
            >
              <RequisitionLabelTemplate doc={selectedPrintLabelDoc} isPreview={true} />
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
          </div>
        </div>
      )}

      {/* Requisition Issue Report Print Preview Modal (shows both pages before printing) */}
      {selectedPrintReportDoc && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-xs no-print select-none py-8"
          onClick={() => setSelectedPrintReportDoc(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative flex flex-col items-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPrintReportDoc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              Issue Report Print Preview
            </h3>

            {/* Scrollable preview of both pages, stacked with a visual gap between them */}
            <div className="w-full max-h-[65vh] overflow-y-auto border border-dashed border-gray-200 rounded-lg bg-gray-50/50 p-4">
              <RequisitionPrintTemplate doc={selectedPrintReportDoc} isPreview={true} />
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
          </div>
        </div>
      )}

    </>
  );
}

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { auditApi } from "@/features/audit/api";
import StockPrintLabelTemplate from "./StockPrintLabelTemplate";
import StockLabelPrintService from "@/services/stockLabelPrintService";

export default function StockPrintLabelModal({ item, onClose, formatDate }) {
  if (!item) return null;

  return (
    <>
      {createPortal(
        <div id="stock-label-print-wrapper" className="hidden print:block">
          <StockPrintLabelTemplate item={item} formatDate={formatDate} />
        </div>,
        document.body
      )}

      <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-2xl no-print flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>Blood Bag Label Print Preview</DialogTitle>
          </DialogHeader>

          {/* Wrapper to contain the CSS scaled label preview on screen */}
          <div
            className="flex items-center justify-center overflow-auto max-h-[65vh] max-w-full my-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 p-2"
            style={{
              width: '11.5cm',
              height: '14.5cm',
            }}
          >
            <StockPrintLabelTemplate item={item} formatDate={formatDate} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4 w-full justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-5 text-xs font-bold shadow-none"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                auditApi.logPrintEvent({
                  module: 'bag-stock',
                  entityType: 'BagStock',
                  entityId: item?.bag?.bagNo || item?.bagNo || 'unknown',
                  entityLabel: item?.bag?.segmentNo || item?.segmentNo,
                  docType: 'sticker',
                });
                StockLabelPrintService.print(item?.bag?.bagNo || item?.bagNo);
              }}
              className="px-6 text-xs font-bold bg-red-800 hover:bg-red-900 text-white shadow-sm flex items-center gap-1.5"
            >
              Print Label
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

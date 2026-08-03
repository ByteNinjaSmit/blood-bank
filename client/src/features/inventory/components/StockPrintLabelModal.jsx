import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
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
            className="flex items-center justify-center overflow-hidden my-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50"
            style={{
              width: '11.5cm',
              height: '14.5cm',
            }}
          >
            <StockPrintLabelTemplate item={item} formatDate={formatDate} />
          </div>

          {/* One-time browser print-setting warning — the page title,
              timestamp, URL and page number are drawn by the browser's
              own print dialog, outside the page, gated behind its
              "Headers and footers" setting. No CSS/JS on this page can
              turn that off — only the operator can, in the dialog. */}
          <div className="no-print w-full flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Before you click Print:</span> in the print dialog that opens, click{" "}
              <span className="font-semibold">More settings</span>, set{" "}
              <span className="font-semibold">Margins</span> to{" "}
              <span className="font-semibold">None</span>, and turn{" "}
              <span className="font-semibold">Headers and footers</span> OFF. This is a one-time browser
              setting — the sticker date, URL, and page number in the browser's header/footer come from that
              toggle, not from this page, and it stays off once set for future prints.
            </p>
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

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchStockRegister } from "../stockRegisterReport";
import StockRegisterReportTemplate from "./StockRegisterReportTemplate";
import StockRegisterPrintService from "@/services/stockRegisterPrintService";

const formatDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// `config` = { label, reportTitle, componentType, includeTesting, minRows, bbgMinRows }
export default function StockRegisterReportModal({ config, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!config) return;
    setReport(null);
    setIsLoading(true);
    fetchStockRegister(config)
      .then(setReport)
      .catch((e) => {
        toast.error(e?.response?.data?.message || "Failed to build stock register report");
        onClose();
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const open = !!config;

  return (
    <>
      {report && createPortal(
        <div id="stock-register-print-wrapper" className="hidden print:block">
          <StockRegisterReportTemplate
            stockGroups={report.stockGroups}
            testingGroups={report.testingGroups}
            formatDate={formatDate}
            reportTitle={config?.reportTitle}
          />
        </div>,
        document.body
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-5xl no-print flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>{config?.label || 'Stock Register'} — Print Preview</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 py-16">
              <Loader2 className="w-5 h-5 animate-spin" /> Building stock register…
            </div>
          ) : report ? (
            <>
              <div className="w-full max-h-[65vh] overflow-auto border border-dashed border-gray-200 rounded-lg bg-gray-50/50 p-4 flex flex-col items-center">
                <StockRegisterReportTemplate
                  stockGroups={report.stockGroups}
                  testingGroups={report.testingGroups}
                  formatDate={formatDate}
                  reportTitle={config?.reportTitle}
                />
              </div>

              <div className="no-print w-full flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 mt-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Before you click Print:</span> in the print dialog that opens, click{" "}
                  <span className="font-semibold">More settings</span> and turn{" "}
                  <span className="font-semibold">Headers and footers</span> OFF. This is a one-time browser
                  setting — the page date/URL/number in the browser's own header/footer come from that toggle, not
                  from this report, and it stays off once set.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-4 w-full justify-end">
                <Button variant="outline" onClick={onClose} className="px-5 text-xs font-bold shadow-none">
                  Cancel
                </Button>
                <Button
                  onClick={() => StockRegisterPrintService.print()}
                  className="px-6 text-xs font-bold bg-red-800 hover:bg-red-900 text-white shadow-sm flex items-center gap-1.5"
                >
                  Print Stock Register
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

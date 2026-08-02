import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BulkTransferCoverLetter from "@/features/inventory/components/BulkTransferCoverLetter";
import TestingCertificate from "@/features/inventory/components/TestingCertificate";
import BulkTransferInvoice from "@/features/inventory/components/BulkTransferInvoice";

export default function IssuePrintPrompts({ bulk }) {
  const {
    coverLetterPromptOpen, setCoverLetterPromptOpen, coverLetterBoxCount, setCoverLetterBoxCount, coverLetterPrintDoc, handleConfirmCoverLetter,
    testingCertPromptOpen, setTestingCertPromptOpen, testingCertBleedDate, setTestingCertBleedDate, testingCertBoxCount, setTestingCertBoxCount, testingCertPrintDoc, handleConfirmTestingCert,
    invoicePromptOpen, setInvoicePromptOpen, invoiceRate, setInvoiceRate, invoicePrintDoc, handleConfirmInvoice,
  } = bulk;
  return (
    <>
      {/* ── Cover Letter: Box Count Prompt ────────────────── */}
      <Dialog open={coverLetterPromptOpen} onOpenChange={(o) => { if (!o) setCoverLetterPromptOpen(false); }}>
        <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enter Box Count</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm p-1">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Total No. of Boxes</label>
            <input
              type="number"
              min="1"
              autoFocus
              value={coverLetterBoxCount}
              onChange={(e) => setCoverLetterBoxCount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCoverLetter(); }}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              placeholder="e.g. 5"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button onClick={() => setCoverLetterPromptOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button onClick={handleConfirmCoverLetter} className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5">
              Print
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print wrapper for the cover letter */}
      {coverLetterPrintDoc && createPortal(
        <div id="bulk-transfer-cover-letter-print-wrapper" className="hidden print:block">
          <BulkTransferCoverLetter transfer={coverLetterPrintDoc} boxCount={coverLetterPrintDoc.boxCount} />
        </div>,
        document.body
      )}

      {/* ── Testing Certificate: Bleed Date & Box Count Prompt ──── */}
      <Dialog open={testingCertPromptOpen} onOpenChange={(o) => { if (!o) setTestingCertPromptOpen(false); }}>
        <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Testing Certificate Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm p-1">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Bleed Date</label>
            <input
              type="date"
              autoFocus
              value={testingCertBleedDate}
              onChange={(e) => setTestingCertBleedDate(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Total No. of Boxes</label>
            <input
              type="number"
              min="1"
              value={testingCertBoxCount}
              onChange={(e) => setTestingCertBoxCount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmTestingCert(); }}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              placeholder="e.g. 6"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button onClick={() => setTestingCertPromptOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button onClick={handleConfirmTestingCert} className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5">
              Print
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print wrapper for the testing certificate */}
      {testingCertPrintDoc && createPortal(
        <div id="testing-certificate-print-wrapper" className="hidden print:block">
          <TestingCertificate transfer={testingCertPrintDoc} bleedDate={testingCertPrintDoc.bleedDate} boxCount={testingCertPrintDoc.boxCount} />
        </div>,
        document.body
      )}

      {/* ── Invoice: Rate Per Litre Prompt ─────────────────── */}
      <Dialog open={invoicePromptOpen} onOpenChange={(o) => { if (!o) setInvoicePromptOpen(false); }}>
        <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm p-1">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Rate per Litre (₹)</label>
            <input
              type="number"
              min="0"
              autoFocus
              value={invoiceRate}
              onChange={(e) => setInvoiceRate(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmInvoice(); }}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              placeholder="e.g. 1600"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button onClick={() => setInvoicePromptOpen(false)} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button onClick={handleConfirmInvoice} className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5">
              Print
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print wrapper for the invoice */}
      {invoicePrintDoc && createPortal(
        <div id="bulk-transfer-invoice-print-wrapper" className="hidden print:block">
          <BulkTransferInvoice transfer={invoicePrintDoc} ratePerLitre={invoicePrintDoc.ratePerLitre} />
        </div>,
        document.body
      )}
    </>
  );
}

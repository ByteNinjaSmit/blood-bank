/**
 * StockLabelPrintService
 * Print-isolation for the inventory stock bag label, mirroring
 * RequisitionPrintService's 'label' mode so both printed labels render at
 * the identical physical size (10cm x 13cm) instead of being constrained
 * by a transformed dialog ancestor.
 */
class StockLabelPrintService {
  // `label` is printed into the browser's own page-title header (when the
  // operator hasn't turned that off in the print dialog) — swap it for
  // something short and useful for the duration of the print instead of
  // leaving the full app title/URL there.
  static print(label) {
    const originalTitle = document.title;
    if (label) document.title = label;

    const styleEl = document.createElement('style');
    styleEl.id = 'stock-label-print-isolation-style';
    styleEl.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      @media print {
        @page {
          size: 10cm 13cm !important;
          margin: 0 !important;
        }

        html, body {
          width: 10cm !important;
          height: 13cm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          overflow: hidden !important;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif !important;
        }

        #root {
          display: none !important;
        }

        #stock-label-print-wrapper {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 10cm !important;
          height: 13cm !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          background: white !important;
          overflow: hidden !important;
        }

        #stock-label-print-wrapper .flex {
          display: flex !important;
        }

        #stock-label-print-wrapper .flex-col {
          flex-direction: column !important;
        }

        #stock-label-print-wrapper .flex-row {
          flex-direction: row !important;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-scheme: light !important;
        }
      }
    `;

    document.head.appendChild(styleEl);

    setTimeout(() => {
      window.print();

      const cleanupStyles = () => {
        const style = document.getElementById('stock-label-print-isolation-style');
        if (style) {
          style.remove();
        }
        if (label) document.title = originalTitle;
        window.removeEventListener('afterprint', cleanupStyles);
      };

      window.addEventListener('afterprint', cleanupStyles);
      setTimeout(cleanupStyles, 1500);
    }, 200);
  }
}

export default StockLabelPrintService;

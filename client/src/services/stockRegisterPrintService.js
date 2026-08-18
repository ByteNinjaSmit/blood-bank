/**
 * StockRegisterPrintService
 * Print-isolation for the Stock Register report (Stock page -> Export Excel
 * -> Export Stocks PRBC/FFP/RDP). Blood-group blocks flow continuously one
 * below another with a small gap — each block is marked "avoid splitting"
 * so the browser only starts a new page when a block wouldn't otherwise
 * fit (and still lets an oversized block split across pages rather than
 * overflow). The app chrome (#root) is hidden entirely so only the
 * register prints — no app header, sidebar, or footer.
 */
class StockRegisterPrintService {
  static print() {
    const originalTitle = document.title;
    document.title = 'Stock Register';

    const styleEl = document.createElement('style');
    styleEl.id = 'stock-register-print-isolation-style';
    styleEl.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif !important;
        }

        #root {
          display: none !important;
        }

        #stock-register-print-wrapper {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }

        #stock-register-print-wrapper .grid {
          display: grid !important;
        }

        #stock-register-print-wrapper .flex {
          display: flex !important;
        }

        #stock-register-print-wrapper table {
          display: table !important;
        }

        #stock-register-print-wrapper thead {
          display: table-header-group !important;
        }

        #stock-register-print-wrapper tbody {
          display: table-row-group !important;
        }

        #stock-register-print-wrapper tr {
          display: table-row !important;
        }

        #stock-register-print-wrapper th,
        #stock-register-print-wrapper td {
          display: table-cell !important;
        }

        .stock-register-block {
          break-inside: avoid;
          page-break-inside: avoid;
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
        const style = document.getElementById('stock-register-print-isolation-style');
        if (style) style.remove();
        document.title = originalTitle;
        window.removeEventListener('afterprint', cleanupStyles);
      };

      window.addEventListener('afterprint', cleanupStyles);
      setTimeout(cleanupStyles, 1500);
    }, 200);
  }
}

export default StockRegisterPrintService;

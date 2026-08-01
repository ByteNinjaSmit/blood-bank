/**
 * RequisitionPrintService
 * Handles print-specific stylesheets injection and window print trigger lifecycle.
 * Isolates the printable receipt element during browser print preview.
 */
class RequisitionPrintService {
  /**
   * Triggers browser print, isolating and scaling the print area depending on printType ('report' or 'label').
   */
  static print(printType = 'report') {
    // 1. Create a stylesheet to completely override normal page layout styles during print
    const styleEl = document.createElement('style');
    styleEl.id = 'requisition-print-isolation-style';
    
    if (printType === 'label') {
      styleEl.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @media print {
          /* Setup absolute page dimensions for the sticker labels */
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
          
          /* Hide the main React application container entirely during printing */
          #root {
            display: none !important;
          }
          
          /* Show only our print wrapper container at the top body level */
          #requisition-receipt-print-wrapper {
            display: block !important;
          }
          
          #requisition-receipt-print-wrapper {
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
          
          /* Restoring layout features for the sticker flex blocks */
          #requisition-receipt-print-wrapper .flex {
            display: flex !important;
          }
          
          #requisition-receipt-print-wrapper .flex-col {
            flex-direction: column !important;
          }
          
          #requisition-receipt-print-wrapper .flex-row {
            flex-direction: row !important;
          }
          
          /* Force colors & backgrounds in print preview */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-scheme: light !important;
          }
        }
      `;
    } else {
      styleEl.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @media print {
          /* Hide the main React application container entirely during printing */
          #root {
            display: none !important;
          }
          
          html, body {
            background: white !important;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif !important;
          }
          
          /* Show only our print wrapper container at the top body level */
          #requisition-receipt-print-wrapper {
            display: block !important;
          }
          
          /* Force receipt container to take full width and hide body margins */
          #requisition-receipt-print-wrapper {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* Restore grid display within the receipt if needed */
          #requisition-receipt-print-wrapper .grid {
            display: grid !important;
          }
          
          #requisition-receipt-print-wrapper .flex {
            display: flex !important;
          }
          
          #requisition-receipt-print-wrapper .divide-y > * + * {
            border-top-width: 1px !important;
          }

          #requisition-receipt-print-wrapper table {
            display: table !important;
          }

          #requisition-receipt-print-wrapper thead {
            display: table-header-group !important;
          }

          #requisition-receipt-print-wrapper tbody {
            display: table-row-group !important;
          }

          #requisition-receipt-print-wrapper tr {
            display: table-row !important;
          }

          #requisition-receipt-print-wrapper th, 
          #requisition-receipt-print-wrapper td {
            display: table-cell !important;
          }
          
          /* Force color & background adjustments in print preview */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-scheme: light !important;
          }
        }
      `;
    }
    
    document.head.appendChild(styleEl);

    // 2. Trigger print action asynchronously so React can mount the DOM elements
    setTimeout(() => {
      window.print();
      
      // 3. Cleanup: Remove the injected stylesheet once printing completes/cancels
      const cleanupStyles = () => {
        const style = document.getElementById('requisition-print-isolation-style');
        if (style) {
          style.remove();
        }
        window.removeEventListener('afterprint', cleanupStyles);
      };
      
      window.addEventListener('afterprint', cleanupStyles);
      // Fallback cleanup if afterprint isn't fired
      setTimeout(cleanupStyles, 1500);
    }, 200);
  }
}

export default RequisitionPrintService;

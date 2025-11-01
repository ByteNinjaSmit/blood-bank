// ./lib/discard-pdfGenerator.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/** Ensure directory exists */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Date formatter */
function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Draw a horizontal separator line */
function drawLine(doc, y) {
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#aaa').lineWidth(0.5).stroke();
}

/** Add page footer with page numbers */
function addFooter(doc) {
  const pageNumber = doc.bufferedPageRange().count;
  for (let i = 0; i < pageNumber; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.height - 40;
    drawLine(doc, bottom - 10);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#555');
    doc.text(`Generated automatically on ${new Date().toLocaleString('en-IN')}`, 40, bottom, { align: 'left' });
    doc.text(`Page ${i + 1} of ${pageNumber}`, -40, bottom, { align: 'right' });
  }
}

/**
 * Generate Auto Discard Report PDF (Improved version)
 */
async function generateDiscardPDF({ reportDir, title, subtitle, summaryRows = [], detailRows = [] }) {
  ensureDir(reportDir);

  const dateLabel = new Date().toISOString().slice(0, 10);
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false }).replace(/:/g, '');
  const fileName = `AutoDiscard_${dateLabel}_${timestamp}.pdf`;
  const filePath = path.join(reportDir, fileName);

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 40,
    bufferPages: true,
    info: {
      Title: 'Auto Discard Report',
      Author: 'Blood Bank Automation System',
      Subject: 'Daily Auto-Discarded Blood Components',
    },
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ================= HEADER =================
  doc.font('Helvetica-Bold').fontSize(20).fillColor('black')
    .text('BLOOD BANK MANAGEMENT SYSTEM', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(14).text(title, { align: 'center' });
  if (subtitle) {
    doc.font('Helvetica').fontSize(10).fillColor('#333').text(subtitle, { align: 'center' });
  }
  drawLine(doc, doc.y + 10);
  doc.moveDown(1);

  // ================= SUMMARY SECTION =================
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('black').text('SUMMARY BY COMPONENT TYPE AND BLOOD GROUP');
  doc.moveDown(0.5);

  let startX = 50;
  const colWidths = [200, 200, 200, 100];
  const headers = ['Component Type', 'Blood Group', 'Rh', 'Count'];

  const rowHeight = 18;
  let y = doc.y + 5;

  // Table header
  doc.font('Helvetica-Bold').fontSize(10);
  headers.forEach((h, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h, x, y, { width: colWidths[i], align: 'left' });
  });
  drawLine(doc, y + rowHeight - 4);
  y += rowHeight;

  // Summary rows
  doc.font('Helvetica').fontSize(10);
  if (summaryRows.length === 0) {
    doc.text('No components discarded today.', startX, y);
    y += rowHeight;
  } else {
    summaryRows.forEach(row => {
      const vals = [row.componentType, row.bloodGroup, row.rh, String(row.count)];
      vals.forEach((val, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(val || '-', x, y, { width: colWidths[i], align: 'left' });
      });
      y += rowHeight;
    });
  }

  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
  doc.moveDown(1.5);

  // ================= DETAILED SECTION =================
  doc.moveDown(1); // was 0.5 before — adds more space from previous table
  doc.font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('black')
    .text('DETAILED COMPONENT LIST', { align: 'center' }); // center-align properly
  doc.moveDown(0.8);

  const detailCols = [
    { label: 'S.No', width: 40 },
    { label: 'Bag No', width: 90 },
    { label: 'Component ID', width: 110 },
    { label: 'Component Type', width: 110 },
    { label: 'Blood Group', width: 70 },
    { label: 'Rh', width: 40 },
    { label: 'Expiry Date', width: 90 },
    { label: 'Site', width: 110 },
    { label: 'Reason', width: 120 },
  ];

  startX = 50;
  const headerY = doc.y + 5;
  const rowGap = 4;
  const tableBottomMargin = 60;

  // ---- HEADER ----
  doc.font('Helvetica-Bold').fontSize(9);
  detailCols.forEach((c, i) => {
    const colX = startX + detailCols.slice(0, i).reduce((a, b) => a + b.width, 0);
    doc.text(c.label, colX, headerY, { width: c.width });
  });
  drawLine(doc, headerY + 14);

  // ---- ROWS ----
  doc.font('Helvetica').fontSize(9);
  y = headerY + 18;

  if (detailRows.length === 0) {
    doc.text('No detailed records available.', startX, y);
  } else {
    for (let idx = 0; idx < detailRows.length; idx++) {
      const d = detailRows[idx];

      const vals = [
        idx + 1,
        d.bagNo || '-',
        d.componentId || '-',  
        d.componentType || '-',
        d.bloodGroup || '-',
        d.rh || '-',
        formatDate(d.expiryDate),
        d.siteName || '-',
        d.reason || 'Expired',
      ];

      // Step 1: measure each cell’s wrapped height
      const cellHeights = vals.map((val, i) => {
        const options = { width: detailCols[i].width, align: 'left' };
        return doc.heightOfString(String(val), options);
      });

      // Step 2: determine row height (max height of wrapped cells + padding)
      const rowHeight = Math.max(...cellHeights) + rowGap;

      // Step 3: handle page break
      if (y + rowHeight > doc.page.height - tableBottomMargin) {
        doc.addPage();
        y = 60;

        // re-render header on new page
        doc.font('Helvetica-Bold').fontSize(9);
        detailCols.forEach((c, i) => {
          const colX = startX + detailCols.slice(0, i).reduce((a, b) => a + b.width, 0);
          doc.text(c.label, colX, y, { width: c.width });
        });
        drawLine(doc, y + 14);
        doc.font('Helvetica').fontSize(9);
        y += 18;
      }

      // Step 4: render each cell with proper wrapping
      vals.forEach((val, i) => {
        const colX = startX + detailCols.slice(0, i).reduce((a, b) => a + b.width, 0);
        doc.text(String(val), colX, y, {
          width: detailCols[i].width,
          align: 'left',
        });
      });

      // Step 5: draw separator line after each row
      drawLine(doc, y + rowHeight - 3);
      y += rowHeight;
    }
  }

  // ================= FOOTER =================
  // ================= FOOTER =================
  // Remove the extra addPage() that was causing blank pages
  addFooter(doc);

  doc.end();
  await new Promise((res, rej) => {
    stream.on('finish', res);
    stream.on('error', rej);
  });

  return filePath;

}

module.exports = { generateDiscardPDF };

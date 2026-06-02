// lib/pdfGenerator.js
const fs = require('fs');
const path = require('path');

let PDFDocument;
let pdfkitAvailable = false;

function initializePDFKit() {
  try {
    PDFDocument = require('pdfkit');
    pdfkitAvailable = true;
    return true;
  } catch (error) {
    console.error('[PDF] Failed to initialize PDFKit:', error.message);
    return false;
  }
}

initializePDFKit();

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function drawLine(doc) {
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.5);
}

function drawTable(doc, headers, rows, columnWidths, startX, startY) {
  const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0);
  const rowHeight = 22;
  const headerHeight = 28;

  // Draw header background
  doc.rect(startX, startY, tableWidth, headerHeight).fill('#f0f0f0');

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
  let currentX = startX;
  headers.forEach((header, i) => {
    doc.text(header, currentX + 5, startY + 8, { width: columnWidths[i] - 10, align: 'left' });
    currentX += columnWidths[i];
  });

  doc.rect(startX, startY, tableWidth, headerHeight).stroke();

  // Column separators
  currentX = startX;
  for (let i = 1; i < headers.length; i++) {
    currentX += columnWidths[i - 1];
    doc
      .moveTo(currentX, startY)
      .lineTo(currentX, startY + headerHeight)
      .stroke();
  }

  let currentY = startY + headerHeight;
  rows.forEach((row, rowIndex) => {
    if (currentY + rowHeight > doc.page.height - 80) {
      doc.addPage({ layout: 'landscape' });
      currentY = doc.page.margins.top;
    }

    const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
    doc.rect(startX, currentY, tableWidth, rowHeight).fill(bgColor);

    doc.fontSize(8).font('Helvetica').fillColor('#000');
    currentX = startX;
    row.forEach((cell, i) => {
      const text = String(cell ?? '').substring(0, 35);
      doc.text(text, currentX + 5, currentY + 6, { width: columnWidths[i] - 10, align: 'left' });
      currentX += columnWidths[i];
    });

    doc.rect(startX, currentY, tableWidth, rowHeight).stroke();

    currentX = startX;
    for (let i = 1; i < row.length; i++) {
      currentX += columnWidths[i - 1];
      doc
        .moveTo(currentX, currentY)
        .lineTo(currentX, currentY + rowHeight)
        .stroke();
    }

    currentY += rowHeight;
  });

  return currentY;
}

function addPageHeader(doc, title, subtitle) {
  doc.fontSize(16).font('Helvetica-Bold').text('BLOOD BANK MANAGEMENT SYSTEM', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
  if (subtitle) doc.fontSize(10).font('Helvetica').text(subtitle, { align: 'center' });
  doc.moveDown(0.5);
  drawLine(doc);
}

function addSummarySection(doc, summaryRows) {
  doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY BY COMPONENT TYPE AND BLOOD GROUP');
  doc.moveDown(0.5);

  const headers = ['Component Type', 'Blood Group', 'Rh', 'Count'];
  const columnWidths = [200, 100, 50, 100];

  const rows = (summaryRows || []).map((r) => [r.componentType, r.bloodGroup, r.rh, r.count]);
  drawTable(doc, headers, rows, columnWidths, doc.page.margins.left, doc.y);

  doc.moveDown(1);
}

function addDetailsSection(doc, detailRows) {
  doc.moveDown(1); // Add extra space before the section
  doc.fontSize(12).font('Helvetica-Bold').text('DETAILED COMPONENT LISTING');
  doc.moveDown(0.5);

  const headers = [
    'Component ID',
    'Bag No',
    'Component Type',
    'Blood Group',
    'Rh',
    'Volume (ml)',
    'Expiry Date',
    'Status',
    'Location',
  ];
  const columnWidths = [100, 60, 100, 80, 50, 80, 80, 80, 150]; // Adjusted for landscape

  const rows = (detailRows || []).map((d) => [
    d.componentId || '',
    d.bagNo || '',
    d.componentType || '',
    d.bloodGroup || '',
    d.rh || '',
    d.volumeMl ?? '',
    d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '',
    d.status || '',
    d.storageLocation || '',
  ]);

  drawTable(doc, headers, rows, columnWidths, doc.page.margins.left, doc.y);
  doc.moveDown(1);
}

function addFooter(doc, totalComponents) {
  doc.fontSize(8).font('Helvetica');
  doc.y = doc.page.height - 50;
  drawLine(doc);
  doc.text(`Report generated on: ${new Date().toLocaleString()}`, { align: 'left' });
  doc.text(`Total components: ${totalComponents}`, { align: 'right' });
  doc.moveDown(0.5);
  doc.text('This is an automated report. Please verify all information before taking action.', {
    align: 'center',
  });
}

async function generateNearExpiryPDF({
  title,
  subtitle,
  reportDir,
  dateLabel,
  summaryRows,
  detailRows,
}) {
  if (!pdfkitAvailable) throw new Error('PDFKit is not available - PDF generation disabled');

  ensureDir(reportDir);
  const filename = `NearExpiry_${dateLabel}.pdf`;
  const filePath = path.join(reportDir, filename);

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape', // Landscape orientation
    margin: 40,
    info: {
      Title: 'Near Expiry Blood Components Report',
      Author: 'Blood Bank Management System',
      Subject: 'Blood Component Expiry Report',
      Keywords: 'blood bank, expiry, components',
      CreationDate: new Date(),
    },
  });

  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  addPageHeader(doc, title, subtitle);
  addSummarySection(doc, summaryRows);
  addDetailsSection(doc, detailRows);
  addFooter(doc, detailRows ? detailRows.length : 0);

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  return filePath;
}

module.exports = { generateNearExpiryPDF };

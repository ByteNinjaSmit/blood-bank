import PDFDocument from 'pdfkit';
import { PassThrough } from 'node:stream';
import { env } from '@/core/config/env';

// ─── Brand ───────────────────────────────────────────────────────────────────
const RED = '#b91c1c';
const RED_DARK = '#991b1b';
const ZINC_900 = '#18181b';
const ZINC_700 = '#3f3f46';
const ZINC_500 = '#71717a';
const ZINC_200 = '#e4e4e7';
const ZINC_50 = '#fafafa';
const WHITE = '#ffffff';

const BANK_NAME = () => env.BANK_NAME || 'Sanjivani Blood Bank';
const BANK_ADDRESS = () => env.BANK_ADDRESS || '';
const BANK_PHONE = () => env.BANK_PHONE || '';
const BANK_LICENSE = () => env.BANK_LICENSE || '';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function bufferFromStream(stream: PassThrough): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

function pageHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string): void {
  // Red header bar
  doc.rect(0, 0, doc.page.width, 72).fill(RED);
  doc
    .fillColor(WHITE)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(BANK_NAME(), 40, 20, { lineBreak: false });
  doc
    .fillColor('rgba(255,255,255,0.75)')
    .fontSize(9)
    .font('Helvetica')
    .text('Blood Bank Management System', 40, 42, { lineBreak: false });

  // Title beneath header
  doc.rect(0, 72, doc.page.width, 40).fill('#f4f4f5');
  doc
    .fillColor(ZINC_900)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(title, 40, 82, { lineBreak: false });
  if (subtitle) {
    doc
      .fillColor(ZINC_500)
      .fontSize(9)
      .font('Helvetica')
      .text(subtitle, doc.page.width - 40 - 200, 84, { width: 200, align: 'right' });
  }
  doc.moveDown(0.5);
  doc.y = 126;
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string): void {
  doc.moveDown(0.4);
  doc.rect(40, doc.y, doc.page.width - 80, 22).fill('#fee2e2');
  doc
    .fillColor(RED_DARK)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(text, 48, doc.y + 6);
  doc.moveDown(0.6);
}

function keyValueRow(doc: PDFKit.PDFDocument, label: string, value: string, y?: number): void {
  const ty = y ?? doc.y;
  doc
    .fillColor(ZINC_500)
    .fontSize(9)
    .font('Helvetica')
    .text(label, 40, ty, { width: 160, lineBreak: false });
  doc
    .fillColor(ZINC_900)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(value, 210, ty, { width: doc.page.width - 250, lineBreak: false });
  doc.y = ty + 16;
}

function tableHeader(
  doc: PDFKit.PDFDocument,
  columns: Array<{ label: string; width: number; align?: 'left' | 'right' | 'center' }>,
): void {
  const y = doc.y;
  let x = 40;
  doc.rect(40, y, doc.page.width - 80, 20).fill(RED);
  columns.forEach(({ label, width, align }) => {
    doc
      .fillColor(WHITE)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(label, x + 4, y + 6, { width: width - 8, align: align ?? 'left', lineBreak: false });
    x += width;
  });
  doc.y = y + 20;
}

function tableRow(
  doc: PDFKit.PDFDocument,
  cells: string[],
  widths: number[],
  opts: { even?: boolean; height?: number } = {},
): void {
  const y = doc.y;
  const h = opts.height ?? 18;
  const bg = opts.even ? ZINC_50 : WHITE;
  doc
    .rect(40, y, doc.page.width - 80, h)
    .fill(bg)
    .stroke(ZINC_200);
  let x = 40;
  cells.forEach((cell, i) => {
    const w = widths[i] ?? 80;
    doc
      .fillColor(ZINC_700)
      .fontSize(8)
      .font('Helvetica')
      .text(cell, x + 4, y + 5, { width: w - 8, lineBreak: false });
    x += w;
  });
  doc.y = y + h;
}

function footer(doc: PDFKit.PDFDocument): void {
  const y = doc.page.height - 48;
  doc.rect(0, y, doc.page.width, 48).fill('#f4f4f5');
  doc.rect(0, y, doc.page.width, 1).fill(ZINC_200);
  const lines: string[] = [BANK_NAME()];
  if (BANK_ADDRESS()) lines.push(BANK_ADDRESS());
  if (BANK_PHONE()) lines.push(`Tel: ${BANK_PHONE()}`);
  if (BANK_LICENSE()) lines.push(`Licence: ${BANK_LICENSE()}`);
  lines.push(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  doc
    .fillColor(ZINC_500)
    .fontSize(8)
    .font('Helvetica')
    .text(lines.join('  |  '), 40, y + 12, {
      width: doc.page.width - 80,
      align: 'center',
      lineBreak: false,
    });
  doc
    .fillColor(ZINC_500)
    .fontSize(7)
    .font('Helvetica')
    .text('Confidential — Internal Blood Bank Management System', 40, y + 28, {
      width: doc.page.width - 80,
      align: 'center',
      lineBreak: false,
    });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface NearExpiryUnit {
  unitId: string;
  componentType: string;
  aboGroup: string;
  rhFactor: string;
  expiresAt: string;
  daysLeft: number;
  locationOrCamp?: string;
}

export async function generateNearExpiryReportPdf(opts: {
  reportDate: string;
  daysThreshold: number;
  units: NearExpiryUnit[];
}): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  pageHeader(
    doc,
    'Near-Expiry Stock Report',
    `${opts.reportDate}  |  Within ${opts.daysThreshold} day(s)  |  ${opts.units.length} unit(s)`,
  );

  sectionTitle(doc, 'Summary');
  keyValueRow(doc, 'Report Date', opts.reportDate);
  keyValueRow(doc, 'Threshold', `${opts.daysThreshold} day(s)`);
  keyValueRow(doc, 'Total Units', String(opts.units.length));

  // Group by component type
  const grouped = opts.units.reduce<Record<string, number>>((acc, u) => {
    acc[u.componentType] = (acc[u.componentType] ?? 0) + 1;
    return acc;
  }, {});
  Object.entries(grouped).forEach(([comp, cnt]) => keyValueRow(doc, comp, `${cnt} unit(s)`));

  doc.moveDown(0.5);
  sectionTitle(doc, `Unit Detail (FEFO Order — ${opts.units.length} units)`);

  const cols = [
    { label: 'Unit ID', width: 140 },
    { label: 'Component', width: 110 },
    { label: 'Blood Group', width: 80 },
    { label: 'Expires', width: 90 },
    { label: 'Days Left', width: 70 },
  ];
  tableHeader(doc, cols);
  opts.units.forEach((u, i) => {
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
      pageHeader(doc, 'Near-Expiry Stock Report (cont.)', opts.reportDate);
      tableHeader(doc, cols);
    }
    tableRow(
      doc,
      [
        u.unitId,
        u.componentType,
        `${u.aboGroup} ${u.rhFactor}`,
        u.expiresAt.slice(0, 10),
        String(u.daysLeft),
      ],
      cols.map((c) => c.width),
      { even: i % 2 === 0 },
    );
  });

  footer(doc);
  doc.end();
  return bufferFromStream(stream);
}

export interface DiscardedUnit {
  unitId: string;
  componentType: string;
  aboGroup: string;
  rhFactor: string;
  discardReason: string;
  discardedAt: string;
  discardedBy?: string;
}

export async function generateDiscardReportPdf(opts: {
  reportDate: string;
  units: DiscardedUnit[];
  byReason: Array<{ reason: string; count: number }>;
}): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  pageHeader(
    doc,
    'Daily Discard Report',
    `${opts.reportDate}  |  ${opts.units.length} unit(s) discarded`,
  );

  sectionTitle(doc, 'Breakdown by Reason');
  const reasonCols = [
    { label: 'Discard Reason', width: 300 },
    { label: 'Count', width: 100 },
  ];
  tableHeader(doc, reasonCols);
  opts.byReason.forEach((r, i) => {
    tableRow(
      doc,
      [r.reason, String(r.count)],
      reasonCols.map((c) => c.width),
      { even: i % 2 === 0 },
    );
  });

  doc.moveDown(0.5);
  sectionTitle(doc, `Unit-Level Detail (${opts.units.length} records)`);

  const unitCols = [
    { label: 'Unit ID', width: 130 },
    { label: 'Component', width: 100 },
    { label: 'Blood Group', width: 70 },
    { label: 'Reason', width: 120 },
    { label: 'Discarded At', width: 95 },
  ];
  tableHeader(doc, unitCols);
  opts.units.forEach((u, i) => {
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
      pageHeader(doc, 'Discard Report (cont.)', opts.reportDate);
      tableHeader(doc, unitCols);
    }
    tableRow(
      doc,
      [
        u.unitId,
        u.componentType,
        `${u.aboGroup} ${u.rhFactor}`,
        u.discardReason,
        u.discardedAt.slice(0, 16),
      ],
      unitCols.map((c) => c.width),
      { even: i % 2 === 0 },
    );
  });

  footer(doc);
  doc.end();
  return bufferFromStream(stream);
}

export interface MonthlyMisData {
  month: string;
  totalDonations: number;
  totalUnitsIssued: number;
  totalDiscarded: number;
  totalExpired: number;
  reactiveCount: number;
  campCount: number;
  newDonors: number;
  bloodGroupBreakdown?: Array<{
    bloodGroup: string;
    rh: string;
    issued: number;
    discarded: number;
  }>;
  componentBreakdown?: Array<{
    componentType: string;
    collected: number;
    issued: number;
    discarded: number;
  }>;
}

export async function generateMonthlyMisReportPdf(data: MonthlyMisData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  pageHeader(doc, 'Monthly Management Information System Report', data.month);

  sectionTitle(doc, 'Key Performance Indicators');
  const kpis: [string, string][] = [
    ['Total Donations Collected', String(data.totalDonations)],
    ['Total Units Issued', String(data.totalUnitsIssued)],
    ['Total Units Discarded', String(data.totalDiscarded)],
    ['Total Units Expired', String(data.totalExpired)],
    ['Reactive TTI Results', String(data.reactiveCount)],
    ['Donation Camps Held', String(data.campCount)],
    ['New Donors Registered', String(data.newDonors)],
    [
      'Utilisation Rate',
      data.totalDonations > 0
        ? `${((data.totalUnitsIssued / data.totalDonations) * 100).toFixed(1)}%`
        : 'N/A',
    ],
    [
      'Discard Rate',
      data.totalDonations > 0
        ? `${((data.totalDiscarded / data.totalDonations) * 100).toFixed(1)}%`
        : 'N/A',
    ],
  ];
  kpis.forEach(([label, value]) => keyValueRow(doc, label, value));

  if (data.componentBreakdown?.length) {
    doc.moveDown(0.5);
    sectionTitle(doc, 'Component Breakdown');
    const compCols = [
      { label: 'Component Type', width: 160 },
      { label: 'Collected', width: 100 },
      { label: 'Issued', width: 100 },
      { label: 'Discarded', width: 100 },
    ];
    tableHeader(doc, compCols);
    data.componentBreakdown.forEach((c, i) => {
      tableRow(
        doc,
        [c.componentType, String(c.collected), String(c.issued), String(c.discarded)],
        compCols.map((col) => col.width),
        { even: i % 2 === 0 },
      );
    });
  }

  if (data.bloodGroupBreakdown?.length) {
    doc.moveDown(0.5);
    sectionTitle(doc, 'Blood Group Breakdown');
    const bgCols = [
      { label: 'Blood Group', width: 120 },
      { label: 'Issued', width: 120 },
      { label: 'Discarded', width: 120 },
    ];
    tableHeader(doc, bgCols);
    data.bloodGroupBreakdown.forEach((b, i) => {
      tableRow(
        doc,
        [`${b.bloodGroup} ${b.rh}`, String(b.issued), String(b.discarded)],
        bgCols.map((c) => c.width),
        { even: i % 2 === 0 },
      );
    });
  }

  footer(doc);
  doc.end();
  return bufferFromStream(stream);
}

export interface DonationCertificateData {
  donorName: string;
  donorId: string;
  donationId: string;
  bloodGroup: string;
  rh: string;
  collectedAt: string;
  campName?: string;
  phlebotomist?: string;
  unitCount: number;
}

export async function generateDonationCertificatePdf(
  data: DonationCertificateData,
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Decorative border
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke(RED);
  doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).stroke('#fee2e2');

  // Header
  doc.rect(40, 40, doc.page.width - 80, 60).fill(RED);
  doc
    .fillColor(WHITE)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(BANK_NAME(), 40, 52, { align: 'center', width: doc.page.width - 80, lineBreak: false });
  doc
    .fillColor('rgba(255,255,255,0.8)')
    .fontSize(10)
    .font('Helvetica')
    .text('Certificate of Blood Donation', 40, 78, {
      align: 'center',
      width: doc.page.width - 80,
      lineBreak: false,
    });

  // Certificate body
  doc.y = 130;
  doc
    .fillColor(ZINC_900)
    .fontSize(13)
    .font('Helvetica')
    .text('This is to certify that', { align: 'center' });
  doc.moveDown(0.3);
  doc.fillColor(RED).fontSize(26).font('Helvetica-Bold').text(data.donorName, { align: 'center' });
  doc.moveDown(0.3);
  doc
    .fillColor(ZINC_700)
    .fontSize(13)
    .font('Helvetica')
    .text('has voluntarily donated blood on', { align: 'center' });
  doc.moveDown(0.3);
  doc
    .fillColor(ZINC_900)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(data.collectedAt, { align: 'center' });
  doc.moveDown(0.6);
  doc
    .fillColor(ZINC_700)
    .fontSize(12)
    .font('Helvetica')
    .text('and has thereby contributed to the gift of life.', { align: 'center' });

  // Divider
  doc.moveDown(0.8);
  doc.rect(80, doc.y, doc.page.width - 160, 1).fill(ZINC_200);
  doc.moveDown(0.6);

  // Info grid
  const infoY = doc.y;
  const halfW = (doc.page.width - 100) / 2;
  const infoPairs: [string, string][] = [
    ['Donor ID', data.donorId],
    ['Donation ID', data.donationId],
    ['Blood Group', `${data.bloodGroup} ${data.rh}`],
    ['Units Derived', String(data.unitCount)],
    ...(data.campName ? [['Camp', data.campName] as [string, string]] : []),
    ...(data.phlebotomist ? [['Collected by', data.phlebotomist] as [string, string]] : []),
  ];
  infoPairs.forEach(([label, val], i) => {
    const x = i % 2 === 0 ? 60 : 60 + halfW;
    const y = infoY + Math.floor(i / 2) * 22;
    doc
      .fillColor(ZINC_500)
      .fontSize(9)
      .font('Helvetica')
      .text(label + ':', x, y, { width: 90, lineBreak: false });
    doc
      .fillColor(ZINC_900)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(val, x + 90, y, { width: halfW - 100, lineBreak: false });
  });

  // Bottom note
  doc.y = doc.page.height - 130;
  doc.rect(40, doc.y, doc.page.width - 80, 1).fill(ZINC_200);
  doc.moveDown(0.5);
  doc
    .fillColor(ZINC_500)
    .fontSize(9)
    .font('Helvetica')
    .text('Thank you for saving lives. One donation can help up to three patients.', {
      align: 'center',
    });
  doc.moveDown(0.4);
  doc
    .fillColor(ZINC_500)
    .fontSize(8)
    .text(`Next eligible donation: 90 days from ${data.collectedAt}`, { align: 'center' });

  footer(doc);
  doc.end();
  return bufferFromStream(stream);
}

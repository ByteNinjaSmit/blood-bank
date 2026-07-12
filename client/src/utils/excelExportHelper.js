import { toast } from 'sonner';
import { buildStyledSheet, buildMultiTableSheet, buildDashboardMultiTableSheet, XLSX } from '@/utils/xlsxStyleHelper';

/**
 * Formats a date string/object to DD/MM/YYYY
 */
export const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date string/object to DD/MM/YYYY HH:mm
 */
export const formatDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Builds the standard { reportType, filtersApplied, reportPeriod } trio used
 * by every export sheet's header. Pass the page's active filter values (as a
 * label -> value map) plus an optional from/to date range; empty/falsy filter
 * values are ignored so the description only lists what's actually active.
 */
export function buildExportMeta(filters = {}, { fromDate, toDate } = {}) {
  const activeFilters = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const isFiltered = activeFilters.length > 0 || Boolean(fromDate) || Boolean(toDate);

  const parts = activeFilters.map(([label, value]) => `${label}: ${value}`);
  if (fromDate || toDate) {
    if (fromDate && toDate) parts.push(`Date Range: ${formatDate(fromDate)} to ${formatDate(toDate)}`);
    else if (fromDate) parts.push(`Date Range: From ${formatDate(fromDate)}`);
    else parts.push(`Date Range: Until ${formatDate(toDate)}`);
  }

  let reportPeriod = 'All Records';
  if (fromDate && toDate) reportPeriod = `${formatDate(fromDate)} to ${formatDate(toDate)}`;
  else if (fromDate) reportPeriod = `From ${formatDate(fromDate)}`;
  else if (toDate) reportPeriod = `Until ${formatDate(toDate)}`;

  return {
    reportType: isFiltered ? 'FILTERED REPORT' : 'FULL REPORT',
    filtersApplied: parts.length > 0 ? parts.join('; ') : undefined,
    reportPeriod,
  };
}

/**
 * Central utility that renders one or more styled worksheets fully in the
 * browser (via xlsx-js-style) — the same "proper heading + colored table"
 * design used by the requisition and master donor/donation exports, with no
 * server round-trip. Each `sheet` is { name, title, subtitle, headers, rows,
 * stats, reportPeriod, filtersApplied, groupHeader, totalRowIndexes }.
 */
export async function downloadExcelReport(sheets, filename = 'Report.xlsx') {
  try {
    const wb = XLSX.utils.book_new();

    (sheets || []).forEach((sheet, idx) => {
      const {
        name = `Sheet${idx + 1}`,
        title = 'SANJIVANI BLOOD BANK, KOPARGAON',
        subtitle = '',
        headers = [],
        rows = [],
        stats = [],
        reportPeriod = 'All Records',
        filtersApplied,
        groupHeader,
        totalRowIndexes,
        highlightRowIndexes,
        redCells,
        tables,
        generatedBy,
      } = sheet;

      const statsParts = (stats || []).map((s) => `${s.label}: ${s.value}`);
      if (filtersApplied) statsParts.push(`Filters — ${filtersApplied}`);
      const statsLine = statsParts.length ? statsParts.join('     ·     ') : undefined;

      const ws = tables
        ? buildDashboardMultiTableSheet(tables, {
            title,
            subtitle,
            generatedBy,
            reportPeriod,
            formatDateTime,
          })
        : buildStyledSheet(rows, {
            title,
            subtitle,
            generatedBy,
            reportPeriod,
            statsLine,
            columns: headers,
            groupHeader,
            totalRowIndexes,
            highlightRowIndexes,
            redCells,
            formatDateTime,
          });
      XLSX.utils.book_append_sheet(wb, ws, String(name).slice(0, 31));
    });

    XLSX.writeFile(wb, filename);
    const reportLabel = sheets?.[0]?.subtitle || sheets?.[0]?.name || 'Excel report';
    toast.success(`"${reportLabel}" downloaded successfully!`);
  } catch (e) {
    toast.error(e.message || 'Failed to generate Excel report');
    console.error(e);
  }
}

/**
 * Same shell as downloadExcelReport, but each sheet stacks several
 * independent tables one below another (via buildMultiTableSheet) instead of
 * one flat table — e.g. the Storage register, where every send date/location
 * gets its own titled table in the same sheet.
 * `sheet.blocks` = [{ label, rows }]; `sheet.headers` are shared across blocks.
 */
export async function downloadMultiTableExcelReport(sheets, filename = 'Report.xlsx') {
  try {
    const wb = XLSX.utils.book_new();

    (sheets || []).forEach((sheet, idx) => {
      const {
        name = `Sheet${idx + 1}`,
        title = 'SANJIVANI BLOOD BANK, KOPARGAON',
        subtitle = '',
        headers = [],
        blocks = [],
        stats = [],
        reportPeriod = 'All Records',
        filtersApplied,
      } = sheet;

      const statsParts = (stats || []).map((s) => `${s.label}: ${s.value}`);
      if (filtersApplied) statsParts.push(`Filters — ${filtersApplied}`);
      const statsLine = statsParts.length ? statsParts.join('     ·     ') : undefined;

      const ws = buildMultiTableSheet(blocks, {
        title,
        subtitle,
        reportPeriod,
        statsLine,
        columns: headers,
        formatDateTime,
      });
      XLSX.utils.book_append_sheet(wb, ws, String(name).slice(0, 31));
    });

    XLSX.writeFile(wb, filename);
    const reportLabel = sheets?.[0]?.subtitle || sheets?.[0]?.name || 'Excel report';
    toast.success(`"${reportLabel}" downloaded successfully!`);
  } catch (e) {
    toast.error(e.message || 'Failed to generate Excel report');
    console.error(e);
  }
}

// ==========================================
// 17 PAGE SPECIFIC EXPORT MAPPERS
// ==========================================

// 1. Camp Donors
export async function exportCampDonors(items, campName = 'Camp', meta = {}) {
  const headers = ['Sr No', 'Full Name', 'DOB', 'Age', 'Sex', 'Phone', 'Email', 'Blood Group', 'Last Donation', 'Status'];

  const ageFromDob = (dob) => {
    if (!dob) return '—';
    const b = new Date(dob);
    if (Number.isNaN(b.getTime())) return '—';
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age >= 0 ? age : '—';
  };

  const rows = items.map((r, i) => {
    const fullName = r.name
      ? (typeof r.name === 'object' ? [r.name.firstName, r.name.middleName, r.name.lastName].filter(Boolean).join(' ') : r.name)
      : '—';
    const bg = r.rh ? `${r.bloodGroup ?? ''} ${r.rh}`.trim() : (r.bloodGroup || '—');
    return [
      i + 1,
      fullName,
      formatDate(r.dob),
      ageFromDob(r.dob),
      r.sex || '—',
      r.phone || '—',
      r.email || '—',
      bg || '—',
      formatDate(r.lastDonationDate),
      (r.status || 'Active').toUpperCase(),
    ];
  });

  const stats = [
    { label: 'Total Donors', value: items.length },
    { label: 'Temporary/Deferred', value: items.filter(r => r.status?.toLowerCase() === 'deferred').length },
  ];

  await downloadExcelReport([{
    name: 'Camp Donors',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: `Camp Donor Registry - ${campName}`,
    headers,
    rows,
    stats,
    ...meta,
  }], `Camp_Donors_${campName.replace(/\s+/g, '_')}.xlsx`);
}

// 2. Camp Donations
export async function exportCampDonations(items, campName = 'Camp', meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Donor Name', 'Bag Type', 'Blood Group', 'Units', 'Fitness', 'Status', 'Collected At'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => {
    const donorName = r.donorId?.name 
      ? [r.donorId.name.firstName, r.donorId.name.middleName, r.donorId.name.lastName].filter(Boolean).join(' ')
      : r.donorName || '—';
    return [
      i + 1,
      r.bagNo || '—',
      donorName,
      r.donationType || r.bagType || '—',
      r.bloodGroup || '—',
      r.unitsCount ?? 1,
      (r.fitnessStatus || '—').toUpperCase(),
      (r.status || '—').toUpperCase(),
      formatDateTime(r.collectedAt || r.createdAt),
    ];
  });

  const stats = [
    { label: 'Total Donations', value: items.length },
    { label: 'Fit Bags', value: items.filter(r => r.fitnessStatus?.toLowerCase() === 'fit').length },
    { label: 'Unfit Bags', value: items.filter(r => r.fitnessStatus?.toLowerCase() === 'unfit').length },
  ];

  await downloadExcelReport([{
    name: 'Camp Donations',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: `Camp Donation Log - ${campName}`,
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], `Camp_Donations_${campName.replace(/\s+/g, '_')}.xlsx`);
}

// 3. Component List
export async function exportComponents(items, meta = {}) {
  const headers = ['Sr No', 'Component ID', 'Bag No', 'Segment No', 'Component Type', 'Blood Group', 'Volume (mL)', 'Site', 'Created At', 'Storage Location', 'Expiry Date', 'Status'];
  const alignments = ['center', 'center', 'center', 'center', 'left', 'center', 'center', 'left', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.componentId || r._id || '—',
    r.bagNo || r.bag?.bagNo || '—',
    r.segmentNo || '—',
    r.componentType || '—',
    r.bloodGroup || (r.bag ? `${r.bag.bloodGroup} ${r.bag.rh || ''}` : '—'),
    r.volumeMl ?? '—',
    r.site || '—',
    formatDate(r.createdAt),
    r.storageLocation || 'Main Fridge',
    formatDate(r.expiryDate),
    (r.status || '—').toUpperCase(),
  ]);

  const stats = [
    { label: 'Total Components', value: items.length },
    { label: 'In Stock', value: items.filter(r => r.status?.toLowerCase() === 'in-stock' || r.status?.toLowerCase() === 'available').length },
  ];

  await downloadExcelReport([{
    name: 'Component Inventory',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Blood Component Inventory Ledger',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Component_Inventory_Report.xlsx');
}

// 3b. Near-Expiry Components
export async function exportNearExpiryComponents(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Component Type', 'Blood Group', 'Volume (mL)', 'Status', 'Expiry Date', 'Days Left'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'center'];

  const daysUntil = (d) => {
    if (!d) return '—';
    const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const rows = items.map((r, i) => [
    i + 1,
    r.bagNo || '—',
    r.type || '—',
    r.bloodGroup || '—',
    r.volumeMl ?? '—',
    (r.status || '—').toUpperCase(),
    formatDate(r.expiryDate),
    daysUntil(r.expiryDate),
  ]);

  const stats = [
    { label: 'Total Near-Expiry', value: items.length },
    { label: 'Expiring In ≤3 Days', value: items.filter(r => Number(daysUntil(r.expiryDate)) <= 3).length },
  ];

  await downloadExcelReport([{
    name: 'Near-Expiry Components',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Near-Expiry Blood Components Report',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Near_Expiry_Components_Report.xlsx');
}

// 4. Serology Results
export async function exportSerologyResults(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Segment No', 'Blood Group', 'Collected Date', 'Serology Status', 'Tests & Outcomes'];
  const alignments = ['center', 'center', 'center', 'center', 'center', 'center', 'left'];

  // A test/status is reactive when it isn't negative/non-reactive/pending.
  const isReactiveVal = (v) => {
    if (v == null) return false;
    const s = String(v).toUpperCase();
    if (s.includes('NON')) return false; // Non-Reactive
    return s.includes('REACTIVE') || s === 'POSITIVE' || s === 'UNFIT';
  };

  const STATUS_COL = 5;
  const TESTS_COL = 6;
  const highlightRowIndexes = [];
  const redCells = [];

  const rows = items.map((r, i) => {
    const testRuns = r.tests || r.testRuns || r.testResults || [];
    const testOutcomes = testRuns.map(t => `${t.testName || t.name || t.test}: ${t.result || 'PENDING'}`).join(', ') || 'No Tests Run';
    const anyReactive = isReactiveVal(r.status) || testRuns.some((t) => isReactiveVal(t.result));
    if (anyReactive) {
      highlightRowIndexes.push(i);
      redCells.push({ r: i, c: STATUS_COL });
      redCells.push({ r: i, c: TESTS_COL });
    }
    return [
      i + 1,
      r.bagNo || '—',
      r.segmentNo || '—',
      r.bloodGroup || (r.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh || ''}` : '—'),
      formatDate(r.collectedAt || r.createdAt),
      (r.status || '—').toUpperCase(),
      testOutcomes,
    ];
  });

  const stats = [
    { label: 'Total Tested Bags', value: items.length },
    { label: 'Reactive / Unfit', value: items.filter(r => r.status?.toLowerCase() === 'reactive' || r.status?.toLowerCase() === 'unfit').length },
    { label: 'Non-Reactive / Fit', value: items.filter(r => r.status?.toLowerCase() === 'non-reactive' || r.status?.toLowerCase() === 'fit').length },
  ];

  await downloadExcelReport([{
    name: 'Serology Testing',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Serology Lab Testing Registry',
    headers,
    rows,
    alignments,
    stats,
    highlightRowIndexes,
    redCells,
    ...meta,
  }], 'Serology_Lab_Results.xlsx');
}

// 5. Inventory Stock
export async function exportStock(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Segment No', 'Component', 'Blood Group', 'Volume', 'Collection Date', 'Expiry Date', 'Status', 'Storage / Destination'];
  const alignments = ['center', 'center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'left'];

  const rows = items.map((r, i) => [
    i + 1,
    r?.bag?.bagNo || r.bagNo || '—',
    r?.bag?.segmentNo || r.segmentNo || '—',
    r?.component?.componentType || '—',
    r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh || ''}` : '—',
    r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—',
    formatDate(r?.bag?.donationDate),
    formatDate(r?.component?.expiryDate),
    (r.status || '—').toUpperCase(),
    r.status === 'in-stock' ? (r.storageLocation || 'Main Fridge') : (r.hospital?.name || r.storageLocation || '—'),
  ]);

  const stats = [
    { label: 'Total In-Stock Items', value: items.filter(r => r.status === 'in-stock').length },
    { label: 'Total Reserved Items', value: items.filter(r => r.status === 'reserved').length },
    { label: 'Total Stocked units', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Current Inventory Stock',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Blood Units Inventory Stock Report',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Inventory_Stock_Report.xlsx');
}

// 6. Inventory Reserve
export async function exportReserve(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Component', 'Blood Group', 'Volume', 'Expiry', 'Reserved For', 'Reserved Until', 'Patient Name', 'Patient Age', 'Patient Sex'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'left', 'center', 'left', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagNo || r.unitId || '—',
    r.componentType || '—',
    r.bloodGroup || '—',
    r.volumeMl ? `${r.volumeMl} mL` : '—',
    formatDate(r.expiryDate),
    r.reservedForHospital || r.hospitalName || '—',
    formatDateTime(r.reservedUntil || r.expiresAt),
    r.patientName || '—',
    r.patientAge || '—',
    r.patientSex || '—',
  ]);

  const stats = [
    { label: 'Total Reserved Bags', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Reserved Units',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Reserved Blood Units Registry',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Reserved_Units_Report.xlsx');
}

// 7. Inventory Issue (Issue Stock tab) — grouped by issue date, one table per
// date stacked in the same sheet (same design as the Storage register): a
// bold "Issued on <date> — N bag(s)" banner, then the column header row, then
// that date's rows.
export async function exportIssues(items, meta = {}) {
  const headers = [
    'Sr No', 'Bag No', 'Segment No', 'Component', 'Blood Group', 'Volume',
    'Collection Date', 'Expiry Date', 'Patient Name & Address',
    'Hospital & Doctor', 'Issue Date & Time',
  ];

  const groups = new Map();
  items.forEach((r) => {
    const dateKey = r.issuedAt ? formatDate(r.issuedAt) : 'Unknown Date';
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(r);
  });

  // Most recent issue date first.
  const sortedGroups = [...groups.entries()].sort((a, b) => {
    const da = a[1][0]?.issuedAt ? new Date(a[1][0].issuedAt) : 0;
    const db = b[1][0]?.issuedAt ? new Date(b[1][0].issuedAt) : 0;
    return db - da;
  });

  const blocks = sortedGroups.map(([dateKey, groupItems]) => ({
    label: `Issued on ${dateKey} — ${groupItems.length} bag${groupItems.length > 1 ? 's' : ''}`,
    rows: groupItems.map((r, i) => {
      const rh = r?.bag?.rh === 'Positive' ? '+' : r?.bag?.rh === 'Negative' ? '-' : '';
      const patientName = r.reservedPatientName || r?.requisition?.patient?.name;
      const patientAddress = r?.requisition?.patient?.address;
      const hospitalName = r?.hospital?.name;
      const doctorName = r?.requisition?.doctorName;

      const patientCell = patientName || patientAddress
        ? [patientName || '—', patientAddress].filter(Boolean).join('\n')
        : '—';
      const hospitalCell = hospitalName || doctorName
        ? [hospitalName || '—', doctorName ? `Dr. ${doctorName}` : null].filter(Boolean).join('\n')
        : '—';

      return [
        i + 1,
        r?.bag?.bagNo || r.bagNo || '—',
        r.segmentNo || r?.bag?.segmentNo || '—',
        r?.component?.componentType || '—',
        r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${rh}`.trim() : '—',
        r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—',
        formatDate(r?.bag?.donationDate),
        formatDate(r?.component?.expiryDate),
        patientCell,
        hospitalCell,
        formatDateTime(r.issuedAt),
      ];
    }),
  }));

  const stats = [
    { label: 'Total Issued Bags', value: items.length },
    { label: 'Issue Dates', value: blocks.length },
  ];

  await downloadMultiTableExcelReport([{
    name: 'Issued Units',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Issued Blood Units Ledger',
    headers,
    blocks,
    stats,
    ...meta,
  }], 'Issued_Units_Report.xlsx');
}

// 7b. Storage Transfers (Issue Stock > Storage tab) — grouped by location
// first (SJS, then Anand, then any other site — matching the Storage tab's
// own sub-tabs), and within each location one table per send date, stacked
// in the same sheet (mirrors the date accordion on the Storage tab), e.g.:
//   Sent to SJS [Kopargaon] on 07 Jul 2026 — 2 bag(s)   [table]
//   Sent to SJS [Kopargaon] on 06 Jul 2026 — 3 bag(s)   [table]
//   Sent to Anand on 07 Jul 2026 — 1 bag(s)             [table]
const STORAGE_LOCATION_PRIORITY = ['SJS', 'Anand'];
function storageLocationRank(location) {
  const idx = STORAGE_LOCATION_PRIORITY.findIndex((p) => location?.toLowerCase().includes(p.toLowerCase()));
  return idx === -1 ? STORAGE_LOCATION_PRIORITY.length : idx;
}

export async function exportStorageBags(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Segment No', 'Component', 'Blood Group', 'Volume', 'Expiry Date', 'Storage Location', 'Sent Date'];

  const groups = new Map();
  items.forEach((r) => {
    const location = r.storageLocation || r?.hospital?.name || 'Unknown Location';
    const dateKey = r.issuedAt ? formatDate(r.issuedAt) : 'Unknown Date';
    const groupKey = `${location}__${dateKey}`;
    if (!groups.has(groupKey)) groups.set(groupKey, { dateKey, location, items: [] });
    groups.get(groupKey).items.push(r);
  });

  // Group by location (SJS, then Anand, then anything else), most recent
  // transfer date first within each location.
  const sortedGroups = [...groups.values()].sort((a, b) => {
    const locRank = storageLocationRank(a.location) - storageLocationRank(b.location);
    if (locRank !== 0) return locRank;
    if (a.location !== b.location) return a.location.localeCompare(b.location);
    const da = a.items[0]?.issuedAt ? new Date(a.items[0].issuedAt) : 0;
    const db = b.items[0]?.issuedAt ? new Date(b.items[0].issuedAt) : 0;
    return db - da;
  });

  const blocks = sortedGroups.map(({ dateKey, location, items: groupItems }) => ({
    label: `Sent to ${location} on ${dateKey} — ${groupItems.length} bag${groupItems.length > 1 ? 's' : ''}`,
    rows: groupItems.map((r, i) => [
      i + 1,
      r?.bag?.bagNo || r.bagNo || '—',
      r.segmentNo || '—',
      r?.component?.componentType || '—',
      r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh === 'Positive' ? '+' : r.bag.rh === 'Negative' ? '-' : ''}`.trim() : '—',
      r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—',
      formatDate(r?.component?.expiryDate),
      location,
      formatDateTime(r.issuedAt),
    ]),
  }));

  const stats = [
    { label: 'Total Bags Sent to Storage', value: items.length },
    { label: 'Transfer Batches', value: blocks.length },
  ];

  await downloadMultiTableExcelReport([{
    name: 'Storage Transfers',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Bags Sent to Storage Register',
    headers,
    blocks,
    stats,
    ...meta,
  }], 'Storage_Transfers_Report.xlsx');
}

// 7c. Clinical Indication / Disease Patient Issues (Issue Stock > Disease tab)
export async function exportClinicalIndicationIssues(items, meta = {}) {
  const headers = ['Sr No', 'Patient Name', 'Disease', 'Age', 'Sex', 'Patient Blood Group', 'Bag No', 'Component', 'Blood Group', 'Issued At'];
  const alignments = ['center', 'left', 'left', 'center', 'center', 'center', 'center', 'left', 'center', 'center'];

  const rows = items.map((r, i) => {
    const p = r.clinicalIndicationPatient || {};
    const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || '—';
    const disease = p.disease === 'THALASSEMIA' ? 'Thalassemia' : p.disease === 'SICKLE_CELL_ANAEMIA' ? 'Sickle Cell Anaemia' : (p.otherDiseaseName || p.disease || '—');
    return [
      i + 1,
      fullName,
      disease,
      p.age ?? '—',
      p.sex || '—',
      p.bloodGroup || '—',
      r?.bag?.bagNo || r.bagNo || '—',
      r?.component?.componentType || '—',
      r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh === 'Positive' ? '+' : r.bag.rh === 'Negative' ? '-' : ''}`.trim() : '—',
      formatDateTime(r.issuedAt),
    ];
  });

  const stats = [{ label: 'Total Clinical Indication Issues', value: items.length }];

  await downloadExcelReport([{
    name: 'Clinical Indication Issues',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Clinical Indication / Disease Patient Issue Register',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Clinical_Indication_Issues_Report.xlsx');
}

// 7d. Bulk Transfers / Loans (Issue Stock > Bulk Transfer tab) — Give Loan and
// Take Loan kept in separate sections (Given first, then Taken), each
// transfer date-ordered (most recent first). Every individual transfer (one
// blood bank, one date) gets its own sub-table listing the bags/components
// that moved, with a heading naming the direction, blood bank, address and
// date, e.g.:
//   Loan Given — City Blood Bank, Nashik — 07 Jul 2026 — 3 bag(s) (BT-...)  [table]
//   Loan Taken — Red Cross Blood Bank, Pune — 05 Jul 2026 — 2 bag(s) (BT-...) [table]
export async function exportBulkTransfers(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Segment No', 'Component', 'Blood Group', 'Volume', 'Collected Date', 'Expiry Date'];

  const typeLabel = (t) => (t === 'GIVE_LOAN' ? 'Loan Given' : 'Loan Taken');

  const byDateDesc = (a, b) => new Date(b.transferDate) - new Date(a.transferDate);
  const giveTransfers = items.filter((r) => r.transferType === 'GIVE_LOAN').sort(byDateDesc);
  const takeTransfers = items.filter((r) => r.transferType === 'TAKE_LOAN').sort(byDateDesc);

  const toBlock = (r) => {
    const bagCount = r.items?.length || 0;
    return {
      label: `${typeLabel(r.transferType)} — ${r.bloodBankName || 'Unknown Blood Bank'}, ${r.bloodBankAddress || '—'} — ${formatDate(r.transferDate)} — ${bagCount} bag${bagCount === 1 ? '' : 's'} (${r.transferId || '—'})`,
      rows: (r.items || []).map((it, i) => [
        i + 1,
        it.bagNo || '—',
        it.segmentNo || '—',
        it.componentType || '—',
        it.bloodGroup || '—',
        it.volumeMl ? `${it.volumeMl} mL` : '—',
        formatDate(it.collectedAt),
        formatDate(it.expiresAt),
      ]),
    };
  };

  const blocks = [...giveTransfers.map(toBlock), ...takeTransfers.map(toBlock)];

  const stats = [
    { label: 'Total Transfers', value: items.length },
    { label: 'Given on Loan', value: giveTransfers.length },
    { label: 'Taken on Loan', value: takeTransfers.length },
    { label: 'Total Bags', value: items.reduce((sum, r) => sum + (r.items?.length || 0), 0) },
  ];

  await downloadMultiTableExcelReport([{
    name: 'Bulk Transfers',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Bulk Transfer (Loan) Register',
    headers,
    blocks,
    stats,
    ...meta,
  }], 'Bulk_Transfers_Report.xlsx');
}

// 8. Master Donors
export async function exportMasterDonors(items, meta = {}) {
  const headers = ['Sr No', 'Public ID', 'Full Name', 'Source', 'DOB', 'Sex', 'Phone', 'Blood Group', 'Last Donation', 'Status'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'left', 'center', 'center', 'center'];

  const rows = items.map((r, i) => {
    const fullName = r.name 
      ? (typeof r.name === 'object' ? [r.name.firstName, r.name.middleName, r.name.lastName].filter(Boolean).join(' ') : r.name)
      : '—';
    return [
      i + 1,
      r.donorPublicId || r._id || '—',
      fullName,
      r.donorSource || '—',
      formatDate(r.dob),
      r.sex || '—',
      r.phone || '—',
      r.bloodGroup || '—',
      formatDate(r.lastDonationDate),
      (r.status || 'Active').toUpperCase(),
    ];
  });

  const stats = [
    { label: 'Total Registered Donors', value: items.length },
    { label: 'Active', value: items.filter(r => r.status?.toLowerCase() !== 'deferred').length },
    { label: 'Deferred', value: items.filter(r => r.status?.toLowerCase() === 'deferred').length },
  ];

  await downloadExcelReport([{
    name: 'Donor Register',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Master Donor Register Ledger',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Master_Donor_Register.xlsx');
}

// 9. Master Donations
export async function exportMasterDonations(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Donor Name', 'Source', 'Donation Type', 'Blood Group', 'Units Count', 'Fitness Status', 'Collected At'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => {
    const donorName = r.donorId?.name 
      ? [r.donorId.name.firstName, r.donorId.name.middleName, r.donorId.name.lastName].filter(Boolean).join(' ')
      : r.donorName || '—';
    return [
      i + 1,
      r.bagNo || '—',
      donorName,
      r.donorSource || '—',
      r.donationType || '—',
      r.bloodGroup || '—',
      r.unitsCount ?? 1,
      (r.fitnessStatus || '—').toUpperCase(),
      formatDateTime(r.collectedAt),
    ];
  });

  const stats = [
    { label: 'Total Donations Recorded', value: items.length },
    { label: 'Fit', value: items.filter(r => r.fitnessStatus?.toLowerCase() === 'fit').length },
    { label: 'Unfit/Discarded', value: items.filter(r => r.fitnessStatus?.toLowerCase() === 'unfit').length },
  ];

  await downloadExcelReport([{
    name: 'Donation Register',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Master Donation Log Ledger',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Master_Donation_Register.xlsx');
}

// 10. Procurement Inspection
export async function exportProcurementInspection(items, meta = {}) {
  const yn = (v) => (v === true ? 'Yes' : v === false ? 'No' : '—');
  const headers = [
    'Sr No', 'Inspection ID', 'Batch No', 'PO Number', 'Bag No', 'Segment No', 'Blood Group',
    'Sample Size', 'Testing Type', 'Testing Lab', 'Inspection Date', 'Inspector', 'Decision / Status',
    'Seal Intact', 'No Leakage', 'Tube Integrity', 'Needle Condition OK', 'Label Present', 'Sterility Check', 'Packaging Condition',
  ];

  const rows = items.map((r, i) => {
    const c = r.physicalChecks || {};
    return [
      i + 1,
      r.inspectionId || r._id || '—',
      r.batchNo || '—',
      r.poNumber || '—',
      r.bagNo || '—',
      r.segmentNo || '—',
      r.bloodGroup || '—',
      r.sampleSize ?? '—',
      r.testingType || '—',
      r.testingLab || '—',
      formatDate(r.inspectionDate),
      r.inspectorName || '—',
      (r.status || '—').toUpperCase(),
      yn(c.sealIntact),
      yn(c.noLeakage),
      yn(c.tubeIntegrity),
      yn(c.needleCondition),
      yn(c.labelPresence),
      yn(c.sterilityCheck),
      yn(c.packagingCondition),
    ];
  });

  const stats = [
    { label: 'Total Inspected Batches', value: items.length },
    { label: 'Passed Inspections', value: items.filter(r => r.status?.toLowerCase() === 'passed' || r.status?.toLowerCase() === 'approved').length },
    { label: 'Failed Inspections', value: items.filter(r => r.status?.toLowerCase() === 'failed' || r.status?.toLowerCase() === 'rejected').length },
  ];

  await downloadExcelReport([{
    name: 'Procurement Inspection',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Blood Bags Procurement Inspection Log',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Procurement_Inspection_Report.xlsx');
}

// 11. Procurement GRN (Goods Receipt)
export async function exportProcurementGRN(items, meta = {}) {
  const headers = ['Sr No', 'GRN Number', 'Invoice No', 'GRN Date', 'PO Number', 'Supplier', 'Total Received Qty', 'Status', 'Bag Type', 'Capacity (mL)', 'Anticoagulant', 'Batch No', 'Mfg Date', 'Expiry Date', 'Qty Received'];

  // Each GRN expands into one row per batch line, sharing a single serial no.
  const rows = [];
  items.forEach((r, i) => {
    const batchLines = (r.batchLines && r.batchLines.length) ? r.batchLines : [null];
    batchLines.forEach((b, j) => {
      rows.push([
        j === 0 ? i + 1 : '',
        r.grnNumber || r.grnNo || '—',
        r.invoiceNo || '—',
        formatDate(r.grnDate || r.receivedDate),
        r.poNumber || '—',
        r.supplierName || r.vendorName || '—',
        r.receivedQty || r.quantityReceived || 0,
        (r.status || r.inspectionStatus || '—').toUpperCase(),
        b?.bagType || '—',
        b?.capacityMl ?? '—',
        b?.anticoagulant || '—',
        b?.batchNumber || '—',
        formatDate(b?.manufacturingDate),
        formatDate(b?.expiryDate),
        b?.quantityReceived ?? '—',
      ]);
    });
  });

  const stats = [
    { label: 'Total Receipts (GRN)', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Goods Receipt Note',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Goods Receipt Note (GRN) Procurement ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Goods_Receipt_GRN_Report.xlsx');
}

// 12. Procurement PO (Purchase Order)
export async function exportProcurementPO(items, meta = {}) {
  const headers = ['Sr No', 'PO Number', 'PO Date', 'Vendor', 'Manufacturer', 'Bill Date', 'Bag Type', 'Capacity (mL)', 'Anticoagulant', 'Qty Ordered'];

  // Each PO expands into one row per line item, sharing a single serial no.
  const rows = [];
  items.forEach((r, i) => {
    const lineItems = (r.lineItems && r.lineItems.length) ? r.lineItems : [null];
    lineItems.forEach((it, j) => {
      rows.push([
        j === 0 ? i + 1 : '',
        r.poNumber || '—',
        formatDate(r.poDate),
        r.vendorName || r.vendorId?.name || r.vendorId || '—',
        r.manufacturer || '—',
        formatDate(r.billDate),
        it?.bagType || '—',
        it?.capacityMl ?? '—',
        it?.anticoagulant || '—',
        it?.quantityOrdered ?? '—',
      ]);
    });
  });

  const stats = [
    { label: 'Total Purchase Orders', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Purchase Orders',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Purchase Orders ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Purchase_Orders_Report.xlsx');
}

// 13. Procurement Issue (Bag Issuance)
export async function exportProcurementIssue(items, meta = {}) {
  const headers = [
    'Sr No', 'Bag No', 'Segment No', 'Batch No', 'Bag Type', 'Blood Group', 'Collection Room',
    'Issue Date', 'Status', 'Donor Name', 'Donor Blood Group', 'Donor Phone', 'Donation ID', 'Notes',
  ];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagNo || '—',
    r.segmentNo || '—',
    r.batchNo || '—',
    r.bagType || '—',
    r.bloodGroup || '—',
    r.collectionRoom || '—',
    formatDateTime(r.issueDate),
    (r.status || 'ISSUED').toUpperCase(),
    r.donorName || '—',
    r.donorBloodGroup || '—',
    r.donorPhone || '—',
    r.donationId || '—',
    r.notes || '—',
  ]);

  const stats = [
    { label: 'Total Issuances', value: items.length },
    { label: 'Issued', value: items.filter(r => r.status?.toUpperCase() === 'ISSUED').length },
    { label: 'Used', value: items.filter(r => r.status?.toUpperCase() === 'USED').length },
    { label: 'Total Discarded', value: items.filter(r => r.status?.toUpperCase() === 'DISCARDED').length },
  ];

  await downloadExcelReport([{
    name: 'Bag Issuances',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Blood Bag Issuances Log',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Procurement_Bag_Issuances.xlsx');
}

// 14. Procurement Inventory (Bag Inventory)
export async function exportProcurementInventory(items, meta = {}) {
  const headers = [
    'Sr No', 'Bag Type', 'Batch No', 'Expiry Date', 'Total Ordered (Boxes)', 'Opened Boxes',
    'Unopened Boxes', 'Remaining Stock (Bags)', 'Issued', 'Discarded', 'Damaged', 'Status',
  ];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagType || '—',
    r.batchNo || r.bagId || r._id || '—',
    formatDate(r.expiryDate),
    r.totalBoxes ?? '—',
    r.openedBoxes ?? '—',
    r.unopenedBoxes ?? '—',
    r.remainingBags ?? '—',
    r.issuedQty ?? 0,
    r.discardedQty ?? 0,
    r.damagedQty ?? 0,
    (r.status || 'Available').toUpperCase().replace(/_/g, ' '),
  ]);

  const stats = [
    { label: 'Total Stock Records', value: items.length },
    { label: 'Available', value: items.filter(r => r.status?.toLowerCase() === 'available' || r.status?.toLowerCase() === 'in-stock').length },
    { label: 'Out of Stock', value: items.filter(r => r.status?.toUpperCase() === 'OUT_OF_STOCK').length },
    { label: 'Total Remaining Bags', value: items.reduce((sum, r) => sum + (r.remainingBags ?? 0), 0) },
  ];

  await downloadExcelReport([{
    name: 'Bags Inventory',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Unused Blood Bags Ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Procurement_Bags_Inventory.xlsx');
}

// 15. Procurement Discard
export async function exportProcurementDiscard(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Component No', 'Type', 'Item Name', 'Reason', 'Discarded Date'];
  const alignments = ['center', 'center', 'center', 'center', 'left', 'left', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagNo || '—',
    r.componentNo || r.componentId || '—',
    r.itemType || '—',
    r.itemName || '—',
    r.reason || '—',
    formatDateTime(r.discardedAt || r.createdAt),
  ]);

  const stats = [
    { label: 'Total Discards', value: items.length },
    { label: 'Bags Discarded', value: items.filter(r => r.itemType === 'Donation' || r.itemType === 'Bag').length },
    { label: 'Components Discarded', value: items.filter(r => r.itemType === 'Component').length },
  ];

  await downloadExcelReport([{
    name: 'Discards',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Inventory Discard & Waste Registry',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Discards_And_Wastes_Report.xlsx');
}

// 14b. Vendor Management
export async function exportVendors(items, meta = {}) {
  const headers = ['Sr No', 'Vendor Name', 'Manufacturer', 'Contact Person', 'Phone', 'Email', 'Address', 'Drug License No', 'GST No', 'Status', 'Contract End'];
  const alignments = ['center', 'left', 'left', 'left', 'center', 'left', 'left', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.name || '—',
    r.manufacturer || '—',
    r.contactPerson || '—',
    r.contactPhone || '—',
    r.email || '—',
    r.address || '—',
    r.drugLicenseNo || '—',
    r.gstNo || '—',
    r.approvalStatus || '—',
    formatDate(r.contractEnd),
  ]);

  const stats = [
    { label: 'Total Vendors', value: items.length },
    { label: 'Approved', value: items.filter(r => r.approvalStatus === 'APPROVED').length },
  ];

  await downloadExcelReport([{
    name: 'Vendors',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Blood Bag Vendor Register',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Vendor_Register.xlsx');
}

// 15b. Bag Procurement Discard Register (empty bag stock, not blood units)
export async function exportBagDiscardRegister(items, meta = {}) {
  const headers = ['Sr No', 'Discard ID', 'Bag Type', 'Batch No', 'Quantity', 'Reason', 'Discard Date', 'Approved By', 'Disposal Date', 'Status'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'left', 'center', 'left', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.discardId || r._id?.slice(-8).toUpperCase() || '—',
    r.bagType || '—',
    r.stock?.batchNo || r.batchNo || '—',
    r.quantity ?? '—',
    (r.reason || '—').replace(/_/g, ' '),
    formatDate(r.discardDate || r.createdAt),
    r.approvedBy?.name || '—',
    formatDate(r.disposalDate),
    r.status || '—',
  ]);

  const stats = [
    { label: 'Total Discard Records', value: items.length },
    { label: 'Pending Approval', value: items.filter(r => r.status === 'PENDING_APPROVAL').length },
  ];

  await downloadExcelReport([{
    name: 'Bag Discard Register',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Empty Bag Discard & Biomedical Waste Register',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Bag_Discard_Register.xlsx');
}

// 15c. Damaged Chemical Stock Register
export async function exportDamagedChemicalStock(items, meta = {}) {
  const headers = ['Sr No', 'Chemical', 'Lot Number', 'Batch Number', 'Quantity', 'Reason', 'Damaged Date', 'Registered By'];
  const alignments = ['center', 'left', 'center', 'center', 'center', 'left', 'center', 'left'];

  const rows = items.map((r, i) => [
    i + 1,
    r.chemicalId?.name || '—',
    r.lotId?.lotNumber || '—',
    r.lotId?.batchNumber || '—',
    r.quantity ?? '—',
    r.reason || '—',
    formatDate(r.damagedDate),
    r.createdBy ? [r.createdBy.name?.first, r.createdBy.name?.last].filter(Boolean).join(' ') || r.createdBy.email : '—',
  ]);

  const stats = [
    { label: 'Total Damage Records', value: items.length },
    { label: 'Total Units Damaged', value: items.reduce((sum, r) => sum + (r.quantity || 0), 0) },
  ];

  await downloadExcelReport([{
    name: 'Damaged Stock',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Damaged Chemical Stock Register',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Damaged_Chemical_Stock_Register.xlsx');
}

// 15d. Chemical Master List
export async function exportChemicalMaster(items, meta = {}) {
  const headers = ['Sr No', 'Chemical Name', 'Category', 'Manufacturer', 'Unit Type', 'Min Stock', 'Reorder Level', 'Status'];
  const alignments = ['center', 'left', 'left', 'left', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.name || '—',
    r.categoryId?.name || '—',
    r.manufacturerId?.name || '—',
    r.unitType || '—',
    r.minStockLevel ?? '—',
    r.reorderLevel ?? '—',
    r.isActive === false ? 'Inactive' : 'Active',
  ]);

  const stats = [
    { label: 'Total Chemicals', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Chemical Master',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Chemical Master List',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Chemical_Master_List.xlsx');
}

// 15f. Camp Donor Appointments (voluntary donations submitted at a camp)
export async function exportCampAppointments(items, campName = 'Camp', meta = {}) {
  const headers = ['Sr No', 'Full Name', 'Mobile', 'Blood Group', 'Age', 'Sex', 'Weight (kg)', 'Hb (g%)', 'BP', 'Pulse', 'Status', 'Submitted On'];
  const alignments = ['center', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ') || '—',
    r.mobile || '—',
    r.bloodGroup || '—',
    r.age ?? '—',
    r.sex || '—',
    r.weight ?? '—',
    r.hb ?? '—',
    r.bp || '—',
    r.pulse ?? '—',
    (r.status || '—').toUpperCase(),
    formatDateTime(r.createdAt),
  ]);

  const stats = [
    { label: 'Total Appointments', value: items.length },
    { label: 'Donated', value: items.filter(r => r.status === 'DONATED').length },
  ];

  await downloadExcelReport([{
    name: 'Camp Appointments',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: `Camp Donor Appointments - ${campName}`,
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], `Camp_Appointments_${campName.replace(/\s+/g, '_')}.xlsx`);
}

// 15e. Donor Appointments (public site form submissions)
export async function exportAppointments(items, meta = {}) {
  const headers = ['Sr No', 'Full Name', 'Gender', 'Mobile No', 'Email', 'Blood Group', 'Age', 'Address', 'Preferred Date', 'Status', 'Source', 'Submitted On'];
  const alignments = ['center', 'left', 'center', 'center', 'left', 'center', 'center', 'left', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.fullName || '—',
    r.gender || '—',
    r.mobileNo || '—',
    r.email || '—',
    r.bloodGroup || '—',
    r.age ?? '—',
    r.address || '—',
    formatDate(r.appointmentDate),
    (r.status || '—').toUpperCase(),
    r.source || '—',
    formatDateTime(r.createdAt),
  ]);

  const stats = [
    { label: 'Total Appointments', value: items.length },
    { label: 'Confirmed', value: items.filter(r => r.status === 'confirmed').length },
    { label: 'Pending', value: items.filter(r => r.status === 'pending').length },
  ];

  await downloadExcelReport([{
    name: 'Appointments',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Donor Appointment Register',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Donor_Appointments_Report.xlsx');
}

// 16. Chemical Inventory Usage (Reagents)
export async function exportChemicalUsage(items, meta = {}) {
  const headers = [
    'Sr No', 'Chemical / Reagent', 'Category', 'Lot Number', 'Batch Number', 'Invoice Number',
    'Expiry Date', 'Total Purchased', 'Available', 'In Use', 'Consumed', 'Usage %',
  ];

  const rows = items.map((r, i) => {
    const total = r.qtyPurchased || 0;
    const consumed = r.qtyConsumed || 0;
    const usagePct = total > 0 ? `${Math.round((consumed / total) * 100)}%` : '—';
    return [
      i + 1,
      r.chemicalName || r.chemicalId?.name || '—',
      r.category || '—',
      r.lotNumber || '—',
      r.batchNumber || '—',
      r.invoiceNumber || '—',
      formatDate(r.expiryDate),
      total,
      r.qtyAvailable ?? 0,
      r.qtyInUse ?? 0,
      consumed,
      usagePct,
    ];
  });

  const stats = [
    { label: 'Total Lots', value: items.length },
    { label: 'Total Available', value: items.reduce((s, r) => s + (r.qtyAvailable ?? 0), 0) },
    { label: 'Total In Use', value: items.reduce((s, r) => s + (r.qtyInUse ?? 0), 0) },
    { label: 'Total Consumed', value: items.reduce((s, r) => s + (r.qtyConsumed ?? 0), 0) },
  ];

  await downloadExcelReport([{
    name: 'Reagents Usage',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Chemical Reagents Usage Ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Chemical_Reagents_Usage.xlsx');
}

// 17. Chemical Inventory Purchase
export async function exportChemicalPurchase(items, meta = {}) {
  const headers = [
    'Sr No', 'Invoice Number', 'Purchase Date', 'Supplier Name', 'Item Name', 'Manufacturer',
    'Pack Type', 'Batch No', 'Expiry Date', 'Qty', 'Rate (₹)', 'CGST (₹)', 'SGST (₹)',
    'Item Total (₹)', 'Invoice Total (₹)', 'Paid (₹)', 'Balance (₹)', 'Payment Status',
  ];
  const money = (v) => (v || v === 0 ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');

  const rows = [];
  items.forEach((r, i) => {
    const lineItems = (r.items && r.items.length) ? r.items : [{}];
    lineItems.forEach((it, j) => {
      rows.push([
        j === 0 ? i + 1 : '',
        j === 0 ? (r.invoiceNumber || '—') : '',
        j === 0 ? formatDate(r.purchaseDate) : '',
        j === 0 ? (r.supplierName || '—') : '',
        it.chemicalName || '—',
        it.manufacturer || '—',
        it.packType || '—',
        it.batchNumber || '—',
        it.expiryDate ? formatDate(it.expiryDate) : '—',
        it.quantity ?? 0,
        money(it.unitPrice),
        money(it.cgstAmount),
        money(it.sgstAmount),
        money(it.itemTotal),
        j === 0 ? money(r.totalAmount) : '',
        j === 0 ? money(r.paidAmount) : '',
        j === 0 ? money(r.balance) : '',
        j === 0 ? (r.paymentStatus || '—') : '',
      ]);
    });
  });

  const stats = [
    { label: 'Total Invoices', value: items.length },
    { label: 'Total Amount', value: `₹${money(items.reduce((s, r) => s + (r.totalAmount || 0), 0))}` },
    { label: 'Total Paid', value: `₹${money(items.reduce((s, r) => s + (r.paidAmount || 0), 0))}` },
    { label: 'Total Balance', value: `₹${money(items.reduce((s, r) => s + (r.balance || 0), 0))}` },
  ];

  await downloadExcelReport([{
    name: 'Chemical Purchases',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Chemical Reagents Procurement purchase ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Chemical_Procurement_Purchases.xlsx');
}

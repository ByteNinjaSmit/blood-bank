import { toast } from 'sonner';
import { buildStyledSheet, buildMultiTableSheet, buildDashboardMultiTableSheet, XLSX } from '@/utils/xlsxStyleHelper';
import { formatDate, formatDateTime, buildExportMeta, downloadExcelReport, downloadMultiTableExcelReport } from './core';

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

// 3. Component List — one row per BAG. Each bag's prepared components are
// stacked on their own line within a single "Components" cell so bag-level
// details (blood group, site, RPM, time, serology) show only once per row
// instead of repeating per component.
export async function exportComponents(items, meta = {}) {
  const headers = [
    'Sr No', 'Bag No', 'Segment No', 'Components', 'Blood Group', 'Site',
    '1st Spin', '2nd Spin',
    'Collection Time', 'Separation Time',
    'Created At',
    'Serological Test Report',
  ];
  const alignments = ['center', 'center', 'center', 'left', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center'];

  const componentLines = (components) =>
    (Array.isArray(components) ? components : [])
      .map((c) => `${c.type} — ${c.volumeMl} mL (${c.storageLocation || 'Main Fridge'}, Exp ${formatDate(c.expiryDate)}, ${(c.status || '').toUpperCase()})`)
      .join('\n');

  // Overall serology verdict for the bag: any Reactive test wins, then any
  // Shadeness (indeterminate), otherwise Negative (or Not Tested if the
  // panel hasn't been run at all).
  const overallSerology = (tests) => {
    if (!Array.isArray(tests) || tests.length === 0) return 'Not Tested';
    if (tests.some((t) => t.result === 'Reactive')) return 'Reactive';
    if (tests.some((t) => t.result === 'Shadeness')) return 'Shadeness';
    if (tests.every((t) => t.result === 'Not Tested')) return 'Not Tested';
    return 'Negative';
  };

  const rows = items.map((r, i) => [
    i + 1,
    r.bagNo || '—',
    r.segmentNo || '—',
    componentLines(r.components),
    r.bloodGroup || '—',
    r.site || '—',
    r.rpmFirstSpin || '—',
    r.rpmSecondSpin || '—',
    r.collectionTime ? formatDateTime(r.collectionTime) : '—',
    r.separationTime ? formatDateTime(r.separationTime) : '—',
    formatDate(r.createdAt),
    overallSerology(r.serologyTests),
  ]);

  const stats = [
    { label: 'Total Bags', value: items.length },
    { label: 'Total Components', value: items.reduce((sum, r) => sum + (Array.isArray(r.components) ? r.components.length : 0), 0) },
  ];

  const groupHeaders = [
    { label: 'RPM', startCol: 6, endCol: 7, dark: true },
    { label: 'TIME', startCol: 8, endCol: 9, dark: true },
  ];

  await downloadExcelReport([{
    name: 'Component Inventory',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Blood Component Inventory Ledger',
    headers,
    rows,
    alignments,
    groupHeaders,
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
    r.status === 'in-stock' || r.status === 'quarantine' ? (r.storageLocation || 'Main Fridge') : (r.hospital?.name || r.storageLocation || '—'),
  ]);

  const stats = [
    { label: 'Total In-Stock Items', value: items.filter(r => r.status === 'in-stock').length },
    { label: 'Total Reserved Items', value: items.filter(r => r.status === 'reserved').length },
    { label: 'Total Quarantined Items', value: items.filter(r => r.status === 'quarantine').length },
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

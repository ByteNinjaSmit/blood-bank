import { buildStyledSheet, XLSX } from '@/utils/xlsxStyleHelper';
import requisitionApi from '@/services/requisitionApi';

const COMPATIBILITY_RESULT_LABELS = {
  MAJOR_COMPATIBLE: 'Major Compatible',
  MINOR_COMPATIBLE: 'Minor Compatible',
  UNIVERSAL: 'Universal',
};

// ── Blood-grouping worksheet (serum group / cell group / Rh typing) ──
const GRADING_LABELS = {
  NEG_0: 'Neg (0)', POS_1: '+1', POS_2: '+2', POS_3: '+3', POS_4: '+4', H: 'H', MF: 'MF',
};
// Fixed field order = the sub-column order under each group heading.
const CELL_FIELDS = ['antiA', 'antiA1', 'antiB', 'antiAB', 'antiH'];
const SERUM_FIELDS = ['aCell', 'bCell', 'oCell'];
const RH_FIELDS = ['antiD', 'antiDBovine', 'indirectCoombs'];
// Sub-column headers, repeated identically for the Recipient and Donor blocks.
const GROUPING_SUBHEADERS = [
  'Anti-A', 'Anti-A1', 'Anti-B', 'Anti-AB', 'Anti-H', // cell grouping
  'A Cell', 'B Cell', 'O Cell',                        // serum grouping
  'Anti-D', 'Anti-D (Bovine)', 'Indirect Coombs',      // Rh typing
];

function gradeLabel(v) {
  return v ? GRADING_LABELS[v] || v : '—';
}

// 11 cells (cell grouping + serum grouping + Rh typing) for one worksheet.
function groupingCells(g) {
  if (!g) return new Array(11).fill('—');
  const cg = g.cellGrouping || {};
  const sg = g.serumGrouping || {};
  const rt = g.rhTyping || {};
  return [
    ...CELL_FIELDS.map((f) => gradeLabel(cg[f])),
    ...SERUM_FIELDS.map((f) => gradeLabel(sg[f])),
    ...RH_FIELDS.map((f) => gradeLabel(rt[f])),
  ];
}
const BLANK_GROUPING = new Array(11).fill('');

// componentType is already one of the 6 canonical short codes (WB, PRBC,
// FFP, RDP, CRYO) coming from the backend, so no translation is needed.
function abbreviateComponent(componentType) {
  return componentType || '—';
}

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// Fetches every requisition matching the filters by paging through the
// existing list endpoint — keeps the server as a thin JSON API and moves
// all report assembly (sheets, formatting) into the browser.
async function fetchAllRequisitions(filters) {
  const items = [];
  let page = 1;
  const limit = 1000;
  while (true) {
    const res = await requisitionApi.listRequests({ ...filters, page, limit });
    if (!res.success) throw new Error(res.error || 'Failed to fetch requisitions');
    const pageItems = Array.isArray(res.data) ? res.data : [];
    items.push(...pageItems);
    const pagination = res.raw?.pagination;
    if (!pagination || page >= pagination.pages || pageItems.length === 0) break;
    page += 1;
  }
  return items;
}

function buildSheet(rows, opts) {
  return buildStyledSheet(rows, { ...opts, formatDateTime: fmtDateTime });
}

function reportPeriodLabel(filters) {
  if (filters.from && filters.to) return `From ${filters.from} To ${filters.to}`;
  if (filters.from) return `From ${filters.from}`;
  if (filters.to) return `To ${filters.to}`;
  return 'All Records';
}

function buildAllRequestsRows(records) {
  const rows = [];
  let srNo = 1;
  records.forEach((r) => {
    const components = r.requestedComponents || [];
    // One serial number per requisition. When a requisition has multiple
    // components they each get their own line, but only the first line shows
    // the serial number (subsequent component lines leave it blank).
    if (components.length === 0) {
      rows.push([
        srNo, r.requestId || '—', r.hospitalId?.name || '—', r.patient?.name || '—',
        r.patient?.age ?? '—', r.patient?.sex || '—', '—', '—', '—',
        r.requestedAt ? fmtDateTime(r.requestedAt) : '—', (r.status || '—').toUpperCase(),
      ]);
    } else {
      components.forEach((rc, i) => {
        rows.push([
          i === 0 ? srNo : '', r.requestId || '—', r.hospitalId?.name || '—', r.patient?.name || '—',
          r.patient?.age ?? '—', r.patient?.sex || '—', `${rc.bloodGroup}${rc.rh === 'Positive' ? '+' : rc.rh === 'Negative' ? '-' : rc.rh}`,
          rc.componentType || '—', rc.units || 0,
          r.requestedAt ? fmtDateTime(r.requestedAt) : '—', (r.status || '—').toUpperCase(),
        ]);
      });
    }
    srNo++;
  });
  return rows;
}

const REQUEST_LIST_COLUMNS = [
  'Sr No', 'Request ID', 'Hospital', 'Patient Name', 'Age', 'Gender',
  'Blood Group', 'Component', 'Units', 'Request Date', 'Status',
];

export async function exportRequisitionsExcel(filters, generatedBy) {
  const listFilters = {};
  if (filters.exportAll) {
    // no filters — pull everything
  } else {
    if (filters.search) listFilters.search = filters.search;
    if (filters.status) listFilters.status = filters.status;
    if (filters.hospitalId) listFilters.hospitalId = filters.hospitalId;
    if (filters.from) listFilters.from = filters.from;
    if (filters.to) listFilters.to = filters.to;
  }

  const records = await fetchAllRequisitions(listFilters);
  const reportPeriod = reportPeriodLabel(filters);
  const wb = XLSX.utils.book_new();

  // Crossmatch & Component Detail — one row per matched unit, covering the
  // full crossmatch worksheet: hospital, doctor, indication, recipient
  // name/address, blood group, component (WB/PRBC/FFP/RDP/CRYO), bags given
  // (component-wise), when required, crossmatch done-at/seen-at (grouped
  // under "Crossmatching"), compatibility result, card number, and
  // per-unit issue date/time. Created FIRST so it's the sheet Excel opens
  // to by default — it used to be the 7th tab and easy to miss.
  const xmColumnsBase = [
    'Sr No', 'Date', 'Hospital Name', 'Doctor Name', 'Indication for Transfusion',
    "Recipient's Name", "Recipient's Address", 'Blood Group', 'Component (WB/PRBC/FFP/RDP/CRYO)',
    'Total Bags Given', 'When Required', 'Crossmatch Done At', 'Seen At',
    'Crossmatching & Compatibility Test', 'Card Number', 'Issue Date & Time', 'Bag No',
  ];
  const doneAtIdx = xmColumnsBase.indexOf('Crossmatch Done At');
  const crossmatchingResult = xmColumnsBase.indexOf('Crossmatching & Compatibility Test');

  // Two blocks of blood-grouping sub-columns appended after the base columns:
  // Recipient (entered once per requisition, shown on the first line only) and
  // Donor (per matched bag, component-wise). Each block = cell grouping (5) +
  // serum grouping (3) + Rh typing (3) = 11 columns, with a two-level header.
  const xmColumns = [...xmColumnsBase, ...GROUPING_SUBHEADERS, ...GROUPING_SUBHEADERS];
  const R0 = xmColumnsBase.length;        // recipient block start
  const D0 = R0 + GROUPING_SUBHEADERS.length; // donor block start
  const xmGroupHeaders = [
    { label: 'Crossmatching', startCol: doneAtIdx, endCol: crossmatchingResult },
    { label: 'Recipient — Cell Grouping', startCol: R0, endCol: R0 + 4 },
    { label: 'Recipient — Serum Grouping', startCol: R0 + 5, endCol: R0 + 7 },
    { label: 'Recipient — Rh Typing', startCol: R0 + 8, endCol: R0 + 10 },
    { label: 'Donor — Cell Grouping', startCol: D0, endCol: D0 + 4, dark: true },
    { label: 'Donor — Serum Grouping', startCol: D0 + 5, endCol: D0 + 7, dark: true },
    { label: 'Donor — Rh Typing', startCol: D0 + 8, endCol: D0 + 10, dark: true },
  ];

  const xmRows = [];
  let xmSrNo = 1;
  records.forEach((r) => {
    const matchedInventory = r.matchedInventory || [];

    // Requisitions that haven't been matched/crossmatched yet used to be
    // skipped entirely here, so the sheet would show none of these fields
    // for any pending request. Fall back to the requested components so
    // every requisition gets at least one row, with crossmatch-specific
    // columns marked "Not Matched Yet" instead of being silently dropped.
    if (matchedInventory.length === 0) {
      const requested = r.requestedComponents?.length ? r.requestedComponents : [null];
      const requestedCounts = new Map();
      requested.forEach((rc) => {
        if (!rc) return;
        const abbr = abbreviateComponent(rc.componentType);
        requestedCounts.set(abbr, (requestedCounts.get(abbr) || 0) + (rc.units || 1));
      });
      // One serial number per requisition. Patient-level details (date,
      // hospital, doctor, indication, recipient name/address, when required,
      // card number) are shown only on the first line; each component gets its
      // own line below with only the component/bag-specific columns filled.
      requested.forEach((rc, i) => {
        const first = i === 0;
        const abbr = rc ? abbreviateComponent(rc.componentType) : '—';
        xmRows.push([
          first ? xmSrNo : '',
          first ? (r.requestedAt ? fmtDateTime(r.requestedAt) : '—') : '',
          first ? (r.hospitalId?.name || '—') : '',
          first ? (r.doctorName || '—') : '',
          first ? (r.patient?.indication || '—') : '',
          first ? (r.patient?.name || '—') : '',
          first ? (r.patient?.address || '—') : '',
          rc ? `${rc.bloodGroup}${rc.rh === 'Positive' ? '+' : rc.rh === 'Negative' ? '-' : ''}` : '—',
          abbr,
          rc ? (requestedCounts.get(abbr) || 0) : 0,
          first ? (r.requiredAt ? fmtDateTime(r.requiredAt) : '—') : '',
          'Not Matched Yet',
          'Not Matched Yet',
          'Not Matched Yet',
          first ? '—' : '',
          '—',
          '—',
          // Recipient grouping once (first line); no donor bag yet.
          ...(first ? groupingCells(r.recipientGrouping) : BLANK_GROUPING),
          ...new Array(11).fill('—'),
        ]);
      });
      xmSrNo++;
      return;
    }

    const componentCounts = new Map();
    matchedInventory.forEach((mi) => {
      const abbr = abbreviateComponent(mi?.inventoryId?.componentId?.componentType);
      componentCounts.set(abbr, (componentCounts.get(abbr) || 0) + 1);
    });

    // One serial number per requisition. Patient-level details (date,
    // hospital, doctor, indication, recipient name/address, when required,
    // card number) are shown only on the first line; each matched bag gets its
    // own line below with only the per-bag columns filled (blood group,
    // component, total bags of that component, crossmatch done-at/seen-at,
    // compatibility test, issue date/time, bag no).
    matchedInventory.forEach((mi, i) => {
      const first = i === 0;
      const inv = mi.inventoryId;
      const abbr = abbreviateComponent(inv?.componentId?.componentType);
      xmRows.push([
        first ? xmSrNo : '',
        first ? (r.requestedAt ? fmtDateTime(r.requestedAt) : '—') : '',
        first ? (r.hospitalId?.name || '—') : '',
        first ? (r.doctorName || '—') : '',
        first ? (r.patient?.indication || '—') : '',
        first ? (r.patient?.name || '—') : '',
        first ? (r.patient?.address || '—') : '',
        inv?.bagNo ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}` : '—',
        abbr,
        componentCounts.get(abbr) || 0,
        first ? (r.requiredAt ? fmtDateTime(r.requiredAt) : '—') : '',
        mi.crossmatchDoneAt ? fmtDateTime(mi.crossmatchDoneAt) : '—',
        mi.crossmatchSeenAt ? fmtDateTime(mi.crossmatchSeenAt) : '—',
        COMPATIBILITY_RESULT_LABELS[mi.compatibilityResult] || '—',
        first ? (mi.cardNumber || '—') : '',
        inv?.issuedAt ? fmtDateTime(inv.issuedAt) : '—',
        inv?.bagNo?.bagNo || '—',
        // Recipient grouping once (first line); donor grouping per bag.
        ...(first ? groupingCells(r.recipientGrouping) : BLANK_GROUPING),
        ...groupingCells(mi.grouping),
      ]);
    });
    xmSrNo++;
  });

  const xmSheet = buildSheet(xmRows, {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: 'Crossmatch & Component-wise Issue Worksheet',
    generatedBy,
    reportPeriod,
    columns: xmColumns,
    groupHeaders: xmGroupHeaders,
  });
  XLSX.utils.book_append_sheet(wb, xmSheet, 'Crossmatch & Component Detail');

  const statusSheets = [
    ['All Requests', records],
    ['Approved Requests', records.filter((r) => r.status === 'approved')],
    ['Rejected Requests', records.filter((r) => r.status === 'rejected')],
    ['Matched Requests', records.filter((r) => r.status === 'matched' || r.status === 'crossmatched')],
    ['Issued Requests', records.filter((r) => r.status === 'issued')],
    ['Completed Requests', records.filter((r) => r.status === 'completed')],
  ];

  statusSheets.forEach(([sheetName, sheetRecords]) => {
    const ws = buildSheet(buildAllRequestsRows(sheetRecords), {
      title: 'Sanjivani Blood Bank, Kopargaon',
      subtitle: `Blood Request Management Report - ${sheetName}`,
      generatedBy,
      reportPeriod,
      columns: REQUEST_LIST_COLUMNS,
    });
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Hospital Analysis
  const hospMap = new Map();
  records.forEach((r) => {
    const name = r.hospitalId?.name || 'Unknown Hospital';
    if (!hospMap.has(name)) hospMap.set(name, { total: 0, approved: 0, rejected: 0, issued: 0, completed: 0 });
    const m = hospMap.get(name);
    m.total += 1;
    if (r.status === 'approved') m.approved += 1;
    if (r.status === 'rejected') m.rejected += 1;
    if (r.status === 'issued') m.issued += 1;
    if (r.status === 'completed') m.completed += 1;
  });
  const hospRows = Array.from(hospMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, m]) => [name, m.total, m.approved, m.rejected, m.issued, m.completed]);
  const hospTotals = hospRows.reduce(
    (acc, row) => {
      acc[0] += row[1]; acc[1] += row[2]; acc[2] += row[3]; acc[3] += row[4]; acc[4] += row[5];
      return acc;
    },
    [0, 0, 0, 0, 0],
  );
  hospRows.push(['TOTAL SUMMARY', ...hospTotals]);
  const hospSheet = buildSheet(hospRows, {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: 'Hospital-wise Request Statistics & Breakdown',
    generatedBy,
    reportPeriod,
    columns: ['Hospital Name', 'Total Requests', 'Approved', 'Rejected', 'Issued', 'Completed'],
    totalRowIndexes: [hospRows.length - 1],
  });
  XLSX.utils.book_append_sheet(wb, hospSheet, 'Hospital Analysis');

  // Blood Group Analysis
  const bgList = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const bgMap = new Map(bgList.map((bg) => [bg, 0]));
  let unknownBg = 0;
  records.forEach((r) => {
    const seen = new Set();
    (r.requestedComponents || []).forEach((rc) => {
      const rh = rc.rh === 'Positive' ? '+' : rc.rh === 'Negative' ? '-' : rc.rh;
      seen.add(`${rc.bloodGroup}${rh}`);
    });
    seen.forEach((bg) => {
      if (bgMap.has(bg)) bgMap.set(bg, bgMap.get(bg) + 1);
      else unknownBg += 1;
    });
  });
  const bgRows = bgList.map((bg) => [bg, bgMap.get(bg) || 0]);
  let bgTotal = bgRows.reduce((sum, row) => sum + row[1], 0);
  if (unknownBg > 0) {
    bgRows.push(['Other / Unknown', unknownBg]);
    bgTotal += unknownBg;
  }
  bgRows.push(['TOTAL', bgTotal]);
  const bgSheet = buildSheet(bgRows, {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: 'Blood Group-wise Request Demands Analysis',
    generatedBy,
    reportPeriod,
    columns: ['Blood Group', 'Number of Requests'],
    totalRowIndexes: [bgRows.length - 1],
  });
  XLSX.utils.book_append_sheet(wb, bgSheet, 'Blood Group Analysis');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Sanjivani_Blood_Requests_Report_${filters.exportAll ? 'All' : 'Filtered'}_${dateStr}.xlsx`);
}

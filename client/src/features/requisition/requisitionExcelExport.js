import { buildStyledSheet, XLSX } from '@/utils/xlsxStyleHelper';
import requisitionApi from '@/services/requisitionApi';
import { BLOOD_GROUPS } from '@/lib/blood-groups';

const COMPATIBILITY_RESULT_LABELS = {
  MAJOR_COMPATIBLE: 'Major Compatible',
  MINOR_COMPATIBLE: 'Minor Compatible',
  UNIVERSAL: 'Universal',
};

// componentType is already one of the 6 canonical short codes (WB, PRBC,
// FFP, RDP, CRYO) coming from the backend, so no translation is needed.
function abbreviateComponent(componentType) {
  return componentType || '—';
}

// Compact blood group format used consistently across the report, e.g. "O+".
// `rh` may come through as the string 'Positive'/'Negative' (as stored on
// requestedComponents / bagNo) — anything else is left as-is rather than
// guessed at.
function compactBloodGroup(bloodGroup, rh) {
  if (!bloodGroup) return '—';
  const sign = rh === 'Positive' ? '+' : rh === 'Negative' ? '-' : '';
  return `${bloodGroup}${sign}`;
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

// Age is stored in Years by default; DAYS is only used for infant patients.
function formatAge(patient) {
  if (patient?.age == null) return '—';
  return `${patient.age} ${patient.ageUnit === 'DAYS' ? 'Days' : 'Years'}`;
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
        formatAge(r.patient), r.patient?.sex || '—', '—', '—', '—',
        r.requestedAt ? fmtDateTime(r.requestedAt) : '—', (r.status || '—').toUpperCase(),
      ]);
    } else {
      components.forEach((rc, i) => {
        rows.push([
          i === 0 ? srNo : '', r.requestId || '—', r.hospitalId?.name || '—', r.patient?.name || '—',
          formatAge(r.patient), r.patient?.sex || '—', `${rc.bloodGroup}${rc.rh === 'Positive' ? '+' : rc.rh === 'Negative' ? '-' : rc.rh}`,
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
  // (component-wise), when required, compatibility result, card number, and
  // per-unit issue date/time. Created FIRST so it's the sheet Excel opens
  // to by default — it used to be the 7th tab and easy to miss.
  const xmColumnsBase = [
    'Sr No', 'Date', 'Hospital Name', 'Doctor Name', 'Indication for Transfusion',
    "Recipient's Name", "Recipient's Address", 'Blood Group', 'Component (WB/PRBC/FFP/RDP/CRYO)',
    'Bags Given (this Component)', 'When Required',
    'Crossmatching & Compatibility Test', 'Card Number', 'Issue Date & Time', 'Bag No',
  ];

  const xmColumns = [...xmColumnsBase];

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
          rc ? compactBloodGroup(rc.bloodGroup, rc.rh) : '—',
          abbr,
          rc ? (requestedCounts.get(abbr) || 0) : 0,
          first ? (r.requiredAt ? fmtDateTime(r.requiredAt) : '—') : '',
          'Not Matched Yet',
          first ? '—' : '',
          '—',
          '—',
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
    // component, total bags of that component, compatibility test, issue
    // date/time, bag no).
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
        inv?.bagNo ? compactBloodGroup(inv.bagNo.bloodGroup, inv.bagNo.rh) : '—',
        abbr,
        componentCounts.get(abbr) || 0,
        first ? (r.requiredAt ? fmtDateTime(r.requiredAt) : '—') : '',
        COMPATIBILITY_RESULT_LABELS[mi.compatibilityResult] || '—',
        first ? (mi.cardNumber || '—') : '',
        inv?.issuedAt ? fmtDateTime(inv.issuedAt) : '—',
        inv?.bagNo?.bagNo || '—',
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
  const bgList = BLOOD_GROUPS;
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

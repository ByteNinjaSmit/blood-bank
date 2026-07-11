import { buildStyledSheet, XLSX } from '@/utils/xlsxStyleHelper';
import requisitionApi from '@/services/requisitionApi';

const COMPATIBILITY_RESULT_LABELS = {
  MAJOR_COMPATIBLE: 'Major Compatible',
  MINOR_COMPATIBLE: 'Minor Compatible',
  UNIVERSAL: 'Universal',
};

function abbreviateComponent(componentType) {
  switch (componentType) {
    case 'WHOLE_BLOOD':
      return 'WB';
    case 'RBC':
    case 'PRBC':
    case 'IRRADIATED_PRBC':
    case 'WASHED_PRBC':
    case 'LEUKOREDUCED_PRBC':
      return 'PCV';
    case 'FFP':
      return 'FFP';
    case 'Platelet':
    case 'PLATELET_CONCENTRATE':
      return 'RDP';
    case 'SDP':
      return 'SDP';
    case 'Cryo':
    case 'CRYOPRECIPITATE':
      return 'CRYO';
    default:
      return componentType || '—';
  }
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
  // name/address, blood group, component (WB/PCV/FFP/RDP), bags given
  // (component-wise), when required, crossmatch done-at/seen-at (grouped
  // under "Crossmatching"), compatibility result, card number, and
  // per-unit issue date/time. Created FIRST so it's the sheet Excel opens
  // to by default — it used to be the 7th tab and easy to miss.
  const xmColumns = [
    'Sr No', 'Date', 'Hospital Name', 'Doctor Name', 'Indication for Transfusion',
    "Recipient's Name", "Recipient's Address", 'Blood Group', 'Component (WB/PCV/FFP/RDP)',
    'Total Bags Given', 'When Required', 'Crossmatch Done At', 'Seen At',
    'Crossmatching & Compatibility Test', 'Card Number', 'Issue Date & Time', 'Bag No',
  ];
  const doneAtIdx = xmColumns.indexOf('Crossmatch Done At');
  const seenAtIdx = xmColumns.indexOf('Seen At');

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
      // One serial number per requisition; multiple component lines share it
      // (blank on the 2nd+ lines).
      requested.forEach((rc, i) => {
        const abbr = rc ? abbreviateComponent(rc.componentType) : '—';
        xmRows.push([
          i === 0 ? xmSrNo : '',
          r.requestedAt ? fmtDateTime(r.requestedAt) : '—',
          r.hospitalId?.name || '—',
          r.doctorName || '—',
          r.patient?.indication || '—',
          r.patient?.name || '—',
          r.patient?.address || '—',
          rc ? `${rc.bloodGroup}${rc.rh === 'Positive' ? '+' : rc.rh === 'Negative' ? '-' : ''}` : '—',
          abbr,
          rc ? (requestedCounts.get(abbr) || 0) : 0,
          r.requiredAt ? fmtDateTime(r.requiredAt) : '—',
          'Not Matched Yet',
          'Not Matched Yet',
          'Not Matched Yet',
          '—',
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

    // One serial number per requisition; each matched unit gets its own line
    // but only the first shows the serial number.
    matchedInventory.forEach((mi, i) => {
      const inv = mi.inventoryId;
      const abbr = abbreviateComponent(inv?.componentId?.componentType);
      xmRows.push([
        i === 0 ? xmSrNo : '',
        r.requestedAt ? fmtDateTime(r.requestedAt) : '—',
        r.hospitalId?.name || '—',
        r.doctorName || '—',
        r.patient?.indication || '—',
        r.patient?.name || '—',
        r.patient?.address || '—',
        inv?.bagNo ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}` : '—',
        abbr,
        componentCounts.get(abbr) || 0,
        r.requiredAt ? fmtDateTime(r.requiredAt) : '—',
        mi.crossmatchDoneAt ? fmtDateTime(mi.crossmatchDoneAt) : '—',
        mi.crossmatchSeenAt ? fmtDateTime(mi.crossmatchSeenAt) : '—',
        COMPATIBILITY_RESULT_LABELS[mi.compatibilityResult] || '—',
        mi.cardNumber || '—',
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
    groupHeader: { label: 'Crossmatching', startCol: doneAtIdx, endCol: seenAtIdx },
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

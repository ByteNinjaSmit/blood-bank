import { buildStyledSheet, XLSX } from '@/utils/xlsxStyleHelper';
import { donationApi } from '@/features/donation/api';

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function statusOf(d) {
  return d.status || (d.ttiReleaseDecision === 'released' ? 'passed' : d.ttiReleaseDecision === 'reactive' ? 'failed' : 'pending');
}

function matchesFilters(d, filters) {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const bagNoMatch = (d.bagNo || d.donationId || '').toLowerCase().includes(q);
    const donorMatch = (d.donorName || '').toLowerCase().includes(q);
    if (!bagNoMatch && !donorMatch) return false;
  }
  if (filters.bagType && d.typeOfBag !== filters.bagType) return false;
  if (filters.bloodGroup && d.bloodGroup !== filters.bloodGroup) return false;
  if (filters.status && statusOf(d) !== filters.status) return false;
  if (filters.from && (!d.collectedAt || new Date(d.collectedAt) < new Date(filters.from))) return false;
  if (filters.to && (!d.collectedAt || new Date(d.collectedAt) > new Date(`${filters.to}T23:59:59`))) return false;
  return true;
}

const COLUMNS = [
  'Bag No', 'Donor Name', 'Donation Type', 'Bag Type', 'Blood Group',
  'Units Count', 'Fitness Status', 'Collection Date & Time', 'TTI Status',
];

function donationRow(d) {
  return [
    d.bagNo || d.donationId || '—',
    d.donorName || '—',
    d.donationType || '—',
    d.typeOfBag || '—',
    d.bloodGroup ? `${d.bloodGroup} ${d.rhFactor === 'Positive' ? '+' : d.rhFactor === 'Negative' ? '-' : ''}`.trim() : '—',
    d.unitCount ?? 1,
    d.isFit === true ? 'Fit' : d.isFit === false ? 'Unfit' : 'Pending',
    fmtDateTime(d.collectedAt),
    (statusOf(d) || '—').toUpperCase(),
  ];
}

const TTI_STATUS_COL = COLUMNS.indexOf('TTI Status');

function buildSheet(rows, { title, subtitle, generatedBy, reportScope, highlightRowIndexes, redCells }) {
  return buildStyledSheet(rows, {
    title,
    subtitle,
    generatedBy,
    reportPeriod: reportScope,
    columns: COLUMNS,
    highlightRowIndexes,
    redCells,
    formatDateTime: fmtDateTime,
  });
}

// register: 'all' | 'inhouse' | 'camp'; scope: 'filtered' | 'all'
export async function exportDonationRegister(register, scope, filters, generatedBy) {
  const res = await donationApi.list({ source: register === 'all' ? undefined : register, page: 1, pageSize: 5000 });
  const allItems = res?.items ?? [];
  const rows = scope === 'filtered' ? allItems.filter((d) => matchesFilters(d, filters)) : allItems;

  const sheetLabel = register === 'camp' ? 'Camp Donations' : register === 'inhouse' ? 'Inhouse Donations' : 'Master Donation Register';
  // TTI-reactive donations → yellow row + red TTI Status cell.
  const highlightRowIndexes = [];
  const redCells = [];
  rows.forEach((d, i) => {
    if (statusOf(d) === 'failed') {
      highlightRowIndexes.push(i);
      redCells.push({ r: i, c: TTI_STATUS_COL });
    }
  });
  const wb = XLSX.utils.book_new();
  const ws = buildSheet(rows.map(donationRow), {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: `${sheetLabel} — Donation Register`,
    generatedBy,
    reportScope: scope === 'filtered' ? 'Filtered View' : 'All Records',
    highlightRowIndexes,
    redCells,
  });
  XLSX.utils.book_append_sheet(wb, ws, sheetLabel.slice(0, 31));
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${sheetLabel.replace(/\s+/g, '_')}_Register_${dateStr}.xlsx`);
}

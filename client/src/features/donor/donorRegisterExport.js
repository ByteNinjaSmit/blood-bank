import { buildStyledSheet, XLSX } from '@/utils/xlsxStyleHelper';
import { apiClient } from '@/core/api-client';
import { deferralApi } from '@/features/deferral/api';

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

const COMPONENT_STATUS_LABELS = {
  'in-stock': 'In Stock',
  reserved: 'Reserved',
  utilized: 'Utilized',
  discarded: 'Discarded',
  expired: 'Expired',
};

function buildTitledSheet(rows, { title, subtitle, generatedBy, reportScope, columns, colWidths, highlightRowIndexes, redCells, greenCells }) {
  return buildStyledSheet(rows, {
    title,
    subtitle,
    generatedBy,
    reportPeriod: reportScope,
    columns,
    colWidths,
    highlightRowIndexes,
    redCells,
    greenCells,
    formatDateTime: fmtDateTime,
  });
}

// A TTI marker is reactive when it's positive/reactive (but not the common
// "Non-Reactive"/"Negative" wordings).
function isReactiveTti(v) {
  if (v == null) return false;
  const s = String(v).toUpperCase();
  if (s.includes('NON')) return false; // Non-Reactive
  return s.includes('REACTIVE') || s === 'POSITIVE' || s === 'POS';
}

// Column indexes of the five TTI markers in DONOR_REGISTER_COLUMNS, in the
// same order donorRegisterRow emits them (HIV, HBs, HCV, VDRL, M.P.).
const DONOR_TTI_COLS = [15, 16, 17, 18, 19];

function donorTtiValues(d) {
  return [d.tti?.HIV, d.tti?.HBSAG, d.tti?.HCV, d.tti?.SYPHILIS, d.tti?.MALARIA];
}

// Builds { highlightRowIndexes, redCells } for a donor row set: any donor with
// a reactive marker gets a yellow row and each reactive marker cell goes red.
function donorReactiveHighlights(donors) {
  const highlightRowIndexes = [];
  const redCells = [];
  const greenCells = [];
  donors.forEach((d, i) => {
    let anyReactive = false;
    donorTtiValues(d).forEach((val, m) => {
      if (isReactiveTti(val)) {
        anyReactive = true;
        redCells.push({ r: i, c: DONOR_TTI_COLS[m] });
      }
    });
    if (anyReactive) highlightRowIndexes.push(i);
    // "Yes" to emergency donation → green cell.
    if (String(d.emergencyDonationWillingness).toUpperCase() === 'YES') {
      greenCells.push({ r: i, c: EMERGENCY_COL });
    }
  });
  return { highlightRowIndexes, redCells, greenCells };
}

// Donor register — one row per donor, enriched server-side with their most
// recent donation's vitals, TTI serology results, and prepared components.
async function fetchDonorRegisterRows(source, filters) {
  const params = { source, ...filters };
  const res = await apiClient.get('/api/v2/donor/register-export', { params });
  return res.data?.data || [];
}

const DONOR_REGISTER_COLUMNS = [
  'S.No', 'Donor ID', 'Name', 'Address', 'Sex', 'Phone', 'Blood Group',
  'Blood Bag No', 'Date of Collection', 'Date of Expiry',
  'Weight (Kg)', 'Pulse (BPM)', 'Hb (Gm%)', 'Rh Typing', 'Atypical Antibody',
  'HIV 1 & 2', 'HBs', 'HCV', 'VDRL', 'M.P.',
  'Components Prepared (Type: Volume mL)', 'Component Status', 'Status Date',
  'Eligibility Status', 'Last Donation Date', 'Will Donate in Emergency',
];

const EMERGENCY_COL = DONOR_REGISTER_COLUMNS.indexOf('Will Donate in Emergency');

function donorRegisterRow(d, i) {
  const componentsStr = (d.components || [])
    .map((c) => `${c.componentType}: ${c.volumeMl ?? '—'} mL`)
    .join('\n') || '—';
  const statusStr = (d.components || [])
    .map((c) => COMPONENT_STATUS_LABELS[c.status] || c.status)
    .join('\n') || '—';
  const statusDateStr = (d.components || [])
    .map((c) => (c.statusDate ? fmtDateTime(c.statusDate) : '—'))
    .join('\n') || '—';

  return [
    i + 1,
    d.donorId || '—',
    d.name || '—',
    d.address || '—',
    d.sex || '—',
    d.phone || '—',
    d.bloodGroup && d.rh ? `${d.bloodGroup} ${d.rh === 'Positive' || d.rh === 'POSITIVE' ? '+' : '-'}` : '—',
    d.bagNo || '—',
    d.collectionDate ? fmtDate(d.collectionDate) : '—',
    d.expiryDate ? fmtDate(d.expiryDate) : '—',
    d.weightKg ?? '—',
    d.pulseBpm ?? '—',
    d.hbGdl ?? '—',
    d.rhTypingConfirmed || '—',
    d.atypicalAntibody ?? 'Not Captured',
    d.tti?.HIV || '—',
    d.tti?.HBSAG || '—',
    d.tti?.HCV || '—',
    d.tti?.SYPHILIS || '—',
    d.tti?.MALARIA || '—',
    componentsStr,
    statusStr,
    statusDateStr,
    d.eligibilityStatus || '—',
    d.lastDonationDate ? fmtDate(d.lastDonationDate) : '—',
    d.emergencyDonationWillingness || '—',
  ];
}

async function exportDonorRegister(source, sheetLabel, scope, filters, generatedBy) {
  const rows = await fetchDonorRegisterRows(source === 'all' ? undefined : source, scope === 'filtered' ? filters : {});
  const wb = XLSX.utils.book_new();
  const { highlightRowIndexes, redCells, greenCells } = donorReactiveHighlights(rows);
  const ws = buildTitledSheet(rows.map(donorRegisterRow), {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: `${sheetLabel} — Donor Register`,
    generatedBy,
    reportScope: scope === 'filtered' ? 'Filtered View' : 'All Records',
    columns: DONOR_REGISTER_COLUMNS,
    highlightRowIndexes,
    redCells,
    greenCells,
  });
  XLSX.utils.book_append_sheet(wb, ws, sheetLabel.slice(0, 31));
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${sheetLabel.replace(/\s+/g, '_')}_Register_${dateStr}.xlsx`);
}

const DEFERRAL_COLUMNS = [
  'S.No', 'Donor ID', 'Name', 'Blood Group', 'Phone', 'Type', 'Reason', 'Deferred On', 'Until Date', 'Status',
];

function deferralRow(entry, i) {
  const lifted = Boolean(entry.liftedAt);
  const expired = !lifted && entry.type !== 'PERMANENT' && entry.untilDate && new Date(entry.untilDate) <= new Date();
  const status = lifted ? 'Lifted' : expired ? 'Period Ended' : 'Active';
  return [
    i + 1,
    entry.donor?.donorId || '—',
    entry.donor?.name || '—',
    entry.donor?.bloodGroup ? `${entry.donor.bloodGroup} ${entry.donor.rh === 'Positive' ? '+' : entry.donor.rh === 'Negative' ? '-' : ''}` : '—',
    entry.donor?.phone || '—',
    entry.type === 'PERMANENT' ? 'Permanent' : 'Temporary',
    entry.reason || '—',
    fmtDate(entry.createdAt),
    entry.untilDate ? fmtDate(entry.untilDate) : '—',
    status,
  ];
}

async function exportDeferralRegister(scope, generatedBy) {
  const status = scope === 'filtered' ? 'active' : 'all';
  const res = await deferralApi.list({ page: 1, limit: 5000, sortBy: 'createdAt', sortOrder: 'desc', status });
  const rows = res.items || [];
  const wb = XLSX.utils.book_new();
  const ws = buildTitledSheet(rows.map(deferralRow), {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: 'Donor Deferral Register',
    generatedBy,
    reportScope: scope === 'filtered' ? 'Active Deferrals Only' : 'All Records',
    columns: DEFERRAL_COLUMNS,
  });
  XLSX.utils.book_append_sheet(wb, ws, 'Donor Deferral Register');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Donor_Deferral_Register_${dateStr}.xlsx`);
}

// register: 'all' | 'inhouse' | 'camp' | 'deferral'; scope: 'filtered' | 'all'
export async function exportRegisterChoice(register, scope, filters, generatedBy) {
  if (register === 'deferral') {
    return exportDeferralRegister(scope, generatedBy);
  }
  const sheetLabel = register === 'camp' ? 'Camp Donors' : register === 'inhouse' ? 'Inhouse Donors' : 'Master Donor Register';
  return exportDonorRegister(register, sheetLabel, scope, filters, generatedBy);
}

// Donor register for one specific camp — identical columns, colours and
// layout to the Master Donor Register, just pre-filtered to a single camp
// and titled/named after that camp instead of "Master Donor Register".
export async function exportCampDonorRegister(campId, campName, generatedBy) {
  const rows = await fetchDonorRegisterRows(undefined, { campId });
  const wb = XLSX.utils.book_new();
  const { highlightRowIndexes, redCells, greenCells } = donorReactiveHighlights(rows);
  const sheetTabName = `${campName} Donor Register`.slice(0, 31);
  const ws = buildTitledSheet(rows.map(donorRegisterRow), {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: `${campName} — Donor Register`,
    generatedBy,
    reportScope: 'All Records',
    columns: DONOR_REGISTER_COLUMNS,
    highlightRowIndexes,
    redCells,
    greenCells,
  });
  XLSX.utils.book_append_sheet(wb, ws, sheetTabName);
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${campName.replace(/\s+/g, '_')}_Donor_Register_${dateStr}.xlsx`);
}

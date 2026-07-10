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

function buildTitledSheet(rows, { title, subtitle, generatedBy, reportScope, columns, colWidths }) {
  return buildStyledSheet(rows, {
    title,
    subtitle,
    generatedBy,
    reportPeriod: reportScope,
    columns,
    colWidths,
    formatDateTime: fmtDateTime,
  });
}

// Donor register — one row per donor, enriched server-side with their most
// recent donation's vitals, TTI serology results, and prepared components.
async function fetchDonorRegisterRows(source, filters) {
  const params = { source, ...filters };
  const res = await apiClient.get('/api/v2/donor/register-export', { params });
  return res.data?.data || [];
}

const DONOR_REGISTER_COLUMNS = [
  'Donor ID', 'Name', 'Address', 'Sex', 'Phone', 'Blood Group',
  'Blood Bag No', 'Date of Collection', 'Date of Expiry',
  'Weight (Kg)', 'Pulse (BPM)', 'Hb (Gm%)', 'Rh Typing', 'Atypical Antibody',
  'HIV 1 & 2', 'HBs', 'HCV', 'VDRL', 'M.P.',
  'Components Prepared (Type: Volume mL)', 'Component Status', 'Status Date',
  'Eligibility Status', 'Last Donation Date',
];

function donorRegisterRow(d) {
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
  ];
}

async function exportDonorRegister(source, sheetLabel, scope, filters, generatedBy) {
  const rows = await fetchDonorRegisterRows(source === 'all' ? undefined : source, scope === 'filtered' ? filters : {});
  const wb = XLSX.utils.book_new();
  const ws = buildTitledSheet(rows.map(donorRegisterRow), {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: `${sheetLabel} — Donor Register`,
    generatedBy,
    reportScope: scope === 'filtered' ? 'Filtered View' : 'All Records',
    columns: DONOR_REGISTER_COLUMNS,
  });
  XLSX.utils.book_append_sheet(wb, ws, sheetLabel.slice(0, 31));
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${sheetLabel.replace(/\s+/g, '_')}_Register_${dateStr}.xlsx`);
}

const DEFERRAL_COLUMNS = [
  'Donor ID', 'Name', 'Blood Group', 'Phone', 'Type', 'Reason', 'Deferred On', 'Until Date', 'Status',
];

function deferralRow(entry) {
  const lifted = Boolean(entry.liftedAt);
  const expired = !lifted && entry.type !== 'PERMANENT' && entry.untilDate && new Date(entry.untilDate) <= new Date();
  const status = lifted ? 'Lifted' : expired ? 'Period Ended' : 'Active';
  return [
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

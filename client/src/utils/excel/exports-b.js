import { toast } from 'sonner';
import { buildStyledSheet, buildMultiTableSheet, buildDashboardMultiTableSheet, XLSX } from '@/utils/xlsxStyleHelper';
import { formatDate, formatDateTime, buildExportMeta, downloadExcelReport, downloadMultiTableExcelReport } from './core';

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

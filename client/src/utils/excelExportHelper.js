import { toast } from 'sonner';
import { buildStyledSheet, XLSX } from '@/utils/xlsxStyleHelper';

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
      } = sheet;

      const statsParts = (stats || []).map((s) => `${s.label}: ${s.value}`);
      if (filtersApplied) statsParts.push(`Filters — ${filtersApplied}`);
      const statsLine = statsParts.length ? statsParts.join('     ·     ') : undefined;

      // Auto column widths from header + cell content (min 10, max 45).
      const colWidths = headers.map((h, c) => {
        let maxLen = String(h ?? '').length;
        rows.forEach((r) => {
          const v = r[c];
          if (v != null) maxLen = Math.max(maxLen, String(v).length);
        });
        return { wch: Math.min(45, Math.max(10, maxLen + 2)) };
      });

      const ws = buildStyledSheet(rows, {
        title,
        subtitle,
        reportPeriod,
        statsLine,
        columns: headers,
        colWidths,
        groupHeader,
        totalRowIndexes,
        formatDateTime,
      });
      XLSX.utils.book_append_sheet(wb, ws, String(name).slice(0, 31));
    });

    XLSX.writeFile(wb, filename);
    toast.success('Excel report downloaded successfully!');
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
  const headers = ['Sr No', 'Full Name', 'DOB', 'Sex', 'Phone', 'Blood Group', 'Last Donation', 'Status'];
  const alignments = ['center', 'left', 'center', 'center', 'left', 'center', 'center', 'center'];
  
  const rows = items.map((r, i) => {
    const fullName = r.name 
      ? (typeof r.name === 'object' ? [r.name.firstName, r.name.middleName, r.name.lastName].filter(Boolean).join(' ') : r.name)
      : '—';
    return [
      i + 1,
      fullName,
      formatDate(r.dob),
      r.sex || '—',
      r.phone || '—',
      r.bloodGroup || '—',
      formatDate(r.lastDonationDate),
      (r.status || 'Active').toUpperCase(),
    ];
  });

  const stats = [
    { label: 'Total Donors', value: items.length },
    { label: 'Deals/Temporary Deferrals', value: items.filter(r => r.status?.toLowerCase() === 'deferred').length },
  ];

  await downloadExcelReport([{
    name: 'Camp Donors',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: `Camp Donor Registry - ${campName}`,
    headers,
    rows,
    alignments,
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

  const rows = items.map((r, i) => {
    const testRuns = r.tests || r.testRuns || [];
    const testOutcomes = testRuns.map(t => `${t.testName || t.name}: ${t.result || 'PENDING'}`).join(', ') || 'No Tests Run';
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

// 7. Inventory Issue
export async function exportIssues(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Component', 'Blood Group', 'Volume', 'Expiry Date', 'Issued To', 'Issued By', 'Issued Date'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'left', 'left', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagNo || '—',
    r.componentType || '—',
    r.bloodGroup || '—',
    r.volumeMl ? `${r.volumeMl} mL` : '—',
    formatDate(r.expiryDate),
    r.issuedToHospital || r.hospitalName || '—',
    r.issuedBy || '—',
    formatDateTime(r.issuedAt),
  ]);

  const stats = [
    { label: 'Total Issued Bags', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Issued Units',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Issued Blood Units Ledger',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Issued_Units_Report.xlsx');
}

// 7b. Storage Transfers (Issue Stock > Storage tab)
export async function exportStorageBags(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Segment No', 'Component', 'Blood Group', 'Volume', 'Expiry Date', 'Storage Location', 'Sent Date'];
  const alignments = ['center', 'center', 'center', 'left', 'center', 'center', 'center', 'left', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r?.bag?.bagNo || r.bagNo || '—',
    r.segmentNo || '—',
    r?.component?.componentType || '—',
    r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh === 'Positive' ? '+' : r.bag.rh === 'Negative' ? '-' : ''}`.trim() : '—',
    r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—',
    formatDate(r?.component?.expiryDate),
    r.storageLocation || r?.hospital?.name || '—',
    formatDateTime(r.issuedAt),
  ]);

  const stats = [{ label: 'Total Bags Sent to Storage', value: items.length }];

  await downloadExcelReport([{
    name: 'Storage Transfers',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Bags Sent to Storage Register',
    headers,
    rows,
    alignments,
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

// 7d. Bulk Transfers / Loans (Issue Stock > Bulk Transfer tab)
export async function exportBulkTransfers(items, meta = {}) {
  const headers = ['Sr No', 'Transfer ID', 'Type', 'Blood Bank', 'Address', 'Transfer Date', 'Bags Count'];
  const alignments = ['center', 'center', 'center', 'left', 'left', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.transferId || '—',
    r.transferType === 'GIVE_LOAN' ? 'Give Loan' : 'Take Loan',
    r.bloodBankName || '—',
    r.bloodBankAddress || '—',
    formatDate(r.transferDate),
    r.items?.length || 0,
  ]);

  const stats = [
    { label: 'Total Transfers', value: items.length },
    { label: 'Given on Loan', value: items.filter(r => r.transferType === 'GIVE_LOAN').length },
    { label: 'Taken on Loan', value: items.filter(r => r.transferType === 'TAKE_LOAN').length },
  ];

  await downloadExcelReport([{
    name: 'Bulk Transfers',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Bulk Transfer (Loan) Register',
    headers,
    rows,
    alignments,
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
  const headers = ['Sr No', 'Inspection ID', 'Batch No', 'PO Number', 'Inspection Date', 'Inspector Name', 'Status'];
  const alignments = ['center', 'center', 'center', 'center', 'center', 'left', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.inspectionId || r._id || '—',
    r.batchNo || '—',
    r.poNumber || '—',
    formatDate(r.inspectionDate),
    r.inspectorName || '—',
    (r.status || '—').toUpperCase(),
  ]);

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
    alignments,
    stats,
    ...meta,
  }], 'Procurement_Inspection_Report.xlsx');
}

// 11. Procurement GRN (Goods Receipt)
export async function exportProcurementGRN(items, meta = {}) {
  const headers = ['Sr No', 'GRN Number', 'GRN Date', 'PO Number', 'Supplier', 'Received Qty', 'Inspection Status'];
  const alignments = ['center', 'center', 'center', 'center', 'left', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.grnNumber || r.grnNo || '—',
    formatDate(r.grnDate || r.receivedDate),
    r.poNumber || '—',
    r.supplierName || r.vendorName || '—',
    r.receivedQty || r.quantityReceived || 0,
    (r.status || r.inspectionStatus || '—').toUpperCase(),
  ]);

  const stats = [
    { label: 'Total Receipts (GRN)', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Goods Receipt Note',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Goods Receipt Note (GRN) Procurement ledger',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Goods_Receipt_GRN_Report.xlsx');
}

// 12. Procurement PO (Purchase Order)
export async function exportProcurementPO(items, meta = {}) {
  const headers = ['Sr No', 'PO Number', 'PO Date', 'Vendor', 'Manufacturer', 'Bill Date'];
  const alignments = ['center', 'center', 'center', 'left', 'left', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.poNumber || '—',
    formatDate(r.poDate),
    r.vendorName || r.vendorId?.name || r.vendorId || '—',
    r.manufacturer || '—',
    formatDate(r.billDate),
  ]);

  const stats = [
    { label: 'Total Purchase Orders', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Purchase Orders',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Purchase Orders ledger',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Purchase_Orders_Report.xlsx');
}

// 13. Procurement Issue (Bag Issuance)
export async function exportProcurementIssue(items, meta = {}) {
  const headers = ['Sr No', 'Bag No', 'Segment No', 'Bag Type', 'Blood Group', 'Batch No', 'Issue Date', 'Status'];
  const alignments = ['center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagNo || '—',
    r.segmentNo || '—',
    r.bagType || '—',
    r.bloodGroup || '—',
    r.batchNo || '—',
    formatDateTime(r.issueDate),
    (r.status || 'ISSUED').toUpperCase(),
  ]);

  const stats = [
    { label: 'Total Issuances', value: items.length },
    { label: 'Total Discarded', value: items.filter(r => r.status?.toUpperCase() === 'DISCARDED').length },
  ];

  await downloadExcelReport([{
    name: 'Bag Issuances',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Blood Bag Issuances Log',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Procurement_Bag_Issuances.xlsx');
}

// 14. Procurement Inventory (Bag Inventory)
export async function exportProcurementInventory(items, meta = {}) {
  const headers = ['Sr No', 'Bag ID', 'Capacity (mL)', 'Anticoagulant', 'Status'];
  const alignments = ['center', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagId || r.unitId || r._id || '—',
    r.capacityMl || r.capacity || '—',
    r.anticoagulant || '—',
    (r.status || 'Available').toUpperCase(),
  ]);

  const stats = [
    { label: 'Total Stocked Bags', value: items.length },
    { label: 'Available', value: items.filter(r => r.status?.toLowerCase() === 'available' || r.status?.toLowerCase() === 'in-stock').length },
  ];

  await downloadExcelReport([{
    name: 'Bags Inventory',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Unused Blood Bags Ledger',
    headers,
    rows,
    alignments,
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
  const headers = ['Sr No', 'Usage ID', 'Chemical Name', 'Lot Number', 'Quantity Used', 'Used By', 'Usage Date'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'left', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.usageId || r._id || '—',
    r.chemicalName || r.chemicalId?.name || '—',
    r.lotNumber || '—',
    r.quantityUsed || r.quantity || 0,
    r.usedBy || '—',
    formatDate(r.usageDate || r.createdAt),
  ]);

  const stats = [
    { label: 'Total Usages Recorded', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Reagents Usage',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Chemical Reagents Usage Ledger',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Chemical_Reagents_Usage.xlsx');
}

// 17. Chemical Inventory Purchase
export async function exportChemicalPurchase(items, meta = {}) {
  const headers = ['Sr No', 'Invoice Number', 'Purchase Date', 'Supplier Name', 'Chemical Name', 'Quantity', 'Unit Price'];
  const alignments = ['center', 'center', 'center', 'left', 'left', 'center', 'right'];

  const rows = items.map((r, i) => [
    i + 1,
    r.invoiceNumber || '—',
    formatDate(r.purchaseDate),
    r.supplierName || '—',
    r.chemicalName || r.name || '—',
    r.quantity || 0,
    r.unitPrice !== undefined ? `₹${r.unitPrice.toLocaleString('en-IN')}` : '—',
  ]);

  const stats = [
    { label: 'Total Purchases', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Chemical Purchases',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Chemical Reagents Procurement purchase ledger',
    headers,
    rows,
    alignments,
    stats,
    ...meta,
  }], 'Chemical_Procurement_Purchases.xlsx');
}

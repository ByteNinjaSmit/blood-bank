import apiService from '@/services/api';
import { toast } from 'sonner';

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
 * Central utility to trigger binary Excel generation on the backend.
 */
export async function downloadExcelReport(sheets, filename = 'Report.xlsx') {
  try {
    toast.info('Generating Excel report...');
    const res = await apiService.postDownload('/api/v2/export/excel', {
      filename,
      sheets,
    });

    if (res.error) {
      toast.error(res.error || 'Failed to generate Excel report');
      return;
    }

    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel report downloaded successfully!');
  } catch (e) {
    toast.error('Network error during Excel report download');
    console.error(e);
  }
}

// ==========================================
// 17 PAGE SPECIFIC EXPORT MAPPERS
// ==========================================

// 1. Camp Donors
export async function exportCampDonors(items, campName = 'Camp') {
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
  }], `Camp_Donors_${campName.replace(/\s+/g, '_')}.xlsx`);
}

// 2. Camp Donations
export async function exportCampDonations(items, campName = 'Camp') {
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
  }], `Camp_Donations_${campName.replace(/\s+/g, '_')}.xlsx`);
}

// 3. Component List
export async function exportComponents(items) {
  const headers = ['Sr No', 'Component ID', 'Bag No', 'Component Type', 'Blood Group', 'Volume (mL)', 'Expiry Date', 'Status'];
  const alignments = ['center', 'center', 'center', 'left', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.componentId || r._id || '—',
    r.bagNo || r.bag?.bagNo || '—',
    r.componentType || '—',
    r.bloodGroup || (r.bag ? `${r.bag.bloodGroup} ${r.bag.rh || ''}` : '—'),
    r.volumeMl ?? '—',
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
  }], 'Component_Inventory_Report.xlsx');
}

// 4. Serology Results
export async function exportSerologyResults(items) {
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
  }], 'Serology_Lab_Results.xlsx');
}

// 5. Inventory Stock
export async function exportStock(items) {
  const headers = ['Sr No', 'Bag No', 'Component', 'Blood Group', 'Volume', 'Expiry Date', 'Status'];
  const alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r?.bag?.bagNo || r.bagNo || '—',
    r?.component?.componentType || '—',
    r?.bag?.bloodGroup ? `${r.bag.bloodGroup} ${r.bag.rh || ''}` : '—',
    r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—',
    formatDate(r?.component?.expiryDate),
    (r.status || '—').toUpperCase(),
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
  }], 'Inventory_Stock_Report.xlsx');
}

// 6. Inventory Reserve
export async function exportReserve(items) {
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
  }], 'Reserved_Units_Report.xlsx');
}

// 7. Inventory Issue
export async function exportIssues(items) {
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
  }], 'Issued_Units_Report.xlsx');
}

// 8. Master Donors
export async function exportMasterDonors(items) {
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
  }], 'Master_Donor_Register.xlsx');
}

// 9. Master Donations
export async function exportMasterDonations(items) {
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
  }], 'Master_Donation_Register.xlsx');
}

// 10. Procurement Inspection
export async function exportProcurementInspection(items) {
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
  }], 'Procurement_Inspection_Report.xlsx');
}

// 11. Procurement GRN (Goods Receipt)
export async function exportProcurementGRN(items) {
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
  }], 'Goods_Receipt_GRN_Report.xlsx');
}

// 12. Procurement PO (Purchase Order)
export async function exportProcurementPO(items) {
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
  }], 'Purchase_Orders_Report.xlsx');
}

// 13. Procurement Issue (Bag Issuance)
export async function exportProcurementIssue(items) {
  const headers = ['Sr No', 'Issue ID', 'Issued Date', 'Receiver Name', 'Total Bags Issued', 'Status'];
  const alignments = ['center', 'center', 'center', 'left', 'center', 'center'];

  const rows = items.map((r, i) => [
    i + 1,
    r.issueId || r._id || '—',
    formatDateTime(r.issuedAt || r.createdAt),
    r.receiverName || r.issuedTo || '—',
    r.totalBagsIssued || r.quantityIssued || 0,
    (r.status || 'Completed').toUpperCase(),
  ]);

  const stats = [
    { label: 'Total Issuances', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Bag Issuances',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Blood Bag Issuances Log',
    headers,
    rows,
    alignments,
    stats,
  }], 'Procurement_Bag_Issuances.xlsx');
}

// 14. Procurement Inventory (Bag Inventory)
export async function exportProcurementInventory(items) {
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
  }], 'Procurement_Bags_Inventory.xlsx');
}

// 15. Procurement Discard
export async function exportProcurementDiscard(items) {
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
  }], 'Discards_And_Wastes_Report.xlsx');
}

// 16. Chemical Inventory Usage (Reagents)
export async function exportChemicalUsage(items) {
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
  }], 'Chemical_Reagents_Usage.xlsx');
}

// 17. Chemical Inventory Purchase
export async function exportChemicalPurchase(items) {
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
  }], 'Chemical_Procurement_Purchases.xlsx');
}

import { toast } from 'sonner';
import { buildStyledSheet, buildMultiTableSheet, buildDashboardMultiTableSheet, XLSX } from '@/utils/xlsxStyleHelper';
import { formatDate, formatDateTime, buildExportMeta, downloadExcelReport, downloadMultiTableExcelReport } from './core';

export async function exportProcurementInspection(items, meta = {}) {
  const yn = (v) => (v === true ? 'Yes' : v === false ? 'No' : '—');
  const headers = [
    'Sr No', 'Inspection ID', 'Batch No', 'PO Number', 'Bag No', 'Segment No', 'Blood Group',
    'Sample Size', 'Testing Type', 'Testing Lab', 'Inspection Date', 'Inspector', 'Decision / Status',
    'Seal Intact', 'No Leakage', 'Tube Integrity', 'Needle Condition OK', 'Label Present', 'Sterility Check', 'Packaging Condition',
  ];

  const rows = items.map((r, i) => {
    const c = r.physicalChecks || {};
    return [
      i + 1,
      r.inspectionId || r._id || '—',
      r.batchNo || '—',
      r.poNumber || '—',
      r.bagNo || '—',
      r.segmentNo || '—',
      r.bloodGroup || '—',
      r.sampleSize ?? '—',
      r.testingType || '—',
      r.testingLab || '—',
      formatDate(r.inspectionDate),
      r.inspectorName || '—',
      (r.status || '—').toUpperCase(),
      yn(c.sealIntact),
      yn(c.noLeakage),
      yn(c.tubeIntegrity),
      yn(c.needleCondition),
      yn(c.labelPresence),
      yn(c.sterilityCheck),
      yn(c.packagingCondition),
    ];
  });

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
    stats,
    ...meta,
  }], 'Procurement_Inspection_Report.xlsx');
}

// 11. Procurement GRN (Goods Receipt)
export async function exportProcurementGRN(items, meta = {}) {
  const headers = ['Sr No', 'GRN Number', 'Invoice No', 'GRN Date', 'PO Number', 'Supplier', 'Total Received Qty', 'Status', 'Bag Type', 'Capacity (mL)', 'Anticoagulant', 'Batch No', 'Mfg Date', 'Expiry Date', 'Qty Received'];

  // Each GRN expands into one row per batch line, sharing a single serial no.
  const rows = [];
  items.forEach((r, i) => {
    const batchLines = (r.batchLines && r.batchLines.length) ? r.batchLines : [null];
    batchLines.forEach((b, j) => {
      rows.push([
        j === 0 ? i + 1 : '',
        r.grnNumber || r.grnNo || '—',
        r.invoiceNo || '—',
        formatDate(r.grnDate || r.receivedDate),
        r.poNumber || '—',
        r.supplierName || r.vendorName || '—',
        r.receivedQty || r.quantityReceived || 0,
        (r.status || r.inspectionStatus || '—').toUpperCase(),
        b?.bagType || '—',
        b?.capacityMl ?? '—',
        b?.anticoagulant || '—',
        b?.batchNumber || '—',
        formatDate(b?.manufacturingDate),
        formatDate(b?.expiryDate),
        b?.quantityReceived ?? '—',
      ]);
    });
  });

  const stats = [
    { label: 'Total Receipts (GRN)', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Goods Receipt Note',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Goods Receipt Note (GRN) Procurement ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Goods_Receipt_GRN_Report.xlsx');
}

// 12. Procurement PO (Purchase Order)
export async function exportProcurementPO(items, meta = {}) {
  const headers = ['Sr No', 'PO Number', 'PO Date', 'Vendor', 'Manufacturer', 'Bill Date', 'Bag Type', 'Capacity (mL)', 'Anticoagulant', 'Qty Ordered'];

  // Each PO expands into one row per line item, sharing a single serial no.
  const rows = [];
  items.forEach((r, i) => {
    const lineItems = (r.lineItems && r.lineItems.length) ? r.lineItems : [null];
    lineItems.forEach((it, j) => {
      rows.push([
        j === 0 ? i + 1 : '',
        r.poNumber || '—',
        formatDate(r.poDate),
        r.vendorName || r.vendorId?.name || r.vendorId || '—',
        r.manufacturer || '—',
        formatDate(r.billDate),
        it?.bagType || '—',
        it?.capacityMl ?? '—',
        it?.anticoagulant || '—',
        it?.quantityOrdered ?? '—',
      ]);
    });
  });

  const stats = [
    { label: 'Total Purchase Orders', value: items.length },
  ];

  await downloadExcelReport([{
    name: 'Purchase Orders',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Purchase Orders ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Purchase_Orders_Report.xlsx');
}

// 13. Procurement Issue (Bag Issuance)
export async function exportProcurementIssue(items, meta = {}) {
  const headers = [
    'Sr No', 'Bag No', 'Segment No', 'Batch No', 'Bag Type', 'Blood Group', 'Collection Room',
    'Issue Date', 'Status', 'Donor Name', 'Donor Blood Group', 'Donor Phone', 'Donation ID', 'Notes',
  ];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagNo || '—',
    r.segmentNo || '—',
    r.batchNo || '—',
    r.bagType || '—',
    r.bloodGroup || '—',
    r.collectionRoom || '—',
    formatDateTime(r.issueDate),
    (r.status || 'ISSUED').toUpperCase(),
    r.donorName || '—',
    r.donorBloodGroup || '—',
    r.donorPhone || '—',
    r.donationId || '—',
    r.notes || '—',
  ]);

  const stats = [
    { label: 'Total Issuances', value: items.length },
    { label: 'Issued', value: items.filter(r => r.status?.toUpperCase() === 'ISSUED').length },
    { label: 'Used', value: items.filter(r => r.status?.toUpperCase() === 'USED').length },
    { label: 'Total Discarded', value: items.filter(r => r.status?.toUpperCase() === 'DISCARDED').length },
  ];

  await downloadExcelReport([{
    name: 'Bag Issuances',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Blood Bag Issuances Log',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Procurement_Bag_Issuances.xlsx');
}

// 14. Procurement Inventory (Bag Inventory)
export async function exportProcurementInventory(items, meta = {}) {
  const headers = [
    'Sr No', 'Bag Type', 'Batch No', 'Expiry Date', 'Total Ordered (Boxes)', 'Opened Boxes',
    'Unopened Boxes', 'Remaining Stock (Bags)', 'Issued', 'Discarded', 'Damaged', 'Status',
  ];

  const rows = items.map((r, i) => [
    i + 1,
    r.bagType || '—',
    r.batchNo || r.bagId || r._id || '—',
    formatDate(r.expiryDate),
    r.totalBoxes ?? '—',
    r.openedBoxes ?? '—',
    r.unopenedBoxes ?? '—',
    r.remainingBags ?? '—',
    r.issuedQty ?? 0,
    r.discardedQty ?? 0,
    r.damagedQty ?? 0,
    (r.status || 'Available').toUpperCase().replace(/_/g, ' '),
  ]);

  const stats = [
    { label: 'Total Stock Records', value: items.length },
    { label: 'Available', value: items.filter(r => r.status?.toLowerCase() === 'available' || r.status?.toLowerCase() === 'in-stock').length },
    { label: 'Out of Stock', value: items.filter(r => r.status?.toUpperCase() === 'OUT_OF_STOCK').length },
    { label: 'Total Remaining Bags', value: items.reduce((sum, r) => sum + (r.remainingBags ?? 0), 0) },
  ];

  await downloadExcelReport([{
    name: 'Bags Inventory',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Procurement Unused Blood Bags Ledger',
    headers,
    rows,
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
  const headers = [
    'Sr No', 'Chemical / Reagent', 'Category', 'Lot Number', 'Batch Number', 'Invoice Number',
    'Expiry Date', 'Total Purchased', 'Available', 'In Use', 'Consumed', 'Usage %',
  ];

  const rows = items.map((r, i) => {
    const total = r.qtyPurchased || 0;
    const consumed = r.qtyConsumed || 0;
    const usagePct = total > 0 ? `${Math.round((consumed / total) * 100)}%` : '—';
    return [
      i + 1,
      r.chemicalName || r.chemicalId?.name || '—',
      r.category || '—',
      r.lotNumber || '—',
      r.batchNumber || '—',
      r.invoiceNumber || '—',
      formatDate(r.expiryDate),
      total,
      r.qtyAvailable ?? 0,
      r.qtyInUse ?? 0,
      consumed,
      usagePct,
    ];
  });

  const stats = [
    { label: 'Total Lots', value: items.length },
    { label: 'Total Available', value: items.reduce((s, r) => s + (r.qtyAvailable ?? 0), 0) },
    { label: 'Total In Use', value: items.reduce((s, r) => s + (r.qtyInUse ?? 0), 0) },
    { label: 'Total Consumed', value: items.reduce((s, r) => s + (r.qtyConsumed ?? 0), 0) },
  ];

  await downloadExcelReport([{
    name: 'Reagents Usage',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Chemical Reagents Usage Ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Chemical_Reagents_Usage.xlsx');
}

// 17. Chemical Inventory Purchase
export async function exportChemicalPurchase(items, meta = {}) {
  const headers = [
    'Sr No', 'Invoice Number', 'Purchase Date', 'Supplier Name', 'Item Name', 'Manufacturer',
    'Pack Type', 'Batch No', 'Expiry Date', 'Qty', 'Rate (₹)', 'CGST (₹)', 'SGST (₹)',
    'Item Total (₹)', 'Invoice Total (₹)', 'Paid (₹)', 'Balance (₹)', 'Payment Status',
  ];
  const money = (v) => (v || v === 0 ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');

  const rows = [];
  items.forEach((r, i) => {
    const lineItems = (r.items && r.items.length) ? r.items : [{}];
    lineItems.forEach((it, j) => {
      rows.push([
        j === 0 ? i + 1 : '',
        j === 0 ? (r.invoiceNumber || '—') : '',
        j === 0 ? formatDate(r.purchaseDate) : '',
        j === 0 ? (r.supplierName || '—') : '',
        it.chemicalName || '—',
        it.manufacturer || '—',
        it.packType || '—',
        it.batchNumber || '—',
        it.expiryDate ? formatDate(it.expiryDate) : '—',
        it.quantity ?? 0,
        money(it.unitPrice),
        money(it.cgstAmount),
        money(it.sgstAmount),
        money(it.itemTotal),
        j === 0 ? money(r.totalAmount) : '',
        j === 0 ? money(r.paidAmount) : '',
        j === 0 ? money(r.balance) : '',
        j === 0 ? (r.paymentStatus || '—') : '',
      ]);
    });
  });

  const stats = [
    { label: 'Total Invoices', value: items.length },
    { label: 'Total Amount', value: `₹${money(items.reduce((s, r) => s + (r.totalAmount || 0), 0))}` },
    { label: 'Total Paid', value: `₹${money(items.reduce((s, r) => s + (r.paidAmount || 0), 0))}` },
    { label: 'Total Balance', value: `₹${money(items.reduce((s, r) => s + (r.balance || 0), 0))}` },
  ];

  await downloadExcelReport([{
    name: 'Chemical Purchases',
    title: 'SANJIVANI BLOOD BANK, KOPARGAON',
    subtitle: 'Chemical Reagents Procurement purchase ledger',
    headers,
    rows,
    stats,
    ...meta,
  }], 'Chemical_Procurement_Purchases.xlsx');
}

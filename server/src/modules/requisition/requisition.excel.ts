import ExcelJS from 'exceljs';
import mongoose, { Types } from 'mongoose';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import { PatientModel } from '@/modules/patient/patient.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { UserModel } from '@/modules/user/user.model';
import { IssueModel } from '@/modules/issue/issue.model';
import {
  createProfessionalHeader,
  createSummaryTable,
  formatTable,
  applyPrintFormatting,
  applyFooter,
  formatDateTime,
} from '@/shared/utils/excelHelper';

/**
 * Builds a query object matching UI filters
 */
function buildQuery(filters: any): Record<string, any> {
  const query: Record<string, any> = { deletedAt: null };

  if (filters.exportAll === 'true' || filters.exportAll === true) {
    return query;
  }

  if (filters.status) {
    query.status = filters.status.toUpperCase();
  }

  if (filters.hospitalId && mongoose.Types.ObjectId.isValid(filters.hospitalId)) {
    query.hospitalId = new Types.ObjectId(filters.hospitalId);
  }

  if (filters.patientId && mongoose.Types.ObjectId.isValid(filters.patientId)) {
    query.patientId = new Types.ObjectId(filters.patientId);
  }

  if (filters.from || filters.to) {
    query.requestedAt = {};
    if (filters.from) {
      query.requestedAt.$gte = new Date(filters.from);
    }
    if (filters.to) {
      // Set to end of day to include the entire 'to' date
      const toDate = new Date(filters.to);
      toDate.setHours(23, 59, 59, 999);
      query.requestedAt.$lte = toDate;
    }
  }

  if (filters.search) {
    query.$or = [
      { requisitionId: { $regex: filters.search, $options: 'i' } },
      { 'patient.name': { $regex: filters.search, $options: 'i' } },
    ];
  }

  return query;
}

/**
 * Enrich raw requisition documents with related models
 */
async function enrichRequisitions(docs: any[]): Promise<any[]> {
  if (docs.length === 0) return [];

  // Extract reference IDs
  const hospitalIds = docs.map(d => d.hospitalId).filter(Boolean);
  const userIds = docs
    .flatMap(d => [d.createdBy, d.updatedBy, d.approvedBy, d.rejectedBy])
    .filter(Boolean);

  const matchedUnitIds = docs
    .flatMap(d => (d.matchedUnits || []).map((mu: any) => mu.unitId))
    .filter(Boolean);

  // Batch query related collections
  const [hospitals, users, bloodUnits] = await Promise.all([
    HospitalModel.find({ _id: { $in: hospitalIds } }).lean(),
    UserModel.find({ _id: { $in: userIds } }).select('name username').lean(),
    BloodUnitModel.find({ unitId: { $in: matchedUnitIds } }).lean(),
  ]);

  const hospitalMap = new Map(hospitals.map(h => [h._id.toString(), h]));
  const userMap = new Map(users.map(u => [u._id.toString(), u]));
  const unitMap = new Map(bloodUnits.map(u => [u.unitId, u]));

  // Batch query donations for matched units
  const donationIds = bloodUnits.map(u => u.donationId).filter(Boolean);
  const donations = await DonationModel.find({ donationId: { $in: donationIds } })
    .select('donationId bagNo collectedAt donor')
    .lean();
  const donationMap = new Map(donations.map(d => [d.donationId, d]));

  // Batch query donors for donations
  const donorIds = donations.map(d => d.donor).filter(Boolean);
  const donors = await DonorModel.find({ _id: { $in: donorIds } })
    .select('_id name')
    .lean();
  const donorMap = new Map(
    donors.map((d: any) => {
      const fullName = d.name
        ? [d.name.firstName, d.name.middleName, d.name.lastName].filter(Boolean).join(' ')
        : 'Unknown';
      return [d._id.toString(), fullName];
    }),
  );

  return Promise.all(
    docs.map(async (doc: any) => {
      // Map hospital details
      const hospitalDoc = hospitalMap.get(doc.hospitalId?.toString()) as any;
      const hospitalInfo = hospitalDoc
        ? {
            _id: doc.hospitalId,
            name: hospitalDoc.name,
            contactPerson: hospitalDoc.contactPerson,
            phone: hospitalDoc.phone,
            email: hospitalDoc.email || '—',
            address: hospitalDoc.address,
          }
        : { name: 'Unknown Hospital' };

      // Map user details
      const approvedByDoc = userMap.get(doc.approvedBy?.toString()) as any;
      const rejectedByDoc = userMap.get(doc.rejectedBy?.toString()) as any;

      const formatUser = (user: any) => {
        if (!user) return null;
        return user.name
          ? [user.name.first, user.name.last].filter(Boolean).join(' ')
          : user.username || 'System';
      };

      // Map components
      const requestedComponents = (doc.requestedComponents || []).map((rc: any) => ({
        componentType:
          rc.componentType === 'PRBC'
            ? 'RBC'
            : rc.componentType === 'PLATELET_CONCENTRATE'
              ? 'Platelet'
              : rc.componentType === 'CRYOPRECIPITATE'
                ? 'Cryo'
                : rc.componentType,
        units: rc.units,
        bloodGroup: rc.aboGroup,
        rh: rc.rhFactor === 'POSITIVE' ? '+' : '-',
        urgency: rc.urgency?.toLowerCase() === 'routine' ? 'Regular' : rc.urgency,
      }));

      // Enrich matched units details
      const matchedInventory = (doc.matchedUnits || [])
        .map((mu: any) => {
          const unit = unitMap.get(mu.unitId);
          if (!unit) return null;
          const donation = donationMap.get(unit.donationId) as any;
          return {
            inventoryId: {
              _id: unit.unitId,
              bagNo: {
                bagNo: donation?.bagNo || unit.donationId,
                bloodGroup: unit.aboGroup,
                rh: unit.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
                donorName: donation?.donor
                  ? donorMap.get(donation.donor.toString()) || 'Unknown'
                  : 'Unknown',
                collectedAt: donation?.collectedAt ? donation.collectedAt.toISOString() : null,
              },
              componentId: {
                componentType:
                  unit.componentType === 'PRBC'
                    ? 'RBC'
                    : unit.componentType === 'PLATELET_CONCENTRATE'
                      ? 'Platelet'
                      : unit.componentType === 'CRYOPRECIPITATE'
                        ? 'Cryo'
                        : unit.componentType,
                expiryDate: unit.expiresAt ? unit.expiresAt.toISOString() : '',
              },
            },
            compatibilityType: mu.compatibilityType.toLowerCase(),
            crossmatchRequired: mu.crossmatchRequired,
            crossmatchStatus: mu.crossmatchStatus.toLowerCase(),
            reservedAt: mu.reservedAt,
          };
        })
        .filter(Boolean);

      return {
        ...doc,
        _id: doc._id.toString(),
        requestId: doc.requisitionId,
        doctorName: doc.doctorName || doc.clinicianName,
        requestedComponents,
        matchedInventory,
        status: doc.status?.toLowerCase(),
        hospitalId: hospitalInfo,
        approvedBy: formatUser(approvedByDoc),
        rejectedBy: formatUser(rejectedByDoc),
      };
    }),
  );
}

/**
 * Builds the entire Excel Workbook
 */
export async function generateRequisitionExcel(
  filters: any,
  loggedInUser: string,
): Promise<ExcelJS.Workbook> {
  const query = buildQuery(filters);

  // Fetch and enrich requisitions
  const rawDocs = await RequisitionModel.find(query).sort({ createdAt: -1 }).lean();
  const enrichedRequests = await enrichRequisitions(rawDocs);

  // Fetch all issues related to these requisitions
  const reqIds = enrichedRequests.map(r => new Types.ObjectId(r._id));
  const rawIssues = await IssueModel.find({ requisitionId: { $in: reqIds } })
    .populate('issuedBy')
    .lean();

  // Map issues by requisition ID for fast lookup
  const issuesMap = new Map<string, any[]>();
  rawIssues.forEach((issue: any) => {
    const key = issue.requisitionId.toString();
    if (!issuesMap.has(key)) {
      issuesMap.set(key, []);
    }
    issuesMap.get(key)!.push(issue);
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sanjivani Blood Bank Management System';
  workbook.lastModifiedBy = loggedInUser;

  // Prepare date range display
  let reportPeriod = 'All Records';
  if (filters.from && filters.to) {
    reportPeriod = `From ${filters.from} To ${filters.to}`;
  } else if (filters.from) {
    reportPeriod = `From ${filters.from}`;
  } else if (filters.to) {
    reportPeriod = `To ${filters.to}`;
  }

  // Calculate statistics
  const totalCount = enrichedRequests.length;
  const approvedCount = enrichedRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = enrichedRequests.filter(r => r.status === 'rejected').length;
  const matchedCount = enrichedRequests.filter(
    r => r.status === 'matched' || r.status === 'crossmatched',
  ).length;
  const issuedCount = enrichedRequests.filter(r => r.status === 'issued').length;
  const completedCount = enrichedRequests.filter(r => r.status === 'completed').length;

  const stats = [
    { label: 'Total Requests', value: totalCount },
    { label: 'Approved Requests', value: approvedCount },
    { label: 'Rejected Requests', value: rejectedCount },
    { label: 'Matched Requests', value: matchedCount },
    { label: 'Issued Requests', value: issuedCount },
    { label: 'Completed Requests', value: completedCount },
  ];

  // Helper function to build a data worksheet for a specific status or all
  const buildRequestSheet = (
    sheetName: string,
    records: any[],
  ) => {
    const sheet = workbook.addWorksheet(sheetName);
    
    // Main Headers configuration
    const columns = [
      'Sr No',
      'Request ID',
      'Hospital',
      'Patient Name',
      'Age',
      'Gender',
      'Blood Group',
      'Component',
      'Units',
      'Request Date',
      'Status',
    ];
    const alignments: ('left' | 'center' | 'right')[] = [
      'center',
      'center',
      'left',
      'left',
      'center',
      'center',
      'center',
      'left',
      'center',
      'center',
      'center',
    ];

    // Create Report Header
    createProfessionalHeader(sheet, {
      title: 'Sanjivani Blood Bank, Kopargaon',
      subtitle: `Blood Request Management Report - ${sheetName}`,
      generatedBy: loggedInUser,
      reportPeriod,
      numCols: columns.length,
    });

    // Create Summary Table (Row 6 to 9)
    const tableStartRow = createSummaryTable(sheet, 7, 'REPORT OVERVIEW', stats);

    // Map records to rows (expanding multiple components)
    let srNo = 1;
    const tableRows: any[][] = [];

    records.forEach(r => {
      const requestedComponents = r.requestedComponents || [];
      if (requestedComponents.length === 0) {
        tableRows.push([
          srNo++,
          r.requestId || '—',
          r.hospitalId?.name || '—',
          r.patient?.name || '—',
          r.patient?.age || '—',
          r.patient?.sex || '—',
          '—',
          '—',
          '—',
          r.requestedAt ? formatDateTime(r.requestedAt) : '—',
          r.status?.toUpperCase() || '—',
        ]);
      } else {
        requestedComponents.forEach((rc: any) => {
          tableRows.push([
            srNo++,
            r.requestId || '—',
            r.hospitalId?.name || '—',
            r.patient?.name || '—',
            r.patient?.age || '—',
            r.patient?.sex || '—',
            `${rc.bloodGroup}${rc.rh}`,
            rc.componentType || '—',
            rc.units || 0,
            r.requestedAt ? formatDateTime(r.requestedAt) : '—',
            r.status?.toUpperCase() || '—',
          ]);
        });
      }
    });

    // Render & style main table
    formatTable(sheet, tableStartRow, columns, tableRows, alignments);

    // Apply Print configurations
    applyPrintFormatting(sheet, tableStartRow);
    applyFooter(sheet);
  };

  // 1. All Requests sheet
  buildRequestSheet('All Requests', enrichedRequests);

  // 2. Approved Requests sheet
  buildRequestSheet('Approved Requests', enrichedRequests.filter(r => r.status === 'approved'));

  // 3. Rejected Requests sheet
  buildRequestSheet('Rejected Requests', enrichedRequests.filter(r => r.status === 'rejected'));

  // 4. Matched Requests sheet
  buildRequestSheet(
    'Matched Requests',
    enrichedRequests.filter(r => r.status === 'matched' || r.status === 'crossmatched'),
  );

  // 5. Issued Requests sheet
  buildRequestSheet('Issued Requests', enrichedRequests.filter(r => r.status === 'issued'));

  // 6. Completed Requests sheet
  buildRequestSheet('Completed Requests', enrichedRequests.filter(r => r.status === 'completed'));

  // 7. Request Details Sheet (Requirement 4)
  const detailsSheet = workbook.addWorksheet('Request Details');
  const detailsColumns = [
    'Sr No',
    'Request ID',
    'Hospital Name',
    'Contact Person',
    'Contact Phone',
    'Hospital Email',
    'Hospital Address',
    'Patient Name',
    'Patient Age',
    'Patient Gender',
    'Patient MRN',
    'Patient Diagnosis',
    'Indication for Transfusion',
    'Hb Level',
    'Blood Group Requested',
    'Component Type Requested',
    'Units Requested',
    'Urgency',
    'Doctor Name',
    'Requisition Clinical Notes',
    'Remarks / Rejection Reason',
    'Approved By',
    'Approved At',
    'Current Status',
    'Issued Bag Number(s)',
    'Issued By',
    'Issued At',
    'Collected By',
    'Transport Temp (°C)',
  ];

  const detailsAlignments: ('left' | 'center' | 'right')[] = [
    'center', 'center', 'left', 'left', 'left', 'left', 'left', 'left', 'center', 'center',
    'center', 'left', 'left', 'center', 'center', 'left', 'center', 'center', 'left', 'left',
    'left', 'left', 'center', 'center', 'left', 'left', 'center', 'left', 'center'
  ];

  createProfessionalHeader(detailsSheet, {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: 'Blood Request Management Report - Exhaustive Request Details',
    generatedBy: loggedInUser,
    reportPeriod,
    numCols: detailsColumns.length,
  });

  const detailsTableStart = 7;
  let detailsSrNo = 1;
  const detailsRows: any[][] = [];

  enrichedRequests.forEach(r => {
    // Approved details
    const approvedBy = r.approvedBy || '—';
    const approvedAt = r.approvedAt ? formatDateTime(r.approvedAt) : '—';
    const remarks = r.rejectionReason || '—';

    // Parse Patient History & Pregnancy Info
    const hist = r.patient?.history;
    const preg = r.patient?.pregnancy;
    const clinicalNotes = [
      hist?.previousTransfusions ? `Prev Transfusions: ${hist.previousTransfusions} (${hist.approximateDate || 'N/A'})` : '',
      hist?.presenceOfReaction && hist.presenceOfReaction !== 'None' ? `Reaction: ${hist.presenceOfReaction}` : '',
      preg?.numPregnancies ? `Pregnancies: ${preg.numPregnancies}` : '',
      preg?.numMiscarriages ? `Miscarriages: ${preg.numMiscarriages}` : '',
      preg?.numChildrenWithHemolyticDisease ? `HDN Kids: ${preg.numChildrenWithHemolyticDisease}` : '',
    ].filter(Boolean).join('; ') || 'No previous clinical history/pregnancy records';

    // Issued bags numbers
    const bagNos = (r.matchedInventory || [])
      .map((mi: any) => mi.inventoryId?.bagNo?.bagNo)
      .filter(Boolean)
      .join(', ') || '—';

    // Issue information
    const reqIssues = issuesMap.get(r._id) || [];
    const issuedByNames = reqIssues
      .map(i =>
        i.issuedBy
          ? i.issuedBy.name
            ? [i.issuedBy.name.first, i.issuedBy.name.last].filter(Boolean).join(' ')
            : i.issuedBy.username
          : '—',
      )
      .join(', ') || '—';
    const issuedAtTimes = reqIssues.map(i => formatDateTime(i.issuedAt)).join(', ') || '—';
    const collectedByNames = reqIssues.map(i => i.collectedByName).filter(Boolean).join(', ') || '—';
    const temps = reqIssues
      .map(i => (i.transportTempCelsius !== undefined ? `${i.transportTempCelsius}°C` : ''))
      .filter(Boolean)
      .join(', ') || '—';

    const requestedComponents = r.requestedComponents || [];
    if (requestedComponents.length === 0) {
      detailsRows.push([
        detailsSrNo++,
        r.requestId || '—',
        r.hospitalId?.name || '—',
        r.hospitalId?.contactPerson || '—',
        r.hospitalId?.phone || '—',
        r.hospitalId?.email || '—',
        r.hospitalId?.address || '—',
        r.patient?.name || '—',
        r.patient?.age || '—',
        r.patient?.sex || '—',
        r.patient?.mrn || '—',
        r.patient?.diagnosis || '—',
        r.patient?.indication || '—',
        r.patient?.hb !== undefined ? r.patient.hb : '—',
        '—',
        '—',
        '—',
        '—',
        r.doctorName || '—',
        clinicalNotes,
        remarks,
        approvedBy,
        approvedAt,
        r.status?.toUpperCase() || '—',
        bagNos,
        issuedByNames,
        issuedAtTimes,
        collectedByNames,
        temps,
      ]);
    } else {
      requestedComponents.forEach((rc: any) => {
        detailsRows.push([
          detailsSrNo++,
          r.requestId || '—',
          r.hospitalId?.name || '—',
          r.hospitalId?.contactPerson || '—',
          r.hospitalId?.phone || '—',
          r.hospitalId?.email || '—',
          r.hospitalId?.address || '—',
          r.patient?.name || '—',
          r.patient?.age || '—',
          r.patient?.sex || '—',
          r.patient?.mrn || '—',
          r.patient?.diagnosis || '—',
          r.patient?.indication || '—',
          r.patient?.hb !== undefined ? r.patient.hb : '—',
          `${rc.bloodGroup}${rc.rh}`,
          rc.componentType || '—',
          rc.units || 0,
          rc.urgency || '—',
          r.doctorName || '—',
          clinicalNotes,
          remarks,
          approvedBy,
          approvedAt,
          r.status?.toUpperCase() || '—',
          bagNos,
          issuedByNames,
          issuedAtTimes,
          collectedByNames,
          temps,
        ]);
      });
    }
  });

  formatTable(detailsSheet, detailsTableStart, detailsColumns, detailsRows, detailsAlignments);
  applyPrintFormatting(detailsSheet, detailsTableStart);
  applyFooter(detailsSheet);

  // 8. Hospital Wise Analysis Sheet (Requirement 6)
  const hospSheet = workbook.addWorksheet('Hospital Analysis');
  const hospColumns = [
    'Hospital Name',
    'Total Requests',
    'Approved',
    'Rejected',
    'Issued',
    'Completed',
  ];
  const hospAlignments: ('left' | 'center' | 'right')[] = [
    'left', 'center', 'center', 'center', 'center', 'center'
  ];

  createProfessionalHeader(hospSheet, {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: 'Hospital-wise Request Statistics & Breakdown',
    generatedBy: loggedInUser,
    reportPeriod,
    numCols: hospColumns.length,
  });

  // Calculate hospital metrics
  const hospMap = new Map<string, { total: number; approved: number; rejected: number; issued: number; completed: number }>();
  enrichedRequests.forEach(r => {
    const name = r.hospitalId?.name || 'Unknown Hospital';
    if (!hospMap.has(name)) {
      hospMap.set(name, { total: 0, approved: 0, rejected: 0, issued: 0, completed: 0 });
    }
    const metrics = hospMap.get(name)!;
    metrics.total++;
    if (r.status === 'approved') metrics.approved++;
    if (r.status === 'rejected') metrics.rejected++;
    if (r.status === 'issued') metrics.issued++;
    if (r.status === 'completed') metrics.completed++;
  });

  const hospRows: any[][] = [];
  let totalHospReqs = 0;
  let totalHospAppr = 0;
  let totalHospRej = 0;
  let totalHospIss = 0;
  let totalHospComp = 0;

  Array.from(hospMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([name, counts]) => {
      hospRows.push([
        name,
        counts.total,
        counts.approved,
        counts.rejected,
        counts.issued,
        counts.completed,
      ]);
      totalHospReqs += counts.total;
      totalHospAppr += counts.approved;
      totalHospRej += counts.rejected;
      totalHospIss += counts.issued;
      totalHospComp += counts.completed;
    });

  // Add Summary Total Row at the bottom
  hospRows.push([
    'TOTAL SUMMARY',
    totalHospReqs,
    totalHospAppr,
    totalHospRej,
    totalHospIss,
    totalHospComp,
  ]);

  const hospTableStart = 7;
  formatTable(hospSheet, hospTableStart, hospColumns, hospRows, hospAlignments);

  // Custom style the TOTAL row
  const hospTotalRowNum = hospTableStart + hospRows.length;
  const hospTotalRow = hospSheet.getRow(hospTotalRowNum);
  hospTotalRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  for (let c = 1; c <= hospColumns.length; c++) {
    const cell = hospTotalRow.getCell(c);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
  }

  applyPrintFormatting(hospSheet, hospTableStart);
  applyFooter(hospSheet);

  // 9. Blood Group Analysis Sheet (Requirement 7)
  const bgSheet = workbook.addWorksheet('Blood Group Analysis');
  const bgColumns = ['Blood Group', 'Number of Requests'];
  const bgAlignments: ('left' | 'center' | 'right')[] = ['center', 'center'];

  createProfessionalHeader(bgSheet, {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: 'Blood Group-wise Request Demands Analysis',
    generatedBy: loggedInUser,
    reportPeriod,
    numCols: bgColumns.length,
  });

  // 8 Standard Blood Groups
  const bgList = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const bgMap = new Map<string, number>(bgList.map(bg => [bg, 0]));
  let unknownBgCount = 0;

  enrichedRequests.forEach(r => {
    const rcList = r.requestedComponents || [];
    // Count unique blood groups per requisition
    const reqBloodGroups = new Set<string>();
    rcList.forEach((rc: any) => {
      const bg = `${rc.bloodGroup}${rc.rh}`;
      reqBloodGroups.add(bg);
    });

    reqBloodGroups.forEach(bg => {
      if (bgMap.has(bg)) {
        bgMap.set(bg, bgMap.get(bg)! + 1);
      } else {
        unknownBgCount++;
      }
    });
  });

  const bgRows: any[][] = [];
  let totalBgReqs = 0;

  bgList.forEach(bg => {
    const count = bgMap.get(bg) || 0;
    bgRows.push([bg, count]);
    totalBgReqs += count;
  });

  if (unknownBgCount > 0) {
    bgRows.push(['Other / Unknown', unknownBgCount]);
    totalBgReqs += unknownBgCount;
  }

  bgRows.push(['TOTAL', totalBgReqs]);

  const bgTableStart = 7;
  formatTable(bgSheet, bgTableStart, bgColumns, bgRows, bgAlignments);

  // Style TOTAL row
  const bgTotalRowNum = bgTableStart + bgRows.length;
  const bgTotalRow = bgSheet.getRow(bgTotalRowNum);
  bgTotalRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  for (let c = 1; c <= bgColumns.length; c++) {
    const cell = bgTotalRow.getCell(c);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
  }

  applyPrintFormatting(bgSheet, bgTableStart);
  applyFooter(bgSheet);

  return workbook;
}

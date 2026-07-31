import { formatDate } from "@/utils/excelExportHelper";

export const number = (v) => (typeof v === "number" ? v : 0);

export const MATRIX_COMPONENTS = [
  { key: "PRBC", label: "Packed Red Blood Cells (PRBC)", theme: "text-rose-700 bg-rose-50 border-rose-200" },
  { key: "FFP", label: "Fresh Frozen Plasma (FFP)", theme: "text-sky-700 bg-sky-50 border-sky-200" },
  { key: "RDP", label: "Random Donor Platelets (RDP)", theme: "text-amber-700 bg-amber-50 border-amber-200" },
  { key: "CRYO", label: "Cryoprecipitate (CRYO)", theme: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { key: "SDP", label: "Single Donor Platelet (SDP)", theme: "text-purple-700 bg-purple-50 border-purple-200" },
];

export const MATRIX_BLOOD_GROUPS = [
  { group: "A", rh: "Positive", label: "A+" },
  { group: "A", rh: "Negative", label: "A-" },
  { group: "B", rh: "Positive", label: "B+" },
  { group: "B", rh: "Negative", label: "B-" },
  { group: "AB", rh: "Positive", label: "AB+" },
  { group: "AB", rh: "Negative", label: "AB-" },
  { group: "O", rh: "Positive", label: "O+" },
  { group: "O", rh: "Negative", label: "O-" },
];

function table({ name, subtitle, headers, rows, alignments }) {
  return {
    name,
    subtitle,
    headers,
    alignments: alignments || headers.map((_, i) => (i === 0 ? "left" : "right")),
    rows,
  };
}

function buildDashboardSheets(data) {
  const totals = data?.stockOverview?.totals || {};
  const matrix = data?.stockOverview?.stockMatrix || [];
  const getMatrixStock = (compKey, group, rh) => {
    const match = matrix.find((x) => x.componentType === compKey && x.bloodGroup === group && x.rh === rh);
    return match ? number(match.count) : 0;
  };
  const matrixHeaders = ["Component Type", ...MATRIX_BLOOD_GROUPS.map((bg) => bg.label), "Total"];
  const matrixRows = MATRIX_COMPONENTS.map((comp) => {
    const counts = MATRIX_BLOOD_GROUPS.map((bg) => getMatrixStock(comp.key, bg.group, bg.rh));
    return [comp.label, ...counts, counts.reduce((a, b) => a + b, 0)];
  });

  const chemical = data?.chemicalStock || {};
  const bagStock = data?.bagStock || {};
  const bulkTransfer = data?.bulkTransfer || {};
  const diseasePatients = data?.diseasePatients || {};
  const storage = data?.storageBreakdown || [];
  const discards = data?.discards || {};
  const deferrals = data?.deferrals || [];
  const legacy = data?.legacyOverview || {};
  const hospitalRequisitions = data?.hospitalRequisitions || [];

  const sheets = [
    table({
      name: "Overview",
      subtitle: "Overall Totals",
      headers: ["Metric", "Value"],
      rows: [
        ["Donors", number(totals.donors)],
        ["Donations", number(totals.donations)],
        ["In-Stock Units", number(totals.inStock)],
        ["Reserved Units", number(totals.reserved)],
        ["Issued Units", number(totals.issued)],
        ["Discarded Units", number(totals.discarded)],
        ["Transfusions", number(totals.transfusions)],
      ],
      alignments: ["left", "right"],
    }),
    table({
      name: "Blood Stock Matrix",
      subtitle: "Real-Time Blood Stock Inventory Matrix (ABO / Rh)",
      headers: matrixHeaders,
      rows: matrixRows,
      alignments: matrixHeaders.map((_, i) => (i === 0 ? "left" : "center")),
    }),
    table({
      name: "Donor & Donation",
      subtitle: "Donor & Donation Overview",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Total Donors": legacy.donorDonation?.donors,
        "New Donors (30d)": legacy.donorDonation?.newDonors,
        "Total Donations": legacy.donorDonation?.donations,
        "In-House Donations": legacy.donorDonation?.donationsInHouse,
        "Camp Donations": legacy.donorDonation?.donationsCamp,
        "Male Donors": legacy.donorDonation?.maleDonors,
        "Female Donors": legacy.donorDonation?.femaleDonors,
        "Other Donors": legacy.donorDonation?.otherDonors,
        "First-Time Donors": legacy.donorDonation?.firstTimeDonors,
        "Repeat Donors": legacy.donorDonation?.repeatDonors,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Blood Bags & Components",
      subtitle: "Blood Bag & Component Overview",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Bags Collected": legacy.bloodBags?.bagsCollected,
        "Bags Tested": legacy.bloodBags?.bagsTested,
        "Bags Passed": legacy.bloodBags?.bagsPassed,
        "Bags Failed": legacy.bloodBags?.bagsFailed,
        "Bags Pending": legacy.bloodBags?.bagsPending,
        "Bags Quarantined": legacy.bloodBags?.bagsQuarantined,
        "Components Produced": legacy.components?.componentsProduced,
        "PRBC Produced": legacy.components?.rbcProduced,
        "RDP Produced": legacy.components?.pltProduced,
        "FFP Produced": legacy.components?.ffpProduced,
        "Cryo Produced": legacy.components?.cryoProduced,
        "SDP Produced": legacy.components?.sdpProduced,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Blood Group Availability",
      subtitle: "In-Stock Units by Blood Group",
      headers: ["Blood Group", "Units"],
      rows: [
        ["O+", number(legacy.bloodGroups?.Opos)],
        ["O-", number(legacy.bloodGroups?.Oneg)],
        ["A+", number(legacy.bloodGroups?.Apos)],
        ["A-", number(legacy.bloodGroups?.Aneg)],
        ["B+", number(legacy.bloodGroups?.Bpos)],
        ["B-", number(legacy.bloodGroups?.Bneg)],
        ["AB+", number(legacy.bloodGroups?.ABpos)],
        ["AB-", number(legacy.bloodGroups?.ABneg)],
      ],
    }),
    table({
      name: "Hospital Requests",
      subtitle: "Hospital Request Overview",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Total Requests": legacy.hospitalRequests?.totalRequests,
        "Pending Requests": legacy.hospitalRequests?.pendingRequests,
        "Matched Requests": legacy.hospitalRequests?.matchedRequests,
        "Approved Requests": legacy.hospitalRequests?.approvedRequests,
        "Issued Requests": legacy.hospitalRequests?.issuedRequests,
        "Completed Requests": legacy.hospitalRequests?.completedRequests,
        "Rejected Requests": legacy.hospitalRequests?.rejectedRequests,
        "Total Units Requested": legacy.hospitalRequests?.totalUnitsRequested,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Requisitions by Hospital",
      subtitle: "Per-Hospital Requisition Breakdown",
      headers: ["Hospital", "Total Requests", "Total Units"],
      rows: hospitalRequisitions.map((h) => [h.hospitalName, number(h.totalRequests), number(h.totalUnits)]),
    }),
    table({
      name: "Testing & Serology",
      subtitle: "Testing & Serology Overview",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Total Tests Performed": legacy.testingSerology?.testsTotal,
        "HIV Reactive": legacy.testingSerology?.hivPos,
        "HBsAg Reactive": legacy.testingSerology?.hbvPos,
        "HCV Reactive": legacy.testingSerology?.hcvPos,
        "VDRL Reactive": legacy.testingSerology?.vdrlPos,
        "MP Reactive": legacy.testingSerology?.mpPos,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Camp KPIs & Alerts",
      subtitle: "Camp Overview & Exception Alerts",
      headers: ["Metric", "Value"],
      rows: Object.entries({
        "Camps Conducted": legacy.camps?.campsConducted,
        "Camp Donors": legacy.camps?.campDonors,
        "Camp Collections": legacy.camps?.campCollections,
        "Camp Serology Failures": legacy.camps?.campFailures,
        "Units Expiring Today": legacy.alerts?.expiringToday,
        "Tests Pending": legacy.alerts?.testsPending,
        "Bags Delayed Testing (>24h)": legacy.alerts?.delayedTesting,
        "Components Missing Expiry": legacy.alerts?.missingExpiry,
        "Inactive Donors (>6 months)": legacy.alerts?.inactiveDonors,
      }).map(([k, v]) => [k, number(v)]),
      alignments: ["left", "right"],
    }),
    table({
      name: "Ongoing Camps",
      subtitle: "Active/Ongoing Donation Camps",
      headers: ["Camp Name", "Address", "Donors", "Units", "Staff", "From", "To"],
      rows: (legacy.ongoingCamps || []).map((c) => [
        c.name, c.address, number(c.donorsCount), number(c.unitsCount), (c.staff || []).length,
        formatDate(c.dateFrom), formatDate(c.dateTo),
      ]),
      alignments: ["left", "left", "right", "right", "right", "center", "center"],
    }),
    table({
      name: "BloodBag Status",
      subtitle: "BloodBag Status Breakdown",
      headers: ["Status", "Count"],
      rows: (legacy.bloodbagStatusPie || []).map((s) => [s.status, number(s.value)]),
    }),
    table({
      name: "Chemical Low Stock",
      subtitle: "Chemicals at/below reorder level",
      headers: ["Chemical", "Available", "Reorder Level"],
      rows: (chemical.lowStockItems || []).map((c) => [c.name, number(c.available), number(c.reorderLevel)]),
    }),
    table({
      name: "Bag Stock",
      subtitle: "Bag Stock by Type",
      headers: ["Bag Type", "Closing Stock", "Received", "Issued", "Damaged", "Discarded"],
      rows: (bagStock.byType || []).map((t) => [t.bagType, number(t.totalClosingStock), number(t.totalReceived), number(t.totalIssued), number(t.totalDamaged), number(t.totalDiscarded)]),
    }),
    table({
      name: "Low Box Stock",
      subtitle: "Batches with 3 or fewer unopened boxes",
      headers: ["Batch", "Bag Type", "Boxes Left", "Expiry"],
      rows: (bagStock.lowBoxBatches || []).map((b) => [b.batchNumber, b.bagType, number(b.unopenedBoxes), formatDate(b.expiryDate)]),
    }),
    table({
      name: "Bulk Transfer",
      subtitle: "Loan Given / Taken",
      headers: ["Direction", "Total"],
      rows: [
        ["Given", number(bulkTransfer.given?.total)],
        ["Taken", number(bulkTransfer.taken?.total)],
      ],
    }),
    table({
      name: "Clinical Indication Disease",
      subtitle: "Component Issue by Clinical Indication / Disease",
      headers: ["Disease", "Blood Group", "Units"],
      rows: [
        ...(diseasePatients.thalassemia?.byBloodGroup || []).map((b) => ["Thalassemia", b.bloodGroup, number(b.count)]),
        ...(diseasePatients.sickleCellAnaemia?.byBloodGroup || []).map((b) => ["Sickle Cell Anaemia", b.bloodGroup, number(b.count)]),
        ...(diseasePatients.other?.byBloodGroup || []).map((b) => ["Other", b.bloodGroup, number(b.count)]),
      ],
    }),
    table({
      name: "Storage Breakdown",
      subtitle: "Units by storage location",
      headers: ["Storage Location", "Units"],
      rows: storage.map((s) => [s.location, number(s.count)]),
    }),
    table({
      name: "Discards",
      subtitle: "Bag-level discards by reason",
      headers: ["Reason", "Quantity", "Entries"],
      rows: (discards.bagLevel || []).map((d) => [d.reason, number(d.quantity), number(d.count)]),
    }),
    table({
      name: "Deferrals",
      subtitle: "Donor deferrals by reason",
      headers: ["Reason", "Count"],
      rows: deferrals.map((d) => [d.reason, number(d.count)]),
    }),
  ];

  return sheets.filter((s) => s.rows.length > 0);
}

/** Combines every dashboard table onto a single worksheet, stacked one below
 * another in the same order they appear on the page, so the exported file
 * mirrors what's actually shown on screen. */
export function buildDashboardSheet(data, meta) {
  return {
    name: "Operational Dashboard",
    title: "SANJIVANI BLOOD BANK, KOPARGAON",
    subtitle: "Operational Dashboard — Full Snapshot",
    tables: buildDashboardSheets(data),
    ...meta,
  };
}

import { formatDate } from "@/utils/excelExportHelper";

function table({ name, subtitle, headers, rows, alignments }) {
  return {
    name,
    subtitle,
    headers,
    alignments: alignments || headers.map(() => "left"),
    rows,
  };
}

function formatBloodGroup(bloodGroup, rhFactor) {
  if (!bloodGroup) return "";
  const baseGroup = bloodGroup.replace(/[\s+−-]+$/, "");
  const rh = String(rhFactor || "").toUpperCase();
  const sign = rh === "POSITIVE" ? " +" : rh === "NEGATIVE" ? " −" : "";
  return `${baseGroup}${sign}`;
}

function buildRecycleBinSheets({
  donorItems = [],
  donationItems = [],
  stockTransferItems = [],
  hospitalItems = [],
  campItems = [],
  affectedItems = [],
}) {
  const sheets = [
    table({
      name: "Deleted Donors",
      subtitle: "Donor Recycle Bin",
      headers: ["Donor ID", "Full Name", "Source", "DOB", "Sex", "Phone", "Blood Group", "Last Donation", "Status", "Deleted On"],
      rows: donorItems.map((d) => [
        d.donorId || "N/A",
        [d.name?.firstName, d.name?.middleName, d.name?.lastName].filter(Boolean).join(" "),
        (d.source || "inhouse") === "camp" ? "Camp" : "Inhouse",
        formatDate(d.dob),
        d.sex || "",
        d.phone || "",
        formatBloodGroup(d.bloodGroup, d.rh),
        formatDate(d.lastDonationDate),
        d.eligibilityStatus || "N/A",
        formatDate(d.deletedAt),
      ]),
    }),
    table({
      name: "Deleted Donations",
      subtitle: "Donation Recycle Bin",
      headers: ["Bag No", "Donor", "Source", "Type", "Blood", "Units", "Fitness", "Collected", "Deleted On"],
      rows: donationItems.map((d) => [
        d.bagNo || d.donationId,
        d.donorName || "—",
        d.campId ? "Camp" : "Inhouse",
        d.donationType || "",
        d.bloodGroup ? formatBloodGroup(d.bloodGroup, d.rhFactor) : "—",
        d.unitCount ?? 0,
        d.isFit === true ? "Fit" : d.isFit === false ? "Unfit" : "—",
        formatDate(d.collectedAt),
        formatDate(d.deletedAt),
      ]),
    }),
    table({
      name: "Deleted Stock Transfers",
      subtitle: "Bulk / Storage Transfer Recycle Bin",
      headers: ["Source", "Transfer ID", "Bags", "Deleted On"],
      rows: stockTransferItems.map((r) => [
        r.__module === "bulk-transfer" ? "Bulk Transfer" : "Storage",
        r.transferId || "—",
        `${r.items?.length || 0} bag${(r.items?.length || 0) !== 1 ? "s" : ""}`,
        formatDate(r.updatedAt),
      ]),
    }),
    table({
      name: "Deleted Hospitals",
      subtitle: "Hospital Recycle Bin",
      headers: ["Hospital ID", "Name", "Contact Person", "Phone", "Deleted On"],
      rows: hospitalItems.map((h) => [
        h.hospitalId || "—", h.name || "—", h.contactPerson || "—", h.phone || "—", formatDate(h.deletedAt),
      ]),
    }),
    table({
      name: "Deleted Camps",
      subtitle: "Camp Recycle Bin",
      headers: ["Camp ID", "Name", "Address", "Donations", "Deleted On"],
      rows: campItems.map((c) => [
        c.campId || "—", c.name || "—", c.address || "—", c.donationCount ?? 0, formatDate(c.deletedAt),
      ]),
    }),
    table({
      name: "Affected Records",
      subtitle: "Records Preserved as Affected (not deleted)",
      headers: ["Record Type", "Record", "Affected By (Parent)", "Current Status", "Why Affected", "Since", "Auto-Recoverable"],
      rows: affectedItems.map((r) => [
        r.entityType || "—",
        r.entityLabel || "—",
        r.affectedByModule || "—",
        r.currentStatus || "—",
        r.affectedReason || "—",
        formatDate(r.affectedDate),
        r.canAutoRecover ? "Yes" : "No — manual review",
      ]),
    }),
  ];

  return sheets.filter((s) => s.rows.length > 0);
}

/** Combines every Recycle Bin tab onto a single worksheet, stacked one below
 * another in the same order the tabs appear on the page — mirrors the
 * dashboard export's "one report, one below another" layout. */
export function buildRecycleBinSheet(data, meta) {
  return {
    name: "Recycle Bin",
    title: "SANJIVANI BLOOD BANK, KOPARGAON",
    subtitle: "Recycle Bin — Full Snapshot",
    tables: buildRecycleBinSheets(data),
    ...meta,
  };
}

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FlaskConical,
  PackageOpen,
  Repeat,
  HeartPulse,
  Warehouse,
  Trash2,
  UserX,
  Users,
  Droplets,
  Package,
  ClipboardList,
  Activity,
  AlertTriangle,
  Truck,
  CreditCard,
} from "lucide-react";

const number = (v) => (typeof v === "number" ? v : 0);
const fmtDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
      <span className="text-slate-500 truncate">{label}</span>
      <span className="font-semibold text-slate-900 tabular-nums">{number(value).toLocaleString()}</span>
    </div>
  );
}

export function SummaryStat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 truncate">{label}</span>
      <span className="text-sm font-semibold text-slate-900 tabular-nums">{number(value).toLocaleString()}</span>
    </div>
  );
}

function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
        {children}
      </td>
    </tr>
  );
}

function SimpleTable({ columns, rows, emptyLabel, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.length === 0 ? (
            <EmptyRow colSpan={columns.length}>{emptyLabel}</EmptyRow>
          ) : (
            rows.map(renderRow)
          )}
        </tbody>
      </table>
    </div>
  );
}

function CampTable({ title, camps, emptyLabel, badgeClass }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{title}</h3>
        <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>{camps.length}</Badge>
      </div>
      <SimpleTable
        columns={["Camp", "Address", "From", "To", "Staff"]}
        rows={camps}
        emptyLabel={emptyLabel}
        renderRow={(c) => (
          <tr key={c.id}>
            <td className="px-4 py-2 font-medium text-slate-800">{c.name}</td>
            <td className="px-4 py-2 text-slate-500">{c.address}</td>
            <td className="px-4 py-2 text-slate-500">{fmtDate(c.dateFrom)}</td>
            <td className="px-4 py-2 text-slate-500">{fmtDate(c.dateTo)}</td>
            <td className="px-4 py-2 text-slate-500">{c.staffCount}</td>
          </tr>
        )}
      />
    </div>
  );
}

export function CampOverviewSection({ data }) {
  const upcoming = data?.upcoming || [];
  const ongoing = data?.ongoing || [];
  const completed = data?.completedLast30Days || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-600" />
          Camp Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <CampTable title="Ongoing" camps={ongoing} emptyLabel="No camps ongoing right now." badgeClass="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <CampTable title="Upcoming" camps={upcoming} emptyLabel="No upcoming camps scheduled." badgeClass="bg-sky-50 text-sky-700 border-sky-200" />
        <CampTable title="Completed (last 30 days)" camps={completed} emptyLabel="No camps completed in the last 30 days." badgeClass="bg-slate-100 text-slate-600 border-slate-200" />
      </CardContent>
    </Card>
  );
}

export function ChemicalStockSection({ data }) {
  const lowStock = data?.lowStockItems || [];
  const recentPurchases = data?.recentPurchases || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-600" />
          Chemical Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryStat label="Total Chemicals" value={data?.totalChemicals} />
          <SummaryStat label="Available" value={data?.availableStock} />
          <SummaryStat label="In Use" value={data?.inUseStock} />
          <SummaryStat label="Consumed (This Month)" value={data?.consumedThisMonth} />
          <SummaryStat label="Expired" value={data?.expiredStock} />
          <SummaryStat label="Near Expiry" value={data?.nearExpiryStock} />
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Low Stock (at/below reorder level)</h3>
          <SimpleTable
            columns={["Chemical", "Available", "Reorder Level"]}
            rows={lowStock}
            emptyLabel="No chemicals are below their reorder level."
            renderRow={(c) => (
              <tr key={c.chemicalId} className="bg-red-50/40">
                <td className="px-4 py-2 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-2 text-red-700 font-semibold">{number(c.available)}</td>
                <td className="px-4 py-2 text-slate-500">{number(c.reorderLevel)}</td>
              </tr>
            )}
          />
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Recent Purchases</h3>
          <SimpleTable
            columns={["Chemical", "Lot No", "Qty Purchased", "Expiry"]}
            rows={recentPurchases}
            emptyLabel="No recent purchases."
            renderRow={(p) => (
              <tr key={p._id}>
                <td className="px-4 py-2 font-medium text-slate-800">{p.chemicalId?.name || "-"}</td>
                <td className="px-4 py-2 text-slate-500">{p.lotNumber || "-"}</td>
                <td className="px-4 py-2 text-slate-500">{number(p.qtyPurchased)}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(p.expiryDate)}</td>
              </tr>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function BagStockSection({ data }) {
  const byType = data?.byType || [];
  const lowBoxBatches = data?.lowBoxBatches || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <PackageOpen className="w-4 h-4 text-rose-600" />
          Blood Bag Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SimpleTable
          columns={["Bag Type", "Closing Stock", "Received", "Issued", "Damaged", "Discarded"]}
          rows={byType}
          emptyLabel="No bag stock recorded."
          renderRow={(t) => (
            <tr key={t.bagType}>
              <td className="px-4 py-2 font-medium text-slate-800">{t.bagType}</td>
              <td className="px-4 py-2 text-slate-800 font-semibold">{number(t.totalClosingStock)}</td>
              <td className="px-4 py-2 text-slate-500">{number(t.totalReceived)}</td>
              <td className="px-4 py-2 text-slate-500">{number(t.totalIssued)}</td>
              <td className="px-4 py-2 text-slate-500">{number(t.totalDamaged)}</td>
              <td className="px-4 py-2 text-slate-500">{number(t.totalDiscarded)}</td>
            </tr>
          )}
        />

        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Low Box Stock (&le;3 boxes)</h3>
          <SimpleTable
            columns={["Batch", "Bag Type", "Boxes Left", "Expiry"]}
            rows={lowBoxBatches}
            emptyLabel="No batches are low on unopened boxes."
            renderRow={(b) => (
              <tr key={b.stockId} className="bg-red-50/40">
                <td className="px-4 py-2 font-medium text-slate-800">{b.batchNumber}</td>
                <td className="px-4 py-2 text-slate-500">{b.bagType}</td>
                <td className="px-4 py-2 text-red-700 font-semibold">{number(b.unopenedBoxes)}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(b.expiryDate)}</td>
              </tr>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function BulkTransferList({ title, entries, emptyLabel }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{title}</h3>
      <SimpleTable
        columns={["Transfer ID", "Blood Bank", "Date", "Items"]}
        rows={entries}
        emptyLabel={emptyLabel}
        renderRow={(t) => (
          <tr key={t.id}>
            <td className="px-4 py-2 font-medium text-slate-800">{t.transferId}</td>
            <td className="px-4 py-2 text-slate-500">{t.bloodBankName}</td>
            <td className="px-4 py-2 text-slate-500">{fmtDate(t.transferDate)}</td>
            <td className="px-4 py-2 text-slate-500">{t.items?.length ?? 0}</td>
          </tr>
        )}
      />
    </div>
  );
}

export function DonorCardSection({ data }) {
  const rows = data?.breakdown || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-teal-600" />
          Donor Card Exchanges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryStat label="Total Donors Who Brought Their Card to Take Blood" value={data?.totalCount} />
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Issued By Component & Blood Group</h3>
          <SimpleTable
            columns={["Component", "Blood Group", "Rh", "Units"]}
            rows={rows}
            emptyLabel="No units issued against donor-card requisitions yet."
            renderRow={(r, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 font-medium text-slate-800">{r.componentType}</td>
                <td className="px-4 py-2 text-slate-500">{r.bloodGroup}</td>
                <td className="px-4 py-2 text-slate-500">{r.rh}</td>
                <td className="px-4 py-2 text-slate-500">{number(r.count)}</td>
              </tr>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function BulkTransferSection({ data }) {
  const given = data?.given || { total: 0, recent: [] };
  const taken = data?.taken || { total: 0, recent: [] };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Repeat className="w-4 h-4 text-indigo-600" />
          Bulk Transfer (Loan Given / Taken)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryStat label="Total Loans Given" value={given.total} />
          <SummaryStat label="Total Loans Taken" value={taken.total} />
        </div>
        <BulkTransferList title="Recent Loans Given" entries={given.recent} emptyLabel="No loans given yet." />
        <BulkTransferList title="Recent Loans Taken" entries={taken.recent} emptyLabel="No loans taken yet." />
      </CardContent>
    </Card>
  );
}

function DiseaseBucket({ label, bucket }) {
  const b = bucket || { unitsIssuedCount: 0, byBloodGroup: [], patients: [] };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</h3>
        <Badge variant="outline" className="text-[10px]">{number(b.unitsIssuedCount)} units</Badge>
      </div>
      <SimpleTable
        columns={["Blood Group", "Units"]}
        rows={b.byBloodGroup}
        emptyLabel="0 — no units issued."
        renderRow={(r) => (
          <tr key={r.bloodGroup}>
            <td className="px-4 py-2 font-medium text-slate-800">{r.bloodGroup}</td>
            <td className="px-4 py-2 text-slate-500">{number(r.count)}</td>
          </tr>
        )}
      />
    </div>
  );
}

export function DiseaseSection({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-pink-600" />
          Component Issue by Clinical Indication / Disease
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <DiseaseBucket label="Thalassemia" bucket={data?.thalassemia} />
        <DiseaseBucket label="Sickle Cell Anaemia" bucket={data?.sickleCellAnaemia} />
        <DiseaseBucket label="Other" bucket={data?.other} />
      </CardContent>
    </Card>
  );
}

export function StorageBreakdownSection({ data }) {
  const rows = data || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-sky-600" />
          Storage Location Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleTable
          columns={["Storage Location", "Units"]}
          rows={rows}
          emptyLabel="No units currently assigned a storage location."
          renderRow={(r) => (
            <tr key={r.location}>
              <td className="px-4 py-2 font-medium text-slate-800">{r.location}</td>
              <td className="px-4 py-2 text-slate-500">{number(r.count)}</td>
            </tr>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function DiscardSection({ data }) {
  const bagLevel = data?.bagLevel || [];
  const unitLevel = data?.unitLevel || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-slate-600" />
          Discard Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Bag Discards (Procurement)</h3>
          <SimpleTable
            columns={["Reason", "Quantity", "Entries"]}
            rows={bagLevel}
            emptyLabel="No bag discards recorded."
            renderRow={(r) => (
              <tr key={r.reason}>
                <td className="px-4 py-2 font-medium text-slate-800">{r.reason}</td>
                <td className="px-4 py-2 text-slate-500">{number(r.quantity)}</td>
                <td className="px-4 py-2 text-slate-500">{number(r.count)}</td>
              </tr>
            )}
          />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Clinical Unit Discards</h3>
          <SimpleTable
            columns={["Reason", "Units"]}
            rows={unitLevel}
            emptyLabel="No clinical unit discards recorded."
            renderRow={(r) => (
              <tr key={r.reason}>
                <td className="px-4 py-2 font-medium text-slate-800">{r.reason}</td>
                <td className="px-4 py-2 text-slate-500">{number(r.count)}</td>
              </tr>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatGrid({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function DonorDonationSection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-600" />
          Donor & Donation Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="Total Donors" value={d.donors} />
          <Stat label="New Donors (30d)" value={d.newDonors} />
          <Stat label="Total Donations" value={d.donations} />
          <Stat label="In-House Donations" value={d.donationsInHouse} />
          <Stat label="Camp Donations" value={d.donationsCamp} />
          <Stat label="Male Donors" value={d.maleDonors} />
          <Stat label="Female Donors" value={d.femaleDonors} />
          <Stat label="Other Donors" value={d.otherDonors} />
          <Stat label="First-Time Donors" value={d.firstTimeDonors} />
          <Stat label="Repeat Donors" value={d.repeatDonors} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function BloodBagOverviewSection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Droplets className="w-4 h-4 text-red-600" />
          Blood Bag Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="Total Bags Collected" value={d.bagsCollected} />
          <Stat label="Bags Tested" value={d.bagsTested} />
          <Stat label="Bags Passed" value={d.bagsPassed} />
          <Stat label="Bags Failed" value={d.bagsFailed} />
          <Stat label="Pending Testing" value={d.bagsPending} />
          <Stat label="Quarantined" value={d.bagsQuarantined} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function ComponentOverviewSection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="w-4 h-4 text-violet-600" />
          Component Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="Total Components Produced" value={d.componentsProduced} />
          <Stat label="PRBC Units Produced" value={d.prbcProduced} />
          <Stat label="RDP Units Produced" value={d.rdpProduced} />
          <Stat label="FFP Units Produced" value={d.ffpProduced} />
          <Stat label="Cryo Units Produced" value={d.cryoProduced} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function InventoryOverviewSection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-amber-600" />
          Inventory Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="Total In-Stock Units" value={d.inStock} />
          <Stat label="Reserved Units" value={d.reserved} />
          <Stat label="Issued Units" value={d.issued} />
          <Stat label="Discarded Units" value={d.discarded} />
          <Stat label="Near-Expiry Units" value={d.nearExpiryTotal} />
          <Stat label="Expired Units" value={d.expiredUnits} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function BloodGroupAvailabilitySection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Droplets className="w-4 h-4 text-rose-600" />
          Blood Group & Rh Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="O+ Stock" value={d.Opos} />
          <Stat label="O- Stock" value={d.Oneg} />
          <Stat label="A+ Stock" value={d.Apos} />
          <Stat label="A- Stock" value={d.Aneg} />
          <Stat label="B+ Stock" value={d.Bpos} />
          <Stat label="B- Stock" value={d.Bneg} />
          <Stat label="AB+ Stock" value={d.ABpos} />
          <Stat label="AB- Stock" value={d.ABneg} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function ComponentAvailabilitySection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-600" />
          Component Type Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="PRBC In-Stock" value={d.prbcStock} />
          <Stat label="RDP In-Stock" value={d.rdpStock} />
          <Stat label="FFP In-Stock" value={d.ffpStock} />
          <Stat label="Cryo In-Stock" value={d.cryoStock} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function HospitalRequestOverviewSection({ data, hospitals }) {
  const d = data || {};
  const rows = hospitals || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          Hospital Request Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatGrid>
          <Stat label="Total Requests" value={d.totalRequests} />
          <Stat label="Pending Requests" value={d.pendingRequests} />
          <Stat label="Matched Requests" value={d.matchedRequests} />
          <Stat label="Approved Requests" value={d.approvedRequests} />
          <Stat label="Issued Requests" value={d.issuedRequests} />
          <Stat label="Completed Requests" value={d.completedRequests} />
          <Stat label="Rejected Requests" value={d.rejectedRequests} />
          <Stat label="Total Units Requested" value={d.totalUnitsRequested} />
        </StatGrid>

        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Requisitions by Hospital</h3>
          <SimpleTable
            columns={["Hospital", "Total Requests", "Total Units"]}
            rows={rows}
            emptyLabel="No hospital requisitions recorded."
            renderRow={(h) => (
              <tr key={h.hospitalId}>
                <td className="px-4 py-2 font-medium text-slate-800">{h.hospitalName}</td>
                <td className="px-4 py-2 text-slate-500">{number(h.totalRequests)}</td>
                <td className="px-4 py-2 text-slate-500">{number(h.totalUnits)}</td>
              </tr>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function TestingSerologySection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          Testing & Serology Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="Total Tests Performed" value={d.testsTotal} />
          <Stat label="HIV Reactive" value={d.hivPos} />
          <Stat label="HBsAg Reactive" value={d.hbvPos} />
          <Stat label="HCV Reactive" value={d.hcvPos} />
          <Stat label="VDRL Reactive" value={d.vdrlPos} />
          <Stat label="MP Reactive" value={d.mpPos} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function CampKpiSection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="w-4 h-4 text-indigo-600" />
          Camp Overview (KPIs)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="Camps Conducted" value={d.campsConducted} />
          <Stat label="Camp Donors" value={d.campDonors} />
          <Stat label="Camp Collections" value={d.campCollections} />
          <Stat label="Camp Serology Failures" value={d.campFailures} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function ExceptionAlertsSection({ data }) {
  const d = data || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          Exception & Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid>
          <Stat label="Units Expiring Today" value={d.expiringToday} />
          <Stat label="Tests Pending" value={d.testsPending} />
          <Stat label="Bags Delayed Testing (>24h)" value={d.delayedTesting} />
          <Stat label="Components Missing Expiry" value={d.missingExpiry} />
          <Stat label="Inactive Donors (>6 months)" value={d.inactiveDonors} />
        </StatGrid>
      </CardContent>
    </Card>
  );
}

export function OngoingCampsSection({ camps }) {
  const rows = camps || [];
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
        <Truck className="w-4 h-4 text-orange-600" />
        Active Ongoing Donation Camps
      </h2>
      {rows.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-8 text-center text-slate-400 text-xs font-medium">
            No donation camps are currently active/ongoing today.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((camp) => (
            <Card key={camp.id} className="border-orange-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900">{camp.name}</CardTitle>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" variant="outline">
                    Live
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{camp.address}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{camp.donorsCount}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Donors</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-700">{camp.unitsCount}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Units</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{(camp.staff || []).length}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Staff</div>
                  </div>
                </div>
                {camp.staff?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {camp.staff.map((s, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[9px] py-0 px-1.5 font-medium">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="text-[9px] text-slate-400 text-right font-medium">
                  {fmtDate(camp.dateFrom)} - {fmtDate(camp.dateTo)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function BloodBagStatusTable({ data }) {
  const statusLabelMap = {
    collected: "Collected",
    "component-separated": "Separated",
    testing: "Testing",
    passed: "In Stock",
    failed: "Failed",
    quarantined: "Quarantined",
    issued: "Issued",
    discarded: "Discarded",
  };
  const rows = data || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-600" />
          BloodBag Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleTable
          columns={["Status", "Count"]}
          rows={rows}
          emptyLabel="No blood bag status data."
          renderRow={(r) => (
            <tr key={r.status}>
              <td className="px-4 py-2 font-medium text-slate-800">{statusLabelMap[r.status] || r.status}</td>
              <td className="px-4 py-2 text-slate-500">{number(r.value)}</td>
            </tr>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function DeferralReasonSection({ data }) {
  const rows = data || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <UserX className="w-4 h-4 text-amber-600" />
          Deferred Donors (Reason-wise)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleTable
          columns={["Reason", "Count"]}
          rows={rows}
          emptyLabel="No donor deferrals recorded."
          renderRow={(r) => (
            <tr key={r.reason}>
              <td className="px-4 py-2 font-medium text-slate-800">{r.reason}</td>
              <td className="px-4 py-2 text-slate-500">{number(r.count)}</td>
            </tr>
          )}
        />
      </CardContent>
    </Card>
  );
}

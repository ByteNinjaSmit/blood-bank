import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FlaskConical, PackageOpen, Repeat, HeartPulse, Warehouse, Trash2, UserX, Users, Droplets, Package, ClipboardList, Activity, AlertTriangle, Truck, CreditCard } from "lucide-react";
import { number, fmtDate, Stat, SummaryStat, EmptyRow, SimpleTable, CampTable, BulkTransferList, DiseaseBucket, StatGrid } from "./_shared";

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

export function RequisitionIndicationSection({ data }) {
  const rows = data?.rows || [];
  const components = [...new Set(rows.flatMap((r) => Object.keys(r.byComponent || {})))];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-rose-600" />
          Component Issue by Requisition Reason for Transfusion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleTable
          columns={["Reason", ...components, "Total"]}
          rows={rows}
          emptyLabel="No requisitions issued in this period."
          renderRow={(r, idx) => {
            const total = Object.values(r.byComponent || {}).reduce((a, b) => a + b, 0);
            return (
              <tr key={idx}>
                <td className="px-4 py-2 font-medium text-slate-800">{r.reason}</td>
                {components.map((c) => (
                  <td key={c} className="px-4 py-2 text-slate-500">{r.byComponent?.[c] || '-'}</td>
                ))}
                <td className="px-4 py-2 text-slate-800 font-semibold">{total}</td>
              </tr>
            );
          }}
        />
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FlaskConical, PackageOpen, Repeat, HeartPulse, Warehouse, Trash2, UserX, Users, Droplets, Package, ClipboardList, Activity, AlertTriangle, Truck, CreditCard } from "lucide-react";
import { number, fmtDate, Stat, SummaryStat, EmptyRow, SimpleTable, CampTable, BulkTransferList, DiseaseBucket, StatGrid } from "./_shared";

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
          <Stat label="PRBC Units Produced" value={d.rbcProduced} />
          <Stat label="RDP Units Produced" value={d.pltProduced} />
          <Stat label="FFP Units Produced" value={d.ffpProduced} />
          <Stat label="Cryo Units Produced" value={d.cryoProduced} />
          <Stat label="SDP Units Produced" value={d.sdpProduced} />
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
          <Stat label="BBG+ Stock" value={d.Bbgpos} />
          <Stat label="BBG- Stock" value={d.Bbgneg} />
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
          <Stat label="PRBC In-Stock" value={d.rbcStock} />
          <Stat label="RDP In-Stock" value={d.pltStock} />
          <Stat label="FFP In-Stock" value={d.ffpStock} />
          <Stat label="Cryo In-Stock" value={d.cryoStock} />
          <Stat label="SDP In-Stock" value={d.sdpStock} />
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

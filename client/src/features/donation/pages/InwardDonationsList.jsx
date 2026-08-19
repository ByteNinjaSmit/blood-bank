import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Droplets, Search, RefreshCw, ArrowRight, ChevronDown, MapPin } from "lucide-react";
import { useIncompleteDonations } from "../queries";
import { useCampList } from "@/features/camp/queries";
import { formatDateTime } from "@/lib/format-date";

// ABO/Rh ordering used to sort rows within a camp's dropdown — O first,
// Positive before Negative within each group.
const ABO_ORDER = { O: 0, A: 1, B: 2, AB: 3, BBG: 4 };
const RH_ORDER = { POSITIVE: 0, NEGATIVE: 1 };

function bloodGroupSortKey(row) {
  const abo = row.provisionalBloodGroup?.aboGroup;
  const rh = row.provisionalBloodGroup?.rhFactor;
  return (ABO_ORDER[abo] ?? 99) * 10 + (RH_ORDER[rh] ?? 9);
}

// "Last 4 digits and year digit" tiebreaker within a blood group — pulled
// out of the DN-YYYYMMDD-XXXXXX donationId (see generateDonationId server-side).
function idSortKey(row) {
  const id = row.donationId || "";
  const year = id.slice(3, 7);
  const last4 = id.slice(-4);
  return `${year}${last4}`;
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const bg = bloodGroupSortKey(a) - bloodGroupSortKey(b);
    if (bg !== 0) return bg;
    return idSortKey(a).localeCompare(idSortKey(b));
  });
}

function DonationRow({ row, navigate }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-semibold text-gray-900">{row.bagNo || "—"}</td>
      <td className="px-4 py-3 text-gray-700">
        {row.provisionalBloodGroup?.aboGroup
          ? `${row.provisionalBloodGroup.aboGroup}${row.provisionalBloodGroup.rhFactor === "POSITIVE" ? "+" : "-"}`
          : "—"}
      </td>
      <td className="px-4 py-3 text-gray-700">{row.collectedAt ? formatDateTime(row.collectedAt) : "—"}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() =>
            navigate(
              `/master-register/donation-inward?resumeId=${row.id}${row.campId ? `&campId=${row.campId}` : ""}`,
            )
          }
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-800 text-white rounded-lg text-xs font-semibold hover:bg-orange-900 transition-colors"
        >
          Continue <ArrowRight className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}

const TABLE_HEAD = (
  <thead>
    <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
      <th className="px-4 py-3">Bag No</th>
      <th className="px-4 py-3">Blood Group</th>
      <th className="px-4 py-3">Collection Date &amp; Time</th>
      <th className="px-4 py-3 text-right">Action</th>
    </tr>
  </thead>
);

// Every incomplete inward (bag-first) donation — split into an Inhouse
// Inward tab and a Camp Inward tab (grouped per camp, expandable). Each row
// shows bag no, blood group, collection date/time, and a Continue action
// that deep-links back into the wizard at the right step. Search matches
// bag no only. Once a donor is linked (the last step before finalize —
// see DonorCreation.jsx handleInwardNext) a donation drops off this list
// server-side (donation.repository.ts listIncomplete), so every row here
// is always still awaiting a donor link.
export default function InwardDonationsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const initialTab = searchParams.get("tab") === "camp" ? "camp" : "inhouse";
  const focusCampId = searchParams.get("campId") || "";
  const [tab, setTab] = useState(initialTab);
  const [expandedCampId, setExpandedCampId] = useState(focusCampId || null);

  // Once consumed, drop tab/campId from the URL so a refresh doesn't keep
  // forcing the same camp open.
  useEffect(() => {
    if (searchParams.get("tab") || searchParams.get("campId")) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: campListData } = useCampList({ limit: 200 });
  const campNameById = useMemo(() => {
    const camps = Array.isArray(campListData) ? campListData : campListData?.items || [];
    const map = new Map();
    camps.forEach((c) => map.set(c._id || c.id, c.name));
    return map;
  }, [campListData]);

  // Camp tab needs every incomplete camp donation at once to group by camp
  // client-side, so it doesn't use server-side pagination the way the
  // Inhouse tab does.
  const { data, isLoading, isFetching, isError, refetch } = useIncompleteDonations(
    tab === "camp"
      ? { q: search || undefined, page: 1, pageSize: 500 }
      : { q: search || undefined, page, pageSize },
  );
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const inhouseItems = useMemo(
    () => (tab === "inhouse" ? (data?.items || []).filter((r) => !r.campId) : []),
    [data, tab],
  );
  const campGroups = useMemo(() => {
    if (tab !== "camp") return [];
    const byCamp = new Map();
    (data?.items || []).filter((r) => r.campId).forEach((r) => {
      if (!byCamp.has(r.campId)) byCamp.set(r.campId, []);
      byCamp.get(r.campId).push(r);
    });
    return [...byCamp.entries()]
      .map(([campId, rows]) => ({
        campId,
        campName: campNameById.get(campId) || "Unknown Camp",
        rows: sortRows(rows),
      }))
      .sort((a, b) => a.campName.localeCompare(b.campName));
  }, [data, tab, campNameById]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-orange-600 via-orange-700 to-orange-900 rounded-xl shadow-[0_4px_10px_-2px_rgba(154,52,18,0.45)] ring-1 ring-white/25">
                <Droplets className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Incomplete Inward Donations</h1>
                <p className="text-gray-500 text-sm">Bag-first donations awaiting donor, medical history, or exam &amp; fitness completion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
                aria-label="Refresh"
                className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => navigate("/master-register/donation-inward")}
                className="flex items-center gap-2 px-4 py-2 bg-orange-800 text-white rounded-lg text-sm font-semibold hover:bg-orange-900 transition-colors"
              >
                New Inward Donation
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200">
          {[
            { key: "inhouse", label: "Inhouse Inward" },
            { key: "camp", label: "Camp Inward" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-orange-800 text-orange-800"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by bag no..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-orange-800/20 focus:border-orange-800 outline-none"
          />
        </div>

        {tab === "inhouse" ? (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                {TABLE_HEAD}
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">Loading…</td></tr>
                  ) : isError ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-red-500 text-sm">Failed to load incomplete donations.</td></tr>
                  ) : inhouseItems.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">No incomplete inhouse inward donations found.</td></tr>
                  ) : (
                    inhouseItems.map((row) => <DonationRow key={row.id} row={row} navigate={navigate} />)
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Page {page} of {totalPages} • {total} total</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-10 text-center text-red-500 text-sm">Failed to load incomplete donations.</div>
        ) : campGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-10 text-center text-gray-400 text-sm">No incomplete camp inward donations found.</div>
        ) : (
          <div className="space-y-3">
            {campGroups.map((group) => {
              const isOpen = expandedCampId === group.campId;
              return (
                <div key={group.campId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedCampId(isOpen ? null : group.campId)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-orange-700" />
                      <span className="font-semibold text-gray-900 text-sm">{group.campName}</span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-800">
                        {group.rows.length} Remaining
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-200 overflow-x-auto">
                      <table className="w-full text-sm">
                        {TABLE_HEAD}
                        <tbody className="divide-y divide-gray-100">
                          {group.rows.map((row) => <DonationRow key={row.id} row={row} navigate={navigate} />)}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

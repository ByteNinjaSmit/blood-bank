import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Search, RefreshCw, ArrowRight } from "lucide-react";
import { useIncompleteDonations } from "../queries";
import { formatDate } from "@/lib/format-date";

const STATUS_LABEL = {
  BAG_ONLY: "Awaiting Donor",
  DONOR_PENDING: "Awaiting Medical History",
  MEDICAL_PENDING: "Awaiting Exam & Fitness",
};
const STATUS_COLOR = {
  BAG_ONLY: "bg-amber-100 text-amber-700 border-amber-200",
  DONOR_PENDING: "bg-blue-100 text-blue-700 border-blue-200",
  MEDICAL_PENDING: "bg-purple-100 text-purple-700 border-purple-200",
};

function ageSince(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Every incomplete inward (bag-first) donation — bag no, batch, collection
// date/time, completionStatus as a status pill, age since creation, and a
// Continue action that deep-links back into the wizard at the right step.
export default function InwardDonationsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading, isFetching, isError, refetch } = useIncompleteDonations({ q: search || undefined, page, pageSize });
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by bag no, donation ID, or batch no..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-orange-800/20 focus:border-orange-800 outline-none"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Donation ID</th>
                <th className="px-4 py-3">Bag No</th>
                <th className="px-4 py-3">Batch No</th>
                <th className="px-4 py-3">Collected</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-red-500 text-sm">Failed to load incomplete donations.</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No incomplete inward donations found.</td></tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{row.donationId}</td>
                    <td className="px-4 py-3 text-gray-700">{row.bagNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{row.lotNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{row.collectedAt ? formatDate(row.collectedAt) : "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{row.donorName || <span className="text-gray-400">Not linked yet</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${STATUS_COLOR[row.completionStatus] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {STATUS_LABEL[row.completionStatus] || row.completionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{ageSince(row.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/master-register/donation-inward?resumeId=${row.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-800 text-white rounded-lg text-xs font-semibold hover:bg-orange-900 transition-colors"
                      >
                        Continue <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
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
      </div>
    </div>
  );
}

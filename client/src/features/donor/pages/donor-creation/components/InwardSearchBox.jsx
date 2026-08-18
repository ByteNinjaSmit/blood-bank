import { useEffect, useState } from "react";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { donationApi } from "@/features/donation/api";
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav";

const STATUS_LABEL = {
  BAG_ONLY: "Awaiting Donor",
  DONOR_PENDING: "Awaiting Medical History",
  MEDICAL_PENDING: "Awaiting Exam & Fitness",
};
const STATUS_COLOR = {
  BAG_ONLY: "bg-amber-100 text-amber-700",
  DONOR_PENDING: "bg-blue-100 text-blue-700",
  MEDICAL_PENDING: "bg-purple-100 text-purple-700",
};

// Same debounced search-and-select shape as the repeat-donor search in
// DonorProfileStep, but querying GET /incomplete by bag no / donation id /
// batch no instead of donor identity. Used at the top of the inward wizard
// so an operator can resume an in-progress bag-first donation instead of
// (accidentally) starting a new one.
export default function InwardSearchBox({ onSelect, isResuming }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await donationApi.listIncomplete({ q: query, pageSize: 10 });
        setResults(res?.items || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { onKeyDown, onChange } = createFormEnterNavHandlers({});

  return (
    <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm space-y-3" onKeyDown={onKeyDown} onChange={onChange}>
      <label className="block text-sm font-semibold text-gray-700">
        Resume an incomplete inward donation
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-800">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search by bag no, donation ID, or batch no..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-orange-800/20 focus:border-orange-800 focus:bg-white outline-none transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex items-center justify-center text-gray-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center">No matching incomplete donations found.</p>
          ) : (
            results.map((r) => (
              <button
                type="button"
                key={r.id}
                disabled={isResuming}
                onClick={() => { onSelect(r); setOpen(false); }}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {r.donationId} {r.bagNo ? `• Bag ${r.bagNo}` : ""}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {r.donorName || "No donor linked yet"} {r.lotNo ? `• Batch ${r.lotNo}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${STATUS_COLOR[r.completionStatus] || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[r.completionStatus] || r.completionStatus}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-700" />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

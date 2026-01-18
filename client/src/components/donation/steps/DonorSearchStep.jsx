import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, X, Check, Loader2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import CreateDonor from "../../donor/Create-Donor";

const DonorSearchStep = ({
  donorInfo,
  onDonorInfoFieldChange,
  canSearchDonor,
  showAdvanced,
  onToggleAdvanced,
  loading,
  error,
  onSearch,
  onOpenCreateDonor,
  showPopup,
  onClosePopup,
  showCreateDonor,
  onCloseCreateDonor,
  onDonorCreated,
  getDonorName,
  donor,
  onDonorSelected,
}) => {
  const { API, authorizationToken } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectingId, setSelectingId] = useState(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setQError(""); return; }
    const t = setTimeout(async () => {
      try {
        setQLoading(true);
        setQError("");
        const res = await axios.get(`${API}/api/donor/search/fast`, {
          params: { q: query, limit: 20 },
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        const list = res?.data?.data;
        setResults(Array.isArray(list) ? list : []);
      } catch (e) {
        setQError(e?.response?.data?.message || "Search failed");
        setResults([]);
      } finally {
        setQLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, API, authorizationToken]);

  const handleSelect = async (d) => {
    // Check if donor is eligible to donate
    if (d.isAvailableToDonate === false) {
      const lastDate = d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : 'N/A';
      const waitingPeriod = d.sex === 'F' ? '120 days (4 months)' : '90 days (3 months)';
      toast.error(
        `${d.fullName} cannot donate yet. Last donation was on ${lastDate}. The waiting period is ${waitingPeriod}. Eligible after ${d.daysUntilEligible} days.`,
        { duration: 5000 }
      );
      return;
    }

    try {
      setSelectingId(d._id);
      setSelectedId(d._id);
      await onDonorSelected?.(d);
    } finally {
      setSelectingId(null);
    }
  };

  const highlight = (text) => {
    if (!query) return text;
    const s = String(text || '');
    const q = query.trim();
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i === -1) return text;
    const pre = s.slice(0, i);
    const mid = s.slice(i, i + q.length);
    const post = s.slice(i + q.length);
    return (
      <>
        {pre}
        <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{mid}</mark>
        {post}
      </>
    );
  };

  return (
    <div
      className="p-6"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (canSearchDonor) onSearch();
        }
      }}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Donor Information</h2>
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT: classic search + create */}
        <div className="md:w-2/3 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Quick Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search donor by Name, Phone, Donor ID, UID, Email, City..."
                className="w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {qError && <p className="text-red-600 text-xs mt-1">{qError}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["firstName", "middleName", "lastName"].map((key) => (
              <div key={key}>
                <label className="block text-sm text-gray-700 mb-1">
                  {key === "firstName" ? "First Name" : key === "middleName" ? "Middle Name" : "Last Name"}
                  {key !== "middleName" && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={donorInfo[key]}
                  onChange={(e) => onDonorInfoFieldChange(key, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Date of Birth
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={donorInfo.dob}
                onChange={(e) => onDonorInfoFieldChange("dob", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={onToggleAdvanced}
              className="text-sm text-orange-800 hover:underline"
            >
              {showAdvanced ? "Hide advanced" : "Show advanced (UID, Phone, Donor ID)"}
            </button>
          </div>
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {Object.entries({
                uid: "UID (12 digits)",
                phone: "Phone (10 digits)",
                donorId: "Donor ID",
              }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={donorInfo[key]}
                    onChange={(e) => onDonorInfoFieldChange(key, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onSearch}
              disabled={loading || !canSearchDonor}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 border ${loading || !canSearchDonor
                ? "border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Search className="w-4 h-4" /> Search
            </button>
            <button
              type="button"
              onClick={onOpenCreateDonor}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Create Donor
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
        {/* RIGHT: live results */}
        <div className="md:w-1/3 border rounded-lg p-3 h-[360px] overflow-y-auto bg-gray-50">
          <div className="sticky top-0 bg-gray-50 pb-2 mb-2 flex items-center justify-between">
            <div className="text-sm text-gray-600">Results</div>
            <div className="text-xs text-gray-500">{results.length} found</div>
          </div>
          {qLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-sm text-gray-500">{query ? 'No results' : 'Start typing to search donors'}</div>
          ) : (
            results.map((d) => (
              <div
                key={d._id}
                role="button"
                tabIndex={0}
                aria-selected={selectedId === d._id}
                onClick={() => handleSelect(d)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSelect(d); }}
                className={`group p-3 mb-2 bg-white border rounded-lg cursor-pointer transition hover:bg-red-50 ${selectedId === d._id ? 'ring-2 ring-red-600 border-red-600' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">
                    {highlight(d.fullName)} {d.age ? (<span className="text-xs text-gray-500">• {d.age}y</span>) : null}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* Eligibility icon */}
                    {d.isAvailableToDonate === false ? (
                      <Lock className="w-4 h-4 text-red-600" title={`Locked: ${d.daysUntilEligible} days until eligible`} />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-600" title="Available to donate" />
                    )}
                    {selectingId === d._id ? (
                      <Loader2 className="w-4 h-4 text-red-700 animate-spin" />
                    ) : selectedId === d._id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-gray-600">DOB: {d.dob ? new Date(d.dob).toLocaleDateString() : '—'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">{d.bloodGroup || '—'}{d.rh ? d.rh : ''}</span>
                  {d.city ? <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{highlight(d.city)}</span> : null}
                  {d.donorId ? <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">ID: {highlight(d.donorId)}</span> : null}
                  {d.phone ? <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">{highlight(d.phone)}</span> : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {donor && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Donor selected: <strong>{getDonorName(donor)}</strong>
            {donor?.donorId ? (
              <span className="text-gray-600"> (ID: {donor.donorId})</span>
            ) : null}
          </p>
        </div>
      )}

      {/* Donor Not Found Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
            <button
              onClick={onClosePopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">Donor Not Found</h2>
            <p className="text-gray-600 mb-6">No donor matched your search. Create one now and continue.</p>
            <button
              onClick={() => {
                onClosePopup();
                onOpenCreateDonor();
              }}
              className="px-5 py-2 bg-orange-800 text-white rounded-lg hover:bg-orange-900 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Donor
            </button>
          </div>
        </div>
      )}

      {showCreateDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CreateDonor
              onBack={onCloseCreateDonor}
              onCreated={onDonorCreated}
              prefill={{
                donorId: donorInfo.donorId,
                firstName: donorInfo.firstName,
                middleName: donorInfo.middleName,
                lastName: donorInfo.lastName,
                dob: donorInfo.dob,
                uid: donorInfo.uid,
                phone: donorInfo.phone,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorSearchStep;

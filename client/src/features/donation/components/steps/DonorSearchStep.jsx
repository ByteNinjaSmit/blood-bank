import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, X, Check, Loader2, Lock, Unlock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import CreateDonor from "@/features/donor/components/Create-Donor";
import DonorForm from "@/features/donor/components/DonorForm";

const DonorSearchStep = ({
  loading,
  error,
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
  const [editingDonor, setEditingDonor] = useState(null);
  const [uLoading, setULoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setQError("");
      return;
    }
    const t = setTimeout(async () => {
      try {
        setQLoading(true);
        setQError("");
        const res = await axios.get(`${API}/api/v2/donor/search`, {
          params: { q: query, limit: 20 },
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        });
        const list = res?.data?.data?.items || res?.data?.data;
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
    if (d.eligibilityStatus === 'deferred' || d.eligibilityStatus === 'temp-deferred') {
      toast.error(`${d.fullName} is deferred and cannot donate.`, { duration: 5000 });
      return;
    }

    if (d.isAvailableToDonate === false) {
      const lastDate = d.lastDonationDate
         ? new Date(d.lastDonationDate).toLocaleDateString()
        : "N/A";
      const waitingPeriod =
        d.sex === "F" ? "120 days (4 months)" : "90 days (3 months)";
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

  const handleUpdateSubmit = async (data) => {
    if (!editingDonor) return;
    try {
      setULoading(true);
      const res = await axios.put(`${API}/api/v2/donor/${editingDonor._id}`, data, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success("Donor updated successfully");
        const updated = res.data.donor || res.data.data;
        
        // Update local results
        setResults(prev => prev.map(item => item._id === updated._id ? {
          ...item,
          fullName: [updated.name.firstName, updated.name.middleName, updated.name.lastName].filter(Boolean).join(" "),
          phone: updated.phone,
          bloodGroup: updated.bloodGroup,
          rh: updated.rh,
          age: updated.dob ? (new Date().getFullYear() - new Date(updated.dob).getFullYear()) : item.age,
          sex: updated.sex,
          city: updated.address?.city,
          dob: updated.dob
        } : item));

        // If the edited donor is the selected one, update selection
        if (donor?._id === updated._id) {
          onDonorSelected?.(updated);
        }

        setEditingDonor(null);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setULoading(false);
    }
  };

  const highlight = (text) => {
    if (!query) return text;
    const s = String(text || "");
    const q = query.trim();
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i === -1) return text;
    const pre = s.slice(0, i);
    const mid = s.slice(i, i + q.length);
    const post = s.slice(i + q.length);
    return (
      <>
        {pre}
        <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">
          {mid}
        </mark>
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
        }
      }}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Donor Information
      </h2>
      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT: Search Bar Section */}
        <div className="md:w-2/3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <label className="block text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Search Donor
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-600">
                <Search className="w-6 h-6 text-gray-400 group-focus-within:text-orange-600" />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Type Name, Phone, ID, or UID..."
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl text-lg font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {qError && (
              <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
                <X className="w-4 h-4" /> {qError}
              </p>
            )}

            <div className="mt-8">
              <button
                type="button"
                onClick={onOpenCreateDonor}
                className="w-full px-6 py-4 bg-orange-50 text-orange-800 border border-orange-100 rounded-xl font-semibold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> New Donor Registration
              </button>
            </div>
          </div>

          {donor && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="w-5 h-5 text-green-700" />
              </div>
              <p className="text-sm font-medium text-green-800">
                Selected: <span className="font-bold">{getDonorName(donor)}</span>
                {donor?.donorId && (
                  <span className="text-green-600 font-normal"> (ID: {donor.donorId})</span>
                )}
              </p>
            </div>
          )}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* RIGHT: Results List Section */}
        <div className="md:w-1/3 border border-gray-100 rounded-2xl p-4 h-[420px] overflow-y-auto bg-gray-50/50">
          <div className="sticky top-0 bg-gray-50/50 backdrop-blur-sm pb-3 mb-3 flex items-center justify-between border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Results
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-200 text-gray-600 rounded-full">
              {results.length} FOUND
            </span>
          </div>

          {qLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-white border border-gray-100 rounded-xl animate-pulse"
                >
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 grayscale opacity-60">
              <Search className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">
                {query ? "No donors matched your search" : "Search to see results"}
              </p>
            </div>
          ) : (
            results.map((d) => (
              <div
                key={d._id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(d)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSelect(d);
                }}
                className={`p-4 mb-3 bg-white border rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  selectedId === d._id
                    ? "ring-2 ring-orange-500 border-orange-500 shadow-lg shadow-orange-500/10"
                    : "border-gray-100 shadow-sm hover:border-orange-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {highlight(d.fullName)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                      {d.age && <span>{d.age} Years</span>}
                      {d.sex && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span>{d.sex === 'M' ? 'Male' : d.sex === 'F' ? 'Female' : 'Other'}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 shrink-0 ml-2">
                    <div className="flex items-center gap-2">
                      {d.isAvailableToDonate === false || d.eligibilityStatus === 'deferred' || d.eligibilityStatus === 'temp-deferred' ? (
                        <Lock className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-green-500" />
                      )}
                      {selectingId === d._id ? (
                        <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                      ) : (
                        selectedId === d._id && (
                          <Check className="w-4 h-4 text-green-600" />
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={uLoading}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setSelectingId(d._id);
                          setULoading(true);
                          const res = await axios.get(`${API}/api/v2/donor/${d._id}`, {
                            headers: { Authorization: authorizationToken },
                            withCredentials: true,
                          });
                          const donorData = res.data.donor || res.data.data;
                          if (donorData) {
                            setEditingDonor(donorData);
                          }
                        } catch (err) {
                          toast.error("Failed to fetch donor details");
                        } finally {
                          setULoading(false);
                          setSelectingId(null);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Quick Edit Donor"
                    >
                      {uLoading && selectingId === d._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 text-red-700">
                    {d.bloodGroup}
                    {d.rh}
                  </span>
                  {d.city && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700">
                      {d.city}
                    </span>
                  )}
                  {d.dob && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-50 text-gray-600">
                      DOB: {new Date(d.dob).toLocaleDateString()}
                    </span>
                  )}
                  {d.phone && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-50 text-gray-600">
                      {d.phone}
                    </span>
                  )}
                  {(d.eligibilityStatus === 'deferred' || d.eligibilityStatus === 'temp-deferred') && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-800">
                      Deferred
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Popups */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm relative transform transition-all scale-100">
            <button
              onClick={onClosePopup}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <Plus className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Donor Not Found
            </h2>
            <p className="text-gray-500 mb-8">
              No donors matched your criteria. Would you like to register a new
              donor and continue?
            </p>
            <button
              onClick={() => {
                onClosePopup();
                onOpenCreateDonor();
              }}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all"
            >
              Proceed to Registration
            </button>
          </div>
        </div>
      )}

      {showCreateDonor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-1 flex-1 overflow-y-auto">
              <CreateDonor
                onBack={onCloseCreateDonor}
                onCreated={onDonorCreated}
                prefill={{
                  firstName: query.trim().split(/\s+/)[0] || "",
                  lastName: query.trim().split(/\s+/).slice(1).join(" ") || "",
                  phone: /^\d{10}$/.test(query.trim()) ? query.trim() : "",
                  uid: /^\d{12}$/.test(query.trim()) ? query.trim() : "",
                  donorId: /^[A-Z0-9-]{4,}$/i.test(query.trim()) ? query.trim() : "",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingDonor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Quick Edit Donor</h3>
                <p className="text-sm text-gray-500">Update donor details and eligibility</p>
              </div>
              <button
                onClick={() => setEditingDonor(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              <DonorForm
                initialData={editingDonor}
                onSubmit={handleUpdateSubmit}
                onCancel={() => setEditingDonor(null)}
                loading={uLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorSearchStep;

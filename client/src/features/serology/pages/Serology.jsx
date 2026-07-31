import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Microscope, TestTube, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format-date";
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav";
import SearchBox from "@/components/shared/SearchBox";

const DEFAULT_TESTS = [
  { key: "HIV", label: "HIV" },
  { key: "HBsAg", label: "HBsAg" },
  { key: "HCV", label: "HCV" },
  { key: "VDRL", label: "VDRL" },
  { key: "MP", label: "MP" },
];

const Serology = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [bags, setBags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [order, setOrder] = useState("desc");
  const [sortBy] = useState("collectionDate");

  const [activeBag, setActiveBag] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tests, setTests] = useState(() => DEFAULT_TESTS.map(t => ({ test: t.key, result: "" })));
  const [editReason, setEditReason] = useState("");
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  // A bag already carries a decision (shadeness retest, or any other
  // correction) once its worklist status is no longer 'pending' — the
  // backend requires a reason for these edits (tti.legacy-view.controller.ts).
  const isEditingDecided = activeBag?.status && activeBag.status !== "pending";

  const TEST_DISPLAY_LABELS = { HIV: "HIV", HBsAg: "HBsAg", HCV: "HCV", VDRL: "VDRL", MP: "Malaria" };

  const fetchBags = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/serology/bags`, {
        params: { page, limit, search: search || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined, sortBy, order },
      });
      const data = res.data?.data || [];
      const pg = res.data?.pagination || {};
      setBags(Array.isArray(data) ? data : []);
      setPagination(prev => ({ ...prev, ...pg }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load serology bags");
      setBags([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBags(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, fromDate, toDate, order, sortBy]);

  // Server stores/returns results as raw uppercase enum values (NEGATIVE,
  // REACTIVE, INDETERMINATE) except the legacy view already remaps
  // INDETERMINATE -> "Shadeness". The dropdown's <option> values are
  // Title-case, so an un-normalized "NEGATIVE"/"REACTIVE" never matches any
  // option and silently falls back to the blank "Select" placeholder.
  const normalizeResult = (raw) => {
    if (!raw) return "";
    const upper = String(raw).toUpperCase();
    if (upper === "NEGATIVE") return "Negative";
    if (upper === "REACTIVE") return "Reactive";
    if (upper === "INDETERMINATE" || upper === "SHADENESS") return "Shadeness";
    return raw;
  };

  const openEnterResults = (bag) => {
    setActiveBag(bag);
    // Pre-fill from existing results if present
    const existing = Array.isArray(bag.testResults) ? bag.testResults : [];
    const mapped = DEFAULT_TESTS.map(t => {
      // Server returns test names case-sensitively as stored (e.g. "HBSAG"),
      // not matching this page's display key ("HBsAg") — compare case-insensitively.
      const found = existing.find(e => e.test?.toUpperCase() === t.key.toUpperCase());
      return { test: t.key, result: normalizeResult(found?.result) };
    });
    setTests(mapped);
    setEditReason("");
    setShowModal(true);
  };

  const handleSaveClick = () => {
    // Check if any test results are still unselected
    const unselected = tests.filter(t => !t.result);
    if (unselected.length > 0) {
      toast.error(`Please select a result for all tests: ${unselected.map(t => t.test).join(", ")}`);
      return;
    }
    setShowModal(false);
    setShowConfirmModal(true);
  };

  const backToEdit = () => {
    setShowConfirmModal(false);
    setShowModal(true);
  };

  const submitResults = async () => {
    if (!activeBag?._id) return;
    if (isEditingDecided && !editReason.trim()) {
      toast.error("Please enter a reason for this correction");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post(`/api/serology/results/${activeBag._id}`, {
        testResults: tests,
        technicianId: user?._id || user?.id,
        updatedBy: user?._id || user?.id,
        ...(isEditingDecided ? { editReason: editReason.trim() } : {}),
      });
      toast.success("Serology results saved");
      setShowConfirmModal(false);
      setActiveBag(null);
      setEditReason("");
      fetchBags(pagination.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save results");
    } finally {
      setIsSubmitting(false);
    }
  };

  const STATUS_LABELS = { passed: "Passed", failed: "Failed", discarded: "Discarded", shadeness: "Shadeness", pending: "Pending" };

  const statusBadge = (status) => {
    const cls =
      status === "passed" ? "bg-green-50 text-green-700 border-green-200" :
      status === "discarded" || status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
      status === "shadeness" ? "bg-orange-50 text-orange-700 border-orange-200" :
      "bg-amber-50 text-amber-700 border-amber-200";
    return <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{STATUS_LABELS[status] || status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <Microscope className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Serology</h1>
              <p className="text-gray-500 text-sm">Manage serology testing and update results</p>
            </div>
          </div>
          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setPagination(p => ({ ...p, limit: newLimit, page: 1 }));
                  fetchBags(1, newLimit);
                }}
                className="border rounded-md px-2 py-1"
              >
                {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <button
                onClick={() => {
                  const page = Math.max(1, (pagination.page || 1) - 1);
                  setPagination(p => ({ ...p, page }));
                  fetchBags(page);
                }}
                disabled={(pagination.page || 1) === 1}
                className={`px-3 py-1 rounded-md ${((pagination.page || 1) === 1) ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
              >
                Previous
              </button>
              <span className="text-slate-700">Page {pagination.page || 1} of {pagination.totalPages || 1}</span>
              <button
                onClick={() => {
                  const page = Math.min(pagination.totalPages || 1, (pagination.page || 1) + 1);
                  setPagination(p => ({ ...p, page }));
                  fetchBags(page);
                }}
                disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
                className={`px-3 py-1 rounded-md ${((pagination.page || 1) >= (pagination.totalPages || 1)) ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:bg-red-50"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b">
            <div className="text-sm text-gray-600">{pagination.total} bag(s) found</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchBags(pagination.page)}
                disabled={isLoading}
                title="Refresh"
                aria-label="Refresh"
                className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <SearchBox
                value={searchInput}
                onChange={setSearchInput}
                onSearch={() => { setSearch(searchInput); setPagination(p => ({...p, page: 1})); }}
                placeholder="Search Bag No"
                disabled={isLoading}
                inputClassName="h-9"
              />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPagination(p => ({...p, page: 1})); }}
                className="h-9 px-3 py-2 border rounded-md text-sm"
                title="Collected From"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPagination(p => ({...p, page: 1})); }}
                className="h-9 px-3 py-2 border rounded-md text-sm"
                title="Collected To"
              />
              <select
                value={order}
                onChange={(e) => { setOrder(e.target.value); setPagination(p => ({...p, page: 1})); }}
                className="h-9 px-3 py-2 border rounded-md text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading bags...
                      </div>
                    </td>
                  </tr>
                ) : bags.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">No bags found.</td>
                  </tr>
                ) : (
                  bags.map((bag, idx) => (
                    <tr key={`${bag.bagNo}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{bag.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.segmentNo || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.bloodGroup} {bag.rh}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag?.siteId?.name || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(bag.collectionDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{statusBadge(bag.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {Array.isArray(bag.testResults) && bag.testResults.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bag.testResults.map((t, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-100">
                                {t.test}: {t.result}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not tested</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button size="sm" onClick={() => openEnterResults(bag)} title="Enter Results">
                            <TestTube className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Serology Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange}>
            <div className="text-sm text-gray-600">Bag: <span className="font-medium text-gray-900">{activeBag?.bagNo}</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tests.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 p-3 border rounded-md">
                  <div className="text-sm font-medium text-gray-800">{t.test}</div>
                  <select
                    className="w-40 px-3 py-2 border rounded-md text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
                    value={t.result}
                    onChange={(e) => setTests(prev => prev.map((x, i) => i === idx ? { ...x, result: e.target.value } : x))}
                  >
                    <option value="">Select</option>
                    <option value="Negative">Negative</option>
                    <option value="Reactive">Reactive</option>
                    <option value="Shadeness">Shadeness</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSaveClick}>Save Results</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review TTI Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                Blood Unit Details
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3 py-3 text-sm">
                <div>
                  <span className="block text-xs text-gray-500">Donation Number</span>
                  <span className="font-medium text-gray-900">{activeBag?.donationId || "—"}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Donor Name</span>
                  <span className="font-medium text-gray-900">{activeBag?.donorName || "—"}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Blood Group</span>
                  <span className="font-medium text-gray-900">{activeBag?.bloodGroup} {activeBag?.rh}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Collection Date</span>
                  <span className="font-medium text-gray-900">{formatDateTime(activeBag?.collectionDate)}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                Entered Results
              </div>
              <div className="divide-y">
                {tests.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-700">{TEST_DISPLAY_LABELS[t.test] || t.test}</span>
                    <span className="font-semibold text-gray-900">{t.result}</span>
                  </div>
                ))}
              </div>
            </div>

            {isEditingDecided && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Reason for Correction <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Retest cleared the earlier shadeness (indeterminate) result"
                  className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
                />
              </div>
            )}

            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-medium mb-1">⚠️ Please verify all test results carefully.</p>
              <p>
                Once saved, TTI results can only be edited until no component from this blood unit has
                been issued. After any component is issued, these results will become permanently
                read-only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={backToEdit} disabled={isSubmitting}>
              Back to Edit
            </Button>
            <Button onClick={submitResults} disabled={isSubmitting || (isEditingDecided && !editReason.trim())}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Serology;

import React, { useEffect, useState } from "react";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Microscope, TestTube, RefreshCw, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format-date";
import { sortByBagNoAsc } from "@/lib/natural-sort";
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav";
import SearchBox from "@/components/shared/SearchBox";
import { useBatchSerology } from "@/features/serology/components/batch/use-batch-serology";
import BatchSerologyPanel from "@/features/serology/components/batch/BatchSerologyPanel";
import BatchSerologyQueuePanel from "@/features/serology/components/batch/BatchSerologyQueuePanel";
import BatchSerologySignatureModal from "@/features/serology/components/batch/BatchSerologySignatureModal";

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
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [order, setOrder] = useState("bagAsc");
  const [sortBy] = useState("collectionDate");

  const [activeBag, setActiveBag] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tests, setTests] = useState(() => DEFAULT_TESTS.map(t => ({ test: t.key, result: "" })));
  const [editReason, setEditReason] = useState("");
  const [testDate, setTestDate] = useState("");
  const [testTime, setTestTime] = useState("");
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  // "Untested" = fresh entry (batch-eligible); "Pending" = held bags where
  // the tech marked one or more tests Pending, awaiting a single-bag
  // retest; "Shadeness" = held bags awaiting retest of an indeterminate
  // result. Splitting the worklist this way keeps batch entry separate
  // from the two single-bag retest+reason flows.
  const [worklistTab, setWorklistTab] = useState("pending");
  const batch = useBatchSerology();
  const batchBags = bags.filter((b) => batch.selectedIds.has(b._id));
  // Once a bag is queued into the batch it moves out of the plain table and
  // into the queue panel instead — mirrors Component Separation's
  // visibleBags (bags.filter(b => !selectedKeys.has(bagKey(b)))).
  const HELD_STATUSES = ["shadeness", "pending-retest"];
  const visibleBags = bags.filter((b) => {
    if (worklistTab === "shadeness") return b.status === "shadeness";
    if (worklistTab === "pending-retest") return b.status === "pending-retest";
    if (HELD_STATUSES.includes(b.status)) return false;
    if (batch.batchMode && batch.selectedIds.has(b._id)) return false;
    return true;
  });

  // A bag already carries a decision (shadeness/pending retest, or any
  // other correction) once its worklist status is no longer 'pending' —
  // the backend requires a reason for these edits (tti.legacy-view.controller.ts).
  const isEditingDecided = activeBag?.status && activeBag.status !== "pending";

  const TEST_DISPLAY_LABELS = { HIV: "HIV", HBsAg: "HBsAg", HCV: "HCV", VDRL: "VDRL", MP: "Malaria" };

  // Worklist is shown in full — no pagination, so always request the
  // max page size the backend allows (tti.legacy-view.validator.ts caps
  // `limit` at 5000).
  const ALL_ROWS_LIMIT = 5000;

  const fetchBags = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/serology/bags`, {
        params: { page: 1, limit: ALL_ROWS_LIMIT, search: search || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined, sortBy, order: order === "bagAsc" ? "asc" : order },
      });
      const data = res.data?.data || [];
      const pg = res.data?.pagination || {};
      const list = Array.isArray(data) ? data : [];
      setBags(order === "bagAsc" ? sortByBagNoAsc(list) : list);
      setTotal(pg.total ?? list.length);
      batch.pruneStaleKeys(list);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load serology bags");
      setBags([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBags();
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
    if (upper === "PENDING") return "Pending";
    return raw;
  };

  // 12-hour-clock friendly defaults for the test date/time fields —
  // native <input type="date"/"time"> store/display per the browser
  // locale (en-IN renders the time field with an AM/PM picker), we just
  // need to seed them with "now" in the HTML value formats (YYYY-MM-DD /
  // HH:mm 24h) and let the browser handle the 12h display + arrow-key
  // increment/Enter-to-advance behavior natively.
  const nowDateTimeParts = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    };
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
    const existingTestedAt = bag.testedAt ? new Date(bag.testedAt) : null;
    if (existingTestedAt && !Number.isNaN(existingTestedAt.getTime())) {
      const pad = (n) => String(n).padStart(2, "0");
      setTestDate(`${existingTestedAt.getFullYear()}-${pad(existingTestedAt.getMonth() + 1)}-${pad(existingTestedAt.getDate())}`);
      setTestTime(`${pad(existingTestedAt.getHours())}:${pad(existingTestedAt.getMinutes())}`);
    } else {
      const { date, time } = nowDateTimeParts();
      setTestDate(date);
      setTestTime(time);
    }
    setShowModal(true);
  };

  const handleSaveClick = () => {
    // Check if any test results are still unselected
    const unselected = tests.filter(t => !t.result);
    if (unselected.length > 0) {
      toast.error(`Please select a result for all tests: ${unselected.map(t => t.test).join(", ")}`);
      return;
    }
    if (!testDate || !testTime) {
      toast.error("Please enter the test date and time");
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
      const performedAt = testDate && testTime ? new Date(`${testDate}T${testTime}:00`).toISOString() : undefined;
      await apiClient.post(`/api/serology/results/${activeBag._id}`, {
        testResults: tests,
        technicianId: user?._id || user?.id,
        updatedBy: user?._id || user?.id,
        ...(performedAt ? { performedAt } : {}),
        ...(isEditingDecided ? { editReason: editReason.trim() } : {}),
      });
      toast.success("Serology results saved");
      setShowConfirmModal(false);
      setActiveBag(null);
      setEditReason("");
      fetchBags();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save results");
    } finally {
      setIsSubmitting(false);
    }
  };

  const STATUS_LABELS = { passed: "Passed", failed: "Failed", discarded: "Discarded", shadeness: "Shadeness", "pending-retest": "Pending", pending: "Untested" };

  const statusBadge = (status) => {
    const cls =
      status === "passed" ? "bg-green-50 text-green-700 border-green-200" :
      status === "discarded" || status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
      status === "shadeness" ? "bg-orange-50 text-orange-700 border-orange-200" :
      status === "pending-retest" ? "bg-blue-50 text-blue-700 border-blue-200" :
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
              <h1 className="text-2xl font-bold text-gray-900">TTD Testing</h1>
              <p className="text-gray-500 text-sm">Manage TTD testing and update results</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {batch.batchMode && (
          <BatchSerologyQueuePanel
            bags={batchBags}
            matrix={batch.matrix}
            onRemove={batch.removeBag}
            onOpenPanel={batch.openPanel}
            confirmChecked={batch.confirmChecked}
            onConfirmCheckedChange={batch.setConfirmChecked}
            onOpenSignModal={batch.openSignModal}
            isSubmitting={batch.isSubmitting}
          />
        )}
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="px-4 pt-4 border-b flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWorklistTab("pending")}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${worklistTab === "pending" ? "border-red-600 text-red-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              Untested ({bags.filter(b => !HELD_STATUSES.includes(b.status)).length})
            </button>
            <button
              type="button"
              onClick={() => setWorklistTab("pending-retest")}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${worklistTab === "pending-retest" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              Pending ({bags.filter(b => b.status === "pending-retest").length})
            </button>
            <button
              type="button"
              onClick={() => setWorklistTab("shadeness")}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${worklistTab === "shadeness" ? "border-orange-600 text-orange-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              Shadeness — Retest Needed ({bags.filter(b => b.status === "shadeness").length})
            </button>
          </div>

          <div className="p-4 flex items-center justify-between border-b flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{total} bag(s) found</span>
              {worklistTab === "pending" && (
                <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <Switch checked={batch.batchMode} onCheckedChange={batch.setBatchMode} id="batch-test" />
                  <label htmlFor="batch-test" className="text-sm text-gray-700 cursor-pointer select-none">
                    Batch Test
                  </label>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchBags()}
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
                onSearch={() => setSearch(searchInput)}
                placeholder="Search Bag No"
                disabled={isLoading}
                inputClassName="h-9"
              />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 px-3 py-2 border rounded-md text-sm"
                title="Collected From"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 px-3 py-2 border rounded-md text-sm"
                title="Collected To"
              />
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="h-9 px-3 py-2 border rounded-md text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
                <option value="bagAsc">Ascending Order</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {worklistTab === "pending" && batch.batchMode ? (
                      <input
                        type="checkbox"
                        checked={visibleBags.length > 0 && visibleBags.every(b => batch.selectedIds.has(b._id))}
                        onChange={(e) => e.target.checked ? batch.selectAll(visibleBags) : batch.clearSelection(visibleBags)}
                      />
                    ) : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading bags...
                      </div>
                    </td>
                  </tr>
                ) : visibleBags.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      {worklistTab === "shadeness" ? "No bags awaiting retest." : worklistTab === "pending-retest" ? "No bags pending retest." : "No bags found."}
                    </td>
                  </tr>
                ) : (
                  visibleBags.map((bag, idx) => (
                    <tr key={`${bag.bagNo}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{bag.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.typeOfBag || "-"}</td>
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
                        {worklistTab === "pending" && batch.batchMode ? (
                          <input
                            type="checkbox"
                            checked={batch.selectedIds.has(bag._id)}
                            onChange={() => batch.toggleBag(bag)}
                          />
                        ) : (
                          <div className="inline-flex items-center gap-2 justify-end">
                            {HELD_STATUSES.includes(bag.status) ? (
                              <Button size="sm" onClick={() => openEnterResults(bag)} title="Retest" className={`gap-1.5 ${bag.status === "pending-retest" ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"}`}>
                                <RotateCcw className="w-4 h-4" /> Retest
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => openEnterResults(bag)} title="Enter Results">
                                <TestTube className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
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
            <DialogTitle>Enter TTD Testing Results</DialogTitle>
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
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1">
                <label htmlFor="tti-test-date" className="text-xs font-medium text-gray-600">Test Date</label>
                <input
                  id="tti-test-date"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="tti-test-time" className="text-xs font-medium text-gray-600">Test Time (12-hour)</label>
                <input
                  id="tti-test-time"
                  type="time"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  step="60"
                  className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
                />
              </div>
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
                <div>
                  <span className="block text-xs text-gray-500">Test Date/Time</span>
                  <span className="font-medium text-gray-900">
                    {testDate && testTime ? formatDateTime(new Date(`${testDate}T${testTime}:00`).toISOString()) : "—"}
                  </span>
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

      <BatchSerologyPanel
        open={batch.showPanel}
        onOpenChange={batch.setShowPanel}
        bags={batchBags}
        matrix={batch.matrix}
        setCell={batch.setCell}
        removeBag={batch.removeBag}
        batchTestDate={batch.batchTestDate}
        setBatchTestDate={batch.setBatchTestDate}
        batchTestTime={batch.batchTestTime}
        setBatchTestTime={batch.setBatchTestTime}
      />

      <BatchSerologySignatureModal
        open={batch.showSignModal}
        onOpenChange={batch.setShowSignModal}
        bags={batchBags}
        matrix={batch.matrix}
        user={user}
        batchTestDate={batch.batchTestDate}
        batchTestTime={batch.batchTestTime}
        signatureText={batch.signatureText}
        setSignatureText={batch.setSignatureText}
        isSubmitting={batch.isSubmitting}
        onConfirm={() =>
          batch.submitBatch(batchBags, user?._id || user?.id, {
            onSuccess: () => fetchBags(),
          })
        }
      />
    </div>
  );
};

export default Serology;

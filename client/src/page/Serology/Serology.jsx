import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Microscope, ArrowLeft, TestTube } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const DEFAULT_TESTS = [
  { key: "HIV", label: "HIV" },
  { key: "HBsAg", label: "HBsAg" },
  { key: "HCV", label: "HCV" },
  { key: "VDRL", label: "VDRL" },
  { key: "MP", label: "MP" },
  { key: "NA", label: "NA" },
];

const Serology = () => {
  const { API, authorizationToken, user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [bags, setBags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("collectionDate");

  const [activeBag, setActiveBag] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tests, setTests] = useState(() => DEFAULT_TESTS.map(t => ({ test: t.key, result: "Negative" })));

  const fetchBags = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/api/sernology/bags`, {
        params: { page, limit, search: search || undefined, sortBy, order },
        headers: { Authorization: authorizationToken },
        withCredentials: true,
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
  }, [search, order, sortBy]);

  const openEnterResults = (bag) => {
    setActiveBag(bag);
    // Pre-fill from existing results if present
    const existing = Array.isArray(bag.testResults) ? bag.testResults : [];
    const mapped = DEFAULT_TESTS.map(t => {
      const found = existing.find(e => e.test === t.key);
      return { test: t.key, result: found?.result || "Negative" };
    });
    setTests(mapped);
    setShowModal(true);
  };

  const submitResults = async () => {
    if (!activeBag?._id) return;
    try {
      setIsSubmitting(true);
      await axios.post(
        `${API}/api/sernology/results/${activeBag._id}`,
        {
          testResults: tests,
          technicianId: user?._id || user?.id,
          updatedBy: user?._id || user?.id,
        },
        {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
        }
      );
      toast.success("Serology results saved");
      setShowModal(false);
      setActiveBag(null);
      fetchBags(pagination.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save results");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const cls =
      status === "passed" ? "bg-green-50 text-green-700 border-green-200" :
      status === "discarded" || status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
      "bg-amber-50 text-amber-700 border-amber-200";
    return <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer gap-3 text-red-800 border border-red-200 hover:bg-red-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
              <Microscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Serology</h1>
              <p className="text-gray-600 mt-1">Manage serology testing and update results</p>
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
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination(p => ({...p, page: 1})); }}
                placeholder="Search Bag No"
                className="h-9 px-3 py-2 border rounded-md text-sm"
              />
              <select
                value={order}
                onChange={(e) => { setOrder(e.target.value); setPagination(p => ({...p, page: 1})); }}
                className="h-9 px-3 py-2 border rounded-md text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
              <Button onClick={() => fetchBags(pagination.page)} variant="outline" size="sm" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
              </Button>
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
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.collectionDate ? new Date(bag.collectionDate).toLocaleDateString() : "-"}</td>
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
          <div className="space-y-4">
            <div className="text-sm text-gray-600">Bag: <span className="font-medium text-gray-900">{activeBag?.bagNo}</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tests.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 p-3 border rounded-md">
                  <div className="text-sm font-medium text-gray-800">{t.test}</div>
                  <select
                    className="w-40 px-3 py-2 border rounded-md text-sm"
                    value={t.result}
                    onChange={(e) => setTests(prev => prev.map((x, i) => i === idx ? { ...x, result: e.target.value } : x))}
                  >
                    <option value="Negative">Negative</option>
                    <option value="Positive">Positive</option>
                    <option value="Indeterminate">Indeterminate</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={submitResults} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Results"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Serology;

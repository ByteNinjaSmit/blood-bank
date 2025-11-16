import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Microscope } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CustomModal from "@/components/CustomModal";

const SerologyResults = () => {
  const { API, authorizationToken } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [bags, setBags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [selectedBag, setSelectedBag] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchBags = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/api/sernology/results`, {
        params: { page, limit, search: search || undefined, sortBy, order },
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setBags(data);
      setPagination(prev => ({ ...prev, ...(res.data?.pagination || {}) }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load results");
      setBags([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBags(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, order, sortBy]);

  const statusBadge = (status) => {
    const cls =
      status === "passed" ? "bg-green-50 text-green-700 border-green-200" :
      status === "discarded" || status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
      "bg-amber-50 text-amber-700 border-amber-200";
    return <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{status}</span>;
  };

  const formatBlood = (group, rh) => {
    if (!group && !rh) return "-";
    const symbol = rh === "Positive" ? "+" : rh === "Negative" ? "-" : (rh || "");
    return `${group || ""} ${symbol}`.trim();
  };

  const handleViewDetails = (bag) => {
    setSelectedBag(bag);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
              <Microscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Serology Results</h1>
              <p className="text-gray-600 mt-1">View finalized or recorded serology results</p>
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
            <div className="text-sm text-gray-600">{pagination.total} total</div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading results...
                      </div>
                    </td>
                  </tr>
                ) : bags.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No results found.</td>
                  </tr>
                ) : (
                  bags.map((bag, idx) => (
                    <tr key={`${bag.bagNo}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{bag.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.segmentNo || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatBlood(bag.bloodGroup, bag.rh)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.collectionDate ? new Date(bag.collectionDate).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{statusBadge(bag.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {Array.isArray(bag.testResults) && bag.testResults.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bag.testResults.map((t, i) => {
                              const isPositive = String(t.result).toLowerCase() === "positive";
                              const chipCls = isPositive
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200";
                              return (
                                <span
                                  key={i}
                                  className={`px-2 py-0.5 rounded-full text-xs border ${chipCls}`}
                                >
                                  {t.test}: {t.result}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not tested</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(bag)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDetails && selectedBag && (
        <CustomModal
          open={showDetails}
          title={`Bag ${selectedBag.bagNo} – Serology details`}
          description={selectedBag.status ? `Status: ${selectedBag.status}` : ""}
          onCancel={() => {
            setShowDetails(false);
            setSelectedBag(null);
          }}
          size="lg"
          hideFooter
        >
          <div className="space-y-4 text-sm text-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bag Information</p>
                <p><span className="font-medium">Bag No:</span> {selectedBag.bagNo}</p>
                <p><span className="font-medium">Segment No:</span> {selectedBag.segmentNo || "-"}</p>
                <p><span className="font-medium">Blood Group:</span> {formatBlood(selectedBag.bloodGroup, selectedBag.rh)}</p>
                <p>
                  <span className="font-medium">Collection Date:</span>{" "}
                  {selectedBag.collectionDate ? new Date(selectedBag.collectionDate).toLocaleString() : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Summary</p>
                <p>
                  <span className="font-medium">Status:</span> {selectedBag.status}{" "}
                  {statusBadge(selectedBag.status)}
                </p>
                {selectedBag.updatedAt && (
                  <p>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date(selectedBag.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-white/80 p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Test Results</p>
              {Array.isArray(selectedBag.testResults) && selectedBag.testResults.length > 0 ? (
                <div className="divide-y text-sm">
                  {selectedBag.testResults.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-slate-800">{t.test}</p>
                        {t.notes && <p className="text-xs text-slate-500 mt-0.5">{t.notes}</p>}
                      </div>
                      {(() => {
                        const isPositive = String(t.result).toLowerCase() === "positive";
                        const chipCls = isPositive
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200";
                        return (
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${chipCls}`}>
                            {t.result}
                          </span>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No serology tests recorded for this bag.</p>
              )}
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
};

export default SerologyResults;

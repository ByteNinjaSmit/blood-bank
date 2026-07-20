import { Loader2, ChevronLeft, ChevronRight, AlertTriangle, Eye, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusBadgeClass, getStatusLabel, isNearExpiry, isExpired, isBagQuarantined } from "../component-helpers";

const COMPONENT_COLUMNS = [
  { key: "prbc", label: "Packed Red Blood Cells (PRBC)" },
  { key: "ffp", label: "Fresh Frozen Plasma (FFP)" },
  { key: "rdp", label: "Random Donor Platelets (RDP)" },
  { key: "cryo", label: "Cryoprecipitate" },
  { key: "sdp", label: "Single Donor Platelet (SDP)" },
];

function ComponentCell({ comp }) {
  if (comp?.status !== "prepared") {
    return (
      <Badge variant="outline" className="w-fit text-[9px] font-medium text-gray-400 border-gray-200 bg-gray-50/50 uppercase tracking-wider">
        Unprepared
      </Badge>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant="outline" className={`w-fit text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${getStatusBadgeClass(comp.componentStatus)}`}>
        {getStatusLabel(comp.componentStatus)}
      </Badge>
      <span className="font-semibold text-gray-900 text-xs mt-0.5">{comp.volumeMl} mL</span>
      <span className="text-[9px] text-gray-500">{comp.storageLocation || "Main Fridge"}</span>
      {isExpired(comp.expiryDate) && (
        <span className="text-[9px] text-red-600 flex items-center gap-0.5 mt-0.5">
          <AlertTriangle className="w-2.5 h-2.5" /> Expired
        </span>
      )}
      {isNearExpiry(comp.expiryDate) && !isExpired(comp.expiryDate) && (
        <span className="text-[9px] text-yellow-600 flex items-center gap-0.5 mt-0.5">
          <AlertTriangle className="w-2.5 h-2.5" /> Near Expiry
        </span>
      )}
    </div>
  );
}

export default function ComponentsTable({
  state,
  canEdit,
  formatDate,
  onRefresh,
  onView,
  onEdit,
  onPageChange,
  onRowsPerPageChange,
}) {
  const { components, isLoading, pagination, filters } = state;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Components Grouped by Blood Bag ({pagination.total})</CardTitle>
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                Search: "{filters.search}"
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bag Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Segment No</th>
                {COMPONENT_COLUMNS.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Group</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Site</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Edited</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="13" className="px-4 py-8 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading components inventory...
                    </div>
                  </td>
                </tr>
              ) : components.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-4 py-8 text-center text-gray-500">
                    No blood bag groups found.
                  </td>
                </tr>
              ) : (
                components.map((bag, idx) => (
                  <tr
                    key={`${bag.bagNo}-${idx}`}
                    className={`transition-colors ${
                      isBagQuarantined(bag) ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{bag.bagNo}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{bag.segmentNo || "-"}</td>
                    {COMPONENT_COLUMNS.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-sm">
                        <ComponentCell comp={bag[c.key]} />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">{bag.bloodGroup || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{bag.site || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(bag.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {bag.lastEditedAt ? (
                        <span title={bag.editReason || ""}>
                          Edited on {formatDate(bag.lastEditedAt)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(bag.id)}
                          className="h-8 w-8 p-0 border-red-100 text-red-700 hover:bg-red-50"
                          title="View Group Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEdit && bag.canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(bag.id)}
                            className="h-8 w-8 p-0 border-blue-100 text-blue-700 hover:bg-blue-50"
                            title="Edit Components"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 bg-gray-50/10 p-4 border-t rounded-b-xl">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} results
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <Select
                value={pagination.limit.toString()}
                onValueChange={onRowsPerPageChange}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = pagination.totalPages;
                  const currentPage = pagination.page;
                  const pages = [];

                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, currentPage + 2);

                  if (endPage - startPage < 4) {
                    if (startPage === 1) {
                      endPage = Math.min(totalPages, startPage + 4);
                    } else {
                      startPage = Math.max(1, endPage - 4);
                    }
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(i)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        {i}
                      </Button>
                    );
                  }

                  return pages;
                })()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || isLoading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

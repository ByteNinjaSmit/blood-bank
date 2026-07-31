import { Loader2, ChevronLeft, ChevronRight, AlertTriangle, Clock, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isNearExpiry, isExpired } from "../component-helpers";

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case "in-stock": return "default";
    case "reserved": return "secondary";
    case "issued": return "outline";
    case "discarded": return "destructive";
    default: return "outline";
  }
};

const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 0;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getExpiryColor = (days) => {
  if (days <= 1) return "text-red-600 bg-red-100";
  if (days <= 3) return "text-orange-600 bg-orange-100";
  return "text-yellow-600 bg-yellow-100";
};

export default function NearExpiryTable({
  state,
  formatDate,
  onRefresh,
  onView,
  onPageChange,
  onRowsPerPageChange,
}) {
  const { components, isLoading, pagination, filters } = state;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Near-Expiry Components ({pagination.total})</CardTitle>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading near-expiry components...
                    </div>
                  </td>
                </tr>
              ) : components.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="w-12 h-12 text-yellow-500" />
                      <p className="text-lg font-medium">No near-expiry components found</p>
                      <p className="text-sm">
                        There are no components expiring within {filters.days} days that match your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                components.map((component, idx) => {
                  const daysUntilExpiry = getDaysUntilExpiry(component.expiryDate);
                  const expiryColor = getExpiryColor(daysUntilExpiry);

                  return (
                    <tr key={`${component.componentId}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {component.bagNo || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <Badge variant="outline">{component.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {component.volumeMl} mL
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <Badge variant={getStatusBadgeVariant(component.status)}>
                          {component.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          {isExpired(component.expiryDate) && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          {isNearExpiry(component.expiryDate) && !isExpired(component.expiryDate) && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className={isExpired(component.expiryDate) ? "text-red-600" : ""}>
                            {formatDate(component.expiryDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className={`text-xs ${expiryColor} px-2 py-1 rounded-full inline-flex items-center`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {component.bloodGroup || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(component.id)}
                          className="h-8 w-8 p-0"
                          title="View Component Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">
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
                <SelectTrigger className="w-20">
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

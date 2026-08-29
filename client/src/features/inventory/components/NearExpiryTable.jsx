import { Loader2, AlertTriangle, Clock, Eye, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format-date";

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
};

const expiryPillClass = (days) => {
  if (days == null) return "text-gray-600 bg-gray-100";
  if (days <= 1) return "text-red-600 bg-red-100";
  if (days <= 3) return "text-orange-600 bg-orange-100";
  return "text-yellow-700 bg-yellow-100";
};

export default function NearExpiryTable({
  rows,
  isLoading,
  total,
  pagination,
  onView,
  onRefresh,
  onPageChange,
  onRowsPerPageChange,
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Near-Expiry Blood Units ({total})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages || 1}
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" /> Loading near-expiry units...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="w-10 h-10 text-yellow-500" />
                      <p className="font-medium">No near-expiry units for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const days = daysUntil(r.expiryDate);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                          {r.bagNo}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <Badge variant="outline">{r.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.bloodGroup}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(r.expiryDate)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${expiryPillClass(days)}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {days == null ? "—" : `${Math.max(0, days)} ${Math.abs(days) === 1 ? "day" : "days"}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(r.id)}
                          className="h-8 w-8 p-0"
                          title="View unit details"
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

        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Rows per page:</span>
            <Select value={pagination.limit.toString()} onValueChange={onRowsPerPageChange}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= (pagination.totalPages || 1) || isLoading}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

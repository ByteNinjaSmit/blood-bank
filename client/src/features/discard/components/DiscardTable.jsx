import { Eye, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";

const DiscardTable = ({ items = [], isLoading, onView, onRestore, restoringId }) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment No</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component No</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discarded</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan="8" className="px-4 py-8 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading records...
                </div>
              </td>
            </tr>
          ) : items && items.length > 0 ? (
            items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.bagNo}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item?.segmentNo || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item?.componentId || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        item.itemType === "Donation" || item.itemType === "Bag"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}
                  >
                    {item.itemType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{item?.itemName || item?.componentType || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={item.reason}>
                  {item.reason}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDateTime(item.discardedAt)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Button
                      onClick={() => onView?.(item)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="View details"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </Button>
                    {item.reason === "CASCADE_DELETED" && (
                      <Button
                        onClick={() => onRestore?.(item)}
                        disabled={restoringId === item.itemId}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                        title="Restore — reinstates the deleted donation/donor and returns this unit to normal status"
                      >
                        {restoringId === item.itemId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Restore
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-12 text-center text-gray-500" colSpan={8}>
                No discarded items found matching the selection.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DiscardTable;

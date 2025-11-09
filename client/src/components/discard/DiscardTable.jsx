import React from "react";
import { Eye } from "lucide-react";

const Button = ({ children, onClick, variant = "default", size = "default", className = "", ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  const variants = {
    default: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-red-200 text-red-600 hover:bg-red-50",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-11 px-8",
  };
  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const DiscardTable = ({ items = [], isLoading, onView }) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-red-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Bag No</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Component No</th>
            <th className="px-6 py-4 text-left text-sm text-wrap font-semibold text-slate-800">Component Type</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Item Type</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Reason</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Discarded Date</th>
            <th className="px-6 py-4 text-middle text-sm font-semibold text-slate-800">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-red-100">
          {isLoading ? (
            [...Array(5)].map((_, idx) => (
              <tr key={`sk_${idx}`} className="animate-pulse">
                <td className="px-6 py-4"><div className="h-4 bg-red-100 rounded w-28" /></td>
                <td className="px-6 py-4"><div className="h-4 bg-red-100 rounded w-24" /></td>
                <td className="px-6 py-4"><div className="h-4 bg-red-100 rounded w-24" /></td>
                <td className="px-6 py-4"><div className="h-6 bg-red-100 rounded-full w-20" /></td>
                <td className="px-6 py-4"><div className="h-4 bg-red-100 rounded w-40" /></td>
                <td className="px-6 py-4"><div className="h-4 bg-red-100 rounded w-24" /></td>
                <td className="px-6 py-4"><div className="h-8 bg-red-100 rounded w-16" /></td>
              </tr>
            ))
          ) : items && items.length > 0 ? (
            items.map((item) => (
              <tr key={item.id} className="hover:bg-red-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.bagNo}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{item?.componentId}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{item?.componentType}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${item.itemType === "Donation" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                  >
                    {item.itemType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{item.reason}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.discardedAt}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => onView?.(item)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-6 py-8 text-center text-slate-500" colSpan={7}>No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DiscardTable;

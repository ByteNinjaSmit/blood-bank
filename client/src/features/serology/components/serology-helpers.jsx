export const RESULT_OPTIONS = ["NEGATIVE", "REACTIVE", "Shadeness"];

export const STATUS_LABELS = { passed: "Passed", failed: "Failed", discarded: "Discarded", shadeness: "Shadeness", pending: "Pending" };

export function statusBadge(status) {
  const cls =
    status === "passed" ? "bg-green-50 text-green-700 border-green-200" :
    status === "discarded" || status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
    status === "shadeness" ? "bg-orange-50 text-orange-700 border-orange-200" :
    "bg-amber-50 text-amber-700 border-amber-200";
  return <span className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{STATUS_LABELS[status] || status}</span>;
}

export function formatBlood(group, rh) {
  if (!group && !rh) return "-";
  const symbol = rh === "Positive" ? "+" : rh === "Negative" ? "-" : (rh || "");
  return `${group || ""} ${symbol}`.trim();
}

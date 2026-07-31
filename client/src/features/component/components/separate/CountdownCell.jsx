const HOLDING_WINDOW_MS = 6 * 60 * 60 * 1000;

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Components must be separated within 6h of collection — one shared `now`
// tick (from the page) drives every row so we don't run N setIntervals.
export default function CountdownCell({ deadline, now }) {
  if (!deadline) return <span className="text-xs text-gray-400">—</span>;

  const deadlineMs = new Date(deadline).getTime() + HOLDING_WINDOW_MS;
  const remainingMs = deadlineMs - now;
  const overdue = remainingMs <= 0;

  return (
    <span
      className={
        overdue
          ? "font-mono text-xs font-semibold text-red-600"
          : remainingMs < 60 * 60 * 1000
            ? "font-mono text-xs font-semibold text-amber-600"
            : "font-mono text-xs text-gray-700"
      }
    >
      {overdue ? `OVERDUE ${formatDuration(Math.abs(remainingMs))}` : formatDuration(remainingMs)}
    </span>
  );
}

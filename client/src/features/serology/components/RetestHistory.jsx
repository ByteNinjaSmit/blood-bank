import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { serologyApi } from "@/features/serology/api";
import { formatDateTime } from "@/lib/format-date";

// Full before/after retest history for a bag, sourced from the existing
// audit trail (tti.service.ts's recordAndFinalize already persists the
// complete tests[] panel on every save — see
// tti.legacy-view.controller.ts's getHistory). Renders nothing unless the
// bag has actually been edited/retested at least once.
export default function RetestHistory({ bagId, enabled }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !bagId) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    serologyApi
      .getHistory(bagId)
      .then((res) => {
        if (!cancelled) setHistory(res?.data || []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bagId, enabled]);

  if (!enabled) return null;
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading retest history...
      </div>
    );
  }
  if (!history || history.length === 0) return null;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3">
      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">
        Retest History — Before / After
      </p>
      <div className="space-y-2.5">
        {history.map((event, idx) => (
          <div key={idx} className="bg-white border border-orange-100 rounded-md p-2.5">
            <p className="text-2xs text-slate-500 mb-1.5">
              {formatDateTime(event.at)} — decision: <span className="font-medium">{event.decisionBefore}</span>{" "}
              → <span className="font-medium">{event.decisionAfter}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {event.after.map((t) => {
                const prior = event.before.find((b) => b.test === t.test);
                const changed = prior && prior.result !== t.result;
                return (
                  <div
                    key={t.test}
                    className="flex items-center justify-between gap-2 px-2 py-1 rounded border border-slate-100 bg-slate-50/60"
                  >
                    <span className="text-slate-600">{t.test}</span>
                    <span className="flex items-center gap-1.5">
                      {changed && <span className="line-through text-slate-400">{prior.result}</span>}
                      <span className={changed ? "font-semibold text-orange-700" : "text-slate-700"}>
                        {t.result}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

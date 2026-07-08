import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FlaskConical, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardAlerts } from "@/features/dashboard/queries";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { data } = useDashboardAlerts();
  const alerts = data?.alerts || [];

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" className="relative h-9 w-9 p-0" onClick={() => setOpen((o) => !o)}>
        <Bell className="w-4 h-4" />
        {alerts.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[28rem] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Notifications</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{alerts.length} active</span>
          </div>
          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-400 font-medium">No active alerts.</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {alerts.map((a, i) => (
                <li
                  key={`${a.type}-${a.entityId}-${i}`}
                  className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    navigate(a.link);
                  }}
                >
                  <div className={`mt-0.5 shrink-0 ${a.severity === "critical" ? "text-red-600" : "text-amber-500"}`}>
                    {a.type === "CHEMICAL_LOW_STOCK" ? <FlaskConical className="w-4 h-4" /> : <PackageOpen className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{a.message}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${a.severity === "critical" ? "text-red-600" : "text-amber-600"}`}>
                      {a.severity}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

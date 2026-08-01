import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { severityMeta, TOAST_DURATION_MS } from '../lib/notification-meta';

const BAR_COLOR = {
  CRITICAL: 'bg-red-600',
  WARNING: 'bg-amber-500',
  INFORMATION: 'bg-blue-500',
  SUCCESS: 'bg-green-600',
};

export default function NotificationToast({ notification, onClose }) {
  const meta = severityMeta(notification.severity);
  const Icon = meta.icon;
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShrink(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role="status"
      className={`w-80 max-w-[92vw] overflow-hidden rounded-xl border bg-white shadow-lg ring-1 ${meta.ring} animate-in slide-in-from-bottom-4 fade-in duration-300`}
    >
      <div className="flex items-start gap-3 p-3">
        <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${meta.bg}`} aria-hidden="true">
          <Icon className={`w-4 h-4 ${meta.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 leading-snug">{notification.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{notification.message}</p>
        </div>
        <button
          type="button"
          aria-label="Close notification"
          onClick={onClose}
          className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="h-1 bg-slate-100">
        <div
          className={`h-full ${BAR_COLOR[notification.severity] ?? BAR_COLOR.INFORMATION}`}
          style={{
            width: shrink ? '0%' : '100%',
            transition: shrink ? `width ${TOAST_DURATION_MS}ms linear` : 'none',
          }}
        />
      </div>
    </div>
  );
}

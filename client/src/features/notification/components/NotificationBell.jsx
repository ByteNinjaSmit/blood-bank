import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { badgeCount, MODULE_LABELS, SEVERITY_META } from '../lib/notification-meta';
import {
  useClearRead,
  useMarkAllRead,
  useNotificationList,
  useUnreadCount,
} from '../queries';
import NotificationItem from './NotificationItem';

const SEVERITY_FILTERS = ['ALL', 'UNREAD', 'CRITICAL', 'WARNING', 'INFORMATION', 'SUCCESS'];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const ref = useRef(null);

  const queryFilters = {
    ...(severityFilter === 'UNREAD' ? { read: false } : {}),
    ...(severityFilter !== 'ALL' && severityFilter !== 'UNREAD' ? { severity: severityFilter } : {}),
    ...(moduleFilter !== 'ALL' ? { module: moduleFilter } : {}),
    pageSize: 50,
  };

  const { data: unreadData } = useUnreadCount();
  const { data, isLoading, isFetching, refetch } = useNotificationList(queryFilters);
  const markAllRead = useMarkAllRead();
  const clearRead = useClearRead();

  const unreadCount = unreadData?.count ?? 0;
  const items = data?.items ?? [];

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative h-9 w-9 p-0"
            aria-label="Notifications"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {badgeCount(unreadCount)}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      {open && (
        <div
          role="dialog"
          aria-label="Notification center"
          className="absolute right-0 mt-2 w-[26rem] max-w-[92vw] bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-col"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Notifications</span>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Refresh"
                      onClick={() => refetch()}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Mark all as read"
                      onClick={() => markAllRead.mutate()}
                      className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Mark all read</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Clear read notifications"
                      onClick={() => clearRead.mutate()}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Clear read</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5">
              {SEVERITY_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverityFilter(s)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border whitespace-nowrap transition-colors ${
                    severityFilter === s
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s === 'UNREAD' ? 'Unread' : SEVERITY_META[s]?.label ?? s}
                </button>
              ))}
            </div>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              aria-label="Filter by module"
              className="mt-2 w-full text-[11px] font-medium border border-slate-200 rounded-md px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="ALL">All modules</option>
              {Object.entries(MODULE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <ScrollArea className="max-h-[26rem]">
            {isLoading ? (
              <div className="px-4 py-10 text-center text-xs text-slate-400 font-medium">Loading notifications…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">You're all caught up. No notifications.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {items.map((n) => (
                  <NotificationItem key={n.id} notification={n} onNavigate={() => setOpen(false)} />
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

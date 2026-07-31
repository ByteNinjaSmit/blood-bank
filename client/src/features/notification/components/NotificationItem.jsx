import { useNavigate } from 'react-router-dom';
import { Check, ExternalLink, Mail, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MODULE_LABELS, severityMeta, timeAgo } from '../lib/notification-meta';
import { useDeleteNotification, useMarkRead, useMarkUnread } from '../queries';

export default function NotificationItem({ notification, onNavigate }) {
  const navigate = useNavigate();
  const markRead = useMarkRead();
  const markUnread = useMarkUnread();
  const remove = useDeleteNotification();
  const meta = severityMeta(notification.severity);
  const Icon = meta.icon;

  function handleOpen() {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.actionLink) {
      navigate(notification.actionLink);
      onNavigate?.();
    }
  }

  return (
    <li
      className={`group relative px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 ${
        !notification.read ? meta.bg : ''
      }`}
    >
      {!notification.read && (
        <span className={`absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      )}

      <div
        className={`mt-0.5 shrink-0 rounded-full p-1.5 ring-1 ${meta.bg} ${meta.ring}`}
        aria-hidden="true"
      >
        <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
      </div>

      <div className="min-w-0 flex-1 cursor-pointer" onClick={handleOpen}>
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-xs leading-snug ${!notification.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
            {notification.title}
          </p>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{notification.message}</p>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
          <span>{MODULE_LABELS[notification.module] ?? notification.module}</span>
          <span aria-hidden="true">&middot;</span>
          <span title={new Date(notification.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}>
            {timeAgo(notification.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
        {notification.actionLink && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="View details"
                onClick={handleOpen}
                className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>View details</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}
              onClick={() =>
                notification.read ? markUnread.mutate(notification.id) : markRead.mutate(notification.id)
              }
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
            >
              {notification.read ? <Mail className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{notification.read ? 'Mark as unread' : 'Mark as read'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => remove.mutate(notification.id)}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Dismiss</TooltipContent>
        </Tooltip>
      </div>
    </li>
  );
}

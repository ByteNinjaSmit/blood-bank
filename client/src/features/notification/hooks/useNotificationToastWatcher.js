import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import NotificationToast from '../components/NotificationToast';
import { useNotificationList } from '../queries';
import { TOAST_DURATION_MS } from '../lib/notification-meta';

// Watches unread notifications and pops a toast for anything created
// after the watcher mounted — never floods the user with toasts for
// notifications that already existed when the app loaded.
export function useNotificationToastWatcher() {
  const { data } = useNotificationList({ read: false, pageSize: 10 });
  const lastSeenAtRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const items = data?.items ?? [];
    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSeenAtRef.current = items[0]?.createdAt ?? new Date().toISOString();
      return;
    }

    const freshest = items[0]?.createdAt;
    const newItems = items.filter((n) => n.createdAt > lastSeenAtRef.current);
    if (freshest) lastSeenAtRef.current = freshest;
    if (newItems.length === 0) return;

    [...newItems].reverse().forEach((notification) => {
      toast.custom(
        (id) => <NotificationToast notification={notification} onClose={() => toast.dismiss(id)} />,
        { position: 'bottom-right', duration: TOAST_DURATION_MS, unstyled: true },
      );
    });
  }, [data]);
}

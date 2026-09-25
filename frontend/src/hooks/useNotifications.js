import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      // Notification bell is non-critical; fail quietly.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllUnreadAsRead() {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    await Promise.all(unread.map((n) => api.put(`/notifications/${n._id}/read`)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return { notifications, unreadCount, isLoading, refetch: load, markAllUnreadAsRead };
}

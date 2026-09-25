import { useState } from 'react';
import useNotifications from '../hooks/useNotifications';

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllUnreadAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) markAllUnreadAsRead();
  }

  return (
    <div className="notification-bell">
      <button type="button" className="bell-button" onClick={handleToggle}>
        🔔
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="bell-dropdown">
          <div className="bell-dropdown-header">Notifications</div>
          {notifications.length === 0 && <div className="bell-empty">No notifications yet.</div>}
          {notifications.map((n) => (
            <div key={n._id} className={`bell-item ${n.read ? '' : 'bell-item-unread'}`}>
              <p>{n.message}</p>
              <span>{timeAgo(n.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

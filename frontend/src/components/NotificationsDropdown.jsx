import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, handleMarkAsRead, handleDeleteNotification } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronRight size={20} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No notifications</p>
            )}
          </div>

          {notifications.length > 5 && (
            <div className="p-4 border-t border-gray-200">
              <a
                href="/notifications"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View All Notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationsBell() {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <Bell size={20} className="text-gray-600 hover:text-gray-900 cursor-pointer transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}
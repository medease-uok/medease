import { formatTimeAgo } from '../utils/dateFormatter';
import { getNotificationConfig } from '../constants/notifications';
import { X, CheckCircle2 } from 'lucide-react';

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}) {
  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-3 transition-all hover:shadow-md cursor-pointer`}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-1 flex-shrink-0 ${config.textColor}`}>
          <Icon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`font-semibold text-sm ${config.textColor}`}>
                {notification.title}
              </h4>
              <p className="text-gray-600 text-sm mt-1 break-words">
                {notification.message}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(notification.created_at)}
                </span>
                {!notification.is_read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!notification.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="Mark as read"
                >
                  <CheckCircle2 size={18} className="text-gray-600" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors text-red-600"
                title="Delete"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Read indicator */}
        {!notification.is_read && (
          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
        )}
      </div>
    </div>
  );
}

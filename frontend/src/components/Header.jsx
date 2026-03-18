import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import api from '../services/api';
import {
  Bell, LogOut, User, Check, CheckCheck,
  Calendar, Pill, FlaskConical, FileText, Info, RefreshCw, FolderOpen, CheckCircle, XCircle,
} from 'lucide-react';

const NOTIFICATION_ICONS = {
  appointment_scheduled: Calendar,
  appointment_cancelled: Calendar,
  appointment_confirmed: Calendar,
  prescription_created: Pill,
  prescription_dispensed: Pill,
  lab_report_ready: FlaskConical,
  medical_record_created: FileText,
  refill_requested: RefreshCw,
  refill_approved: CheckCircle,
  refill_denied: XCircle,
  document_uploaded: FolderOpen,
  system: Info,
};

const NOTIFICATION_ROUTES = {
  appointment_scheduled: '/appointments',
  appointment_cancelled: '/appointments',
  appointment_confirmed: '/appointments',
  prescription_created: '/prescriptions',
  prescription_dispensed: '/prescriptions',
  lab_report_ready: '/lab-reports',
  medical_record_created: '/medical-records',
  refill_requested: '/prescriptions',
  refill_approved: '/prescriptions',
  refill_denied: '/prescriptions',
  document_uploaded: '/documents',
  system: null,
};

const NOTIFICATION_COLORS = {
  appointment_scheduled: 'bg-blue-100 text-blue-600',
  appointment_cancelled: 'bg-red-100 text-red-600',
  appointment_confirmed: 'bg-green-100 text-green-600',
  prescription_created: 'bg-orange-100 text-orange-600',
  prescription_dispensed: 'bg-orange-100 text-orange-600',
  lab_report_ready: 'bg-pink-100 text-pink-600',
  medical_record_created: 'bg-green-100 text-green-600',
  refill_requested: 'bg-amber-100 text-amber-600',
  refill_approved: 'bg-green-100 text-green-600',
  refill_denied: 'bg-red-100 text-red-600',
  document_uploaded: 'bg-indigo-100 text-indigo-600',
  system: 'bg-slate-100 text-slate-600',
};

const formatTimeAgo = (iso) => {
  if (!iso) return '';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function NotificationItem({ notification, onMarkRead, onClick }) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Info;
  const color = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.system;
  const route = NOTIFICATION_ROUTES[notification.type];

  return (
    <div
      onClick={() => onClick(notification)}
      className={`flex gap-3 p-3 hover:bg-slate-50 transition-colors ${
        route ? 'cursor-pointer' : ''
      } ${!notification.isRead ? 'bg-primary/5' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{notification.message}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <button
          onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
          className="p-1 text-slate-400 hover:text-primary transition-colors flex-shrink-0"
          aria-label="Mark as read"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function Header({ title }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(() => {
    api.get('/notifications/unread-count')
      .then((res) => setUnreadCount(res.data?.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    api.get('/notifications')
      .then((res) => setNotifications(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDropdown = () => {
    if (!open) fetchNotifications();
    setOpen((prev) => !prev);
  };

  const markAsRead = (id) => {
    api.patch(`/notifications/${id}/read`)
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      })
      .catch(() => {});
  };

  const handleNotificationClick = (notification) => {
    let route = NOTIFICATION_ROUTES[notification.type];
    // Patients see their records under Medical History
    if (route === '/medical-records' && currentUser?.role === 'patient') {
      route = '/medical-history';
    }
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  const markAllAsRead = () => {
    api.patch('/notifications/read-all')
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      })
      .catch(() => {});
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-40">
      <div className="h-full px-6 flex items-center justify-between">

        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 font-heading">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-4">

          {/* Notification bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="relative p-2 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={open}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {loading && notifications.length === 0 && (
                    <div className="p-6 text-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  )}

                  {!loading && notifications.length === 0 && (
                    <div className="p-8 text-center">
                      <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No notifications yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        You&apos;ll be notified about appointments, prescriptions, and more.
                      </p>
                    </div>
                  )}

                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={markAsRead}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {currentUser?.profileImageUrl ? (
              <img
                src={currentUser.profileImageUrl}
                alt={`${currentUser.firstName} ${currentUser.lastName}`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cta flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}

            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-slate-900">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {currentUser?.role?.replace('_', ' ')}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2 px-3 py-2
                text-sm font-medium
                text-slate-600 hover:text-red-600
                hover:bg-red-50
                rounded-lg
                transition-all
                group
              "
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden xl:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

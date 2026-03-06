import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { Bell, Search, LogOut, User } from 'lucide-react';

/**
 * ✨ MODERNIZED HEADER
 *
 * IMPROVEMENTS:
 * - Tailwind CSS styling
 * - Modern icons (Lucide React)
 * - Search bar
 * - Notifications icon with badge
 * - User dropdown appearance
 * - Smooth transitions
 * - Better spacing and alignment
 */

export default function Header({ title }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-40">
      <div className="h-full px-6 flex items-center justify-between">

        {/* ✨ LEFT SIDE - Page Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 font-heading">
            {title}
          </h1>
        </div>

        {/* ✨ RIGHT SIDE - Actions */}
        <div className="flex items-center gap-4">

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="
                pl-10 pr-4 py-2 w-64
                border border-slate-200 rounded-lg
                text-sm
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                transition-all
              "
            />
          </div>

          {/* Notifications */}
          <button
            className="
              relative p-2 rounded-lg
              text-slate-600 hover:text-primary hover:bg-slate-100
              transition-colors
            "
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="
              absolute top-1 right-1
              w-2 h-2 bg-red-500 rounded-full
              animate-pulse
            " />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cta flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>

            {/* User Details */}
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-slate-900">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {currentUser?.role?.replace('_', ' ')}
              </p>
            </div>

            {/* Logout Button */}
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

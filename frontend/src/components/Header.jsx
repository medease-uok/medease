import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { Bell, LogOut, User } from 'lucide-react';

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

        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 font-heading">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-4">

          <button
            className="
              relative p-2 rounded-lg
              text-slate-600 hover:text-primary hover:bg-slate-100
              transition-colors
            "
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="
              absolute top-1 right-1
              w-2 h-2 bg-red-500 rounded-full
              animate-pulse
            " />
          </button>

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

/**
 * Sidebar Navigation Component
 */
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="w-80 h-full flex flex-col border-r border-slate-200 bg-surface-light flex-shrink-0 transition-colors duration-200">
      <div className="p-6 flex flex-col h-full justify-between">
        <div className="flex flex-col gap-8">
          {/* User Profile */}
          <div className="flex gap-4 items-center">
            <div className="bg-slate-300 rounded-full size-12 shrink-0 border-2 border-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600">person</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-slate-900 text-base font-bold leading-tight truncate">
                Admin Panel
              </h1>
              <p className="text-slate-500 text-xs font-normal leading-normal truncate">
                Super Administrator
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <Link
              to="/"
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all group ${
                isActive('/')
                  ? 'bg-primary shadow-sm'
                  : 'hover:bg-slate-100 transition-colors'
              }`}
            >
              <span
                className={`material-symbols-outlined group-hover:scale-110 transition-transform ${
                  isActive('/') ? 'text-black' : 'text-slate-600'
                }`}
              >
                dashboard
              </span>
              <p
                className={`text-sm font-semibold leading-normal ${
                  isActive('/') ? 'text-black' : 'text-slate-600 group-hover:text-slate-900'
                }`}
              >
                Dashboard
              </p>
            </Link>

            <Link
              to="/toolboxes"
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all group ${
                isActive('/toolboxes')
                  ? 'bg-primary shadow-sm'
                  : 'hover:bg-slate-100 transition-colors'
              }`}
            >
              <span
                className={`material-symbols-outlined group-hover:scale-110 transition-transform ${
                  isActive('/toolboxes') ? 'text-black' : 'text-slate-600'
                }`}
              >
                home_repair_service
              </span>
              <p
                className={`text-sm font-medium leading-normal ${
                  isActive('/toolboxes')
                    ? 'text-black font-semibold'
                    : 'text-slate-600 group-hover:text-slate-900'
                }`}
              >
                Toolbox Management
              </p>
            </Link>

            <Link
              to="/technicians"
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all group ${
                isActive('/technicians')
                  ? 'bg-primary shadow-sm'
                  : 'hover:bg-slate-100 transition-colors'
              }`}
            >
              <span
                className={`material-symbols-outlined group-hover:scale-110 transition-transform ${
                  isActive('/technicians') ? 'text-black' : 'text-slate-600'
                }`}
              >
                content_paste
              </span>
              <p
                className={`text-sm font-medium leading-normal ${
                  isActive('/technicians')
                    ? 'text-black font-semibold'
                    : 'text-slate-600 group-hover:text-slate-900'
                }`}
              >
                Technician Logs test
              </p>
            </Link>

            <Link
              to="/about"
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all group ${
                isActive('/about')
                  ? 'bg-primary shadow-sm'
                  : 'hover:bg-slate-100 transition-colors'
              }`}
            >
              <span
                className={`material-symbols-outlined group-hover:scale-110 transition-transform ${
                  isActive('/about') ? 'text-black' : 'text-slate-600'
                }`}
              >
                info
              </span>
              <p
                className={`text-sm font-medium leading-normal ${
                  isActive('/about')
                    ? 'text-black font-semibold'
                    : 'text-slate-600 group-hover:text-slate-900'
                }`}
              >
                About
              </p>
            </Link>
          </nav>
        </div>

        {/* Bottom Action */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

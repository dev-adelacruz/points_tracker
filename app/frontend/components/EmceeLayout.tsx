import React, { useRef, useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../state/user/userSlice';
import { RootState } from '../state/store';
import {
  LayoutDashboard, Users, Calendar,
  LogOut, Bell, ChevronDown, Zap, Menu, X, Settings, User,
} from 'lucide-react';

const EMCEE_NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/emcee' },
  { label: 'My Sessions', icon: Calendar, to: '/emcee/sessions' },
  { label: 'My Teams', icon: Users, to: '/emcee/teams' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  emcee: 'Emcee',
  host: 'Host',
};

const EmceeLayout: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { pathname } = useLocation();
  const handleLogout = () => { dispatch(logoutUser() as any); };

  const activeNavItem = EMCEE_NAV_ITEMS.find(({ to }) =>
    to === '/emcee' ? pathname === '/emcee' : pathname.startsWith(to),
  );
  const pageTitle = activeNavItem?.label ?? 'Dashboard';
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'EM';
  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-900/60">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">Points Tracker</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em]">Emcee</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {EMCEE_NAV_ITEMS.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/emcee'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 border-l-2 pl-[10px] ${
                  isActive
                    ? 'bg-teal-600/15 text-teal-400 border-teal-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">{roleLabel}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="p-1 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">{pageTitle}</h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">{today}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors duration-150">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors duration-150"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">{initials}</div>
                <span className="text-sm font-medium text-slate-700 max-w-[140px] truncate hidden sm:block">{user?.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{user?.name}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings className="w-4 h-4 text-slate-400 shrink-0" />Settings
                    </button>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4 shrink-0" />Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 motion-safe:animate-page-fade">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmceeLayout;

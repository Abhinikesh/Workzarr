import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, Users, Briefcase, CalendarCheck, 
  CreditCard, Grid, Bell, BarChart3, Shield, Settings, 
  ChevronLeft, ChevronRight, LogOut, Sun, Moon 
} from 'lucide-react';
import { toggleSidebar, setTheme } from '../../store/slices/uiSlice';
import { logoutAdmin } from '../../store/slices/authSlice';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Briefcase, label: 'Providers', path: '/providers' },
  { icon: CalendarCheck, label: 'Bookings', path: '/bookings' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Grid, label: 'Categories', path: '/categories' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Shield, label: 'Audit Logs', path: '/audit' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar = () => {
  const { sidebarCollapsed, theme } = useSelector((state) => state.ui);
  const { admin } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutAdmin());
  };

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <aside 
      className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">L</span>
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent truncate">
              LocalServe
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative
              ${isActive 
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }
            `}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium truncate">{item.label}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!sidebarCollapsed && <span className="font-medium">Theme</span>}
        </button>

        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 font-bold">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{admin?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{admin?.role || 'Staff'}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>

        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full mt-2 flex items-center justify-center p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

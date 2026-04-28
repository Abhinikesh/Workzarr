import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, Users, Briefcase, CalendarCheck, 
  CreditCard, Grid, Bell, BarChart3, Shield, Settings, 
  ChevronLeft, ChevronRight, LogOut, Sun, Moon 
} from 'lucide-react';
import { toggleSidebar, setTheme } from '../../store/slices/uiSlice';
import { logoutAdmin } from '../../store/slices/authSlice';
import Tooltip from '../shared/Tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Briefcase, label: 'Providers', path: '/providers' },
  { icon: CalendarCheck, label: 'Bookings', path: '/bookings' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Grid, label: 'Categories', path: '/categories' },
  { icon: Bell, label: 'Notifications', path: '/notifications', hasBadge: true },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Shield, label: 'Audit Logs', path: '/audit' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

/**
 * Professional collapsible sidebar for Admin Panel
 * @returns {JSX.Element}
 */
const Sidebar = () => {
  const { sidebarCollapsed, theme } = useSelector((state) => state.ui);
  const { unreadCount } = useSelector((state) => state.notifications);
  const { admin } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate('/login');
  };

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <aside 
      className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 z-40 fixed lg:relative ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      } h-screen`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20">
            <span className="text-white font-bold">L</span>
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent truncate">
              LocalServe
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <Tooltip 
            key={item.path} 
            content={item.label} 
            position="right" 
            disabled={!sidebarCollapsed}
          >
            <NavLink
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                }
              `}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-semibold truncate text-sm">{item.label}</span>}
              
              {item.hasBadge && unreadCount > 0 && (
                <span className={`absolute ${sidebarCollapsed ? 'top-1 right-1' : 'right-3'} w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 animate-pulse`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
        >
          {theme === 'dark' ? <Sun size={20} className="group-hover:rotate-45 transition-transform" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform" />}
          {!sidebarCollapsed && <span className="font-semibold text-sm">Theme Mode</span>}
        </button>

        {/* Admin Profile */}
        <div className={`flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-wider">{admin?.role || 'Staff'}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full mt-1 flex items-center justify-center p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2 font-bold text-xs"><ChevronLeft size={20} /> Collapse Menu</div>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

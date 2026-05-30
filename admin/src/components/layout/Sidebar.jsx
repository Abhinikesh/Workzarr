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
      className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-40 fixed lg:relative ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      } h-screen text-slate-300`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
            <span className="text-white font-black text-lg">W</span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-black tracking-tight text-white leading-none">
                Workzarr
              </span>
              <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-0.5">
                Bharat Service Hub
              </span>
            </div>
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
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-semibold truncate text-sm">{item.label}</span>}
              
              {item.hasBadge && unreadCount > 0 && (
                <span className={`absolute ${sidebarCollapsed ? 'top-1 right-1' : 'right-3'} w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors group"
        >
          {theme === 'dark' ? <Sun size={20} className="group-hover:rotate-45 transition-transform" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform" />}
          {!sidebarCollapsed && <span className="font-semibold text-sm">Theme Mode</span>}
        </button>

        {/* Admin Profile */}
        <div className={`flex items-center gap-3 p-2 rounded-2xl bg-slate-800/40 border border-slate-800 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-orange-500 font-bold border border-orange-500/20">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-wider">{admin?.role || 'Staff'}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full mt-1 flex items-center justify-center p-2 text-slate-500 hover:bg-slate-800 hover:text-white rounded-xl transition-colors border border-transparent hover:border-slate-800"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2 font-bold text-xs"><ChevronLeft size={20} /> Collapse Menu</div>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

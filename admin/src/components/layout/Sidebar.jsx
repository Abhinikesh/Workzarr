import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, Users, Briefcase, CalendarCheck, 
  CreditCard, Grid, Bell, BarChart3, Shield, Settings, 
  ChevronLeft, ChevronRight, LogOut 
} from 'lucide-react';
import { toggleSidebar } from '../../store/slices/uiSlice';
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
 * Professional Light-themed collapsible sidebar for Admin Panel
 * @returns {JSX.Element}
 */
const Sidebar = () => {
  const { sidebarCollapsed } = useSelector((state) => state.ui);
  const { unreadCount } = useSelector((state) => state.notifications);
  const { admin } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate('/login');
  };

  return (
    <aside 
      className={`bg-white border-r border-[#EEEEEE] flex flex-col transition-all duration-300 z-40 fixed lg:relative ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      } h-screen text-[#666666]`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[#EEEEEE]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-[#FF4500] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-black text-lg">W</span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-black tracking-tight text-[#1A1A1A] leading-none">
                Workzarr
              </span>
              <span className="text-[9px] font-bold text-[#FF4500] uppercase tracking-widest mt-0.5">
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
                  ? 'bg-[#FFF0EB] text-[#FF4500] font-extrabold shadow-sm' 
                  : 'text-[#666666] hover:bg-[#FFF0EB]/50 hover:text-[#FF4500]'
                }
              `}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-semibold truncate text-sm">{item.label}</span>}
              
              {item.hasBadge && unreadCount > 0 && (
                <span className={`absolute ${sidebarCollapsed ? 'top-1 right-1' : 'right-3'} w-4 h-4 bg-[#FF4500] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[#EEEEEE] space-y-2">
        {/* Admin Profile */}
        <div className={`flex items-center gap-3 p-2 rounded-2xl bg-[#F8F8F8] border border-[#EEEEEE] overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 text-[#FF4500] font-bold border border-[#FFC0AC]/20">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-[#1A1A1A]">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate font-semibold uppercase tracking-wider">{admin?.role || 'Staff'}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full mt-1 flex items-center justify-center p-2 text-slate-400 hover:bg-[#FFF0EB]/50 hover:text-[#FF4500] rounded-xl transition-colors border border-transparent"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2 font-bold text-xs"><ChevronLeft size={20} /> Collapse Menu</div>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

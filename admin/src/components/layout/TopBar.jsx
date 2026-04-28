import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Search, Bell, Menu, User, Settings, LogOut, 
  ChevronRight, ChevronDown, AlertTriangle, 
  Clock, CheckCircle, X
} from 'lucide-react';
import { logoutAdmin } from '../../store/slices/authSlice';
import useDebounce from '../../hooks/useDebounce';
import axios from '../../lib/axios';

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [title, setTitle] = useState('Dashboard');
  const [breadcrumbs, setBreadcrumbs] = useState(['Home', 'Dashboard']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const { unreadCount, alerts } = useSelector((state) => state.notifications);
  const { admin } = useSelector((state) => state.auth);
  const { maintenanceMode } = useSelector((state) => state.dashboard?.stats?.system || { maintenanceMode: false });

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const path = location.pathname.split('/').filter(Boolean);
    if (path.length === 0) {
      setTitle('Dashboard');
      setBreadcrumbs(['Home', 'Dashboard']);
    } else {
      const main = path[0].charAt(0).toUpperCase() + path[0].slice(1);
      setTitle(main);
      setBreadcrumbs(['Home', main, ...path.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1))]);
    }
  }, [location]);

  useEffect(() => {
    if (debouncedSearch) {
      handleSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedSearch]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const { data } = await axios.get(`/admin/global-search?q=${debouncedSearch}`);
      setSearchResults(data.data);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-30 sticky top-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
          <Menu size={20} />
        </button>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <span className={index === breadcrumbs.length - 1 ? 'text-indigo-500' : ''}>{item}</span>
                {index < breadcrumbs.length - 1 && <ChevronRight size={10} />}
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{title}</h1>
        </div>
      </div>

      {/* Center - Global Search */}
      <div className="flex-1 max-w-xl mx-8 relative group">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {isSearching ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Search size={18} />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, providers, bookings..."
            className="block w-full pl-11 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-sm font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
             {/* Simple Results List for demonstration - would be grouped in production */}
             <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                {Object.entries(searchResults).map(([type, items]) => items.length > 0 && (
                  <div key={type}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-3 py-2">{type}</p>
                    {items.map((item, idx) => (
                      <button 
                        key={idx}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all text-left"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults(null);
                          navigate(`/${type}/${item._id}`);
                        }}
                      >
                         <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500">
                            <User size={16} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name || item.businessName || item.bookingId}</p>
                            <p className="text-xs text-slate-500">{item.email || item.phone || item.status}</p>
                         </div>
                      </button>
                    ))}
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {maintenanceMode && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-900/30 font-bold text-[10px] uppercase animate-pulse">
            <AlertTriangle size={12} />
            Maintenance Active
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-2xl transition-all relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Alerts</h3>
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">{unreadCount} New</span>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.slice(0, 5).map((alert, i) => (
                    <div key={i} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex gap-3">
                       <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                          <CheckCircle size={16} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{alert.message}</p>
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium"><Clock size={10} /> 2 mins ago</p>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 font-medium italic text-sm">No new notifications</div>
                )}
              </div>
              <Link to="/notifications" className="block w-full p-3 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                View All Notifications
              </Link>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1 pl-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none mb-0.5">{admin?.name || 'Super Admin'}</p>
              <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">{admin?.role || 'Admin'}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
               {admin?.name?.charAt(0) || 'A'}
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="p-1.5">
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors">
                    <User size={16} className="text-slate-400" />
                    <span className="text-xs font-bold">My Profile</span>
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors">
                    <Settings size={16} className="text-slate-400" />
                    <span className="text-xs font-bold">System Settings</span>
                  </Link>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-xs font-bold">Sign Out</span>
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;

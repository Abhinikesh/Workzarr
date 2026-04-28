import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, Bell, Menu, User, Settings, LogOut, ChevronRight } from 'lucide-react';

const TopBar = () => {
  const location = useLocation();
  const [title, setTitle] = useState('Dashboard');
  const [breadcrumbs, setBreadcrumbs] = useState(['Home', 'Dashboard']);
  const { unreadCount, alerts } = useSelector((state) => state.notifications);
  const { admin } = useSelector((state) => state.auth);

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

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <Menu size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <span>{item}</span>
                {index < breadcrumbs.length - 1 && <ChevronRight size={12} />}
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
      </div>

      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search for users, providers, bookings..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-sm"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
          <div className="hidden text-right lg:block">
            <p className="text-sm font-semibold">{admin?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{admin?.role || 'Super Admin'}</p>
          </div>
          <button className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30">
             {admin?.name?.charAt(0) || 'A'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

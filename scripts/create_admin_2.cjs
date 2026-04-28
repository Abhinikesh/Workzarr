const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..', 'admin');

function writeFile(filePath, content) {
  const fullPath = path.join(basePath, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
}

// 7. components/layout/Sidebar.jsx
writeFile('src/components/layout/Sidebar.jsx', \`
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
      className={\\\`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 \\\${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      }\\\`}
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
            className={({ isActive }) => \\\`
              flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative
              \\\${isActive 
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }
            \\\`}
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
\`);

// 8. components/layout/TopBar.jsx
writeFile('src/components/layout/TopBar.jsx', \`
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
\`);

// 9. components/ui/StatsCard.jsx
writeFile('src/components/ui/StatsCard.jsx', \`
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsCard = ({ 
  title, value, change, changeLabel, icon: Icon, 
  iconColor = 'text-indigo-500', iconBg = 'bg-indigo-100 dark:bg-indigo-500/10',
  isLoading = false, prefix = '', suffix = ''
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
          <div className="w-16 h-6 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  const isPositive = change >= 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={\\\`w-10 h-10 \\\${iconBg} rounded-xl flex items-center justify-center \\\${iconColor}\\\`}>
          <Icon size={22} />
        </div>
        {change !== undefined && (
          <div className={\\\`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full \\\${
            isPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'
          }\\\`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {prefix}{value}{suffix}
          </span>
          {changeLabel && <span className="text-[10px] font-medium text-slate-400 ml-2">{changeLabel}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
\`);

// 10. components/ui/DataTable.jsx
writeFile('src/components/ui/DataTable.jsx', \`
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, FileDown } from 'lucide-react';

const DataTable = ({ 
  columns, data = [], isLoading, pagination, onPageChange, emptyMessage = 'No data found' 
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 whitespace-nowrap" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-900 dark:text-slate-50">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-50">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}
            </span>{' '}
            of <span className="font-semibold text-slate-900 dark:text-slate-50">{pagination.totalItems}</span> results
          </div>
          <div className="flex items-center gap-1">
            <button 
              disabled={pagination.currentPage === 1}
              onClick={() => onPageChange(1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              disabled={pagination.currentPage === 1}
              onClick={() => onPageChange(pagination.currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-100 dark:border-indigo-500/20 text-xs mx-1">
              {pagination.currentPage} / {pagination.totalPages}
            </div>
            <button 
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => onPageChange(pagination.currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => onPageChange(pagination.totalPages)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
\`);

// 11. components/ui/FilterBar.jsx
writeFile('src/components/ui/FilterBar.jsx', \`
import React from 'react';
import { Filter, X, Search, RotateCcw } from 'lucide-react';

const FilterBar = ({ filters, values, onChange, onReset, onSearch }) => {
  const hasActiveFilters = Object.values(values).some(v => v !== '' && v !== null && v !== undefined);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 transition-all">
      <div className="flex-1 flex items-center gap-3 relative">
        <Search className="absolute left-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Global search..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <div key={filter.key} className="flex flex-col">
            <select
              value={values[filter.key] || ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer min-w-[120px]"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
\`);

// 12. components/ui/Modal.jsx
writeFile('src/components/ui/Modal.jsx', \`
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all"
        onClick={onClose}
      ></div>
      
      <div className={\\\`relative bg-white dark:bg-slate-800 w-full \\\${sizes[size]} rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200\\\`}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-bold">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
\`);

// 31. index.css (Essential styles)
writeFile('src/index.css', \`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222.2 84% 4.9%;
    --primary: 243.4 75.4% 58.6%;
    --primary-foreground: 210 40% 98%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }

  body {
    @apply bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-500 selection:text-white;
    font-family: 'Inter', sans-serif;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors;
}

/* Animations */
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse-live {
  animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Chart Styles */
.recharts-default-tooltip {
  @apply !bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !rounded-xl !shadow-xl !px-3 !py-2 !text-xs !font-medium !outline-none;
}

.recharts-tooltip-label {
  @apply !mb-1 !text-slate-400;
}
\`);

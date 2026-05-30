import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { LayoutDashboard, Inbox, Calendar, User, LogOut, Bell } from 'lucide-react';

const Header = () => {
  const provider = useSelector((s) => s.auth.provider);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 z-40 px-4 lg:px-8 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo and Partner Tag */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">W</span>
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Workzarr Partner</span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Inbox className="w-4 h-4" />
            <span>Requests</span>
          </NavLink>
          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Calendar className="w-4 h-4" />
            <span>My Jobs</span>
          </NavLink>
        </nav>

        {/* Right Side Info */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100 cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-600 rounded-full"></span>
          </button>

          {provider ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs">
                  {getInitials(provider.businessName)}
                </div>
                <span className="hidden md:inline text-sm font-semibold text-slate-700 hover:text-slate-900">
                  {provider.businessName}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Partner Login
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;

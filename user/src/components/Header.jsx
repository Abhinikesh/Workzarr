import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { MapPin, Bell, LogOut, User, Calendar, Search, Home, Sun, Moon } from 'lucide-react';

const Header = () => {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
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
        
        {/* Left Side: Brand Logo and Location */}
        <div className="flex items-center gap-6">
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">W</span>
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Workzarr</span>
          </Link>

          {user && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-700 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.location?.town || 'Select Location'}</span>
            </div>
          )}
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Search className="w-4 h-4" />
            <span>Search Services</span>
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Calendar className="w-4 h-4" />
            <span>My Bookings</span>
          </NavLink>
        </nav>

        {/* Right Side: Notification Bell & Profile Avatar */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-orange-500" /> : <Moon className="w-5 h-5" />}
          </button>

          <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100 cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-600 rounded-full"></span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs">
                  {getInitials(user.name)}
                </div>
                <span className="hidden md:inline text-sm font-semibold text-slate-700 hover:text-slate-900">
                  {user.name}
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
              to="/"
              className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;

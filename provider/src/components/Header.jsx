import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { LayoutDashboard, Inbox, Calendar, LogOut, Bell } from 'lucide-react';

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
    <header className="sticky top-0 bg-white border-b border-[#EEEEEE] z-40 px-4 lg:px-8 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo and Partner Tag */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#FF4500] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-base">W</span>
            </div>
            <span className="font-extrabold text-lg text-[#1A1A1A] tracking-tight">Workzarr <span className="text-[#FF4500]">Partner</span></span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 ${
                isActive ? 'text-[#FF4500]' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 ${
                isActive ? 'text-[#FF4500]' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`
            }
          >
            <Inbox className="w-4 h-4" />
            <span>Requests</span>
          </NavLink>
          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 ${
                isActive ? 'text-[#FF4500]' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`
            }
          >
            <Calendar className="w-4 h-4" />
            <span>My Jobs</span>
          </NavLink>
        </nav>

        {/* Right Side Info */}
        <div className="flex items-center gap-5">
          <button className="relative p-2.5 text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFF0EB] rounded-full transition-all cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF4500] rounded-full"></span>
          </button>

          {provider ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] border border-[#FFC0AC] flex items-center justify-center text-[#FF4500] font-bold text-xs">
                  {getInitials(provider.businessName)}
                </div>
                <span className="hidden md:inline text-sm font-semibold text-[#666666] hover:text-[#1A1A1A] transition-colors">
                  {provider.businessName}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-500 hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-[#FF4500] text-white text-xs font-bold rounded-lg hover:bg-[#cc3700] transition-colors"
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

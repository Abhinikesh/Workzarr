import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Calendar, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </NavLink>

        <NavLink
          to="/bookings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Calendar className="w-5 h-5" />
          <span>Bookings</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;

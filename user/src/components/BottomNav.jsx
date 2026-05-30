import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Calendar, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EEEEEE] z-50 lg:hidden shadow-sm">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-all duration-200 ${
              isActive ? 'text-[#FF4500]' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-all duration-200 ${
              isActive ? 'text-[#FF4500]' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`
          }
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </NavLink>

        <NavLink
          to="/bookings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-all duration-200 ${
              isActive ? 'text-[#FF4500]' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`
          }
        >
          <Calendar className="w-5 h-5" />
          <span>Bookings</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-all duration-200 ${
              isActive ? 'text-[#FF4500]' : 'text-[#666666] hover:text-[#1A1A1A]'
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

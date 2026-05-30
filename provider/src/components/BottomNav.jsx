import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, Calendar, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/requests"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Inbox className="w-5 h-5" />
          <span>Requests</span>
        </NavLink>

        <NavLink
          to="/jobs"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Calendar className="w-5 h-5" />
          <span>Jobs</span>
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

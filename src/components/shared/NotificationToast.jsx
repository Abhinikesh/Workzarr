import React from 'react';
import { toast } from 'sonner';
import { 
  Bell, CheckCircle, AlertTriangle, 
  Info, CreditCard, CalendarCheck, UserPlus 
} from 'lucide-react';

/**
 * Utility for showing professional real-time notifications
 */
export const showNotification = (type, message, description) => {
  const icons = {
    booking: <CalendarCheck size={18} className="text-indigo-500" />,
    payment: <CreditCard size={18} className="text-emerald-500" />,
    alert: <AlertTriangle size={18} className="text-amber-500" />,
    system: <Info size={18} className="text-blue-500" />,
    user: <UserPlus size={18} className="text-purple-500" />,
    success: <CheckCircle size={18} className="text-emerald-500" />,
    error: <X size={18} className="text-red-500" />,
  };

  toast.custom((t) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] p-4 shadow-2xl flex gap-4 w-[350px] animate-in slide-in-from-right-10 duration-300">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center flex-shrink-0">
        {icons[type] || <Bell size={18} className="text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white capitalize leading-tight">
            {message}
          </p>
          <button 
            onClick={() => toast.dismiss(t)}
            className="text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  ), {
    duration: 5000,
  });
};

const NotificationToast = () => {
  return null; // This is a utility-only component
};

export default NotificationToast;

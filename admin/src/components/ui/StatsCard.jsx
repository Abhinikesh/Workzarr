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
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={22} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            isPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'
          }`}>
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

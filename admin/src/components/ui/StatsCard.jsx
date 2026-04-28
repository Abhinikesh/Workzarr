import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Reusable metric card for dashboard stats
 * @param {Object} props
 */
const StatsCard = ({ 
  title, value, change, changeLabel, icon: Icon, 
  iconColor = 'text-indigo-600', iconBg = 'bg-indigo-50 dark:bg-indigo-500/10',
  isLoading = false, prefix = '', suffix = '', onClick
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700"></div>
          <div className="w-16 h-6 rounded-full bg-slate-100 dark:bg-slate-700"></div>
        </div>
        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded-full mb-3"></div>
        <div className="h-8 w-32 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
      </div>
    );
  }

  const isPositive = change >= 0;

  return (
    <div 
      className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 ${
        onClick ? 'hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 cursor-pointer active:scale-[0.98]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center ${iconColor} border border-transparent dark:border-white/5`}>
          <Icon size={24} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
            isPositive 
              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' 
              : 'text-red-600 bg-red-50 dark:bg-red-500/10'
          }`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {prefix}{value.toLocaleString()}{suffix}
          </h4>
          {changeLabel && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">
              {changeLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number,
  changeLabel: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  iconColor: PropTypes.string,
  iconBg: PropTypes.string,
  isLoading: PropTypes.boolean,
  onClick: PropTypes.func,
  prefix: PropTypes.string,
  suffix: PropTypes.string
};

export default StatsCard;

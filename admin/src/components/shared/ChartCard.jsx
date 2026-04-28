import React from 'react';
import PropTypes from 'prop-types';
import { MoreHorizontal, RefreshCw } from 'lucide-react';

/**
 * Reusable card wrapper for charts and visualizations
 */
const ChartCard = ({ 
  title, 
  subtitle, 
  children, 
  isLoading = false, 
  actions,
  onRefresh
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full transition-all duration-300">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
          {actions}
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative min-h-[300px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Gathering insights...</p>
          </div>
        ) : (
          <div className="w-full h-full animate-in fade-in duration-700">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  isLoading: PropTypes.bool,
  actions: PropTypes.node,
  onRefresh: PropTypes.func
};

export default ChartCard;

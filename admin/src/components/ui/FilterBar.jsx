import React from 'react';
import PropTypes from 'prop-types';
import { Filter, X, Search, RotateCcw, ChevronDown } from 'lucide-react';

/**
 * Reusable horizontal Filter Bar component
 * @param {Object} props
 */
const FilterBar = ({ filters = [], values = {}, onChange, onReset, onSearch }) => {
  const hasActiveFilters = Object.values(values).some(v => v !== '' && v !== null && v !== undefined && v !== false);

  const activeFilterCount = Object.values(values).filter(v => v !== '' && v !== null && v !== undefined && v !== false).length;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm mb-6 transition-all duration-300">
      {/* Global Search Part if provided */}
      {onSearch && (
        <div className="flex-1 min-w-[200px] relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search keywords..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}

      {/* Dynamic Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <div key={filter.key} className="relative">
            {filter.type === 'select' ? (
              <div className="relative group">
                <select
                  value={values[filter.key] || ''}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                  className={`appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border ${values[filter.key] ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer min-w-[140px]`}
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
              </div>
            ) : filter.type === 'toggle' ? (
              <button
                onClick={() => onChange(filter.key, !values[filter.key])}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                  values[filter.key] 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                {filter.label}
                {values[filter.key] && <X size={14} />}
              </button>
            ) : null}
          </div>
        ))}

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all group"
          >
            <RotateCcw size={16} className="group-hover:-rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline">Reset Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {!onSearch && <div className="flex-1" />}

      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-slate-800">
        <Filter size={12} />
        {activeFilterCount} Active Filters
      </div>
    </div>
  );
};

FilterBar.propTypes = {
  filters: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['select', 'date', 'search', 'toggle']).isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired
    }))
  })),
  values: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onSearch: PropTypes.func
};

export default FilterBar;

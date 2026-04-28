import React from 'react';
import { Filter, X, Search, RotateCcw } from 'lucide-react';

const FilterBar = ({ filters, values, onChange, onReset, onSearch }) => {
  const hasActiveFilters = Object.values(values).some(v => v !== '' && v !== null && v !== undefined);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 transition-all">
      <div className="flex-1 flex items-center gap-3 relative">
        <Search className="absolute left-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Global search..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <div key={filter.key} className="flex flex-col">
            <select
              value={values[filter.key] || ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer min-w-[120px]"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

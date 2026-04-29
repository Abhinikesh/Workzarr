import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Calendar as CalendarIcon, ChevronDown, Clock } from 'lucide-react';

/**
 * Simplified Date Range Picker with presets
 */
const DateRangePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Today', getValue: () => ({ start: new Date(), end: new Date() }) },
    { label: 'Yesterday', getValue: () => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return { start: d, end: d };
    }},
    { label: 'Last 7 Days', getValue: () => {
      const end = new Date();
      const start = new Date(); start.setDate(start.getDate() - 7);
      return { start, end };
    }},
    { label: 'Last 30 Days', getValue: () => {
      const end = new Date();
      const start = new Date(); start.setDate(start.getDate() - 30);
      return { start, end };
    }},
    { label: 'This Month', getValue: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return { start, end };
    }},
  ];

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group"
      >
        <CalendarIcon size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {value?.start ? `${formatDate(value.start)} - ${formatDate(value.end)}` : 'Select Date Range'}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onChange(preset.getValue());
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors group"
              >
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">
                  {preset.label}
                </span>
                <Clock size={12} className="text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

DateRangePicker.propTypes = {
  value: PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date)
  }),
  onChange: PropTypes.func.isRequired
};

export default DateRangePicker;

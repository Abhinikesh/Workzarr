import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable pill-shaped Badge component
 */
const Badge = ({ label, variant = 'default', size = 'md', icon: Icon }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    warning: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    danger: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    info: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    outline: 'bg-transparent border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
    lg: 'px-3 py-1.5 text-[11px]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-extrabold uppercase tracking-widest rounded-full border border-transparent ${variants[variant]} ${sizes[size]}`}>
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
};

Badge.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['success', 'warning', 'danger', 'info', 'indigo', 'default', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.elementType
};

export default Badge;

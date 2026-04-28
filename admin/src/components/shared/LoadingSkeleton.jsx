import React from 'react';
import PropTypes from 'prop-types';

/**
 * Animated Shimmer Skeletons for loading states
 */
const LoadingSkeleton = ({ variant = 'card', count = 1 }) => {
  const renderSkeleton = (key) => {
    switch (variant) {
      case 'card':
        return (
          <div key={key} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
              <div className="w-16 h-6 bg-slate-100 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="w-1/2 h-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-2" />
            <div className="w-3/4 h-8 bg-slate-100 dark:bg-slate-700 rounded-xl" />
          </div>
        );
      case 'table':
        return (
          <div key={key} className="space-y-4">
            <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl w-full animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl w-full animate-pulse" />
            ))}
          </div>
        );
      case 'list':
        return (
          <div key={key} className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-full" />
            </div>
          </div>
        );
      case 'chart':
        return (
          <div key={key} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 animate-pulse">
            <div className="w-1/3 h-5 bg-slate-100 dark:bg-slate-700 rounded-full mb-8" />
            <div className="flex items-end gap-3 h-48">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }} />
              ))}
            </div>
          </div>
        );
      default:
        return <div key={key} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl w-full animate-pulse" />;
    }
  };

  return (
    <div className={`grid gap-6 ${variant === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
      {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
    </div>
  );
};

LoadingSkeleton.propTypes = {
  variant: PropTypes.oneOf(['card', 'table', 'list', 'chart']),
  count: PropTypes.number
};

export default LoadingSkeleton;

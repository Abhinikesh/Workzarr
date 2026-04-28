import React from 'react';
import PropTypes from 'prop-types';
import { Inbox } from 'lucide-react';

/**
 * Centered Empty State component with optional action
 */
const EmptyState = ({ 
  icon: Icon = Inbox, 
  title = 'No data available', 
  description = 'There are no records to display at this moment.', 
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-slate-800 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-700 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
        <Icon size={40} />
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
        {title}
      </h3>
      <p className="max-w-xs text-slate-500 dark:text-slate-400 font-medium mb-8">
        {description}
      </p>
      {action && (
        <div className="flex items-center justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node
};

export default EmptyState;

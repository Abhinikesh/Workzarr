import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Simple Tooltip wrapper component
 */
const Tooltip = ({ content, children, position = 'top', disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled || !content) return <>{children}</>;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-700',
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[100] whitespace-nowrap px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-bold rounded-lg shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 \${positions[position]}\`}>
          {content}
          <div className={\`absolute border-[6px] border-transparent \${arrows[position]}\`} />
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  content: PropTypes.string,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  disabled: PropTypes.bool
};

export default Tooltip;

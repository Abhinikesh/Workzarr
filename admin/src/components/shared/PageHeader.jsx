import React from 'react';
import PropTypes from 'prop-types';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Consistent Page Header component with breadcrumbs and actions
 */
const PageHeader = ({ title, subtitle, breadcrumbs = [], actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
          <Link to="/" className="hover:text-indigo-500 transition-colors">
            <Home size={12} />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <ChevronRight size={10} />
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-indigo-500 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className={index === breadcrumbs.length - 1 ? 'text-indigo-500' : ''}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    path: PropTypes.string
  })),
  actions: PropTypes.node
};

export default PageHeader;

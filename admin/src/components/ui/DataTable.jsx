import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  Search, ArrowUpDown, ArrowUp, ArrowDown, 
  MoreVertical, FileDown, Inbox
} from 'lucide-react';

/**
 * Professional Reusable Data Table Component
 * @param {Object} props 
 */
const DataTable = ({ 
  columns, 
  data = [], 
  isLoading = false, 
  pagination, 
  onPageChange,
  onSort,
  onRowClick,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  emptyMessage = 'No matching records found',
  emptyIcon: EmptyIcon = Inbox
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    if (onSort) onSort(key, direction);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
              {onSelectAll && (
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={data.length > 0 && selectedRows.length === data.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className={`px-6 py-4 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ${col.sortable ? 'cursor-pointer hover:text-indigo-500 transition-colors' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      sortConfig.key === col.key ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />
                      ) : <ArrowUpDown size={12} className="opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {isLoading ? (
              Array.from({ length: pagination?.limit || 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                   {onSelectAll && <td className="px-6 py-4"><div className="w-4 h-4 bg-slate-100 dark:bg-slate-700 rounded"></div></td>}
                   {columns.map((col) => (
                     <td key={col.key} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full"></div>
                     </td>
                   ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <EmptyIcon size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold">{emptyMessage}</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your filters or search terms</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr 
                  key={row._id || i} 
                  className={`group hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-default ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {onSelectRow && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedRows.includes(row._id)}
                        onChange={(e) => onSelectRow(row._id, e.target.checked)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                      {col.render ? col.render(row) : (
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{row[col.key]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {pagination.totalItems > 0 ? (
              <>
                Showing <span className="text-slate-900 dark:text-white">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{' '}
                <span className="text-slate-900 dark:text-white">
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}
                </span>{' '}
                of <span className="text-slate-900 dark:text-white">{pagination.totalItems}</span> entries
              </>
            ) : (
              'Showing 0 entries'
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={pagination.currentPage <= 1}
              onClick={() => onPageChange(1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              disabled={pagination.currentPage <= 1}
              onClick={() => onPageChange(pagination.currentPage - 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center px-4 h-9 bg-indigo-600 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/20 text-xs">
              {pagination.currentPage} / {Math.max(1, pagination.totalPages)}
            </div>

            <button 
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => onPageChange(pagination.currentPage + 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => onPageChange(pagination.totalPages || 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    render: PropTypes.func,
    sortable: PropTypes.bool,
    width: PropTypes.string
  })).isRequired,
  data: PropTypes.array,
  isLoading: PropTypes.bool,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    totalItems: PropTypes.number,
    limit: PropTypes.number
  }),
  onPageChange: PropTypes.func,
  onSort: PropTypes.func,
  onRowClick: PropTypes.func,
  selectedRows: PropTypes.array,
  onSelectRow: PropTypes.func,
  onSelectAll: PropTypes.func,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.elementType
};

export default DataTable;

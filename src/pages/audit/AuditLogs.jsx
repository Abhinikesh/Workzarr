import React, { useState, useEffect } from 'react';
import { 
  Shield, Clock, Terminal, Filter, Search, 
  User as UserIcon, Activity, AlertTriangle
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import axios from '../../lib/axios';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 15 });
  const [filters, setFilters] = useState({ action: '' });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        action: filters.action
      };
      const { data } = await axios.get('/admin/audit/logs', { params });
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.currentPage, filters]);

  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (row) => (
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
          <Clock size={12} />
          {new Date(row.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      )
    },
    {
      key: 'admin',
      label: 'Administrator',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
            {row.admin?.name?.charAt(0) || 'S'}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.admin?.name || 'System'}</span>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
            {row.action}
          </span>
          <span className="text-xs text-slate-500 font-medium">on {row.targetType}</span>
        </div>
      )
    },
    {
      key: 'details',
      label: 'Details',
      render: (row) => (
        <div className="max-w-[300px]">
           <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate" title={row.details}>
             {row.details}
           </p>
           <p className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-60">{row.ipAddress || '0.0.0.0'}</p>
        </div>
      )
    },
    {
       key: 'status',
       label: 'Result',
       render: (row) => (
         <span className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] uppercase">
            <Activity size={10} />
            Success
         </span>
       )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-indigo-500" size={24} />
            Security & Audit Logs
          </h2>
          <p className="text-slate-500">Immutable record of all administrative actions and system modifications</p>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'action', label: 'All Actions', options: [
            { value: 'CREATE', label: 'Create' }, 
            { value: 'UPDATE', label: 'Update' },
            { value: 'DELETE', label: 'Delete' },
            { value: 'LOGIN', label: 'Login' }
          ]}
        ]}
        values={filters}
        onChange={(key, val) => {
           setFilters(prev => ({ ...prev, [key]: val }));
           setPagination(prev => ({ ...prev, currentPage: 1 }));
        }}
        onReset={() => {
           setFilters({ action: '' });
        }}
      />

      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
      />
    </div>
  );
};

export default AuditLogs;

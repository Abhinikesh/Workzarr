import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Search, Filter, 
  Download, Eye, User, Clock, 
  Terminal, AlertCircle, Database,
  ArrowRight, Activity
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/ui/Modal';
import SettingsService from '../../services/settings.service';
import { formatDate } from '../../utils/formatters';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, limit: 25 });
  const [filters, setFilters] = useState({ search: '', action: '', admin: '' });
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getAuditLogs({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      key: 'admin',
      label: 'Administrator',
      render: (row) => (
        <div className="flex items-center gap-3">
           <Avatar name={row.admin?.name} size="sm" />
           <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{row.admin?.name}</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID: #{row.admin?._id.slice(-6).toUpperCase()}</p>
           </div>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action Performed',
      render: (row) => {
        const actionMap = {
          'CREATE': 'success',
          'UPDATE': 'info',
          'DELETE': 'danger',
          'VERIFY': 'success',
          'BLOCK': 'danger',
          'ADJUST': 'warning'
        };
        const actionType = row.action?.split('_')[0];
        return <Badge label={row.action?.replace(/_/g, ' ')} variant={actionMap[actionType] || 'default'} size="sm" />;
      }
    },
    {
      key: 'target',
      label: 'Affected Resource',
      render: (row) => (
        <div className="flex items-center gap-2">
           <Database size={14} className="text-slate-300" />
           <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{row.targetModel}</span>
           <span className="text-[10px] font-mono text-slate-400">({row.targetId?.slice(-6).toUpperCase()})</span>
        </div>
      )
    },
    {
      key: 'metadata',
      label: 'Environment',
      render: (row) => (
        <div className="flex flex-col">
           <span className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1"><Activity size={10} /> IP: {row.ipAddress}</span>
           <span className="text-[10px] font-medium text-slate-400">{row.userAgent?.split(' ')[0]}</span>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Timestamp',
      render: (row) => (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
           <Clock size={14} />
           {formatDate(row.createdAt, 'dd MMM, hh:mm:ss a')}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Details',
      render: (row) => (
        <button 
          onClick={() => setSelectedLog(row)}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <Eye size={18} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Audit Trails" 
        subtitle="Immutable log of all administrative actions and security events"
        actions={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm hover:shadow-lg transition-all">
            <Download size={18} />
            Export Logs
          </button>
        }
      />

      <FilterBar
        filters={[
          { key: 'action', label: 'All Actions', type: 'select', options: [
            { value: 'VERIFY_PROVIDER', label: 'Verifications' },
            { value: 'BLOCK_USER', label: 'Blocks' },
            { value: 'UPDATE_SETTINGS', label: 'Settings Change' },
            { value: 'ADJUST_EARNINGS', label: 'Earnings Adjustment' }
          ]}
        ]}
        values={filters}
        onSearch={(val) => setFilters(prev => ({ ...prev, search: val }))}
        onChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        onReset={() => setFilters({ search: '', action: '', admin: '' })}
      />

      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
      />

      {/* Detail Modal */}
      <Modal 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)}
        title="Audit Detail"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-8">
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                   <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Performed By</p>
                   <p className="font-bold text-slate-900 dark:text-white">{selectedLog.admin?.name} ({selectedLog.admin?.email})</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Action Date</p>
                   <p className="font-bold text-slate-900 dark:text-white">{formatDate(selectedLog.createdAt, 'PPPpp')}</p>
                </div>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Change Manifest (JSON DIFF)</p>
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 overflow-x-auto">
                   <pre className="text-[11px] font-mono leading-relaxed">
                      {JSON.stringify(selectedLog.changes, null, 2).split('\n').map((line, i) => {
                        const isAdded = line.includes('": "') && !selectedLog.oldData?.[line.split('"')[1]];
                        return (
                          <div key={i} className={isAdded ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-400'}>
                             {line}
                          </div>
                        );
                      })}
                   </pre>
                </div>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;

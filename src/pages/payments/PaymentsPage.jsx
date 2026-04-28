import React, { useState, useEffect, useCallback } from 'react';
import { 
  IndianRupee, CreditCard, Wallet, 
  ArrowUpRight, ArrowDownRight, Search, 
  Filter, Download, CheckCircle2, Clock, 
  AlertCircle, ExternalLink, MoreVertical,
  Banknote, History, RotateCcw
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import StatusBadge from '../../components/shared/StatusBadge';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/shared/Avatar';
import PaymentsService from '../../services/payments.service';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, limit: 25 });
  const [filters, setFilters] = useState({ search: '', status: '', method: '' });

  const fetchSummary = async () => {
    try {
      const res = await PaymentsService.getSummary();
      setSummary(res.data);
    } catch (error) {
      console.error('Summary fetch failed', error);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'transactions') {
        res = await PaymentsService.getTransactions({ page: pagination.currentPage, limit: pagination.limit, ...filters });
      } else if (activeTab === 'payouts') {
        res = await PaymentsService.getPayouts({ page: pagination.currentPage, limit: pagination.limit, ...filters });
      }
      setData(res.data.items);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Data fetch failed', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const transactionColumns = [
    {
      key: 'id',
      label: 'Transaction ID',
      render: (row) => (
        <span className="font-mono text-[10px] font-extrabold text-slate-400 uppercase">
          #{row._id.slice(-8).toUpperCase()}
        </span>
      )
    },
    {
      key: 'customer',
      label: 'Entities',
      render: (row) => (
        <div className="flex items-center gap-3">
           <Avatar name={row.user?.name} size="sm" />
           <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{row.user?.name}</span>
              <span className="text-[10px] font-medium text-slate-400">Paying for {row.service?.name}</span>
           </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Financials',
      render: (row) => (
        <div>
           <p className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(row.amount)}</p>
           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Comm: {formatCurrency(row.commission)}</p>
        </div>
      )
    },
    {
      key: 'method',
      label: 'Method',
      render: (row) => (
        <div className="flex items-center gap-2">
           <CreditCard size={14} className="text-slate-300" />
           <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{row.method || 'Online'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => <span className="text-xs font-medium text-slate-500">{formatDate(row.createdAt, 'dd MMM, hh:mm a')}</span>
    }
  ];

  const payoutColumns = [
    {
      key: 'provider',
      label: 'Service Provider',
      render: (row) => (
        <div className="flex items-center gap-3">
           <Avatar name={row.provider?.businessName} size="sm" />
           <span className="text-xs font-bold text-slate-900 dark:text-white">{row.provider?.businessName}</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Payout Amount',
      render: (row) => <span className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(row.amount)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        row.status === 'pending' && (
          <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20">
             Process Now
          </button>
        )
      )
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Payments & Revenue" 
        subtitle="Track platform earnings, provider payouts and transaction health"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Captured Volume</p>
            <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(summary?.captured || 0)}</h4>
         </div>
         <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-600/20">
            <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60 mb-1">Total Commission</p>
            <h4 className="text-2xl font-extrabold">{formatCurrency(summary?.commission || 0)}</h4>
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Net Platform Revenue</p>
            <h4 className="text-2xl font-extrabold text-emerald-500">{formatCurrency(summary?.netRevenue || 0)}</h4>
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Pending Payouts</p>
            <h4 className="text-2xl font-extrabold text-amber-500">{formatCurrency(summary?.pendingPayouts || 0)}</h4>
         </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl w-fit shadow-sm">
         {[
           { id: 'transactions', label: 'Transactions', icon: Banknote },
           { id: 'payouts', label: 'Payout Requests', icon: Wallet },
           { id: 'refunds', label: 'Refund Logs', icon: RotateCcw }
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all \${
               activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
             }\`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: 'All Status', type: 'select', options: [
            { value: 'captured', label: 'Paid' },
            { value: 'failed', label: 'Failed' },
            { value: 'refunded', label: 'Refunded' }
          ]}
        ]}
        values={filters}
        onSearch={(val) => setFilters(prev => ({ ...prev, search: val }))}
        onChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        onReset={() => setFilters({ search: '', status: '', method: '' })}
      />

      <DataTable
        columns={activeTab === 'transactions' ? transactionColumns : payoutColumns}
        data={data}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
      />
    </div>
  );
};

export default PaymentsPage;

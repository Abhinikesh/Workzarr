import React, { useState, useEffect } from 'react';
import { 
  CreditCard, IndianRupee, ArrowUpRight, ArrowDownRight, 
  CheckCircle, Clock, AlertCircle, Download, ExternalLink
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import axios from '../../lib/axios';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [filters, setFilters] = useState({ status: '', method: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        status: filters.status,
        method: filters.method,
        search: searchTerm
      };
      const { data } = await axios.get('/admin/payments', { params });
      setPayments(data.data.payments);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [pagination.currentPage, filters, searchTerm]);

  const columns = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (row) => (
        <p className="font-bold text-slate-900 dark:text-white text-xs">
          {row.razorpayOrderId || row._id.slice(-12).toUpperCase()}
        </p>
      )
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div className="flex flex-col">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{row.user?.name}</p>
          <p className="text-[10px] text-slate-500 font-medium">{row.user?.email}</p>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
          <IndianRupee size={14} />
          {row.amount}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
          row.status === 'captured' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 
          row.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-500/10' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'method',
      label: 'Method',
      render: (row) => (
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
          <CreditCard size={14} />
          {row.method || 'Razorpay'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => (
        <p className="text-xs text-slate-500 font-medium">{new Date(row.createdAt).toLocaleString()}</p>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transactions & Payments</h2>
          <p className="text-slate-500">View and audit all financial activities</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
          <Download size={18} />
          Report
        </button>
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: 'All Status', options: [{ value: 'captured', label: 'Captured' }, { value: 'failed', label: 'Failed' }, { value: 'created', label: 'Created' }] }
        ]}
        values={filters}
        onChange={(key, val) => {
           setFilters(prev => ({ ...prev, [key]: val }));
           setPagination(prev => ({ ...prev, currentPage: 1 }));
        }}
        onReset={() => {
           setFilters({ status: '', method: '' });
           setSearchTerm('');
        }}
        onSearch={setSearchTerm}
      />

      <DataTable
        columns={columns}
        data={payments}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
      />
    </div>
  );
};

export default PaymentList;

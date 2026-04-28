import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarCheck, Download, IndianRupee, 
  Search, Filter, Eye, MoreVertical,
  Activity, CheckCircle2, XCircle, Clock,
  ArrowRight, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import Badge from '../../components/shared/Badge';
import BookingsService from '../../services/bookings.service';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import { useSocket } from '../../hooks/useSocket';

const BookingsPage = () => {
  const navigate = useNavigate();
  const { subscribe } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, completionRate: 0, revenue: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 25 });
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await BookingsService.getBookings({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });
      setBookings(data.data.bookings);
      setPagination(data.data.pagination);
      setStats(data.data.stats);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    subscribe('booking:new', () => fetchBookings());
    subscribe('booking:status_update', () => fetchBookings());
  }, [subscribe, fetchBookings]);

  const columns = [
    {
      key: 'bookingId',
      label: 'ID',
      render: (row) => (
        <span className="font-mono text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
          #{row._id.slice(-8).toUpperCase()}
        </span>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.user?.name} src={row.user?.avatar} size="sm" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.user?.name}</span>
        </div>
      )
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.provider?.businessName} src={row.provider?.logo} size="sm" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.provider?.businessName}</span>
        </div>
      )
    },
    {
      key: 'service',
      label: 'Service',
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{row.service?.name}</p>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{row.category?.name}</p>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Financials',
      render: (row) => (
        <div>
           <p className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(row.totalPrice)}</p>
           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Comm: {formatCurrency(row.commission)}</p>
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
      label: 'Scheduled',
      render: (row) => (
        <div>
           <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatDate(row.date, 'dd MMM')}</p>
           <p className="text-[10px] font-medium text-slate-400 uppercase">{row.timeSlot}</p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button 
          onClick={() => navigate(\`/bookings/\${row._id}\`)}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
        >
          <Eye size={18} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bookings Management" 
        subtitle="Monitor service fulfillment and transaction health"
        actions={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm hover:shadow-lg transition-all">
            <Download size={18} />
            Export Data
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
            <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total}</h4>
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Active Now</p>
               <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.active}</h4>
            </div>
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
               <Activity size={20} className="text-indigo-500 animate-pulse" />
            </div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Completion Rate</p>
            <h4 className="text-2xl font-extrabold text-emerald-500">{stats.completionRate}%</h4>
         </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Period Revenue</p>
            <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(stats.revenue)}</h4>
         </div>
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: 'All Status', type: 'select', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'accepted', label: 'Confirmed' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
        ]}
        values={filters}
        onSearch={(val) => setFilters(prev => ({ ...prev, search: val }))}
        onChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        onReset={() => setFilters({ search: '', status: '', category: '' })}
      />

      <DataTable
        columns={columns}
        data={bookings}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
      />
    </div>
  );
};

export default BookingsPage;

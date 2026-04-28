import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, Clock, CheckCircle, XCircle, 
  MapPin, User, Briefcase, IndianRupee, Search, Filter
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import axios from '../../lib/axios';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [filters, setFilters] = useState({ status: '', paymentStatus: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        search: searchTerm
      };
      const { data } = await axios.get('/admin/bookings', { params });
      setBookings(data.data.bookings);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.currentPage, filters, searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10';
      case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10';
      case 'confirmed': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10';
      case 'cancelled': return 'bg-red-100 text-red-600 dark:bg-red-500/10';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-500/10';
    }
  };

  const columns = [
    {
      key: 'bookingId',
      label: 'ID / Date',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-xs uppercase">#{row.bookingId || row._id.slice(-8).toUpperCase()}</p>
          <p className="text-[10px] text-slate-500 font-medium">{new Date(row.createdAt).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      key: 'service',
      label: 'Service',
      render: (row) => (
        <div className="flex flex-col">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{row.service?.name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {row.address?.town}, {row.address?.district}</p>
        </div>
      )
    },
    {
      key: 'participants',
      label: 'User / Provider',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold flex items-center gap-1.5"><User size={12} className="text-slate-400" /> {row.user?.name}</p>
          <p className="text-xs font-semibold flex items-center gap-1.5"><Briefcase size={12} className="text-slate-400" /> {row.provider?.businessName}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (row) => (
        <div className="flex flex-col">
          <p className="font-extrabold text-slate-900 dark:text-white flex items-center"><IndianRupee size={12} /> {row.totalPrice}</p>
          <p className={`text-[10px] font-bold ${row.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
             {row.paymentStatus.toUpperCase()}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all font-bold text-xs">
          View
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bookings & Orders</h2>
          <p className="text-slate-500">Track and manage all service requests across the platform</p>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: 'All Status', options: [
            { value: 'pending', label: 'Pending' }, 
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]},
          { key: 'paymentStatus', label: 'Payment', options: [
            { value: 'paid', label: 'Paid' }, 
            { value: 'pending', label: 'Pending' },
            { value: 'failed', label: 'Failed' }
          ]}
        ]}
        values={filters}
        onChange={(key, val) => {
           setFilters(prev => ({ ...prev, [key]: val }));
           setPagination(prev => ({ ...prev, currentPage: 1 }));
        }}
        onReset={() => {
           setFilters({ status: '', paymentStatus: '' });
           setSearchTerm('');
        }}
        onSearch={setSearchTerm}
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

export default BookingList;

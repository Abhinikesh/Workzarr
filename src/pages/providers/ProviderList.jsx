import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Star, CheckCircle, Clock, XCircle, 
  MapPin, ShieldCheck, ExternalLink, Filter, Search
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import axios from '../../lib/axios';

const ProviderList = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [filters, setFilters] = useState({ isVerified: '', isAvailable: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        isVerified: filters.isVerified,
        isAvailable: filters.isAvailable,
        search: searchTerm
      };
      const { data } = await axios.get('/admin/providers', { params });
      setProviders(data.data.providers);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch providers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [pagination.currentPage, filters, searchTerm]);

  const columns = [
    {
      key: 'user',
      label: 'Provider Details',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 overflow-hidden">
            {row.user?.avatar ? (
              <img src={row.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{row.businessName?.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              {row.businessName}
              {row.isVerified && <ShieldCheck size={14} className="text-blue-500" />}
            </p>
            <p className="text-xs text-slate-500 font-medium">{row.user?.name}</p>
          </div>
        </div>
      )
    },
    {
      key: 'services',
      label: 'Main Services',
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.services?.slice(0, 2).map((s, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {s.name}
            </span>
          ))}
          {row.services?.length > 2 && <span className="text-[10px] font-bold text-slate-400">+{row.services.length - 2}</span>}
        </div>
      )
    },
    {
      key: 'verificationStatus',
      label: 'Verification',
      render: (row) => {
        const status = row.isVerified ? 'Verified' : 'Pending';
        return (
          <span className={`flex items-center gap-1.5 font-bold text-xs ${
            row.isVerified ? 'text-emerald-500' : 'text-amber-500'
          }`}>
            {row.isVerified ? <CheckCircle size={14} /> : <Clock size={14} />}
            {status}
          </span>
        );
      }
    },
    {
      key: 'rating',
      label: 'Performance',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-amber-500">
            <Star size={14} fill="currentColor" />
            <span className="font-bold text-xs">{row.ratings?.average || 0}</span>
            <span className="text-slate-400 font-medium text-[10px]">({row.ratings?.count || 0})</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500">Total Bookings: {row.totalBookings || 0}</p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            Manage
            <ExternalLink size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Providers</h2>
          <p className="text-slate-500">Manage and verify professional service providers</p>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'isVerified', label: 'All Status', options: [{ value: 'true', label: 'Verified' }, { value: 'false', label: 'Unverified' }] },
          { key: 'isAvailable', label: 'Availability', options: [{ value: 'true', label: 'Online' }, { value: 'false', label: 'Offline' }] }
        ]}
        values={filters}
        onChange={(key, val) => {
           setFilters(prev => ({ ...prev, [key]: val }));
           setPagination(prev => ({ ...prev, currentPage: 1 }));
        }}
        onReset={() => {
           setFilters({ isVerified: '', isAvailable: '' });
           setSearchTerm('');
        }}
        onSearch={setSearchTerm}
      />

      <DataTable
        columns={columns}
        data={providers}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
      />
    </div>
  );
};

export default ProviderList;

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, Download, ShieldCheck, 
  Search, Filter, Star, Crown, 
  ShieldAlert, ShieldOff, Eye, MoreVertical,
  CheckCircle2, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import Badge from '../../components/shared/Badge';
import RatingDisplay from '../../components/shared/RatingDisplay';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import ProvidersService from '../../services/providers.service';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const ProvidersPage = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 25 });
  const [filters, setFilters] = useState({ search: '', category: '', status: '', verified: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProvidersService.getProviders({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });
      setProviders(data.data.providers);
      setPagination(data.data.pagination);
      setStats({ 
        total: data.data.total, 
        pending: data.data.pendingVerification 
      });
    } catch (error) {
      console.error('Failed to fetch providers', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const columns = [
    {
      key: 'businessName',
      label: 'Business / Provider',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.businessName} src={row.logo} size="md" />
          <div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{row.businessName}</p>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">{row.user?.phone || row.phone}</p>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <div className="flex items-center gap-2">
           <Badge label={row.category?.name || 'Home Service'} variant="default" size="sm" />
        </div>
      )
    },
    {
      key: 'rating',
      label: 'Performance',
      render: (row) => <RatingDisplay rating={row.stats?.averageRating || 0} count={row.stats?.totalReviews || 0} />
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.subscription?.plan === 'premium' ? (
            <Badge label="Premium" variant="indigo" icon={Crown} size="sm" />
          ) : (
            <Badge label="Free" variant="outline" size="sm" />
          )}
        </div>
      )
    },
    {
      key: 'verification',
      label: 'Verification',
      render: (row) => (
        row.isVerified ? (
          <div className="flex items-center gap-1.5 text-emerald-500 font-extrabold text-[10px] uppercase tracking-widest">
            <CheckCircle2 size={14} /> Verified
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-[10px] uppercase tracking-widest">
            <Clock size={14} /> Pending
          </div>
        )
      )
    },
    {
      key: 'earnings',
      label: 'Total Earnings',
      render: (row) => <span className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(row.stats?.totalEarnings || 0)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigate(`/providers/${row._id}`)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => setConfirmModal({ isOpen: true, type: row.status === 'blocked' ? 'unblock' : 'block', data: row })}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
            title={row.status === 'blocked' ? 'Unblock' : 'Block Provider'}
          >
            {row.status === 'blocked' ? <ShieldAlert size={16} /> : <ShieldOff size={16} />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Service Providers" 
        subtitle="Manage businesses, verify documents and track earnings"
        actions={
          <>
            {stats.pending > 0 && (
              <button 
                onClick={() => navigate('/providers/pending')}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all animate-in zoom-in duration-300"
              >
                <ShieldCheck size={18} />
                {stats.pending} Pending Verifications
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm hover:shadow-lg transition-all">
              <Download size={18} />
              Export
            </button>
          </>
        }
      />

      <FilterBar
        filters={[
          { key: 'verified', label: 'All Verification', type: 'select', options: [
            { value: 'true', label: 'Verified Only' },
            { value: 'false', label: 'Unverified Only' }
          ]},
          { key: 'status', label: 'All Status', type: 'select', options: [
            { value: 'active', label: 'Active' },
            { value: 'blocked', label: 'Blocked' }
          ]},
          { key: 'plan', label: 'All Plans', type: 'select', options: [
            { value: 'free', label: 'Free Plan' },
            { value: 'premium', label: 'Premium Plan' }
          ]}
        ]}
        values={filters}
        onSearch={(val) => setFilters(prev => ({ ...prev, search: val }))}
        onChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        onReset={() => setFilters({ search: '', category: '', status: '', verified: '' })}
      />

      <DataTable
        columns={columns}
        data={providers}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
      />

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        variant={confirmModal.type === 'block' ? 'danger' : 'warning'}
        title={`${confirmModal.type === 'block' ? 'Block' : 'Unblock'} ${confirmModal.data?.businessName}?`}
        description={`Are you sure you want to ${confirmModal.type} this provider profile? They will ${confirmModal.type === 'block' ? 'be hidden from search' : 're-appear in search results'}.`}
        onConfirm={async () => {
          await ProvidersService.toggleStatus(confirmModal.data._id, confirmModal.type === 'block' ? 'blocked' : 'active');
          fetchProviders();
          setConfirmModal({ isOpen: false, type: '', data: null });
        }}
        onCancel={() => setConfirmModal({ isOpen: false, type: '', data: null })}
      />
    </div>
  );
};

export default ProvidersPage;

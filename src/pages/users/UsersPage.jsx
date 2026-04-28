import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Download, UserMinus, ShieldAlert, 
  Search, Filter, RotateCcw, MoreVertical, 
  Eye, ShieldOff, Trash2, Send
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import Badge from '../../components/shared/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { exportToCSV } from '../../utils/exportToCSV';
import UsersService from '../../services/users.service';
import { formatDate } from '../../utils/formatters';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 25 });
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [selectedRows, setSelectedRows] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UsersService.getUsers({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleExport = () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Joined Date' }
    ];
    exportToCSV(users, 'LocalServe_Users', columns);
  };

  const handleStatusToggle = async (userId, newStatus) => {
    try {
      await UsersService.toggleUserStatus(userId, newStatus);
      fetchUsers();
      setConfirmModal({ isOpen: false, type: '', data: null });
    } catch (error) {
       console.error('Toggle status failed', error);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User Info',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.avatar} size="md" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{row.name}</p>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">{row.phone || 'No phone'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{row.email}</span>
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <Badge 
          label={row.role} 
          variant={row.role === 'ADMIN' ? 'indigo' : row.role === 'PROVIDER' ? 'info' : 'default'}
          size="sm"
        />
      )
    },
    {
      key: 'bookings',
      label: 'Bookings',
      render: (row) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.stats?.totalBookings || 0}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      render: (row) => <span className="text-xs text-slate-400 font-medium">{formatDate(row.createdAt)}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button 
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
            title="View Profile"
          >
            <Eye size={16} />
          </button>
          <button 
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
            title={row.status === 'blocked' ? 'Unblock' : 'Block User'}
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              type: row.status === 'blocked' ? 'unblock' : 'block', 
              data: row 
            })}
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
        title="User Management" 
        subtitle="Oversee customers, providers and staff accounts"
        actions={
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm hover:shadow-lg transition-all"
          >
            <Download size={18} />
            Export CSV
          </button>
        }
      />

      <FilterBar
        filters={[
          { key: 'role', label: 'All Roles', type: 'select', options: [
            { value: 'USER', label: 'Customer' },
            { value: 'PROVIDER', label: 'Provider' },
            { value: 'ADMIN', label: 'Admin' }
          ]},
          { key: 'status', label: 'All Status', type: 'select', options: [
            { value: 'active', label: 'Active' },
            { value: 'blocked', label: 'Blocked' }
          ]}
        ]}
        values={filters}
        onSearch={(val) => setFilters(prev => ({ ...prev, search: val }))}
        onChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        onReset={() => setFilters({ search: '', role: '', status: '' })}
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
        onSelectRow={(id, checked) => {
          setSelectedRows(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
        }}
        onSelectAll={(checked) => {
          setSelectedRows(checked ? users.map(u => u._id) : []);
        }}
        selectedRows={selectedRows}
      />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        variant={confirmModal.type === 'block' ? 'danger' : 'warning'}
        title={\`\${confirmModal.type === 'block' ? 'Block' : 'Unblock'} User?\`}
        description={\`Are you sure you want to \${confirmModal.type} \${confirmModal.data?.name}? They will \${confirmModal.type === 'block' ? 'lose access' : 'regain access'} to the platform.\`}
        confirmLabel={\`Confirm \${confirmModal.type}\`}
        onConfirm={() => handleStatusToggle(confirmModal.data?._id, confirmModal.type === 'block' ? 'blocked' : 'active')}
        onCancel={() => setConfirmModal({ isOpen: false, type: '', data: null })}
      />
    </div>
  );
};

export default UsersPage;

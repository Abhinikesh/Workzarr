import React, { useState, useEffect } from 'react';
import { User, Shield, Ban, CheckCircle, Search, Mail, Phone, Calendar } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import Modal from '../../components/ui/Modal';
import axios from '../../lib/axios';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [filters, setFilters] = useState({ role: '', isBlocked: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        role: filters.role,
        isBlocked: filters.isBlocked,
        search: searchTerm
      };
      const { data } = await axios.get('/admin/users', { params });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, filters, searchTerm]);

  const handleBlockUnblock = async (userId, isBlocked) => {
    if (!window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`)) return;
    try {
      await axios.patch(`/admin/users/${userId}/${isBlocked ? 'unblock' : 'block'}`);
      fetchUsers();
    } catch (error) {
       alert(error.response?.data?.message || 'Action failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
          row.role === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/10' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10'
        }`}>
          {row.role}
        </span>
      )
    },
    {
      key: 'isBlocked',
      label: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.isBlocked ? (
            <span className="flex items-center gap-1 text-red-500 font-bold text-xs">
              <Ban size={14} /> Blocked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
              <CheckCircle size={14} /> Active
            </span>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (row) => (
        <div className="text-xs text-slate-500">
          <p className="font-medium text-slate-700 dark:text-slate-300">{new Date(row.createdAt).toLocaleDateString()}</p>
          <p>{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedUser(row)}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
          >
            <User size={18} />
          </button>
          <button 
            onClick={() => handleBlockUnblock(row._id, row.isBlocked)}
            className={`p-2 rounded-lg transition-all ${
              row.isBlocked 
                ? 'text-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' 
                : 'text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {row.isBlocked ? <CheckCircle size={18} /> : <Ban size={18} />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-slate-500">Monitor and manage all system users</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
          Add New Admin
        </button>
      </div>

      <FilterBar
        filters={[
          { key: 'role', label: 'All Roles', options: [{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }] },
          { key: 'isBlocked', label: 'All Status', options: [{ value: 'true', label: 'Blocked' }, { value: 'false', label: 'Active' }] }
        ]}
        values={filters}
        onChange={(key, val) => {
           setFilters(prev => ({ ...prev, [key]: val }));
           setPagination(prev => ({ ...prev, currentPage: 1 }));
        }}
        onReset={() => {
           setFilters({ role: '', isBlocked: '' });
           setSearchTerm('');
        }}
        onSearch={setSearchTerm}
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
      />

      {/* User Details Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Profile Details"
      >
        {selectedUser && (
          <div className="space-y-8">
            <div className="flex flex-col items-center">
               <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-indigo-500/30 mb-4">
                 {selectedUser.name.charAt(0)}
               </div>
               <h4 className="text-2xl font-bold">{selectedUser.name}</h4>
               <p className="text-slate-500 font-medium">{selectedUser.email}</p>
               <span className="mt-3 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-widest">{selectedUser.role}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-bold uppercase"><Mail size={12} /> Email</p>
                  <p className="text-sm font-semibold">{selectedUser.email}</p>
               </div>
               <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-bold uppercase"><Phone size={12} /> Phone</p>
                  <p className="text-sm font-semibold">{selectedUser.phone || 'Not provided'}</p>
               </div>
               <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-bold uppercase"><Calendar size={12} /> Registered</p>
                  <p className="text-sm font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
               </div>
               <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-bold uppercase"><Shield size={12} /> Account Status</p>
                  <p className={`text-sm font-bold ${selectedUser.isBlocked ? 'text-red-500' : 'text-emerald-500'}`}>
                    {selectedUser.isBlocked ? 'Restricted' : 'Full Access'}
                  </p>
               </div>
            </div>

            <div className="flex gap-3">
               <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-bold transition-all">
                 View History
               </button>
               <button 
                 onClick={() => handleBlockUnblock(selectedUser._id, selectedUser.isBlocked)}
                 className={`flex-1 py-3 text-white rounded-xl font-bold transition-all ${selectedUser.isBlocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
               >
                 {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
               </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserList;

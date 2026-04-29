import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, ShieldAlert, Send, Trash2, 
  Mail, Phone, MapPin, Calendar, Clock, 
  CreditCard, Briefcase, Star, ExternalLink,
  ShieldCheck, ShieldOff
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import Badge from '../../components/shared/Badge';
import DataTable from '../../components/ui/DataTable';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import UsersService from '../../services/users.service';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '' });

  const fetchUser = async () => {
    try {
      const data = await UsersService.getUserById(id);
      setUser(data.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleStatusToggle = async () => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    await UsersService.toggleUserStatus(id, newStatus);
    fetchUser();
    setConfirmModal({ isOpen: false, type: '' });
  };

  if (loading) return <div className="p-8"><LoadingSkeleton variant="table" /></div>;
  if (!user) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/users')}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-5">
            <Avatar name={user.name} src={user.avatar} size="lg" />
            <div>
               <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
                 <Badge label={user.role} variant={user.role === 'PROVIDER' ? 'info' : 'default'} />
               </div>
               <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                 <StatusBadge status={user.status} />
                 <span className="text-slate-300 dark:text-slate-700">•</span>
                 <span className="flex items-center gap-1.5"><Clock size={14} /> Joined {formatRelativeTime(user.createdAt)}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={() => setConfirmModal({ isOpen: true, type: user.status === 'blocked' ? 'unblock' : 'block' })}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-lg ${
              user.status === 'blocked' 
                ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
            }`}
          >
            {user.status === 'blocked' ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
            {user.status === 'blocked' ? 'Unblock User' : 'Block User'}
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">
            <Send size={18} />
            Notify
          </button>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl w-fit shadow-sm">
         {['overview', 'bookings', 'payments', 'activity'].map((tab) => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-6 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${
               activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
             }`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Info Column */}
             <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
                   <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6">Personal Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                      <div className="space-y-1">
                         <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Full Name</p>
                         <p className="font-bold text-slate-700 dark:text-slate-300">{user.name}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Email Address</p>
                         <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           {user.email} <Mail size={14} className="text-slate-300" />
                         </p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Phone Number</p>
                         <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           {user.phone || 'Not provided'} <Phone size={14} className="text-slate-300" />
                         </p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Primary Town</p>
                         <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           {user.town || 'Unspecified'} <MapPin size={14} className="text-slate-300" />
                         </p>
                      </div>
                   </div>
                </div>

                {/* Map/Location Section Placeholder */}
                <div className="bg-slate-100 dark:bg-slate-900 h-[300px] rounded-[32px] border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                   <div className="text-center">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl mb-4 mx-auto">
                         <MapPin size={32} />
                      </div>
                      <p className="font-bold text-slate-600 dark:text-slate-400">User Registered Location</p>
                      <p className="text-xs text-slate-400 uppercase font-extrabold tracking-widest mt-1">Map View Integration</p>
                   </div>
                </div>
             </div>

             {/* Stats Column */}
             <div className="space-y-6">
                <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-2xl shadow-indigo-600/30">
                   <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60 mb-2">Platform Lifetime Value</p>
                   <h4 className="text-4xl font-extrabold mb-8">{formatCurrency(user.stats?.totalSpent || 0)}</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 p-4 rounded-2xl">
                         <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Bookings</p>
                         <p className="text-xl font-extrabold">{user.stats?.totalBookings || 0}</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-2xl">
                         <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Reviews</p>
                         <p className="text-xl font-extrabold">{user.stats?.totalReviews || 0}</p>
                      </div>
                   </div>
                </div>

                {user.role === 'PROVIDER' && (
                  <Link 
                    to={`/providers/${user.providerId}`}
                    className="block bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all group"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                              <Briefcase size={24} />
                           </div>
                           <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">Provider Profile</p>
                              <p className="text-xs font-medium text-slate-500">View business details</p>
                           </div>
                        </div>
                        <ExternalLink size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                     </div>
                  </Link>
                )}
             </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
             <DataTable 
               columns={[
                 { key: 'id', label: 'Booking ID', render: (row) => <span className="font-bold text-xs">#{row._id.slice(-6).toUpperCase()}</span> },
                 { key: 'service', label: 'Service', render: (row) => <span className="font-medium text-xs">{row.service?.name}</span> },
                 { key: 'amount', label: 'Amount', render: (row) => <span className="font-bold text-xs">{formatCurrency(row.totalPrice)}</span> },
                 { key: 'date', label: 'Date', render: (row) => <span className="text-xs text-slate-500">{formatDate(row.date)}</span> },
                 { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
               ]}
               data={user.bookings || []}
               isLoading={false}
             />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        variant={confirmModal.type === 'block' ? 'danger' : 'warning'}
        title={`${confirmModal.type === 'block' ? 'Block' : 'Unblock'} ${user.name}?`}
        description={`Are you sure you want to ${confirmModal.type} this user? This will affect their ability to use the platform.`}
        onConfirm={handleStatusToggle}
        onCancel={() => setConfirmModal({ isOpen: false, type: '' })}
      />
    </div>
  );
};

export default UserDetailPage;

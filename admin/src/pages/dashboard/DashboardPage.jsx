import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, Users, Briefcase, CalendarCheck, 
  ArrowUpRight, ArrowDownRight, RefreshCw, 
  AlertTriangle, ExternalLink, UserPlus, 
  BarChart, Wallet, ShieldCheck, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart as ReBarChart,
  Bar
} from 'recharts';
import StatsCard from '../../components/ui/StatsCard';
import DataTable from '../../components/ui/DataTable';
import ChartCard from '../../components/shared/ChartCard';
import StatusBadge from '../../components/shared/StatusBadge';
import Avatar from '../../components/shared/Avatar';
import axios from '../../lib/axios';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { CHART_COLORS, STATUS_COLORS, customTooltipFormatter } from '../../utils/chartHelpers';
import { useSocket } from '../../hooks/useSocket';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { subscribe } = useSocket();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, bookingsRes, providersRes] = await Promise.all([
        axios.get('/admin/dashboard/stats'),
        axios.get(\`/admin/dashboard/revenue-chart?period=\${period}\`),
        axios.get('/admin/dashboard/recent-bookings'),
        axios.get('/admin/dashboard/top-providers')
      ]);

      setStats(statsRes.data.data);
      setRevenueData(revenueRes.data.data);
      setRecentBookings(bookingsRes.data.data);
      setTopProviders(providersRes.data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  useEffect(() => {
    subscribe('booking:new', () => {
       fetchDashboardData();
    });
    subscribe('payment:received', (data) => {
       // Live update revenue without full refresh
       setStats(prev => ({
         ...prev,
         totalRevenue: prev.totalRevenue + data.amount
       }));
    });
  }, [subscribe]);

  const bookingDistributionData = [
    { name: 'Pending', value: stats?.bookingDistribution?.pending || 0, color: STATUS_COLORS.pending },
    { name: 'Confirmed', value: stats?.bookingDistribution?.confirmed || 0, color: STATUS_COLORS.confirmed },
    { name: 'Ongoing', value: stats?.bookingDistribution?.ongoing || 0, color: STATUS_COLORS.ongoing },
    { name: 'Completed', value: stats?.bookingDistribution?.completed || 0, color: STATUS_COLORS.completed },
    { name: 'Cancelled', value: stats?.bookingDistribution?.cancelled || 0, color: STATUS_COLORS.cancelled },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* SECTION 1: Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h2>
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Live</span>
             </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            Welcome back, System Admin <span className="text-slate-300">•</span> {formatDate(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex shadow-sm">
             {['7d', '30d', '90d'].map((p) => (
               <button
                 key={p}
                 onClick={() => setPeriod(p)}
                 className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all \${
                   period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                 }\`}
               >
                 {p.toUpperCase()}
               </button>
             ))}
          </div>
          <button 
            onClick={fetchDashboardData}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all group"
            title={\`Last updated at \${lastUpdated.toLocaleTimeString()}\`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : 'group-active:rotate-180 transition-transform'} />
          </button>
        </div>
      </div>

      {/* SECTION 2: Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Gross Revenue"
          value={stats?.totalRevenue || 0}
          prefix="₹"
          change={12.5}
          changeLabel="vs last week"
          icon={IndianRupee}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          isLoading={loading}
        />
        <StatsCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          change={8.2}
          changeLabel="vs last week"
          icon={CalendarCheck}
          iconColor="text-indigo-500"
          iconBg="bg-indigo-50 dark:bg-indigo-500/10"
          isLoading={loading}
        />
        <StatsCard
          title="Registered Users"
          value={stats?.totalUsers || 0}
          change={5.4}
          changeLabel="new today"
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          isLoading={loading}
        />
        <StatsCard
          title="Active Providers"
          value={stats?.activeProviders || 0}
          suffix={\` / \${stats?.totalProviders || 0}\`}
          icon={Briefcase}
          iconColor="text-amber-500"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          isLoading={loading}
        />
      </div>

      {/* SECTION 3: Alert Banner */}
      {stats?.pendingVerifications > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600">
                 <AlertTriangle size={24} />
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 dark:text-white">Pending Verifications</h4>
                 <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">There are <span className="font-extrabold text-amber-600">{stats.pendingVerifications} service providers</span> awaiting document verification.</p>
              </div>
           </div>
           <button className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
              Verify Now <ExternalLink size={16} />
           </button>
        </div>
      )}

      {/* SECTION 4: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Growth" subtitle="Daily transaction volume" onRefresh={fetchDashboardData}>
             <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
                   <XAxis 
                     dataKey="date" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                     dy={10}
                   />
                   <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                     tickFormatter={(val) => \`₹\${val/1000}K\`}
                   />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', padding: '12px' }}
                     itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                     labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px', fontWeight: 'bold' }}
                     formatter={(value) => [\`₹\${value.toLocaleString()}\`, 'Revenue']}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="revenue" 
                     stroke="#6366f1" 
                     strokeWidth={4}
                     fillOpacity={1} 
                     fill="url(#colorRev)" 
                     animationDuration={1500}
                   />
                </AreaChart>
             </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Booking Distribution Pie Chart */}
        <div className="lg:col-span-1">
          <ChartCard title="Booking Distribution" subtitle="Status breakdown" onRefresh={fetchDashboardData}>
             <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                   <Pie
                     data={bookingDistributionData}
                     innerRadius={80}
                     outerRadius={110}
                     paddingAngle={5}
                     dataKey="value"
                     animationDuration={1500}
                   >
                     {bookingDistributionData.map((entry, index) => (
                       <Cell key={\`cell-\${index}\`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', padding: '12px' }}
                     itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                   />
                   <Legend 
                     verticalAlign="bottom" 
                     iconType="circle"
                     formatter={(value) => <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{value}</span>}
                   />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40px] text-center">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{stats?.totalBookings || 0}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Total Bookings</p>
             </div>
          </ChartCard>
        </div>
      </div>

      {/* SECTION 5: Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings Table */}
        <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">Recent Bookings</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Last 10 platform activities</p>
              </div>
              <button className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-slate-100 dark:border-slate-800">
                View All
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                   <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                   {recentBookings.map((booking) => (
                     <tr key={booking._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <Avatar name={booking.user?.name} size="sm" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{booking.user?.name}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-xs font-medium text-slate-500">{booking.service?.name}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-xs text-slate-900 dark:text-white">
                           {formatCurrency(booking.totalPrice)}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <StatusBadge status={booking.status} />
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
           </div>
        </div>

        {/* Top Providers List */}
        <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">Top Service Providers</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Based on performance metrics</p>
              </div>
              <button className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-slate-100 dark:border-slate-800">
                Analytics
              </button>
           </div>
           <div className="p-6 space-y-5">
              {topProviders.map((provider, index) => (
                <div key={provider._id} className="flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="relative">
                         <Avatar name={provider.businessName} size="md" />
                         <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-lg \${
                           index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-300' : index === 2 ? 'bg-orange-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                         }\`}>
                            {index + 1}
                         </div>
                      </div>
                      <div>
                         <p className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{provider.businessName}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{provider.category?.name || 'Home Services'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">{formatCurrency(provider.stats?.totalEarnings || 0)}</p>
                      <p className="text-[10px] font-bold text-emerald-500">{provider.stats?.totalBookings || 0} Jobs</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

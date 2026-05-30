import React, { useEffect, useState } from 'react';
import { 
  Users, Briefcase, CalendarCheck, CreditCard, 
  TrendingUp, Clock, MapPin, Filter, Download, RefreshCw, ChevronRight
} from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import RevenueChart from './RevenueChart';
import CategoryDistribution from './CategoryDistribution';
import { axiosInstance as axios } from '../../lib/axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [bookingChart, setBookingChart] = useState(null);
  const [geographicData, setGeographicData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const [statsRes, revenueRes, bookingRes, geoRes] = await Promise.all([
        axios.get('/admin/dashboard/stats'),
        axios.get('/admin/dashboard/revenue-chart?period=30d'),
        axios.get('/admin/dashboard/booking-chart?period=30d'),
        axios.get('/admin/dashboard/geographic')
      ]);

      setStats(statsRes.data.data);
      setRevenueData(revenueRes.data.data.chartData || []);
      setBookingChart(bookingRes.data.data);
      setGeographicData(geoRes.data.data.topAreas || []);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Map category breakdown to format expected by CategoryDistribution
  const categoryBreakdown = bookingChart?.categoryBreakdown?.map(item => ({
    categoryName: item._id || 'Other',
    count: item.count || 0
  })) || [];

  // Format date helper
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Workzarr Bharat Service Hub performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchStats}
            className={`p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Platform Revenue (Commission)"
          value={stats?.revenue?.totalRevenue || 0}
          change={stats?.revenue?.revenueGrowth ? parseFloat(stats.revenue.revenueGrowth) : 0}
          changeLabel="vs last month"
          icon={CreditCard}
          prefix="₹"
          iconColor="text-orange-500"
          iconBg="bg-orange-50 dark:bg-orange-500/10"
          isLoading={loading}
        />
        <StatsCard
          title="Registered Customers"
          value={stats?.users?.totalUsers || 0}
          change={8.2}
          changeLabel="vs last week"
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          isLoading={loading}
        />
        <StatsCard
          title="Verified Providers"
          value={stats?.providers?.verifiedProviders || 0}
          suffix={` / ${stats?.providers?.totalProviders || 0}`}
          icon={Briefcase}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          isLoading={loading}
        />
        <StatsCard
          title="Completed Bookings"
          value={stats?.bookings?.completedBookings || 0}
          change={24.8}
          changeLabel="vs last month"
          icon={CalendarCheck}
          iconColor="text-amber-500"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          isLoading={loading}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} isLoading={loading} />
        </div>

        {/* Category Distribution */}
        <div>
          <CategoryDistribution data={categoryBreakdown} isLoading={loading} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Recent Bookings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activities</h3>
              <p className="text-xs text-slate-500 font-medium">Latest bookings placed on the platform</p>
            </div>
            <button className="text-sm font-bold text-orange-500 hover:text-orange-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4 flex-1">
            {stats?.recentActivity?.recentBookings?.length > 0 ? (
              stats.recentActivity.recentBookings.slice(0, 5).map((booking) => (
                <div key={booking._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-orange-500 border border-orange-100 dark:border-orange-500/20">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {booking.customer?.name || 'Customer'} hired {booking.provider?.businessName || 'Provider'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Booking ID: <span className="font-semibold">{booking.bookingId}</span> • {formatTimeAgo(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">₹{booking.amount || booking.price}</span>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider ${
                        booking.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                        booking.status === 'cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' :
                        'bg-orange-50 text-orange-600 dark:bg-orange-500/10'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-medium">
                <p>No recent bookings found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Geographic Reach */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Geographic Reach</h3>
              <p className="text-xs text-slate-500 font-medium">Top active towns in Bharat</p>
            </div>
            <MapPin size={20} className="text-slate-400" />
          </div>
          <div className="space-y-4">
            {geographicData.length > 0 ? (
              geographicData.slice(0, 5).map((item) => {
                const maxBookings = Math.max(...geographicData.map(g => g.totalBookings || 1));
                const percentage = Math.round(((item.totalBookings || 0) / maxBookings) * 100);
                return (
                  <div key={item.town} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{item.town} ({item.state})</span>
                      <span className="text-slate-500">{item.totalBookings} Bookings • {item.totalProviders} Pros</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-medium">
                <p>No geographic data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

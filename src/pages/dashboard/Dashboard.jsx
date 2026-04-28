import React, { useEffect, useState } from 'react';
import { 
  Users, Briefcase, CalendarCheck, CreditCard, 
  TrendingUp, TrendingDown, Clock, MapPin, 
  Filter, Download, RefreshCw
} from 'lucide-react';
import StatsCard from '../../components/ui/StatsCard';
import RevenueChart from './RevenueChart';
import CategoryDistribution from './CategoryDistribution';
import axios from '../../lib/axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const { data } = await axios.get('/admin/dashboard/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Platform performance at a glance</p>
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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={stats?.revenue?.total?.toLocaleString() || '0'}
          change={12.5}
          changeLabel="vs last month"
          icon={CreditCard}
          prefix="₹"
          isLoading={loading}
        />
        <StatsCard
          title="Active Users"
          value={stats?.users?.total?.toLocaleString() || '0'}
          change={8.2}
          changeLabel="vs last month"
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-100 dark:bg-blue-500/10"
          isLoading={loading}
        />
        <StatsCard
          title="Verified Providers"
          value={stats?.providers?.verified?.toLocaleString() || '0'}
          change={-2.4}
          changeLabel="vs last month"
          icon={Briefcase}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-100 dark:bg-emerald-500/10"
          isLoading={loading}
        />
        <StatsCard
          title="Completed Bookings"
          value={stats?.bookings?.completed?.toLocaleString() || '0'}
          change={24.8}
          changeLabel="vs last month"
          icon={CalendarCheck}
          iconColor="text-amber-500"
          iconBg="bg-amber-100 dark:bg-amber-500/10"
          isLoading={loading}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart data={stats?.revenue?.growth || []} isLoading={loading} />
        </div>

        {/* Category Distribution */}
        <div>
          <CategoryDistribution data={stats?.bookings?.byCategory || []} isLoading={loading} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Recent Activity Placeholder or real data */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent System Events</h3>
            <button className="text-sm font-bold text-indigo-500 hover:underline">View All</button>
          </div>
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Provider "Rahul S." verified successfully</p>
                  <p className="text-xs text-slate-500 mt-0.5">2 minutes ago • System Audit</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Geographic Reach</h3>
            <MapPin size={20} className="text-slate-400" />
          </div>
          <div className="space-y-4">
             {[
               { name: 'Mumbai', count: 1240, percentage: 85 },
               { name: 'Delhi', count: 980, percentage: 70 },
               { name: 'Bangalore', count: 750, percentage: 55 },
               { name: 'Hyderabad', count: 420, percentage: 30 }
             ].map((city) => (
               <div key={city.name} className="space-y-2">
                 <div className="flex justify-between text-sm font-medium">
                   <span>{city.name}</span>
                   <span className="text-slate-500">{city.count} Bookings</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                     style={{ width: `${city.percentage}%` }}
                   ></div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

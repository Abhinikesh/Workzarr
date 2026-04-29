import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, 
  MapPin, PieChart as PieChartIcon, 
  Download, Calendar, RefreshCw 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, 
  Bar, PieChart, Pie, Cell, Legend,
  ComposedChart, Line
} from 'recharts';
import PageHeader from '../../components/shared/PageHeader';
import ChartCard from '../../components/shared/ChartCard';
import StatsCard from '../../components/ui/StatsCard';
import AnalyticsService from '../../services/analytics.service';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/chartHelpers';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [revenueData, setRevenueData] = useState([]);
  const [bookingFunnel, setBookingFunnel] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [geoData, setGeoData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, bookRes, catRes, geoRes] = await Promise.all([
        AnalyticsService.getRevenueAnalytics(period),
        AnalyticsService.getBookingAnalytics(period),
        AnalyticsService.getCategoryPerformance(),
        AnalyticsService.getGeoAnalytics()
      ]);
      setRevenueData(revRes.data);
      setBookingFunnel(bookRes.data);
      setCategoryData(catRes.data);
      setGeoData(geoRes.data);
    } catch (error) {
      console.error('Analytics fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Intelligence & Analytics" 
        subtitle="Deep insights into platform growth, user behavior and market trends"
        actions={
          <div className="flex items-center gap-3">
             <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex shadow-sm">
                {['7d', '30d', '90d', '12m'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
             </div>
             <button onClick={fetchData} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
          </div>
        }
      />

      {/* SECTION 1: Revenue vs Commission */}
      <ChartCard 
        title="Financial Growth Matrix" 
        subtitle="Revenue vs Platform Commission Trends"
        isLoading={loading}
      >
        <ResponsiveContainer width="100%" height={400}>
           <ComposedChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', padding: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="revenue" fill="#6366f1" fillOpacity={0.1} stroke="#6366f1" strokeWidth={3} />
              <Bar dataKey="commission" barSize={20} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="bookings" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
           </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* SECTION 2: Category Performance */}
         <ChartCard title="Category Dominance" subtitle="Market share by booking volume" isLoading={loading}>
            <ResponsiveContainer width="100%" height={350}>
               <BarChart data={categoryData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#888888" opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px' }}
                  />
                  <Bar dataKey="bookings" radius={[0, 10, 10, 0]} barSize={24}>
                     {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </ChartCard>

         {/* SECTION 3: Booking Conversion Funnel */}
         <ChartCard title="Operational Efficiency" subtitle="Booking funnel conversion rates" isLoading={loading}>
            <div className="flex flex-col h-full justify-center space-y-6 px-12">
               {bookingFunnel.map((step, i) => (
                  <div key={i} className="relative">
                     <div 
                       className="h-12 bg-indigo-600 rounded-2xl flex items-center justify-between px-6 text-white font-extrabold shadow-xl shadow-indigo-600/20"
                       style={{ width: `${100 - (i * 15)}%`, margin: '0 auto' }}
                     >
                        <span className="text-xs uppercase tracking-widest">{step.label}</span>
                        <span>{formatNumber(step.value)}</span>
                     </div>
                     {i < bookingFunnel.length - 1 && (
                       <div className="flex flex-col items-center py-2">
                          <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700" />
                          <span className="text-[10px] font-extrabold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                             {Math.round((bookingFunnel[i+1].value / step.value) * 100)}% Conversion
                          </span>
                       </div>
                     )}
                  </div>
               ))}
            </div>
         </ChartCard>
      </div>

      {/* SECTION 4: Town Heatmap Analytics */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Geographic Market Intelligence</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">High demand areas vs Provider density</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700">
               <MapPin size={16} /> View Global Map
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {geoData.map((town, i) => (
              <div key={i} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all group">
                 <div className="flex items-start justify-between mb-4">
                    <h4 className="font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{town.name}</h4>
                    <div className="flex items-center gap-1 text-emerald-500 font-extrabold text-[10px]">
                       <TrendingUp size={12} /> +{town.growth}%
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                       <span>Market Demand</span>
                       <span className="text-slate-900 dark:text-white">{town.bookings} Bookings</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500" style={{ width: `${(town.bookings / 1000) * 100}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-2">
                       <span>Provider Supply</span>
                       <span className="text-slate-900 dark:text-white">{town.providers} Verified</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500" style={{ width: `${(town.providers / 100) * 100}%` }} />
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
const CHART_COLORS_SET = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

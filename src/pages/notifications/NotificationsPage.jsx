import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Send, History, Bell, Users, 
  Smartphone, MessageSquare, Mail,
  Calendar, CheckCircle2, Clock, 
  AlertTriangle, Filter, Eye, X,
  Briefcase, Crown, MapPin, Search
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/shared/Badge';
import NotificationsService from '../../services/notifications.service';
import { formatNumber, formatDate } from '../../utils/formatters';

const broadcastSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500),
  target: z.enum(['all', 'users', 'providers', 'premium', 'towns']),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  scheduleAt: z.string().optional(),
});

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('broadcast');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reach, setReach] = useState(0);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { target: 'all', channels: ['push', 'in_app'] }
  });

  const selectedTarget = watch('target');
  const messageBody = watch('message') || '';

  const fetchHistory = async () => {
    try {
      const res = await NotificationsService.getBroadcastHistory();
      setHistory(res.data.history);
      const alertsRes = await NotificationsService.getSystemAlerts();
      setAlerts(alertsRes.data.alerts);
    } catch (error) {
      console.error('Fetch notifications failed', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'alerts') {
      fetchHistory();
    }
  }, [activeTab]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await NotificationsService.sendBroadcast(data);
      setActiveTab('history');
    } catch (error) {
      console.error('Broadcast failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Communications Hub" 
        subtitle="Global broadcasts, targeted messaging and system alerts"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl w-fit shadow-sm">
         {[
           { id: 'broadcast', label: 'Send Broadcast', icon: Send },
           { id: 'history', label: 'Campaign History', icon: History },
           { id: 'alerts', label: 'System Alerts', icon: Bell }
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all \${
               activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
             }\`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           {/* Form Section */}
           <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                 <div className="space-y-6">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                       <MessageSquare size={20} className="text-indigo-500" /> Message Composition
                    </h3>
                    
                    <div>
                       <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 ml-1">Notification Title</label>
                       <input 
                         {...register('title')}
                         placeholder="e.g. Flash Sale: 20% off on all cleaning services!"
                         className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all"
                       />
                       {errors.title && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.title.message}</p>}
                    </div>

                    <div>
                       <div className="flex justify-between items-center mb-2 ml-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Message Body</label>
                          <span className={`text-[10px] font-extrabold \${messageBody.length > 450 ? 'text-red-500' : 'text-slate-400'}\`}>
                             {messageBody.length} / 500
                          </span>
                       </div>
                       <textarea 
                         {...register('message')}
                         placeholder="Describe your announcement in detail..."
                         className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 h-32 font-medium transition-all"
                       />
                       {errors.message && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.message.message}</p>}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                       <Users size={20} className="text-indigo-500" /> Audience Segmentation
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {[
                         { id: 'all', label: 'Everyone', icon: Users, desc: 'All active accounts' },
                         { id: 'users', label: 'Customers', icon: Smartphone, desc: 'Service seekers only' },
                         { id: 'providers', label: 'Providers', icon: Briefcase, desc: 'All service providers' },
                         { id: 'premium', label: 'Premium', icon: Crown, desc: 'Paid subscribers' },
                         { id: 'towns', label: 'Localities', icon: MapPin, desc: 'Target by region' }
                       ].map((opt) => (
                         <button
                           key={opt.id}
                           type="button"
                           onClick={() => setValue('target', opt.id)}
                           className={`p-4 rounded-2xl border text-left transition-all group \${
                             selectedTarget === opt.id 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-300'
                           }\`}
                         >
                            <opt.icon size={24} className={selectedTarget === opt.id ? 'text-white' : 'text-indigo-500'} />
                            <p className={`text-xs font-extrabold mt-3 uppercase tracking-widest \${selectedTarget === opt.id ? 'text-white' : 'text-slate-900 dark:text-white'}\`}>{opt.label}</p>
                            <p className={`text-[10px] font-bold mt-1 \${selectedTarget === opt.id ? 'text-white/60' : 'text-slate-400'}\`}>{opt.desc}</p>
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-4">
                       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Channels:</p>
                       <div className="flex items-center gap-3">
                          {['push', 'sms', 'in_app'].map(c => (
                            <label key={c} className="flex items-center gap-2 cursor-pointer group">
                               <input type="checkbox" value={c} defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                               <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase group-hover:text-indigo-600 transition-colors">{c.replace('_', ' ')}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                       {loading ? <Clock className="animate-spin" size={20} /> : <Send size={20} />}
                       Broadcast Message
                    </button>
                 </div>
              </form>
           </div>

           {/* Preview Section */}
           <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />
                 <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mb-4">Mobile Push Preview</p>
                 <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                       <ShieldCheck size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-xs font-extrabold text-white truncate">{watch('title') || 'Notification Title'}</p>
                       <p className="text-[11px] font-medium text-white/60 line-clamp-2 mt-0.5">{watch('message') || 'Message preview will appear here as you type...'}</p>
                    </div>
                 </div>
                 <div className="mt-8 flex justify-center">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                 </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-500/5 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-500/20">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600">
                       <Users size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Estimated Reach</p>
                       <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">~4,850 Accounts</h4>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <DataTable 
          columns={[
            { key: 'title', label: 'Campaign Title', render: (row) => <span className="text-xs font-bold text-slate-900 dark:text-white">{row.title}</span> },
            { key: 'target', label: 'Audience', render: (row) => <Badge label={row.target} variant="indigo" size="sm" /> },
            { key: 'reach', label: 'Reach', render: (row) => <span className="text-xs font-extrabold text-slate-600">{formatNumber(row.sentCount)}</span> },
            { key: 'success', label: 'Success', render: (row) => (
              <div className="w-full max-w-[100px] flex flex-col gap-1">
                 <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: \`\${(row.sentCount / (row.sentCount + row.failedCount)) * 100}%\` }} />
                 </div>
                 <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{Math.round((row.sentCount / (row.sentCount + row.failedCount)) * 100)}% Delivered</span>
              </div>
            )},
            { key: 'date', label: 'Sent Date', render: (row) => <span className="text-xs text-slate-400">{formatDate(row.createdAt)}</span> }
          ]}
          data={history}
        />
      )}
    </div>
  );
};

export default NotificationsPage;
const ShieldCheck = () => <div className="w-full h-full" />

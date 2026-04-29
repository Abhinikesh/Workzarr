import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, FileText, 
  CheckCircle, XCircle, ChevronRight, 
  Search, AlertCircle, Filter, 
  MapPin, Calendar, Briefcase, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import ProvidersService from '../../services/providers.service';
import { formatDate } from '../../utils/formatters';

const PendingVerificationsPage = () => {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, priority: 0, avgWait: 0 });

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await ProvidersService.getPendingVerifications();
      setPending(data.data.providers);
      setStats(data.data.stats);
    } catch (error) {
      console.error('Failed to fetch pending verifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Verification Queue" 
        subtitle="Review and approve new service provider profiles"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 flex items-center gap-4">
           <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <ShieldCheck size={28} />
           </div>
           <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Pending</p>
              <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total} Profiles</h4>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 flex items-center gap-4">
           <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600">
              <AlertCircle size={28} />
           </div>
           <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Priority Queue</p>
              <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.priority} Overdue</h4>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 flex items-center gap-4">
           <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <Clock size={28} />
           </div>
           <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Avg. Wait Time</p>
              <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.avgWait} Days</h4>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         {pending.map((item) => {
           const daysWaiting = Math.floor((new Date() - new Date(item.verificationRequestedAt)) / (1000 * 60 * 60 * 24));
           return (
             <div key={item._id} className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 p-6 flex flex-col md:flex-row gap-6 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all group">
                <div className="flex-shrink-0">
                   <Avatar name={item.businessName} src={item.logo} size="xl" />
                </div>
                
                <div className="flex-1 flex flex-col">
                   <div className="flex items-start justify-between mb-4">
                      <div>
                         <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {item.businessName}
                         </h3>
                         <div className="flex items-center gap-2 mt-1">
                            <Badge label={item.category?.name} variant="default" size="sm" />
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                               <MapPin size={10} /> {item.town || 'District'}
                            </span>
                         </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                        daysWaiting >= 3 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                         {daysWaiting} Days Waiting
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-6">
                      {item.documents?.map(doc => (
                        <div key={doc._id} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                           <FileText size={16} className="text-slate-400" />
                           <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate uppercase">{doc.type.replace('_', ' ')}</span>
                           <div className="ml-auto">
                              {doc.status === 'verified' ? (
                                <CheckCircle size={14} className="text-emerald-500" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              )}
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                         <Calendar size={12} />
                         Requested on {formatDate(item.verificationRequestedAt)}
                      </div>
                      <button 
                        onClick={() => navigate(`/providers/${item._id}`)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                      >
                         Review <ChevronRight size={16} />
                      </button>
                   </div>
                </div>
             </div>
           );
         })}

         {!loading && pending.length === 0 && (
           <div className="col-span-full py-20 bg-white dark:bg-slate-800 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6">
                 <ShieldCheck size={40} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Zero Pending Tasks</h3>
              <p className="text-slate-500 font-medium max-w-xs">All service providers have been successfully verified. Great job!</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default PendingVerificationsPage;

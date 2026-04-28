import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Settings, Percent, CreditCard, 
  ShieldAlert, Smartphone, Clock, 
  Save, AlertTriangle, CheckCircle2,
  MapPin, Bell, ShieldCheck, 
  Trash2, Plus, Info
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SettingsService from '../../services/settings.service';
import { toast } from 'sonner';

const commissionSchema = z.object({
  defaultCommission: z.number().min(0).max(50),
  premiumCommission: z.number().min(0).max(50),
  providerThreshold: z.number().min(0),
});

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('commission');
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(commissionSchema),
    defaultValues: { defaultCommission: 15, premiumCommission: 10, providerThreshold: 5000 }
  });

  const onSaveSettings = async (data) => {
    setLoading(true);
    try {
      await SettingsService.updateSettings(activeTab, data);
    } catch (error) {
      console.error('Settings update failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Platform Governance" 
        subtitle="Manage global commission structures, business rules and system maintenance"
      />

      <div className="flex flex-col lg:flex-row gap-10">
         {/* Sidebar Navigation */}
         <div className="w-full lg:w-72 space-y-2">
            {[
              { id: 'commission', label: 'Commission Rules', icon: Percent },
              { id: 'payouts', label: 'Payout Thresholds', icon: CreditCard },
              { id: 'booking', label: 'Booking Logic', icon: Clock },
              { id: 'radius', label: 'Service Coverage', icon: MapPin },
              { id: 'app', label: 'Version Control', icon: Smartphone },
              { id: 'maintenance', label: 'Maintenance Mode', icon: ShieldAlert, danger: true }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all \${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                    : item.danger 
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20' 
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }\`}
              >
                 <item.icon size={18} />
                 {item.label}
              </button>
            ))}
         </div>

         {/* Settings Content Area */}
         <div className="flex-1 bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm min-h-[600px]">
            {activeTab === 'commission' && (
              <form onSubmit={handleSubmit(onSaveSettings)} className="space-y-10">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Revenue Sharing Model</h3>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Configure automated platform deductions</p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={!isDirty || loading}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                    >
                       <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                       <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Standard Commission (%)</label>
                       <div className="relative">
                          <input 
                            {...register('defaultCommission', { valueAsNumber: true })}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-lg font-extrabold focus:border-indigo-500" 
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-extrabold text-xl">%</div>
                       </div>
                       <p className="text-[10px] font-medium text-slate-500 italic">Applied to all standard service bookings</p>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                       <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Premium Provider Rate (%)</label>
                       <div className="relative">
                          <input 
                            {...register('premiumCommission', { valueAsNumber: true })}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-lg font-extrabold focus:border-emerald-500" 
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-extrabold text-xl">%</div>
                       </div>
                       <p className="text-[10px] font-medium text-emerald-500 font-bold italic">Lower rate for premium platform subscribers</p>
                    </div>

                    <div className="md:col-span-2 p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 flex gap-6">
                       <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                          <Info size={24} />
                       </div>
                       <div>
                          <h4 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-400">Commission Policy Impact</h4>
                          <p className="text-xs font-medium text-indigo-700/60 dark:text-indigo-400/60 mt-1 leading-relaxed">
                             Changes to commission rates will take effect immediately for all <span className="font-bold">new bookings</span>. Existing bookings will retain the commission rate at the time of creation.
                          </p>
                       </div>
                    </div>
                 </div>
              </form>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-10">
                 <div>
                    <h3 className="text-xl font-extrabold text-red-600">Maintenance Protocol</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Restrict platform access for critical updates</p>
                 </div>

                 <div className="bg-red-50 dark:bg-red-500/5 border-2 border-dashed border-red-200 dark:border-red-900/30 p-10 rounded-[40px] flex flex-col items-center text-center space-y-6">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-600 animate-pulse">
                       <ShieldAlert size={48} />
                    </div>
                    <div className="max-w-md">
                       <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">System Online</h4>
                       <p className="text-sm font-medium text-slate-500 leading-relaxed">
                          Enabling maintenance mode will disconnect all active mobile apps and web users. Only verified administrators will be able to bypass the block.
                       </p>
                    </div>
                    <button 
                      onClick={() => setIsMaintenanceOpen(true)}
                      className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white rounded-[24px] font-bold shadow-2xl shadow-red-600/30 transition-all active:scale-95"
                    >
                       Activate Maintenance Mode
                    </button>
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SettingsPage;

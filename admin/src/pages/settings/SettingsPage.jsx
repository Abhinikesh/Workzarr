import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Shield, IndianRupee, Bell, 
  Globe, Server, HardDrive, Lock, RefreshCw,
  AlertTriangle, CheckCircle
} from 'lucide-react';
import axios from '../../lib/axios';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/admin/settings');
      setSettings(data.data);
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.patch('/admin/settings', settings);
      setMessage({ type: 'success', text: 'Settings updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse flex items-center justify-center h-64 text-slate-400 font-bold">Initializing system configurations...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-slate-400" size={24} />
            System Settings
          </h2>
          <p className="text-slate-500">Configure global platform behavior and business rules</p>
        </div>
        <button 
          onClick={handleUpdate}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 disabled:bg-indigo-400 transition-all"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          Save All Changes
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Marketplace Rules */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
           <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600">
                <IndianRupee size={18} />
              </div>
              <h3 className="font-bold text-lg">Revenue Rules</h3>
           </div>

           <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Platform Commission (%)</label>
                <input 
                  type="number"
                  value={settings?.platformCommission || 0}
                  onChange={(e) => setSettings({ ...settings, platformCommission: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Minimum Booking Amount</label>
                <input 
                  type="number"
                  value={settings?.minBookingAmount || 0}
                  onChange={(e) => setSettings({ ...settings, minBookingAmount: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
           </div>
        </section>

        {/* System Operations */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
           <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-lg text-amber-600">
                <Server size={18} />
              </div>
              <h3 className="font-bold text-lg">System Controls</h3>
           </div>

           <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Redirect users to status page</p>
                </div>
                <button 
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings?.maintenanceMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings?.maintenanceMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Provider Auto-Verification</p>
                  <p className="text-xs text-slate-500">Skip manual document review</p>
                </div>
                <button 
                  onClick={() => setSettings({ ...settings, autoVerifyProviders: !settings.autoVerifyProviders })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings?.autoVerifyProviders ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings?.autoVerifyProviders ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
           </div>
        </section>

        {/* Support & Contact */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 md:col-span-2">
           <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg text-indigo-600">
                <Globe size={18} />
              </div>
              <h3 className="font-bold text-lg">Global Contact Details</h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Support Email</label>
                <input 
                  type="email"
                  value={settings?.supportEmail || ''}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Support Phone</label>
                <input 
                  type="text"
                  value={settings?.supportPhone || ''}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-all"
                />
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;

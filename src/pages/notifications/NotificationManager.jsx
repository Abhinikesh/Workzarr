import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, Trash2, CheckCircle, Clock, 
  Users, Briefcase, Globe, Info, AlertTriangle, RefreshCw
} from 'lucide-react';
import axios from '../../lib/axios';

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', target: 'all', type: 'info' });

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/admin/notifications');
      setNotifications(data.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      await axios.post('/admin/notifications/broadcast', formData);
      setFormData({ title: '', message: '', target: 'all', type: 'info' });
      fetchNotifications();
    } catch (error) {
      alert(error.response?.data?.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Broadcast Form */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Send className="text-indigo-500" size={20} />
            Broadcast Notification
          </h3>
          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Audience</label>
              <select 
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
              >
                <option value="all">Everyone (All Users)</option>
                <option value="user">Customers Only</option>
                <option value="provider">Service Providers Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notification Type</label>
              <div className="flex gap-2">
                {['info', 'success', 'warning'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-extrabold uppercase transition-all ${
                      formData.type === type 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' 
                        : 'border-slate-100 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-all"
                placeholder="Important Announcement"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Message</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium outline-none focus:border-indigo-500 transition-all min-h-[120px]"
                placeholder="Enter notification content here..."
              />
            </div>
            <button 
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2"
            >
              {sending ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
              Broadcast Now
            </button>
          </form>
        </div>
      </div>

      {/* History List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Recent Notifications</h3>
          <button onClick={fetchNotifications} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 w-full bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
             <Bell className="mx-auto text-slate-200 dark:text-slate-700 mb-4" size={48} />
             <p className="text-slate-400 font-bold">No notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-4">
             {notifications.map((notif) => (
               <div key={notif._id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                  <div className="flex items-start justify-between">
                     <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'info' ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/10' :
                          notif.type === 'success' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' :
                          'bg-amber-50 text-amber-500 dark:bg-amber-500/10'
                        }`}>
                           {notif.target === 'all' ? <Globe size={20} /> : 
                            notif.target === 'user' ? <Users size={20} /> : <Briefcase size={20} />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {new Date(notif.createdAt).toLocaleDateString()}</span>
                           </div>
                           <p className="text-sm text-slate-500 dark:text-slate-400">{notif.message}</p>
                           <div className="flex items-center gap-3 mt-3">
                              <span className="text-[10px] font-extrabold text-indigo-500 uppercase">Target: {notif.target}</span>
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Status: Delivered</span>
                           </div>
                        </div>
                     </div>
                     <button className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={18} />
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManager;

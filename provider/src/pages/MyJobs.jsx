import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Calendar, Star, Clock, MapPin, Inbox, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MyJobs = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // active, upcoming, completed, cancelled
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [otpVal, setOtpVal] = useState('');
  const [otpTargetId, setOtpTargetId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/bookings');
      setBookings(res.data.data.bookings || []);
    } catch (err) {
      toast.error('Failed to load your gig bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId, nextStatus) => {
    if (nextStatus === 'in_progress') {
      if (!otpVal.trim()) {
        setOtpTargetId(bookingId);
        toast.error('Please enter the 4-digit customer OTP to start the job');
        return;
      }
      if (!/^\d{4}$/.test(otpVal)) {
        toast.error('OTP must be exactly 4 digits');
        return;
      }
    }

    setUpdating(true);
    try {
      const payload = { status: nextStatus };
      if (nextStatus === 'in_progress') {
        payload.otp = otpVal.trim();
      }

      await axiosInstance.patch(`/bookings/${bookingId}/status`, payload);
      toast.success(`Job marked as ${nextStatus.replace('_', ' ')}!`);
      
      setOtpVal('');
      setOtpTargetId(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setUpdating(false);
    }
  };

  // Status partitions
  const activeStatuses = ['arriving', 'in_progress'];
  const upcomingStatuses = ['accepted'];
  const completedStatuses = ['completed'];
  const cancelledStatuses = ['cancelled', 'no_show'];

  const getFilteredBookings = () => {
    if (activeTab === 'active') {
      return bookings.filter((b) => activeStatuses.includes(b.status));
    } else if (activeTab === 'upcoming') {
      return bookings.filter((b) => upcomingStatuses.includes(b.status));
    } else if (activeTab === 'completed') {
      return bookings.filter((b) => completedStatuses.includes(b.status));
    } else {
      return bookings.filter((b) => cancelledStatuses.includes(b.status));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">Accepted</span>;
      case 'arriving':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">Arriving</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-50 text-green-700 border border-green-100 uppercase tracking-wider">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-50 text-slate-700 border border-slate-100 uppercase tracking-wider">{status}</span>;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const filtered = getFilteredBookings();

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Gig Jobs</h1>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm">
          {['active', 'upcoming', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setOtpTargetId(null);
                setOtpVal('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b._id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-500 transition-all flex flex-col gap-4 shadow-sm"
              >
                {/* Header panel */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-extrabold text-xs shrink-0">
                      {getInitials(b.customer?.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">{b.serviceInfo?.title || 'Gig Job'}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Client: <span className="text-slate-800 font-bold">{b.customer?.name || 'Local Customer'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-extrabold text-orange-600 text-base">₹{b.totalAmount}</span>
                    {getStatusBadge(b.status)}
                  </div>
                </div>

                {/* Details grid */}
                <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {new Date(b.scheduledDate || b.scheduledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} • {b.scheduledSlot || 'Slot'}
                    </span>
                  </p>
                  
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{b.address?.fullAddress}</span>
                  </p>

                  {/* Customer phone number visible to accepted gigs */}
                  {b.customer?.phone && ['arriving', 'in_progress', 'accepted'].includes(b.status) && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <a href={`tel:${b.customer.phone}`} className="text-orange-600 font-bold hover:underline">
                        +91 {b.customer.phone}
                      </a>
                    </p>
                  )}
                </div>

                {/* Active OTP inputs */}
                {otpTargetId === b._id && b.status === 'arriving' && (
                  <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
                    <label className="block text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                      Enter Customer Booking OTP (4 digits)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="4"
                        value={otpVal}
                        onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-24 bg-white border border-slate-200 rounded-lg text-center text-sm font-bold tracking-widest py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'in_progress')}
                        disabled={updating}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Verify & Start Job
                      </button>
                    </div>
                  </div>
                )}

                {/* Gig Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {activeTab === 'upcoming' && b.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(b._id, 'arriving')}
                      disabled={updating}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs cursor-pointer text-center"
                    >
                      Mark as Arrived
                    </button>
                  )}

                  {activeTab === 'active' && b.status === 'arriving' && otpTargetId !== b._id && (
                    <button
                      onClick={() => setOtpTargetId(b._id)}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs cursor-pointer text-center"
                    >
                      Start Service (OTP)
                    </button>
                  )}

                  {activeTab === 'active' && b.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(b._id, 'completed')}
                      disabled={updating}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs cursor-pointer text-center"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No gigs found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              You do not have any {activeTab} gig jobs currently. Keep your availability switch "Online" to get matched!
            </p>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default MyJobs;

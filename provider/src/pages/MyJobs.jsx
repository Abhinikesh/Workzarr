import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Calendar, Clock, MapPin, Inbox, Phone, Loader2 } from 'lucide-react';
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
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider" style={{ backgroundColor: '#EFF6FF', color: '#1E3A8A', border: '1px solid #DBEAFE' }}>Accepted</span>;
      case 'arriving':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider" style={{ backgroundColor: '#EEF2FF', color: '#3730A3', border: '1px solid #E0E7FF' }}>Arriving</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider" style={{ backgroundColor: '#F3E8FF', color: '#581C87', border: '1px solid #E9D5FF' }}>In Progress</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider" style={{ backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #D1FAE5' }}>Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider" style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider" style={{ backgroundColor: '#F8F8F8', color: '#666666', border: '1px solid #EEEEEE' }}>{status}</span>;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const filtered = getFilteredBookings();

  return (
    <div className="min-h-screen pb-20 lg:pb-8" style={{ backgroundColor: '#F8F8F8' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#1A1A1A' }}>My Gig Jobs</h1>

        {/* Tab Switcher */}
        <div className="flex rounded-xl p-1 shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
          {['active', 'upcoming', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setOtpTargetId(null);
                setOtpVal('');
              }}
              className="flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === tab ? '#FF4500' : 'transparent',
                color: activeTab === tab ? '#FFFFFF' : '#666666'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF4500' }} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b._id}
                className="rounded-2xl p-5 transition-all flex flex-col gap-4 shadow-sm border"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FF4500'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#EEEEEE'}
              >
                {/* Header panel */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full border flex items-center justify-center font-extrabold text-xs shrink-0"
                      style={{ backgroundColor: '#FFF0EB', borderColor: '#FFC0AC', color: '#FF4500' }}>
                      {getInitials(b.customer?.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>{b.serviceInfo?.title || 'Gig Job'}</h4>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>
                        Client: <span className="font-bold" style={{ color: '#1A1A1A' }}>{b.customer?.name || 'Local Customer'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-extrabold text-base" style={{ color: '#FF4500' }}>₹{b.totalAmount}</span>
                    {getStatusBadge(b.status)}
                  </div>
                </div>

                {/* Details grid */}
                <div className="pt-3.5 space-y-2 text-xs font-semibold" style={{ borderTop: '1px solid #F5F5F5', color: '#666666' }}>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" style={{ color: '#999999' }} />
                    <span>
                      {new Date(b.scheduledDate || b.scheduledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} • {b.scheduledSlot || 'Slot'}
                    </span>
                  </p>
                  
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#999999' }} />
                    <span>{b.address?.fullAddress}</span>
                  </p>

                  {/* Customer phone number visible to accepted gigs */}
                  {b.customer?.phone && ['arriving', 'in_progress', 'accepted'].includes(b.status) && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 shrink-0" style={{ color: '#999999' }} />
                      <a href={`tel:${b.customer.phone}`} className="font-bold hover:underline" style={{ color: '#FF4500' }}>
                        +91 {b.customer.phone}
                      </a>
                    </p>
                  )}
                </div>

                {/* Active OTP inputs */}
                {otpTargetId === b._id && b.status === 'arriving' && (
                  <div className="p-3.5 border rounded-xl space-y-2" style={{ backgroundColor: '#FFF0EB', borderColor: '#FFC0AC' }}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#FF4500' }}>
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
                        className="w-24 border rounded-lg text-center text-sm font-bold tracking-widest py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                      />
                      <button
                        onClick={() => handleUpdateStatus(b._id, 'in_progress')}
                        disabled={updating}
                        className="px-4 py-2 text-white text-xs font-bold rounded-lg cursor-pointer"
                        style={{ backgroundColor: '#FF4500' }}
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
                      className="w-full py-3 text-white font-extrabold rounded-xl text-xs cursor-pointer text-center"
                      style={{ backgroundColor: '#FF4500' }}
                    >
                      Mark as Arrived
                    </button>
                  )}

                  {activeTab === 'active' && b.status === 'arriving' && otpTargetId !== b._id && (
                    <button
                      onClick={() => setOtpTargetId(b._id)}
                      className="w-full py-3 text-white font-extrabold rounded-xl text-xs cursor-pointer text-center"
                      style={{ backgroundColor: '#FF4500' }}
                    >
                      Start Service (OTP)
                    </button>
                  )}

                  {activeTab === 'active' && b.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(b._id, 'completed')}
                      disabled={updating}
                      className="w-full py-3 text-white font-extrabold rounded-xl text-xs cursor-pointer text-center"
                      style={{ backgroundColor: '#16A34A' }}
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-16 text-center flex flex-col items-center justify-center border"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 border"
              style={{ backgroundColor: '#F8F8F8', borderColor: '#EEEEEE' }}>
              <Inbox className="w-6 h-6" style={{ color: '#CCCCCC' }} />
            </div>
            <h3 className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>No gigs found</h3>
            <p className="text-xs max-w-sm mt-2 leading-relaxed" style={{ color: '#999999' }}>
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

import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Calendar, Clock, MapPin, Inbox, Loader2, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     bg: '#FFF9EB', color: '#B45309', border: '#FDE68A' },
  accepted:    { label: 'Accepted',    bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  arriving:    { label: 'Arriving',    bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
  in_progress: { label: 'In Progress', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  completed:   { label: 'Completed',   bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  cancelled:   { label: 'Cancelled',   bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  no_show:     { label: 'No Show',     bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
};

const TABS = ['upcoming', 'completed', 'cancelled'];

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/bookings');
      setBookings(res.data.data.bookings || []);
    } catch (err) {
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancelBooking = async (id) => {
    const reason = window.prompt('Please enter the reason for cancellation:');
    if (reason === null) return;
    if (!reason.trim()) { toast.error('Cancellation reason is required'); return; }
    try {
      await axiosInstance.patch(`/bookings/${id}/cancel`, { cancellationReason: reason.trim() });
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const upcomingStatuses = ['pending', 'accepted', 'arriving', 'in_progress'];
  const completedStatuses = ['completed'];
  const cancelledStatuses = ['cancelled', 'no_show'];

  const getFilteredBookings = () => {
    if (activeTab === 'upcoming') return bookings.filter(b => upcomingStatuses.includes(b.status));
    if (activeTab === 'completed') return bookings.filter(b => completedStatuses.includes(b.status));
    return bookings.filter(b => cancelledStatuses.includes(b.status));
  };

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span
        style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
        className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border uppercase tracking-wider"
      >
        {cfg.label}
      </span>
    );
  };

  const filtered = getFilteredBookings();

  return (
    <div className="min-h-screen pb-24 lg:pb-12" style={{ backgroundColor: '#F8F8F8' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Page Title */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight" style={{ color: '#1A1A1A' }}>My Bookings</h1>
          <p className="text-xs font-semibold mt-1" style={{ color: '#999999' }}>Track and manage all your service appointments</p>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex rounded-xl p-1.5 shadow-sm"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
        >
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 text-xs font-extrabold rounded-lg capitalize transition-all cursor-pointer"
              style={activeTab === tab
                ? { backgroundColor: '#FF4500', color: '#FFFFFF' }
                : { color: '#999999' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Booking List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF4500' }} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(b => (
              <div
                key={b._id}
                className="rounded-2xl p-5 transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-extrabold text-sm leading-tight" style={{ color: '#1A1A1A' }}>
                        {b.serviceInfo?.title || 'Home Service'}
                      </h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: '#666666' }}>
                      Partner: <span style={{ color: '#1A1A1A' }}>{b.provider?.businessName || 'Local Expert'}</span>
                    </p>
                  </div>
                  <span className="font-extrabold text-lg shrink-0" style={{ color: '#FF4500' }}>₹{b.totalAmount}</span>
                </div>

                {/* Date / Slot Row */}
                <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #F5F5F5' }}>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#999999' }}>
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(b.scheduledDate || b.scheduledAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#999999' }}>
                    <Clock className="w-3.5 h-3.5" />
                    {b.scheduledSlot || 'Scheduled'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 mt-4">
                  {activeTab === 'upcoming' && (
                    <>
                      <RouterLink
                        to={`/bookings/${b._id}`}
                        className="flex-1 py-2.5 text-center text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                        style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
                      >
                        Track Job
                      </RouterLink>
                      {b.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(b._id)}
                          className="flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                          style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}

                  {activeTab === 'completed' && (
                    <RouterLink
                      to={`/review/${b._id}`}
                      className="flex-1 py-2.5 text-center text-xs font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Write Review</span>
                    </RouterLink>
                  )}

                  {activeTab === 'cancelled' && (
                    <button
                      onClick={() => navigate(`/book/${b.provider?._id || b.provider}`)}
                      className="flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                      style={{ backgroundColor: '#FFF0EB', color: '#FF4500', border: '1px solid #FFC0AC' }}
                    >
                      Rebook
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-16 text-center flex flex-col items-center justify-center"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#F8F8F8', border: '1px solid #EEEEEE' }}
            >
              <Inbox className="w-8 h-8" style={{ color: '#CCCCCC' }} />
            </div>
            <h3 className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>No bookings found</h3>
            <p className="text-xs max-w-sm mt-2 leading-relaxed" style={{ color: '#999999' }}>
              You don't have any {activeTab} bookings. Find expert professionals in your local area today!
            </p>
            <RouterLink
              to="/search"
              className="mt-6 px-6 py-3 text-xs font-extrabold rounded-xl cursor-pointer"
              style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
            >
              Find Services
            </RouterLink>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default MyBookingsPage;

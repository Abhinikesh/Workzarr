import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Calendar, Star, Clock, MapPin, Inbox, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, completed, cancelled
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

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    const reason = window.prompt('Please enter the reason for cancellation:');
    if (reason === null) return; // user clicked cancel
    if (!reason.trim()) {
      toast.error('Cancellation reason is required');
      return;
    }

    try {
      await axiosInstance.patch(`/bookings/${id}/cancel`, { cancellationReason: reason.trim() });
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  // Status lists
  const upcomingStatuses = ['pending', 'accepted', 'arriving', 'in_progress'];
  const completedStatuses = ['completed'];
  const cancelledStatuses = ['cancelled', 'no_show'];

  const getFilteredBookings = () => {
    if (activeTab === 'upcoming') {
      return bookings.filter((b) => upcomingStatuses.includes(b.status));
    } else if (activeTab === 'completed') {
      return bookings.filter((b) => completedStatuses.includes(b.status));
    } else {
      return bookings.filter((b) => cancelledStatuses.includes(b.status));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">Pending</span>;
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

  const filtered = getFilteredBookings();

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>

        {/* Horizontal tabs switcher */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm">
          {['upcoming', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

        {/* List of bookings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b._id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-800 text-base">{b.serviceInfo?.title || 'Home Service'}</h3>
                    {getStatusBadge(b.status)}
                  </div>
                  
                  <p className="text-xs font-semibold text-slate-500">
                    Partner: <span className="text-slate-800 font-bold">{b.provider?.businessName || 'Local Expert'}</span>
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(b.scheduledDate || b.scheduledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {b.scheduledSlot || 'Slot'}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-3">
                  <span className="font-extrabold text-orange-600 text-base">₹{b.totalAmount}</span>

                  <div className="flex gap-2">
                    {/* Action buttons based on active tab */}
                    {activeTab === 'upcoming' && (
                      <>
                        <RouterLink
                          to={`/bookings/${b._id}`}
                          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Track
                        </RouterLink>
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleCancelBooking(b._id)}
                            className="px-3.5 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}

                    {activeTab === 'completed' && (
                      <RouterLink
                        to={`/review/${b._id}`}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Review
                      </RouterLink>
                    )}

                    {activeTab === 'cancelled' && (
                      <button
                        onClick={() => navigate(`/book/${b.provider?._id || b.provider}`)}
                        className="px-3.5 py-1.5 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Rebook
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No bookings found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              You do not have any {activeTab} bookings at the moment. Find expert professionals in your local area today!
            </p>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default MyBookingsPage;

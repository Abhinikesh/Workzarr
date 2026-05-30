import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProviderProfile } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import { socket, connectSocket } from '../lib/socket';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { CheckCircle2, AlertCircle, Sparkles, MapPin, Phone, Star, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const provider = useSelector((s) => s.auth.provider);
  const user = useSelector((s) => s.auth.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isAvailable, setIsAvailable] = useState(provider?.availability?.isAvailable ?? true);
  const [activeJob, setActiveJob] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [otpVal, setOtpVal] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);

  // Time-based greeting helper
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch provider profile details to get stats
      const profileRes = await axiosInstance.get('/providers/me/profile');
      const latestProfile = profileRes.data.data.provider;
      dispatch(updateProviderProfile(latestProfile));
      setIsAvailable(latestProfile?.availability?.isAvailable ?? true);

      // 2. Fetch all bookings
      const bookingsRes = await axiosInstance.get('/bookings');
      const allBookings = bookingsRes.data.data.bookings || [];

      // Active Job: pending accepted, arriving, in_progress
      const active = allBookings.find((b) => ['accepted', 'arriving', 'in_progress'].includes(b.status));
      setActiveJob(active || null);

      // Incoming Requests: pending
      const requests = allBookings.filter((b) => b.status === 'pending');
      setPendingRequests(requests);

      // Recent Completed
      const completed = allBookings.filter((b) => b.status === 'completed');
      setRecentCompleted(completed.slice(0, 5));
    } catch (err) {
      console.warn('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Reconnect socket if needed
    const token = localStorage.getItem('providerToken');
    if (token) {
      connectSocket(token);
    }

    if (socket) {
      const handleNewRequest = (data) => {
        toast.success('New job request received! Swipe or accept quickly.');
        fetchDashboardData();
        // Play notification sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
          audio.play();
        } catch (_) {}
      };

      const handleCancelled = () => {
        toast.error('Booking has been cancelled by customer.');
        fetchDashboardData();
      };

      socket.on('booking:new_request', handleNewRequest);
      socket.on('booking:cancelled', handleCancelled);

      return () => {
        socket.off('booking:new_request', handleNewRequest);
        socket.off('booking:cancelled', handleCancelled);
      };
    }
  }, [socket]);

  // Handle Availability Toggle Switch
  const handleAvailabilityToggle = async () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    try {
      await axiosInstance.patch('/providers/me/availability', { isAvailable: nextVal });
      
      // Update store
      dispatch(updateProviderProfile({ availability: { ...provider.availability, isAvailable: nextVal } }));
      
      toast.success(nextVal ? 'You are now Online and accepting jobs!' : 'You are now Offline');
    } catch (err) {
      setIsAvailable(!nextVal); // revert
      toast.error('Failed to update availability status');
    }
  };

  // Status updates: Mark as Arrived, Started, Completed
  const handleUpdateStatus = async (statusVal) => {
    if (statusVal === 'in_progress') {
      if (!otpVal.trim()) {
        setShowOtpField(true);
        toast.error('Please enter the 4-digit booking OTP from the customer');
        return;
      }
      if (!/^\d{4}$/.test(otpVal)) {
        toast.error('OTP must be exactly 4 digits');
        return;
      }
    }

    setUpdatingStatus(true);
    try {
      const payload = { status: statusVal };
      if (statusVal === 'in_progress') {
        payload.otp = otpVal.trim();
      }

      await axiosInstance.patch(`/bookings/${activeJob._id}/status`, payload);
      toast.success(`Job marked as ${statusVal.replace('_', ' ')}!`);
      
      setOtpVal('');
      setShowOtpField(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Accept / Decline Incoming Invites
  const handleRequestAction = async (bookingId, actionVal) => {
    try {
      await axiosInstance.patch(`/bookings/${bookingId}/status`, {
        status: actionVal === 'accept' ? 'accepted' : 'cancelled',
        cancellationReason: actionVal === 'decline' ? 'Provider declined' : undefined
      });
      toast.success(actionVal === 'accept' ? 'Job accepted! Go to My Jobs to manage.' : 'Job request declined');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  // Earnings calculation
  const totalCompleted = provider?.stats?.completedJobs ?? 0;
  const ratingAverage = provider?.rating?.average ?? 5.0;
  const earningsToday = provider?.stats?.totalEarnings ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Availability Switch Header Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {getGreeting()}, {provider?.businessName || user?.name}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage your daily gig workspace.</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-600 animate-pulse' : 'bg-slate-300'}`}></span>
            <span className="text-xs font-bold text-slate-700">
              {isAvailable ? 'Online for Jobs' : 'Offline'}
            </span>
            <button
              onClick={handleAvailabilityToggle}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                isAvailable ? 'bg-orange-600' : 'bg-slate-300'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isAvailable ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Professional Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-lg font-extrabold text-orange-600">₹{earningsToday}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Earnings Today</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-lg font-extrabold text-slate-800">{totalCompleted}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Jobs Done</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm flex flex-col items-center justify-center">
            <p className="text-lg font-extrabold text-slate-800 flex items-center gap-0.5">
              <Star className="w-4.5 h-4.5 text-orange-500 fill-orange-500 shrink-0" />
              <span>{ratingAverage.toFixed(1)}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Rating</p>
          </div>
        </div>

        {/* Active Job Card */}
        {activeJob && (
          <div className="bg-white border-2 border-orange-500 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Active Gig Job</span>
              <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-orange-200">
                {activeJob.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-sm shrink-0">
                {activeJob.customer?.name?.[0] || 'C'}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-sm">{activeJob.customer?.name || 'Local Customer'}</h4>
                <p className="text-xs font-bold text-orange-600">{activeJob.serviceInfo?.title || 'Home Service'}</p>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{activeJob.address?.fullAddress}</span>
                </p>
              </div>
            </div>

            {/* Render OTP Box if provider wants to mark in_progress */}
            {showOtpField && activeJob.status === 'arriving' && (
              <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
                <label htmlFor="otp" className="block text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                  Enter 4-Digit Customer OTP
                </label>
                <div className="flex gap-2">
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength="4"
                    value={otpVal}
                    onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-24 bg-white border border-slate-200 rounded-lg text-center text-sm font-bold tracking-widest py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Verify & Start Job
                  </button>
                </div>
              </div>
            )}

            {/* Gig status control action triggers */}
            <div className="border-t border-slate-100 pt-4 flex gap-3">
              {activeJob.status === 'accepted' && (
                <button
                  onClick={() => handleUpdateStatus('arriving')}
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Mark as Arrived
                </button>
              )}
              {activeJob.status === 'arriving' && !showOtpField && (
                <button
                  onClick={() => setShowOtpField(true)}
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Start Service (OTP)
                </button>
              )}
              {activeJob.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        )}

        {/* Incoming requests cards section with 30s timers */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Pending Job Invites ({pendingRequests.length})</h3>
          
          {pendingRequests.length > 0 ? (
            <div className="space-y-3.5">
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-scaleUp"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-orange-600 uppercase tracking-wide">
                        {req.serviceInfo?.title || 'Home Service'}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        Client: <span className="text-slate-800 font-bold">{req.customer?.name || 'Local Family'}</span>
                      </p>
                      <p className="text-xs text-slate-400 font-medium">{req.address?.fullAddress}</p>
                    </div>
                    <span className="font-extrabold text-slate-800 text-sm">₹{req.totalAmount}</span>
                  </div>

                  <div className="flex gap-3 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => handleRequestAction(req._id, 'accept')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Accept Job
                    </button>
                    <button
                      onClick={() => handleRequestAction(req._id, 'decline')}
                      className="flex-1 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center flex flex-col items-center justify-center">
              <Sparkles className="w-10 h-10 text-orange-500 mb-2.5" />
              <p className="text-xs font-bold text-slate-700">All caught up!</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Waiting for new local job requests near your town.</p>
            </div>
          )}
        </section>

        {/* Recent Jobs Completed */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Recent Completed Gigs</h3>
          {recentCompleted.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
              {recentCompleted.map((b) => (
                <div key={b._id} className="p-4 flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800">{b.serviceInfo?.title || 'Gig Job'}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Client: {b.customer?.name} • {new Date(b.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-green-600 text-sm">₹{b.totalAmount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs font-semibold text-slate-400">
              No completed gigs recorded yet.
            </div>
          )}
        </section>

      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;

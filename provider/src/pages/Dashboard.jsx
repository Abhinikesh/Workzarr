import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProviderProfile } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import { socket, connectSocket } from '../lib/socket';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { MapPin, Star, Sparkles, Calendar, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#FF4500] animate-spin" />
      </div>
    );
  }

  // Earnings calculation
  const totalCompleted = provider?.stats?.completedJobs ?? 0;
  const ratingAverage = provider?.rating?.average ?? 5.0;
  const earningsToday = provider?.stats?.totalEarnings ?? 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24 lg:pb-12 text-[#1A1A1A]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Availability Switch Header Panel */}
        <div className="bg-white border border-[#EEEEEE] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
          <div className="text-left">
            <h2 className="text-xl lg:text-2xl font-black text-[#1A1A1A] tracking-tight">
              {getGreeting()}, {provider?.businessName || user?.name}
            </h2>
            <p className="text-xs text-[#666666] font-bold mt-1.5 uppercase tracking-widest">Manage your daily gig workspace.</p>
          </div>

          <div className="flex items-center gap-3.5 bg-[#F8F8F8] border border-[#EEEEEE] rounded-2xl px-5 py-3 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-600 animate-pulse' : 'bg-slate-300'}`}></span>
            <span className="text-xs font-extrabold text-[#666666]">
              {isAvailable ? 'Online for Jobs' : 'Offline'}
            </span>
            <button
              onClick={handleAvailabilityToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-200 ${
                isAvailable ? 'bg-green-600' : 'bg-slate-300'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                isAvailable ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Professional Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-[#EEEEEE] rounded-2xl p-5 text-center shadow-sm hover:border-[#FF4500]/30 transition-all duration-300">
            <p className="text-xl lg:text-2xl font-black text-[#FF4500]">₹{earningsToday}</p>
            <p className="text-[10px] text-[#666666] font-black uppercase tracking-widest mt-2">Earnings Today</p>
          </div>
          <div className="bg-white border border-[#EEEEEE] rounded-2xl p-5 text-center shadow-sm hover:border-[#FF4500]/30 transition-all duration-300">
            <p className="text-xl lg:text-2xl font-black text-[#1A1A1A]">{totalCompleted}</p>
            <p className="text-[10px] text-[#666666] font-black uppercase tracking-widest mt-2">Jobs Done</p>
          </div>
          <div className="bg-white border border-[#EEEEEE] rounded-2xl p-5 text-center flex flex-col items-center justify-center shadow-sm hover:border-[#FF4500]/30 transition-all duration-300">
            <p className="text-xl lg:text-2xl font-black text-[#1A1A1A] flex items-center gap-1 justify-center">
              <Star className="w-5 h-5 text-[#FF4500] fill-[#FF4500] shrink-0" />
              <span>{ratingAverage.toFixed(1)}</span>
            </p>
            <p className="text-[10px] text-[#666666] font-black uppercase tracking-widest mt-2">Rating</p>
          </div>
        </div>

        {/* Active Job Card */}
        {activeJob && (
          <div className="bg-white border-2 border-[#FF4500] rounded-2xl p-6 space-y-5 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-[#FF4500] uppercase tracking-widest">Active Gig Job</span>
              <span className="px-3 py-1 bg-[#FFF0EB] text-[#FF4500] text-[10px] font-black rounded-full uppercase tracking-wider border border-[#FFC0AC]">
                {activeJob.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FFF0EB] border border-[#FFC0AC] flex items-center justify-center text-[#FF4500] font-black text-sm shrink-0">
                {activeJob.customer?.name?.[0] || 'C'}
              </div>
              <div className="space-y-1.5 min-w-0">
                <h4 className="font-extrabold text-[#1A1A1A] text-base leading-tight">{activeJob.customer?.name || 'Local Customer'}</h4>
                <p className="text-xs font-bold text-[#FF4500]">{activeJob.serviceInfo?.title || 'Home Service'}</p>
                <p className="text-xs text-[#666666] font-semibold flex items-center gap-1.5 leading-relaxed">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{activeJob.address?.fullAddress}</span>
                </p>
              </div>
            </div>

            {/* Render OTP Box if provider wants to mark in_progress */}
            {showOtpField && activeJob.status === 'arriving' && (
              <div className="p-4 bg-[#F8F8F8] border border-[#EEEEEE] rounded-xl space-y-3">
                <label htmlFor="otp" className="block text-[10px] font-black text-[#FF4500] uppercase tracking-widest">
                  Enter 4-Digit Customer OTP
                </label>
                <div className="flex gap-3">
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength="4"
                    value={otpVal}
                    onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-28 bg-white border border-[#DDDDDD] rounded-xl text-center text-sm font-black tracking-widest py-2.5 focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none text-[#1A1A1A]"
                    style={{ minHeight: '44px' }}
                  />
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="px-5 py-2.5 bg-[#FF4500] hover:bg-[#cc3700] text-white text-xs font-extrabold rounded-xl cursor-pointer transition-colors shadow-sm"
                  >
                    Verify & Start Job
                  </button>
                </div>
              </div>
            )}

            {/* Gig status control action triggers */}
            <div className="border-t border-[#EEEEEE] pt-5 flex gap-3">
              {activeJob.status === 'accepted' && (
                <button
                  onClick={() => handleUpdateStatus('arriving')}
                  disabled={updatingStatus}
                  className="flex-1 py-3 bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Mark as Arrived
                </button>
              )}
              {activeJob.status === 'arriving' && !showOtpField && (
                <button
                  onClick={() => setShowOtpField(true)}
                  disabled={updatingStatus}
                  className="flex-1 py-3 bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Start Service (OTP)
                </button>
              )}
              {activeJob.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={updatingStatus}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        )}

        {/* Incoming requests cards section */}
        <section className="space-y-5">
          <h3 className="text-base font-black text-[#666666] tracking-wider uppercase">Pending Job Invites ({pendingRequests.length})</h3>
          
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white border border-[#EEEEEE] rounded-2xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="text-xs font-black text-[#FF4500] uppercase tracking-widest">
                        {req.serviceInfo?.title || 'Home Service'}
                      </h4>
                      <p className="text-xs text-[#666666] font-bold">
                        Client: <span className="text-[#1A1A1A] font-extrabold">{req.customer?.name || 'Local Family'}</span>
                      </p>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed truncate">{req.address?.fullAddress}</p>
                    </div>
                    <span className="font-black text-[#FF4500] text-base shrink-0">₹{req.totalAmount}</span>
                  </div>

                  <div className="flex gap-4 border-t border-[#EEEEEE] pt-5">
                    <button
                      onClick={() => handleRequestAction(req._id, 'accept')}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                    >
                      Accept Job
                    </button>
                    <button
                      onClick={() => handleRequestAction(req._id, 'decline')}
                      className="flex-1 py-3 border border-red-500 text-red-500 bg-white hover:bg-red-50 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 bg-white border border-[#EEEEEE] rounded-2xl text-center flex flex-col items-center justify-center shadow-sm">
              <Sparkles className="w-12 h-12 text-[#FF4500] mb-4" />
              <p className="text-sm font-extrabold text-[#666666]">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Waiting for new local job requests near your town.</p>
            </div>
          )}
        </section>

        {/* Recent Jobs Completed */}
        <section className="space-y-5">
          <h3 className="text-base font-black text-[#666666] tracking-wider uppercase">Recent Completed Gigs</h3>
          {recentCompleted.length > 0 ? (
            <div className="bg-white border border-[#EEEEEE] rounded-2xl divide-y divide-[#EEEEEE] overflow-hidden shadow-sm">
              {recentCompleted.map((b) => (
                <div key={b._id} className="p-4.5 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-[#1A1A1A] text-sm">{b.serviceInfo?.title || 'Gig Job'}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Client: {b.customer?.name} • {new Date(b.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-black text-green-600 text-sm">₹{b.totalAmount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 bg-white border border-[#EEEEEE] rounded-2xl text-center text-xs font-bold text-slate-400 shadow-sm">
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

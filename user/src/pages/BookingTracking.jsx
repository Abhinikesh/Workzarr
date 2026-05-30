import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { socket, connectSocket } from '../lib/socket';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Calendar, Clock, MapPin, CreditCard, ShieldAlert, CheckCircle, ArrowLeft, Phone, User, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BookingTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [otp, setOtp] = useState('');

  const fetchOTP = async () => {
    try {
      const res = await axiosInstance.get(`/bookings/${id}/otp`);
      setOtp(res.data.data.otp || '');
    } catch (err) {
      console.warn('Failed to load OTP:', err.response?.data?.message || err.message);
    }
  };

  const fetchBooking = async () => {
    try {
      const res = await axiosInstance.get(`/bookings/${id}`);
      const bData = res.data.data.booking || null;
      setBooking(bData);
      if (bData && ['accepted', 'arriving'].includes(bData.status)) {
        fetchOTP();
      }
    } catch (err) {
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();

    // Setup socket connection
    const token = localStorage.getItem('userToken');
    if (token) {
      connectSocket(token);
    }

    // Connect to room if socket is initialized
    if (socket) {
      socket.emit('booking:start_tracking', { bookingId: id });

      const handleAccepted = (data) => {
        toast.info('Booking Accepted by provider!');
        fetchBooking();
      };
      const handleArriving = (data) => {
        toast.info('Provider is arriving at your location!');
        fetchBooking();
      };
      const handleJobStarted = (data) => {
        toast.info('Service has started!');
        fetchBooking();
      };
      const handleCompleted = (data) => {
        toast.success('Service Completed successfully!');
        fetchBooking();
      };
      const handleCancelled = (data) => {
        toast.error(`Booking cancelled: ${data.reason || 'No-show'}`);
        fetchBooking();
      };

      socket.on('booking:accepted', handleAccepted);
      socket.on('booking:provider_arriving', handleArriving);
      socket.on('booking:job_started', handleJobStarted);
      socket.on('booking:completed', handleCompleted);
      socket.on('booking:cancelled', handleCancelled);

      return () => {
        socket.emit('booking:stop_tracking', { bookingId: id });
        socket.off('booking:accepted', handleAccepted);
        socket.off('booking:provider_arriving', handleArriving);
        socket.off('booking:job_started', handleJobStarted);
        socket.off('booking:completed', handleCompleted);
        socket.off('booking:cancelled', handleCancelled);
      };
    }
  }, [id, socket]);

  const handleCancelBooking = async () => {
    const reason = window.prompt('Please enter the reason for cancellation:');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    setCancelling(true);
    try {
      await axiosInstance.patch(`/bookings/${id}/cancel`, { cancellationReason: reason.trim() });
      toast.success('Booking cancelled successfully');
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'arriving': return 2;
      case 'in_progress': return 3;
      case 'completed': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Booking not found</h3>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg text-xs"
        >
          Go to My Bookings
        </button>
      </div>
    );
  }

  const currentStep = getStatusIndex(booking.status);
  const timelineSteps = [
    { label: 'Requested', desc: 'Sent request to provider' },
    { label: 'Accepted', desc: 'Provider accepted job' },
    { label: 'Provider Arriving', desc: 'On the way to you' },
    { label: 'In Progress', desc: 'Service has started' },
    { label: 'Completed', desc: 'Service completed' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </button>

        {/* Timeline Tracking Block */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800">Service Status Timeline</h3>
          
          {booking.status === 'cancelled' || booking.status === 'no_show' ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <div>
                <p className="font-bold">Booking Cancelled</p>
                <p className="text-[10px] text-red-500 mt-0.5">Reason: {booking.cancellationReason || 'Provider marked as no-show'}</p>
              </div>
            </div>
          ) : (
            <div className="relative pl-6 border-l border-slate-200 ml-3 space-y-6">
              {timelineSteps.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isActive = index === currentStep;

                return (
                  <div key={index} className="relative">
                    {/* Circle marker */}
                    <div className={`absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive 
                        ? 'border-orange-500 bg-orange-600' 
                        : isCompleted
                        ? 'border-orange-500 bg-orange-100'
                        : 'border-slate-200 bg-white'
                    }`} />
                    
                    {/* Step details */}
                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-bold ${isActive ? 'text-orange-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* OTP Verification Box */}
        {['accepted', 'arriving'].includes(booking.status) && otp && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-sm text-center space-y-2">
            <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Share this start code with the provider</p>
            <div className="text-2xl font-extrabold tracking-widest text-orange-600 font-mono">
              {otp}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">Do not share this OTP until the provider arrives at your location.</p>
          </div>
        )}

        {/* Provider Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Provider Information</h3>
          
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-extrabold text-sm shrink-0">
                {booking.provider?.businessName?.[0] || 'P'}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">{booking.provider?.businessName || 'Local Service Expert'}</h4>
                <p className="text-xs text-slate-400 font-semibold">{booking.provider?.category?.name || 'Local Partner'}</p>
              </div>
            </div>

            {/* Render phone actions if status is accepted/in-progress */}
            {['accepted', 'arriving', 'in_progress'].includes(booking.status) && booking.provider?.phone && (
              <a
                href={`tel:${booking.provider.phone}`}
                className="p-2.5 bg-orange-50 border border-orange-100 rounded-full text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Service Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
          <h3 className="text-sm font-bold text-slate-800">Job Details</h3>
          
          <div className="space-y-3 text-xs text-slate-600 font-medium">
            <div className="flex gap-2">
              <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Scheduled Date</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(booking.scheduledDate || booking.scheduledAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Clock className="w-4.5 h-4.5 text-slate-400 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Scheduled Slot</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{booking.scheduledSlot || 'Slot'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Delivery Address</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{booking.address?.fullAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
          <h3 className="text-sm font-bold text-slate-800">Payment Breakdown</h3>
          
          <div className="space-y-2 text-xs text-slate-600 font-medium">
            <div className="flex justify-between">
              <span>Service Charge</span>
              <span className="text-slate-800 font-semibold">₹{booking.serviceInfo?.price || booking.totalAmount - 20}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span className="text-slate-800 font-semibold">₹20</span>
            </div>
            
            <div className="border-t border-slate-100 pt-2.5 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Total Payable</span>
              <span className="text-orange-600">₹{booking.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Cancel Button Option */}
        {booking.status === 'pending' && (
          <button
            onClick={handleCancelBooking}
            disabled={cancelling}
            className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Booking Request'}
          </button>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default BookingTrackingPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { socket, connectSocket } from '../lib/socket';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Calendar, Clock, MapPin, Phone, ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F8F8' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF4500' }} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#F8F8F8' }}>
        <ShieldAlert className="w-12 h-12 mb-3" style={{ color: '#CCCCCC' }} />
        <h3 className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>Booking not found</h3>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 px-6 py-3 font-bold rounded-xl text-xs cursor-pointer"
          style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
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
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F8F8F8' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
          style={{ color: '#666666' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#1A1A1A'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </button>

        {/* Timeline Tracking Block */}
        <div className="rounded-2xl p-6 shadow-sm space-y-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
          <h3 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>Service Status Timeline</h3>
          
          {booking.status === 'cancelled' || booking.status === 'no_show' ? (
            <div className="p-4 border rounded-xl text-xs font-semibold flex items-center gap-3" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' }}>
              <ShieldAlert className="w-5 h-5 shrink-0" style={{ color: '#EF4444' }} />
              <div>
                <p className="font-extrabold">Booking Cancelled</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#B91C1C' }}>Reason: {booking.cancellationReason || 'Provider marked as no-show'}</p>
              </div>
            </div>
          ) : (
            <div className="relative pl-6 ml-3 space-y-6" style={{ borderLeft: '2px solid #EEEEEE' }}>
              {timelineSteps.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isActive = index === currentStep;

                return (
                  <div key={index} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[32px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isCompleted ? '#FF4500' : '#CCCCCC',
                        backgroundColor: isActive ? '#FF4500' : isCompleted ? '#FFF0EB' : '#FFFFFF'
                      }}
                    />
                    
                    {/* Step details */}
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-extrabold" style={{ color: isActive ? '#FF4500' : isCompleted ? '#1A1A1A' : '#999999' }}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] font-semibold" style={{ color: isCompleted ? '#666666' : '#BBBBBB' }}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* OTP Verification Box */}
        {['accepted', 'arriving'].includes(booking.status) && otp && (
          <div className="border rounded-2xl p-6 shadow-sm text-center space-y-3" style={{ backgroundColor: '#FFF0EB', borderColor: '#FFD9CC' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FF4500' }}>Share this start code with the provider</p>
            <div className="text-3xl font-extrabold tracking-widest font-mono" style={{ color: '#FF4500' }}>
              {otp}
            </div>
            <p className="text-[10px] font-semibold" style={{ color: '#666666' }}>Do not share this OTP until the provider arrives at your location.</p>
          </div>
        )}

        {/* Provider Details Card */}
        <div className="rounded-2xl p-6 shadow-sm space-y-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
          <h3 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>Provider Information</h3>
          
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full border flex items-center justify-center font-extrabold text-base shrink-0"
                style={{ backgroundColor: '#FFF0EB', borderColor: '#FFC0AC', color: '#FF4500' }}>
                {booking.provider?.businessName?.[0] || 'P'}
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>{booking.provider?.businessName || 'Local Service Expert'}</h4>
                <p className="text-xs font-semibold" style={{ color: '#666666' }}>{booking.provider?.category?.name || 'Local Partner'}</p>
              </div>
            </div>

            {/* Render phone actions if status is accepted/in-progress */}
            {['accepted', 'arriving', 'in_progress'].includes(booking.status) && booking.provider?.phone && (
              <a
                href={`tel:${booking.provider.phone}`}
                className="p-3 border rounded-full transition-colors flex items-center justify-center"
                style={{ backgroundColor: '#FFF0EB', borderColor: '#FFC0AC', color: '#FF4500' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF4500';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFF0EB';
                  e.currentTarget.style.color = '#FF4500';
                }}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Service Details Card */}
        <div className="rounded-2xl p-6 shadow-sm space-y-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
          <h3 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>Job Details</h3>
          
          <div className="space-y-4 text-xs font-medium">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 shrink-0" style={{ color: '#999999' }} />
              <div>
                <p className="font-bold" style={{ color: '#1A1A1A' }}>Scheduled Date</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#666666' }}>
                  {new Date(booking.scheduledDate || booking.scheduledAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Clock className="w-5 h-5 shrink-0" style={{ color: '#999999' }} />
              <div>
                <p className="font-bold" style={{ color: '#1A1A1A' }}>Scheduled Slot</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#666666' }}>{booking.scheduledSlot || 'Slot'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin className="w-5 h-5 shrink-0" style={{ color: '#999999' }} />
              <div>
                <p className="font-bold" style={{ color: '#1A1A1A' }}>Delivery Address</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#666666' }}>{booking.address?.fullAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="rounded-2xl p-6 shadow-sm space-y-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
          <h3 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>Payment Breakdown</h3>
          
          <div className="space-y-2.5 text-xs font-semibold" style={{ color: '#666666' }}>
            <div className="flex justify-between">
              <span>Service Charge</span>
              <span style={{ color: '#1A1A1A' }}>₹{booking.serviceInfo?.price || booking.totalAmount - 20}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span style={{ color: '#1A1A1A' }}>₹20</span>
            </div>
            
            <div className="border-t pt-3 flex justify-between text-sm font-extrabold" style={{ borderColor: '#F5F5F5', color: '#1A1A1A' }}>
              <span>Total Payable</span>
              <span style={{ color: '#FF4500' }}>₹{booking.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Cancel Button Option */}
        {booking.status === 'pending' && (
          <button
            onClick={handleCancelBooking}
            disabled={cancelling}
            className="w-full py-3.5 border font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FEF2F2';
            }}
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

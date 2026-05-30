import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Calendar as CalendarIcon, Clock, MapPin, CreditCard, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BookingPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [fullAddress, setFullAddress] = useState(
    user?.location ? `${user.location.town}, ${user.location.district}` : ''
  );
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [datesList, setDatesList] = useState([]);

  useEffect(() => {
    const list = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    setDatesList(list);
    setSelectedDate(list[0]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pRes = await axiosInstance.get(`/providers/${providerId}`);
        setProvider(pRes.data.data.provider);
        const sRes = await axiosInstance.get(`/services/provider/${providerId}`);
        const list = sRes.data.data.services || [];
        setServices(list);
        if (list.length > 0) setSelectedService(list[0]);
      } catch {
        toast.error('Failed to load provider services');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [providerId]);

  const slots = [
    { label: 'Morning', sub: '09:00 AM – 12:00 PM', value: 'Morning', time: '09:00' },
    { label: 'Afternoon', sub: '12:00 PM – 04:00 PM', value: 'Afternoon', time: '13:00' },
    { label: 'Evening', sub: '04:00 PM – 08:00 PM', value: 'Evening', time: '17:00' },
  ];

  const handleBookingSubmit = async e => {
    e.preventDefault();
    if (!selectedService) { toast.error('Please select a service'); return; }
    if (!selectedSlot) { toast.error('Please select a time slot'); return; }
    if (!fullAddress.trim()) { toast.error('Please enter a service address'); return; }

    setSubmitting(true);
    try {
      const timeVal = slots.find(s => s.value === selectedSlot).time;
      const [h, m] = timeVal.split(':').map(Number);
      const targetDate = new Date(selectedDate);
      targetDate.setHours(h, m, 0, 0);

      const payload = {
        providerId,
        serviceId: selectedService._id,
        categoryId: provider.category._id || provider.category,
        scheduledAt: targetDate.toISOString(),
        address: {
          fullAddress: fullAddress.trim(),
          landmark: landmark.trim() || undefined,
          lat: user?.location?.coordinates?.[1] || 28.57,
          lng: user?.location?.coordinates?.[0] || 77.32,
        },
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      const res = await axiosInstance.post('/bookings', payload);
      toast.success('Booking requested successfully!');
      navigate(`/bookings/${res.data.data.booking._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8F8' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF4500' }} />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#F8F8F8' }}>
        <h3 className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>Provider not found</h3>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 text-xs font-extrabold rounded-xl cursor-pointer"
          style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const servicePrice = selectedService ? selectedService.price : (provider.pricing?.basePrice || 250);
  const platformFee = 20;
  const totalAmount = servicePrice + platformFee;

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EEEEEE',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };

  const inputStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DDDDDD',
    color: '#1A1A1A',
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F8F8F8' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          style={{ color: '#666666' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Provider Header */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-1" style={{ color: '#FF4500' }}>
            Booking Service From
          </span>
          <h2 className="text-xl font-extrabold" style={{ color: '#1A1A1A' }}>
            {provider.businessName || provider.user?.name}
          </h2>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>
            {provider.category?.name || 'Home Services'}
          </p>
        </div>

        <form onSubmit={handleBookingSubmit} className="space-y-5">

          {/* Step 1: Service Selection */}
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#1A1A1A' }}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
              >1</span>
              Select Service Package
            </h3>

            {services.length > 0 ? (
              <div className="space-y-2.5">
                {services.map(svc => {
                  const isSelected = selectedService?._id === svc._id;
                  return (
                    <label
                      key={svc._id}
                      className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: `1px solid ${isSelected ? '#FF4500' : '#EEEEEE'}`,
                        backgroundColor: isSelected ? '#FFF0EB' : '#FFFFFF',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="service"
                          checked={isSelected}
                          onChange={() => setSelectedService(svc)}
                          className="mt-1"
                          style={{ accentColor: '#FF4500' }}
                        />
                        <div>
                          <p className="text-xs font-extrabold" style={{ color: '#1A1A1A' }}>{svc.title}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#666666' }}>
                            {svc.description || 'Professional execution by verified experts.'}
                          </p>
                          <p className="text-[9px] font-bold mt-1 uppercase tracking-wide" style={{ color: '#999999' }}>
                            Duration: {svc.duration} mins
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-base shrink-0 ml-3" style={{ color: '#FF4500' }}>₹{svc.price}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div
                className="p-4 rounded-xl flex justify-between items-center text-xs"
                style={{ backgroundColor: '#FFF0EB', border: '1px solid #FFC0AC' }}
              >
                <span className="font-bold" style={{ color: '#1A1A1A' }}>
                  General {provider.category?.name} Service
                </span>
                <span className="font-extrabold" style={{ color: '#FF4500' }}>₹{provider.pricing?.basePrice || 250}</span>
              </div>
            )}
          </div>

          {/* Step 2: Date Picker */}
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#1A1A1A' }}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
              >2</span>
              Preferred Date
            </h3>

            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {datesList.map((d, i) => {
                const isSelected = selectedDate?.toDateString() === d.toDateString();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className="flex flex-col items-center justify-center min-w-[60px] py-3 rounded-xl border text-center transition-all cursor-pointer shrink-0"
                    style={isSelected
                      ? { backgroundColor: '#FF4500', borderColor: '#FF4500', color: '#FFFFFF' }
                      : { backgroundColor: '#FFFFFF', borderColor: '#EEEEEE', color: '#666666' }
                    }
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-wider">
                      {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-extrabold my-0.5">{d.getDate()}</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider">
                      {d.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Time Slot */}
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#1A1A1A' }}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
              >3</span>
              Time Slot
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {slots.map(s => {
                const isSelected = selectedSlot === s.value;
                return (
                  <label
                    key={s.value}
                    className="p-3.5 rounded-xl cursor-pointer transition-all text-center"
                    style={{
                      border: `1px solid ${isSelected ? '#FF4500' : '#EEEEEE'}`,
                      backgroundColor: isSelected ? '#FFF0EB' : '#FFFFFF',
                    }}
                  >
                    <input
                      type="radio"
                      name="slot"
                      checked={isSelected}
                      onChange={() => setSelectedSlot(s.value)}
                      className="sr-only"
                    />
                    <p className="text-xs font-extrabold" style={{ color: isSelected ? '#FF4500' : '#1A1A1A' }}>{s.label}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: '#999999' }}>{s.sub}</p>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 4: Address */}
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#1A1A1A' }}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
              >4</span>
              Service Address
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#666666' }}>
                  Full Address *
                </label>
                <textarea
                  value={fullAddress}
                  onChange={e => setFullAddress(e.target.value)}
                  placeholder="House no., Street, Area/Village..."
                  required
                  rows={3}
                  className="w-full p-3.5 rounded-xl text-xs font-medium focus:outline-none resize-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#666666' }}>
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g. Near government school"
                  className="w-full px-4 py-3 rounded-xl text-xs font-medium focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#666666' }}>
                  Special Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Please bring extra wire"
                  className="w-full px-4 py-3 rounded-xl text-xs font-medium focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Step 5: Payment */}
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#1A1A1A' }}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
              >5</span>
              Payment Method
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {['cash', 'upi', 'card'].map(method => {
                const isSelected = paymentMethod === method;
                return (
                  <label
                    key={method}
                    className="flex flex-col items-center justify-center p-3.5 rounded-xl cursor-pointer transition-all text-xs font-extrabold capitalize"
                    style={{
                      border: `1px solid ${isSelected ? '#FF4500' : '#EEEEEE'}`,
                      backgroundColor: isSelected ? '#FFF0EB' : '#FFFFFF',
                      color: isSelected ? '#FF4500' : '#666666',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={isSelected}
                      onChange={() => setPaymentMethod(method)}
                      className="sr-only"
                    />
                    {method}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-2xl p-6 space-y-3" style={cardStyle}>
            <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#999999' }}>
              Pricing Breakdown
            </h3>
            <div className="space-y-2.5 text-xs font-semibold" style={{ color: '#666666' }}>
              <div className="flex justify-between">
                <span>Service ({selectedService?.title || 'General Service'})</span>
                <span style={{ color: '#1A1A1A' }}>₹{servicePrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span style={{ color: '#1A1A1A' }}>₹{platformFee}</span>
              </div>
              <div
                className="flex justify-between pt-3 text-sm font-extrabold"
                style={{ borderTop: '1px solid #EEEEEE', color: '#1A1A1A' }}
              >
                <span>Total Amount</span>
                <span style={{ color: '#FF4500' }}>₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 font-extrabold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-opacity"
            style={{
              backgroundColor: '#FF4500',
              color: '#FFFFFF',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : `Confirm Booking — ₹${totalAmount}`
            }
          </button>

        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default BookingPage;

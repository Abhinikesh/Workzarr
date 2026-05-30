import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Calendar as CalendarIcon, Clock, MapPin, CreditCard, ChevronRight, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BookingPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();

  const user = useSelector((s) => s.auth.user);

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [selectedSlot, setSelectedSlot] = useState(''); // slots: Morning, Afternoon, Evening
  const [fullAddress, setFullAddress] = useState(user?.location ? `${user.location.town}, ${user.location.district}` : '');
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Generate next 7 days for slider picker
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
        if (list.length > 0) {
          setSelectedService(list[0]);
        }
      } catch (err) {
        toast.error('Failed to load services for provider');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [providerId]);

  const getDayLabel = (date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const getDateNumber = (date) => {
    return date.getDate();
  };

  const getMonthLabel = (date) => {
    return date.toLocaleDateString('en-IN', { month: 'short' });
  };

  const slots = [
    { label: 'Morning (09:00 AM - 12:00 PM)', value: 'Morning', time: '09:00' },
    { label: 'Afternoon (12:00 PM - 04:00 PM)', value: 'Afternoon', time: '13:00' },
    { label: 'Evening (04:00 PM - 08:00 PM)', value: 'Evening', time: '17:00' },
  ];

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error('Please select a service');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select a preferred time slot');
      return;
    }
    if (!fullAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    setSubmitting(true);
    try {
      // Build date with slot time
      const timeVal = slots.find((s) => s.value === selectedSlot).time;
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
      
      // Redirect to specific tracking page
      navigate(`/bookings/${res.data.data.booking._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  const servicePrice = selectedService ? selectedService.price : provider.pricing.basePrice;
  const platformFee = 20;
  const totalAmount = servicePrice + platformFee;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block mb-1">
            Booking Service From
          </span>
          <h2 className="text-lg font-extrabold text-slate-800">{provider.businessName || provider.user?.name}</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">{provider.category?.name || 'Home Services'}</p>
        </div>

        <form onSubmit={handleBookingSubmit} className="space-y-6">
          
          {/* Step 1: Select Service */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
              1. Select Service Package
            </h3>

            {services.length > 0 ? (
              <div className="space-y-2">
                {services.map((svc) => (
                  <label
                    key={svc._id}
                    className={`flex items-center justify-between p-3.5 border rounded-lg cursor-pointer transition-all ${
                      selectedService?._id === svc._id
                        ? 'border-orange-500 bg-orange-50/30'
                        : 'border-slate-200 bg-slate-50 hover:border-orange-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="service"
                        checked={selectedService?._id === svc._id}
                        onChange={() => setSelectedService(svc)}
                        className="mt-1 accent-orange-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{svc.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{svc.description || 'Professional execution.'}</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-1">Duration: {svc.duration} mins</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-orange-600 text-sm shrink-0">₹{svc.price}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-orange-50/30 border border-orange-100 rounded-lg flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">General {provider.category?.name} Service</span>
                <span className="font-extrabold text-orange-600">₹{provider.pricing.basePrice}</span>
              </div>
            )}
          </div>

          {/* Step 2: Date Picker 7 Days slider */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-orange-600" />
              2. Preferred Booking Date
            </h3>

            <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
              {datesList.map((d, index) => {
                const isSelected = selectedDate?.toDateString() === d.toDateString();
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center justify-center min-w-[56px] py-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-400'
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider">{getDayLabel(d)}</span>
                    <span className="text-sm font-extrabold my-0.5">{getDateNumber(d)}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{getMonthLabel(d)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Time Slot Picker */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-600" />
              3. Time Slot
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {slots.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all text-xs font-semibold ${
                    selectedSlot === s.value
                      ? 'border-orange-500 bg-orange-50/30 text-orange-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="slot"
                    checked={selectedSlot === s.value}
                    onChange={() => setSelectedSlot(s.value)}
                    className="accent-orange-600"
                  />
                  <span>{s.value}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 4: Address Collection */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-600" />
              4. Service Address
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Address *</label>
                <textarea
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="House number, Street name, Area/Village name..."
                  required
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near government school"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Special Instructions (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please bring extra wire"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Step 5: Payment method */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-orange-600" />
              5. Payment Method
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {['cash', 'upi', 'card'].map((method) => (
                <label
                  key={method}
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all text-xs font-bold capitalize ${
                    paymentMethod === method
                      ? 'border-orange-500 bg-orange-50/30 text-orange-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="sr-only"
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Summary Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing Details</h3>
            
            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Service Price ({selectedService?.title || 'General Service'})</span>
                <span className="text-slate-800 font-semibold">₹{servicePrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Booking Fee</span>
                <span className="text-slate-800 font-semibold">₹{platformFee}</span>
              </div>
              
              <div className="border-t border-slate-100 pt-2.5 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total Amount to Pay</span>
                <span className="text-orange-600">₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Book Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-extrabold rounded-lg shadow-sm text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `Confirm Booking (₹${totalAmount})`
            )}
          </button>

        </form>

      </main>

      <BottomNav />
    </div>
  );
};

export default BookingPage;

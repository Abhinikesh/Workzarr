import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { ArrowLeft, Star, CheckCircle, MapPin, User, ChevronRight, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ProviderProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviderData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Provider Bio/Metadata
        const providerRes = await axiosInstance.get(`/providers/${id}`);
        setProvider(providerRes.data.data.provider || null);

        // 2. Fetch Provider's custom services
        const servicesRes = await axiosInstance.get(`/services/provider/${id}`);
        setServices(servicesRes.data.data.services || []);

        // 3. Fetch Provider reviews
        const reviewsRes = await axiosInstance.get(`/reviews?providerId=${id}`);
        setReviews(reviewsRes.data.data.reviews || []);
      } catch (err) {
        toast.error('Failed to load provider profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [id]);

  const getInitials = (name) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Provider not found</h3>
        <button
          onClick={() => navigate('/home')}
          className="mt-4 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg text-xs"
        >
          Go back Home
        </button>
      </div>
    );
  }

  const basePrice = provider.pricing?.basePrice || 250;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
          {provider.profileImage ? (
            <img
              src={provider.profileImage}
              alt={provider.businessName}
              className="w-24 h-24 rounded-full object-cover border border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-extrabold text-2xl shrink-0">
              {getInitials(provider.businessName || provider.user?.name)}
            </div>
          )}

          <div className="space-y-2.5 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{provider.businessName || provider.user?.name}</h1>
              <div className="flex gap-1.5 justify-center">
                {provider.isVerified && (
                  <span className="bg-green-50 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-green-200 flex items-center gap-0.5 uppercase tracking-wider shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                )}
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                  provider.availability?.isAvailable 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {provider.availability?.isAvailable ? 'Available' : 'Busy'}
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <span>{provider.category?.name || 'Local Service Expert'}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 font-bold text-slate-700">
                <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                {provider.rating?.average ? provider.rating.average.toFixed(1) : '5.0'}
              </span>
              <span className="text-slate-400 font-medium">({provider.rating?.count || 1} reviews)</span>
            </p>

            <p className="text-xs text-slate-500 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{provider.location?.town}, {provider.location?.district}</span>
            </p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-950 tracking-tight">About Us</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {provider.bio || 'We are highly skilled, background-verified professionals committed to offering high quality, robust home services across your town. Customer satisfaction is our utmost priority.'}
          </p>
        </div>

        {/* Custom Services Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-950 tracking-tight">Services Offered</h3>
          {services.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {services.map((svc) => (
                <div key={svc._id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">{svc.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{svc.description || 'Professional execution matching all industry standards.'}</p>
                    <p className="text-xs text-slate-400 font-medium">Duration: {svc.duration} mins</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-orange-600 text-base">₹{svc.price}</span>
                    <p className="text-[10px] text-slate-400 font-medium capitalize">{svc.priceType.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Default standard category service package if no custom service listed
            <div className="py-2 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">General {provider.category?.name || 'Home'} Service</h4>
                <p className="text-xs text-slate-500">General diagnostics, servicing, and on-site minor fixes.</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-orange-600 text-base">₹{basePrice}</span>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Starts From</p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-950 tracking-tight">Reviews & Feedback</h3>
          {reviews.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {reviews.slice(0, 5).map((r) => (
                <div key={r._id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-800 text-xs">{r.customer?.name || 'Anonymous User'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= r.rating 
                            ? 'text-orange-500 fill-orange-500' 
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic">"{r.comment || 'Excellent service, very professional and arrived right on time.'}"</p>
                </div>
              ))}
            </div>
          ) : (
            // Seed reviews fallback
            <div className="space-y-4">
              <div className="py-2 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-800 text-xs">Rohit Verma</span>
                  <span className="text-[10px] text-slate-400 font-semibold">1 week ago</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 italic">"Highly skilled professional. Arrived exactly on time and resolved our issues quickly at a very reasonable rate."</p>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Sticky Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4 px-6 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starts From</p>
            <p className="font-extrabold text-orange-600 text-xl">₹{basePrice}</p>
          </div>
          <Link
            to={`/book/${provider._id}`}
            className="flex-1 max-w-xs py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm transition-colors text-center shadow-sm cursor-pointer"
          >
            Book Now
          </Link>
        </div>
      </div>

    </div>
  );
};

export default ProviderProfilePage;

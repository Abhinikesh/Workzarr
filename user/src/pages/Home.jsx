import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Search, Star, MapPin, Calendar, ArrowRight } from 'lucide-react';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();

  // Haryana / Delhi NCR coordinates
  const lat = 28.57;
  const lng = 77.32;

  useEffect(() => {
    // 1. Fetch Categories
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/categories');
        setCategories(res.data.data.categories || []);
      } catch (err) {
        console.warn('Failed to load categories');
      }
    };

    // 2. Fetch Top Providers Near User
    const fetchTopProviders = async () => {
      setLoadingProviders(true);
      try {
        const res = await axiosInstance.get(`/providers/top?lat=${lat}&lng=${lng}&limit=8`);
        setTopProviders(res.data.data.providers || []);
      } catch (err) {
        console.warn('Failed to load top providers');
      } finally {
        setLoadingProviders(false);
      }
    };

    // 3. Fetch Recent Bookings
    const fetchRecentBookings = async () => {
      setLoadingBookings(true);
      try {
        const res = await axiosInstance.get('/bookings?limit=3');
        setRecentBookings(res.data.data.bookings || []);
      } catch (err) {
        console.warn('Failed to load recent bookings');
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchCategories();
    fetchTopProviders();
    fetchRecentBookings();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const getProviderInitials = (name) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">Pending</span>;
      case 'accepted':
        return <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">Accepted</span>;
      case 'arriving':
        return <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 uppercase tracking-wider">Arriving</span>;
      case 'in_progress':
        return <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-purple-50 text-purple-600 border border-purple-200 uppercase tracking-wider">In Progress</span>;
      case 'completed':
        return <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-green-50 text-green-600 border border-green-200 uppercase tracking-wider">Completed</span>;
      case 'cancelled':
        return <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-slate-50 text-slate-600 border border-slate-200 uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24 lg:pb-12 text-[#1A1A1A]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-12">
        
        {/* Banner with Title and Search */}
        <section className="bg-white border border-[#EEEEEE] rounded-2xl p-8 lg:p-14 relative overflow-hidden shadow-sm">
          {/* Subtle decoration lines */}
          <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-[#FFF0EB] rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-6">
            <span className="text-[#FF4500] font-extrabold uppercase tracking-widest text-[10px] bg-[#FFF0EB] px-3.5 py-1.5 rounded-full border border-[#FFC0AC]">
              Bharat ka trusted service marketplace
            </span>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight text-[#1A1A1A] leading-tight">
              Get professional home services on demand
            </h2>
            <p className="text-[#666666] text-sm lg:text-base leading-relaxed">
              Verified local experts for every need. Book Electricians, Plumbers, Carpenters, AC Repair and more instantly.
            </p>

            <form onSubmit={handleSearchSubmit} className="pt-4 flex gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for electrician, plumber, AC repair..."
                  className="w-full bg-[#FFFFFF] text-[#1A1A1A] pl-12 pr-4 py-4 rounded-xl text-sm border border-[#DDDDDD] focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium transition-all"
                  style={{ minHeight: '44px' }}
                />
              </div>
              <button
                type="submit"
                className="bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold px-7 rounded-xl text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                <span>Search</span>
              </button>
            </form>
          </div>
        </section>

        {/* Category Grid Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-baseline">
            <h3 className="text-xl lg:text-2xl font-black tracking-tight text-[#1A1A1A]">Browse Categories</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.length > 0 ? (
              categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat._id}
                  to={`/search?categoryId=${cat._id}`}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-[#EEEEEE] rounded-2xl hover:border-[#FF4500] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer"
                >
                  <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{cat.icon || '🛠️'}</span>
                  <span className="text-sm font-extrabold text-[#666666] group-hover:text-[#FF4500] transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))
            ) : (
              // Fallback default grid
              [
                { name: 'Electrician', icon: '⚡', id: 'electrician' },
                { name: 'Plumber', icon: '🔧', id: 'plumber' },
                { name: 'Carpenter', icon: '🪚', id: 'carpenter' },
                { name: 'AC Repair', icon: '❄️', id: 'ac-repair' },
                { name: 'Tutor', icon: '📚', id: 'tutor' },
                { name: 'Computer Repair', icon: '💻', id: 'computer-repair' },
                { name: 'Painter', icon: '🎨', id: 'painter' },
                { name: 'Mechanic', icon: '🔩', id: 'mechanic' },
              ].map((c) => (
                <div
                  key={c.name}
                  onClick={() => navigate(`/search?q=${c.name}`)}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-[#EEEEEE] rounded-2xl hover:border-[#FF4500] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer"
                >
                  <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{c.icon}</span>
                  <span className="text-sm font-extrabold text-[#666666] group-hover:text-[#FF4500] transition-colors">
                    {c.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Horizontal scroll of Top-Rated Providers */}
        <section className="space-y-6">
          <div className="flex justify-between items-baseline">
            <h3 className="text-xl lg:text-2xl font-black tracking-tight text-[#1A1A1A]">Top Rated Providers Near You</h3>
            <Link to="/search" className="text-xs lg:text-sm font-extrabold text-[#FF4500] hover:underline flex items-center gap-1.5">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingProviders ? (
            <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="min-w-[280px] max-w-[280px] bg-white border border-[#EEEEEE] rounded-2xl p-5 space-y-4 animate-pulse shadow-sm">
                  <div className="flex gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0" />
                    <div className="space-y-2.5 flex-1">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : topProviders.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
              {topProviders.map((p) => (
                <div
                  key={p._id}
                  className="min-w-[280px] max-w-[280px] bg-white border border-[#EEEEEE] rounded-2xl p-5 flex flex-col justify-between hover:border-[#FF4500] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Provider Meta */}
                    <div className="flex gap-3.5">
                      {p.profileImage ? (
                        <img
                          src={p.profileImage}
                          alt={p.businessName}
                          className="w-12 h-12 rounded-full object-cover border border-[#EEEEEE] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#FFF0EB] border border-[#FFC0AC] flex items-center justify-center text-[#FF4500] font-black shrink-0">
                          {getProviderInitials(p.businessName || p.user?.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-[#1A1A1A] truncate">{p.businessName || p.user?.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFF0EB] text-[#FF4500] rounded-full border border-[#FFC0AC]">
                            {p.category?.name || 'Local Partner'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Rating */}
                    <div className="flex justify-between items-center text-sm border-t border-[#EEEEEE] pt-4">
                      <div className="flex items-center gap-1 font-bold text-[#666666]">
                        <Star className="w-4 h-4 text-[#FF4500] fill-[#FF4500]" />
                        <span>{p.rating?.average ? p.rating.average.toFixed(1) : '5.0'}</span>
                        <span className="text-slate-400 font-bold text-xs">({p.rating?.count || 1})</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starts from</p>
                        <p className="font-black text-[#FF4500] text-base">₹{p.pricing?.basePrice || 250}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/provider/${p._id}`}
                    className="w-full mt-5 py-3 bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <span>Book Now</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 bg-white border border-[#EEEEEE] rounded-2xl text-center shadow-sm">
              <p className="text-sm font-extrabold text-[#666666]">
                No top rated providers found nearby. Try updating your location.
              </p>
            </div>
          )}
        </section>

        {/* Recent Bookings Section */}
        <section className="space-y-6">
          <h3 className="text-xl lg:text-2xl font-black tracking-tight text-[#1A1A1A]">Recent Bookings</h3>
          
          {loadingBookings ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white border border-[#EEEEEE] rounded-2xl animate-pulse shadow-sm" />
              ))}
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recentBookings.slice(0, 3).map((b) => (
                <div
                  key={b._id}
                  onClick={() => navigate(`/bookings/${b._id}`)}
                  className="bg-white border border-[#EEEEEE] rounded-2xl p-5 flex justify-between items-center hover:border-[#FF4500] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-sm"
                >
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-[#1A1A1A] text-base">{b.serviceInfo?.title || 'Home Service'}</h4>
                    <p className="text-xs font-bold text-[#FF4500]">
                      {b.provider?.businessName || 'Local Expert'}
                    </p>
                    <p className="text-xs text-[#666666] font-semibold">
                      {new Date(b.scheduledDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })} • {b.scheduledSlot}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="font-black text-[#1A1A1A] text-base">₹{b.totalAmount}</span>
                    {getStatusBadge(b.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 bg-white border border-[#EEEEEE] rounded-2xl text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF4500] mb-4 border border-[#FFC0AC]">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-[#666666]">No bookings yet</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Find a service near you to start booking!</p>
            </div>
          )}
        </section>

      </main>

      <BottomNav />
    </div>
  );
};

export default HomePage;

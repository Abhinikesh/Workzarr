import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Search, Star, MapPin, Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">
        
        {/* Banner with Title and Search */}
        <section className="bg-[#0f172a] text-white rounded-2xl p-6 lg:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-orange-500 font-bold uppercase tracking-wider text-xs">
              Bharat ka trusted service marketplace
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Get professional home services on demand
            </h2>
            <p className="text-slate-400 text-sm lg:text-base">
              Verified local experts for every need. Book Electricians, Plumbers, Carpenters, AC Repair and more instantly.
            </p>

            <form onSubmit={handleSearchSubmit} className="pt-4 flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for electrician, plumber, AC repair..."
                  className="w-full bg-white text-slate-900 pl-11 pr-4 py-3.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 rounded-lg text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Search</span>
              </button>
            </form>
          </div>
        </section>

        {/* Category Grid Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-baseline">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Browse Categories</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.length > 0 ? (
              categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat._id}
                  to={`/search?categoryId=${cat._id}`}
                  className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-xl hover:border-orange-500 hover:shadow-sm transition-all text-center group cursor-pointer"
                >
                  <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon || '🛠️'}</span>
                  <span className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
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
                  className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-xl hover:border-orange-500 hover:shadow-sm transition-all text-center group cursor-pointer"
                >
                  <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{c.icon}</span>
                  <span className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                    {c.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Horizontal scroll of Top-Rated Providers */}
        <section className="space-y-4">
          <div className="flex justify-between items-baseline">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Top Rated Providers Near You</h3>
            <Link to="/search" className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingProviders ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="min-w-[260px] max-w-[260px] bg-white border border-slate-200 rounded-xl p-4 space-y-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-9 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : topProviders.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {topProviders.map((p) => (
                <div
                  key={p._id}
                  className="min-w-[260px] max-w-[260px] bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-orange-500 hover:shadow-sm transition-all"
                >
                  <div className="space-y-3.5">
                    {/* Provider Meta */}
                    <div className="flex gap-3">
                      {p.profileImage ? (
                        <img
                          src={p.profileImage}
                          alt={p.businessName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold shrink-0">
                          {getProviderInitials(p.businessName || p.user?.name)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{p.businessName || p.user?.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {p.category?.name || 'Local Partner'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Rating */}
                    <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                        <span>{p.rating?.average ? p.rating.average.toFixed(1) : '5.0'}</span>
                        <span className="text-slate-400 font-medium text-xs">({p.rating?.count || 1})</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-medium">Starts from</p>
                        <p className="font-bold text-orange-600">₹{p.pricing?.basePrice || 250}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/provider/${p._id}`}
                    className="w-full mt-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Book Now</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center">
              <p className="text-sm font-semibold text-slate-500">
                No top rated providers found nearby. Try updating your location.
              </p>
            </div>
          )}
        </section>

        {/* Recent Bookings Section */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Bookings</h3>
          
          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentBookings.slice(0, 3).map((b) => (
                <div
                  key={b._id}
                  onClick={() => navigate(`/bookings/${b._id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-orange-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800">{b.serviceInfo?.title || 'Home Service'}</h4>
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <span>{b.provider?.businessName || 'Local Expert'}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {new Date(b.scheduledDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })} • {b.scheduledSlot}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-slate-800">₹{b.totalAmount}</span>
                    {getStatusBadge(b.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No bookings yet</p>
              <p className="text-xs text-slate-400 mt-1">Find a service near you to start booking!</p>
            </div>
          )}
        </section>

      </main>

      <BottomNav />
    </div>
  );
};

export default HomePage;

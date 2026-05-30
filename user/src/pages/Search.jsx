import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Search, Star, MapPin, SlidersHorizontal, ArrowUpDown, ChevronRight, Ban } from 'lucide-react';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryQ = searchParams.get('q') || '';
  const queryCatId = searchParams.get('categoryId') || '';

  const [searchText, setSearchText] = useState(queryQ);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering & Sorting states
  const [selectedCatId, setSelectedCatId] = useState(queryCatId);
  const [sortBy, setSortBy] = useState('relevance'); // rating, price, distance, relevance
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');

  // Default region coordinates matching seeded providers
  const lat = 28.57;
  const lng = 77.32;

  useEffect(() => {
    // Fetch Categories for Chips
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/categories');
        setCategories(res.data.data.categories || []);
      } catch (err) {
        console.warn('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  // Sync category state with search parameters
  useEffect(() => {
    setSelectedCatId(queryCatId);
  }, [queryCatId]);

  // Main search / fetch trigger
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        let url = `/providers/search?lat=${lat}&lng=${lng}&sortBy=${sortBy}`;
        
        if (selectedCatId) {
          url += `&categoryId=${selectedCatId}`;
        }
        if (maxPrice) {
          url += `&maxPrice=${maxPrice}`;
        }
        if (minRating) {
          url += `&minRating=${minRating}`;
        }

        const res = await axiosInstance.get(url);
        let list = res.data.data.providers || [];

        // Client-side text search matching business name or category
        if (searchText.trim()) {
          const lowerQ = searchText.toLowerCase().trim();
          list = list.filter(
            (p) =>
              p.businessName?.toLowerCase().includes(lowerQ) ||
              p.category?.name?.toLowerCase().includes(lowerQ) ||
              p.user?.name?.toLowerCase().includes(lowerQ)
          );
        }

        setProviders(list);
      } catch (err) {
        console.warn('Failed to search providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [selectedCatId, sortBy, maxPrice, minRating, searchText]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (searchText.trim()) {
        prev.set('q', searchText.trim());
      } else {
        prev.delete('q');
      }
      return prev;
    });
  };

  const selectCategory = (id) => {
    setSelectedCatId(id);
    setSearchParams((prev) => {
      if (id) {
        prev.set('categoryId', id);
      } else {
        prev.delete('categoryId');
      }
      return prev;
    });
  };

  const getProviderInitials = (name) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const clearFilters = () => {
    setMaxPrice('');
    setMinRating('');
    setSortBy('relevance');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24 lg:pb-12 text-[#1A1A1A]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Search Bar at Top */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search for providers or services..."
              className="w-full bg-[#FFFFFF] text-[#1A1A1A] pl-12 pr-4 py-4 rounded-xl border border-[#DDDDDD] text-sm focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium transition-all"
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            type="submit"
            className="bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold px-7 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-md"
          >
            Search
          </button>
        </form>

        {/* Category Filter Chips Horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => selectCategory('')}
            className={`px-4.5 py-2 rounded-full text-xs font-extrabold shrink-0 transition-all duration-200 cursor-pointer ${
              !selectedCatId
                ? 'bg-[#FF4500] text-white border border-[#FF4500]'
                : 'bg-white text-[#666666] border border-[#EEEEEE] hover:border-[#FF4500] hover:text-[#1A1A1A]'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => selectCategory(cat._id)}
              className={`px-4.5 py-2 rounded-full text-xs font-extrabold shrink-0 transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                selectedCatId === cat._id
                  ? 'bg-[#FF4500] text-white border-[#FF4500]'
                  : 'bg-white text-[#666666] border-[#EEEEEE] hover:border-[#FF4500] hover:text-[#1A1A1A]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Controls Layout */}
        <div className="flex justify-between items-center bg-white border border-[#EEEEEE] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-4 text-xs font-bold text-[#666666]">
            <span>{providers.length} Partners Available</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Toggle advanced filter pane */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                showFilters || maxPrice || minRating
                  ? 'bg-[#FFF0EB] border-[#FFC0AC] text-[#FF4500]'
                  : 'bg-white border-[#EEEEEE] text-[#666666] hover:border-[#FF4500]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Sorting Dropdown */}
            <div className="relative flex items-center gap-1.5 px-4 py-2 bg-white border border-[#EEEEEE] rounded-xl text-xs font-extrabold text-[#666666]">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Top Rated</option>
                <option value="price">Price: Low to High</option>
                <option value="distance">Nearest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters Block */}
        {showFilters && (
          <div className="bg-white border border-[#EEEEEE] rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-extrabold text-[#1A1A1A]">Filter Options</h4>
              <button
                onClick={clearFilters}
                className="text-xs font-extrabold text-[#FF4500] hover:underline"
              >
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Max Price */}
              <div>
                <label className="block text-xs font-bold text-[#666666] mb-2">Max Budget (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DDDDDD] rounded-xl px-4 py-3 text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-xs font-bold text-[#666666] mb-2">Minimum Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DDDDDD] rounded-xl px-4 py-3 text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-semibold text-[#1A1A1A]"
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5 ★ & above</option>
                  <option value="4.0">4.0 ★ & above</option>
                  <option value="3.5">3.5 ★ & above</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* List View of Providers */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#EEEEEE] rounded-2xl p-5 flex gap-4 animate-pulse shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full shrink-0" />
                <div className="space-y-3.5 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/6" />
                  <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="space-y-4">
            {providers.map((p) => (
              <div
                key={p._id}
                className="bg-white border border-[#EEEEEE] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#FF4500] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
              >
                {/* Left Side: Avatar & Details */}
                <div className="flex gap-4.5">
                  {p.profileImage ? (
                    <img
                      src={p.profileImage}
                      alt={p.businessName}
                      className="w-16 h-16 rounded-full object-cover border border-[#EEEEEE] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#FFF0EB] border border-[#FFC0AC] flex items-center justify-center text-[#FF4500] font-black text-lg shrink-0">
                      {getProviderInitials(p.businessName || p.user?.name)}
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-[#1A1A1A] text-base leading-tight truncate">{p.businessName || p.user?.name}</h4>
                      {p.isVerified && (
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs font-bold text-[#666666] flex items-center gap-1.5 flex-wrap">
                      <span>{p.category?.name || 'Home Services'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-bold text-[#1A1A1A]">
                        <Star className="w-3.5 h-3.5 text-[#FF4500] fill-[#FF4500]" />
                        {p.rating?.average ? p.rating.average.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-slate-400 font-bold">({p.rating?.count || 1} reviews)</span>
                    </p>

                    <p className="text-xs text-[#666666] font-medium line-clamp-1 leading-relaxed">{p.bio || 'Local experienced service provider.'}</p>
                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.location?.town}, {p.location?.district}</span>
                    </p>
                  </div>
                </div>

                {/* Right Side: Pricing & CTA */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-[#EEEEEE] pt-4 md:pt-0 shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Charges starting from</p>
                    <p className="font-black text-[#FF4500] text-lg">₹{p.pricing?.basePrice || 250}</p>
                  </div>

                  <Link
                    to={`/provider/${p._id}`}
                    className="py-3 px-5 bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm hover:shadow-md mt-0 md:mt-4"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#EEEEEE] rounded-2xl p-14 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-16 h-16 bg-[#FFF0EB] rounded-full flex items-center justify-center text-[#FF4500] mb-4 border border-[#FFC0AC]">
              <Ban className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-[#1A1A1A]">No service providers found</h3>
            <p className="text-xs text-[#666666] max-w-sm mt-1.5 leading-relaxed">
              No registered providers matched your search filters. Try widening your price range or category search.
            </p>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default SearchPage;

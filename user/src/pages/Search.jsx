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
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Search Bar at Top */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search for providers or services..."
              className="w-full bg-white text-slate-900 pl-11 pr-4 py-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Category Filter Chips Horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => selectCategory('')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              !selectedCatId
                ? 'bg-orange-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-500'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => selectCategory(cat._id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                selectedCatId === cat._id
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-500'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Controls Layout */}
        <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="text-slate-800 font-bold">{providers.length} Partners Available</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle advanced filter pane */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                showFilters || maxPrice || minRating
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-orange-500'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Sorting Dropdown */}
            <div className="relative flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800">Filter Options</h4>
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Max Budget (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Minimum Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-slate-200 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/6" />
                  <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="space-y-4">
            {providers.map((p) => (
              <div
                key={p._id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-orange-500 hover:shadow-sm transition-all"
              >
                {/* Left Side: Avatar & Details */}
                <div className="flex gap-4">
                  {p.profileImage ? (
                    <img
                      src={p.profileImage}
                      alt={p.businessName}
                      className="w-16 h-16 rounded-full object-cover border border-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-lg shrink-0">
                      {getProviderInitials(p.businessName || p.user?.name)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-800 text-base">{p.businessName || p.user?.name}</h4>
                      {p.isVerified && (
                        <span className="bg-green-50 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wide">
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <span>{p.category?.name || 'Home Services'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-bold text-slate-700">
                        <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                        {p.rating?.average ? p.rating.average.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-slate-400 font-medium">({p.rating?.count || 1} reviews)</span>
                    </p>

                    <p className="text-xs text-slate-400 font-medium line-clamp-1">{p.bio || 'Local experienced service provider.'}</p>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.location?.town}, {p.location?.district}</span>
                    </p>
                  </div>
                </div>

                {/* Right Side: Pricing & CTA */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-400 font-medium">Charges starting from</p>
                    <p className="font-extrabold text-orange-600 text-lg">₹{p.pricing?.basePrice || 250}</p>
                  </div>

                  <Link
                    to={`/provider/${p._id}`}
                    className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Ban className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No service providers found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
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

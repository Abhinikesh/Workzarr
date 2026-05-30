import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { User, Phone, Mail, MapPin, Edit2, LogOut, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [town, setTown] = useState(user?.location?.town || '');
  const [district, setDistrict] = useState(user?.location?.district || '');
  const [stateName, setStateName] = useState(user?.location?.state || 'Haryana');
  const [pincode, setPincode] = useState(user?.location?.pincode || '');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/bookings');
        setBookings(res.data.data.bookings || []);
      } catch (err) {
        console.warn('Failed to load bookings for profile stats');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!town.trim() || !district.trim() || !pincode.trim()) {
      toast.error('Location fields are required');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        town: town.trim(),
        district: district.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      };

      const response = await axiosInstance.patch('/auth/complete-profile', payload);
      
      const updatedUser = response.data.data.user;

      // Update store
      dispatch(setCredentials({ user: updatedUser }));
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // Stats calculation
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled' || b.status === 'no_show').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-extrabold text-xl shrink-0">
              {getInitials(user?.name)}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{user?.name || 'Local User'}</h2>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91 {user?.phone}</span>
              </p>
              {user?.email && (
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 border border-slate-200 hover:border-orange-500 hover:bg-orange-50 rounded-lg text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Stats Row Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-lg font-extrabold text-slate-800">{totalBookings}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Bookings</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-lg font-extrabold text-green-600">{completedBookings}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Completed</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-lg font-extrabold text-red-600">{cancelledBookings}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Cancelled</p>
          </div>
        </div>

        {/* Inline Editing Form */}
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Edit Profile Details</h3>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Town / City</label>
                  <input
                    type="text"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">State</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pincode</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        ) : (
          /* Static details block */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Primary Address</h3>
            
            <div className="flex gap-2 text-xs font-semibold text-slate-600">
              <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-800">{user?.location?.town || 'No address set'}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {user?.location?.district}, {user?.location?.state} - {user?.location?.pincode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-white hover:bg-red-50 text-red-600 font-bold border border-red-100 rounded-xl shadow-sm text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>

      </main>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;

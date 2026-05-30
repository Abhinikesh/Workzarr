import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { User, Phone, Mail, MapPin, Edit2, LogOut, Check, Loader2, Calendar, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const user = useSelector(s => s.auth.user);
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
      } catch {
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

  const handleUpdateProfile = async e => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!town.trim() || !district.trim() || !pincode.trim()) { toast.error('Location fields are required'); return; }
    if (!/^\d{6}$/.test(pincode)) { toast.error('Pincode must be exactly 6 digits'); return; }

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
      dispatch(setCredentials({ user: response.data.data.user }));
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = name => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = bookings.filter(b => ['cancelled', 'no_show'].includes(b.status)).length;

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm font-medium transition-all focus:outline-none";
  const inputStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DDDDDD',
    color: '#1A1A1A',
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-12" style={{ backgroundColor: '#F8F8F8' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Profile Header Card */}
        <div
          className="rounded-2xl p-6 shadow-sm flex justify-between items-start gap-4"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-xl shrink-0"
              style={{ backgroundColor: '#FFF0EB', border: '1px solid #FFC0AC', color: '#FF4500' }}
            >
              {getInitials(user?.name)}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: '#1A1A1A' }}>{user?.name || 'Local User'}</h2>
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#666666' }}>
                <Phone className="w-3.5 h-3.5" />
                +91 {user?.phone}
              </p>
              {user?.email && (
                <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#666666' }}>
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2.5 rounded-xl transition-all cursor-pointer"
            style={{
              backgroundColor: isEditing ? '#FFF0EB' : '#F8F8F8',
              border: '1px solid #EEEEEE',
              color: isEditing ? '#FF4500' : '#666666',
            }}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: totalBookings, label: 'Total Bookings', color: '#1A1A1A' },
            { value: completedBookings, label: 'Completed', color: '#15803D' },
            { value: cancelledBookings, label: 'Cancelled', color: '#B91C1C' },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 text-center shadow-sm"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full animate-pulse mx-auto mb-1" style={{ backgroundColor: '#EEEEEE' }} />
              ) : (
                <p className="text-xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-wider mt-1.5" style={{ color: '#999999' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Edit Form or Address View */}
        {isEditing ? (
          <form
            onSubmit={handleUpdateProfile}
            className="rounded-2xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
          >
            <h3 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>Edit Profile Details</h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#666666' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, minHeight: '44px' }}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#666666' }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, minHeight: '44px' }}
                  placeholder="your@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Town / City', value: town, set: setTown, ph: 'e.g. Rohtak' },
                  { label: 'District', value: district, set: setDistrict, ph: 'e.g. Rohtak' },
                  { label: 'State', value: stateName, set: setStateName, ph: 'e.g. Haryana' },
                  { label: 'Pincode', value: pincode, set: v => setPincode(v.replace(/\D/g, '')), ph: '6 digits', maxLength: 6 },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#666666' }}>{f.label}</label>
                    <input
                      type="text"
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      maxLength={f.maxLength}
                      placeholder={f.ph}
                      className={inputClass}
                      style={{ ...inputStyle, minHeight: '44px', fontSize: '12px' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-3.5 font-extrabold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              style={{ backgroundColor: '#FF4500', color: '#FFFFFF', opacity: updating ? 0.6 : 1 }}
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div
            className="rounded-2xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
          >
            <h3 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>Primary Address</h3>
            <div className="flex gap-2.5 text-sm font-semibold" style={{ color: '#666666' }}>
              <MapPin className="w-4.5 h-4.5 shrink-0 mt-0.5" style={{ color: '#FF4500' }} />
              <div>
                <p style={{ color: '#1A1A1A' }}>{user?.location?.town || 'No address set'}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#999999' }}>
                  {user?.location?.district}, {user?.location?.state} — {user?.location?.pincode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 font-extrabold border rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          style={{ backgroundColor: '#FFFFFF', color: '#B91C1C', borderColor: '#FECACA' }}
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

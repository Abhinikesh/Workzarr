import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import { toast } from 'sonner';
import { User, Mail, MapPin, Building, Globe, Landmark, Loader2 } from 'lucide-react';

const CompleteProfile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [town, setTown] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('Haryana'); // Default to realistic local state
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!town.trim() || !district.trim() || !pincode.trim()) {
      toast.error('Address fields are required');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return;
    }

    setLoading(true);
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

      // Update Redux state
      dispatch(setCredentials({ user: updatedUser }));

      toast.success('Profile completed successfully!');
      navigate('/home', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="w-full max-w-lg rounded-2xl p-8 shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
        <div className="mb-8">
          <span className="font-extrabold uppercase tracking-wider text-[10px] mb-1 block" style={{ color: '#FF4500' }}>
            Step 2: Setup Profile
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#1A1A1A' }}>Complete your profile</h1>
          <p className="text-xs mt-1.5 font-semibold" style={{ color: '#666666' }}>Provide your details to find local service partners near you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#999999' }}>
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: '#999999' }}>
                <User className="w-5 h-5" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abhinav Sharma"
                required
                className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#999999' }}>
              Email Address (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: '#999999' }}>
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. abhinav@email.com"
                className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
              />
            </div>
          </div>

          <div className="border-t my-6 pt-5" style={{ borderColor: '#F0F0F0' }}>
            <h3 className="text-xs font-extrabold mb-4 flex items-center gap-1.5" style={{ color: '#1A1A1A' }}>
              <MapPin className="w-4 h-4" style={{ color: '#FF4500' }} />
              Location Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Town */}
              <div>
                <label htmlFor="town" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>
                  Town / City *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: '#999999' }}>
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="town"
                    type="text"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    placeholder="e.g. Rohtak"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>
              </div>

              {/* District */}
              <div>
                <label htmlFor="district" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>
                  District *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: '#999999' }}>
                    <Landmark className="w-4 h-4" />
                  </div>
                  <input
                    id="district"
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Rohtak"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>
                  State *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: '#999999' }}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    id="state"
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Haryana"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="pincode" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>
                  Pincode (6 digits) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: '#999999' }}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 124001"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-bold rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-2 cursor-pointer mt-4"
            style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Start Booking'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;

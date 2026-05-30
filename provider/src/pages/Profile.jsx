import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { User, Phone, Briefcase, Star, CheckCircle2, AlertCircle, Trash2, Plus, Edit2, LogOut, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const provider = useSelector((s) => s.auth.provider);
  const user = useSelector((s) => s.auth.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(provider?.businessName || '');
  const [bio, setBio] = useState(provider?.bio || '');
  const [town, setTown] = useState(provider?.location?.town || '');
  const [district, setDistrict] = useState(provider?.location?.district || '');
  const [stateName, setStateName] = useState(provider?.location?.state || 'Haryana');
  const [pincode, setPincode] = useState(provider?.location?.pincode || '');

  // Custom services states
  const [services, setServices] = useState([]);
  const [loadingSvcs, setLoadingSvcs] = useState(false);
  const [submittingSvc, setSubmittingSvc] = useState(false);
  const [showAddSvc, setShowAddSvc] = useState(false);

  // New service form
  const [newSvcTitle, setNewSvcTitle] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [newSvcDuration, setNewSvcDuration] = useState('60');

  const fetchServices = async () => {
    setLoadingSvcs(true);
    try {
      const res = await axiosInstance.get('/services/mine');
      setServices(res.data.data.services || []);
    } catch (err) {
      console.warn('Failed to load custom services');
    } finally {
      setLoadingSvcs(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !town.trim() || !district.trim() || !pincode.trim()) {
      toast.error('All address and name fields are required');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return;
    }

    setSubmittingSvc(true);
    try {
      const payload = {
        businessName: businessName.trim(),
        bio: bio.trim(),
        town: town.trim(),
        district: district.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      };

      const res = await axiosInstance.patch('/providers/me/profile', payload);
      const updatedProfile = res.data.data.provider;

      dispatch(setCredentials({ provider: updatedProfile }));
      toast.success('Professional profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update provider profile details');
    } finally {
      setSubmittingSvc(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newSvcTitle.trim() || !newSvcPrice) {
      toast.error('Service package title and price are required');
      return;
    }

    setSubmittingSvc(true);
    try {
      await axiosInstance.post('/services', {
        title: newSvcTitle.trim(),
        description: `Premium service package for ${newSvcTitle.trim()}. Done by verified professionals.`,
        price: Number(newSvcPrice),
        priceType: 'fixed',
        duration: Number(newSvcDuration),
      });

      toast.success('Custom service package added successfully!');
      setNewSvcTitle('');
      setNewSvcPrice('');
      setShowAddSvc(false);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add service');
    } finally {
      setSubmittingSvc(false);
    }
  };

  const handleDeleteService = async (svcId) => {
    if (!window.confirm('Are you sure you want to remove this service package?')) return;

    try {
      await axiosInstance.delete(`/services/${svcId}`);
      toast.success('Service package removed successfully');
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove service package');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8" style={{ backgroundColor: '#F8F8F8' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Profile Card Header */}
        <div className="rounded-2xl p-6 shadow-sm flex justify-between items-start gap-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border flex items-center justify-center font-extrabold text-xl shrink-0"
              style={{ backgroundColor: '#FFF0EB', borderColor: '#FFC0AC', color: '#FF4500' }}>
              {getInitials(provider?.businessName || user?.name)}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold tracking-tight" style={{ color: '#1A1A1A' }}>{provider?.businessName || user?.name}</h2>
                <span className="border text-[9px] font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: '#FFF0EB', borderColor: '#FFC0AC', color: '#FF4500' }}>
                  {provider?.subscription?.plan || 'Free'} Plan
                </span>
              </div>
              
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#666666' }}>
                <Briefcase className="w-3.5 h-3.5" style={{ color: '#999999' }} />
                <span>{provider?.category?.name || 'Local Service Expert'}</span>
              </p>
              
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#666666' }}>
                <Phone className="w-3.5 h-3.5" style={{ color: '#999999' }} />
                <span>+91 {provider?.phone || user?.phone}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 border rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: isEditing ? '#FFF0EB' : '#FFFFFF',
              borderColor: isEditing ? '#FFC0AC' : '#EEEEEE',
              color: isEditing ? '#FF4500' : '#666666'
            }}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="rounded-2xl p-5 shadow-sm space-y-3 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#999999' }}>Verification Status</h3>
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              {provider?.isVerified ? (
                <>
                  <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#16A34A' }} />
                  <span style={{ color: '#16A34A' }}>Aadhaar & Background Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 shrink-0" style={{ color: '#F59E0B' }} />
                  <span style={{ color: '#D97706' }}>Verification Pending</span>
                </>
              )}
            </div>
            <span className="text-[10px] font-semibold" style={{ color: '#999999' }}>Rohtak Region</span>
          </div>
        </div>

        {/* Inline Profile Editing Form */}
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="rounded-2xl p-6 shadow-sm space-y-4 border animate-scaleUp" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
            <h3 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>Edit Business Info</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full border rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength="200"
                  rows="2"
                  className="w-full border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>Town</label>
                  <input
                    type="text"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>State</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#999999' }}>Pincode</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingSvc}
              className="w-full py-3 text-white font-extrabold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: '#FF4500' }}
            >
              {submittingSvc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
            </button>
          </form>
        ) : (
          /* Address details static */
          <div className="rounded-2xl p-6 shadow-sm space-y-3 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#999999' }}>Business Description</h3>
            <p className="text-xs leading-relaxed italic font-semibold" style={{ color: '#666666' }}>
              "{provider?.bio || 'No business description provided yet.'}"
            </p>
          </div>
        )}

        {/* Custom Services Management List */}
        <div className="rounded-2xl p-6 shadow-sm space-y-4 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>My Custom Services</h3>
            <button
              onClick={() => setShowAddSvc(!showAddSvc)}
              className="px-3.5 py-2 text-white font-extrabold rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              style={{ backgroundColor: '#FF4500' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Package</span>
            </button>
          </div>

          {/* Add Service mini modal inline */}
          {showAddSvc && (
            <form onSubmit={handleAddService} className="p-4 rounded-xl space-y-3 border animate-scaleUp" style={{ backgroundColor: '#FFF0EB', borderColor: '#FFC0AC' }}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#FF4500' }}>Create New Service</h4>
              
              <div>
                <label className="block text-[10px] font-semibold mb-1" style={{ color: '#666666' }}>Service Title *</label>
                <input
                  type="text"
                  value={newSvcTitle}
                  onChange={(e) => setNewSvcTitle(e.target.value)}
                  placeholder="e.g. Copper wiring repair"
                  required
                  className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold mb-1" style={{ color: '#666666' }}>Price (₹) *</label>
                  <input
                    type="number"
                    value={newSvcPrice}
                    onChange={(e) => setNewSvcPrice(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold mb-1" style={{ color: '#666666' }}>Duration (Mins)</label>
                  <input
                    type="number"
                    value={newSvcDuration}
                    onChange={(e) => setNewSvcDuration(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddSvc(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold rounded-lg text-[10px]"
                  style={{ backgroundColor: '#EBEBEB' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSvc}
                  className="px-3.5 py-1.5 text-white font-bold rounded-lg text-[10px]"
                  style={{ backgroundColor: '#FF4500' }}
                >
                  {submittingSvc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Service'}
                </button>
              </div>
            </form>
          )}

          {/* List of custom services */}
          {loadingSvcs ? (
            <div className="py-6 text-center text-xs" style={{ color: '#999999' }}>Loading custom services...</div>
          ) : services.length > 0 ? (
            <div className="divide-y text-xs" style={{ borderColor: '#F5F5F5' }}>
              {services.map((svc) => (
                <div key={svc._id} className="py-3.5 flex justify-between items-center gap-4">
                  <div>
                    <h4 className="font-extrabold" style={{ color: '#1A1A1A' }}>{svc.title}</h4>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#666666' }}>₹{svc.price} • {svc.duration} Mins</p>
                  </div>
                  <button
                    onClick={() => handleDeleteService(svc._id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-transparent"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FCA5A5';
                      e.currentTarget.style.backgroundColor = '#FEF2F2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs font-semibold" style={{ color: '#999999' }}>
              No custom services added. Use the general pricing package.
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-white font-extrabold rounded-xl border shadow-sm text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          style={{ borderColor: '#FECACA', color: '#DC2626' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
          }}
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

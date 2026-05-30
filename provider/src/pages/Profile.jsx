import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { User, Phone, Briefcase, Star, CreditCard, CheckCircle2, AlertCircle, Trash2, Plus, Edit2, LogOut, Loader2, Check } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-extrabold text-xl shrink-0">
              {getInitials(provider?.businessName || user?.name)}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{provider?.businessName || user?.name}</h2>
                <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[9px] font-bold px-2 py-0.5 rounded-full capitalize">
                  {provider?.subscription?.plan || 'Free'} Plan
                </span>
              </div>
              
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{provider?.category?.name || 'Local Service Expert'}</span>
              </p>
              
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91 {provider?.phone || user?.phone}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 border border-slate-200 hover:border-orange-500 hover:bg-orange-50 rounded-lg text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Status</h3>
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              {provider?.isVerified ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-green-700">Aadhaar & Background Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-amber-700">Verification Pending</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Rohtak Region</span>
          </div>
        </div>

        {/* Inline Profile Editing Form */}
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-800">Edit Business Info</h3>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength="200"
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Town</label>
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
              disabled={submittingSvc}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submittingSvc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
            </button>
          </form>
        ) : (
          /* Address details static */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business Description</h3>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "{provider?.bio || 'No business description provided yet.'}"
            </p>
          </div>
        )}

        {/* Custom Services Management List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">My Custom Services</h3>
            <button
              onClick={() => setShowAddSvc(!showAddSvc)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Package</span>
            </button>
          </div>

          {/* Add Service mini modal inline */}
          {showAddSvc && (
            <form onSubmit={handleAddService} className="p-4 bg-orange-50/20 border border-orange-100 rounded-xl space-y-3 animate-scaleUp">
              <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wider">Create New Service</h4>
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Service Title *</label>
                <input
                  type="text"
                  value={newSvcTitle}
                  onChange={(e) => setNewSvcTitle(e.target.value)}
                  placeholder="e.g. Copper wiring repair"
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={newSvcPrice}
                    onChange={(e) => setNewSvcPrice(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newSvcDuration}
                    onChange={(e) => setNewSvcDuration(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddSvc(false)}
                  className="px-3.5 py-1.5 bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSvc}
                  className="px-3.5 py-1.5 bg-orange-600 text-white font-bold rounded-lg text-[10px]"
                >
                  {submittingSvc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Service'}
                </button>
              </div>
            </form>
          )}

          {/* List of custom services */}
          {loadingSvcs ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading custom services...</div>
          ) : services.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {services.map((svc) => (
                <div key={svc._id} className="py-3 flex justify-between items-center gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800">{svc.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">₹{svc.price} • {svc.duration} Mins</p>
                  </div>
                  <button
                    onClick={() => handleDeleteService(svc._id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 font-semibold">
              No custom services added. Use the general pricing package.
            </div>
          )}
        </div>

        {/* Logout */}
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { axiosInstance } from '../lib/axios';
import { toast } from 'sonner';
import { Loader2, Briefcase, MapPin, BadgeIndianRupee, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUser = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Step 1: Basic Info & Address
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [town, setTown] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('Haryana');
  const [pincode, setPincode] = useState('');

  // Step 2: Professional Info
  const [categoryId, setCategoryId] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');

  // Step 3: Base Pricing & Custom Service
  const [basePrice, setBasePrice] = useState(250);
  const [priceUnit, setPriceUnit] = useState('per_job'); // per_hour, per_job, negotiable
  const [serviceTitle, setServiceTitle] = useState('General Maintenance Service');
  const [servicePrice, setServicePrice] = useState(250);
  const [serviceDuration, setServiceDuration] = useState(60); // minutes

  useEffect(() => {
    // Load active categories from API
    const loadCategories = async () => {
      setLoadingCats(true);
      try {
        const res = await axiosInstance.get('/categories');
        const list = res.data.data.categories || [];
        setCategories(list);
        if (list.length > 0) {
          setCategoryId(list[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load categories');
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, []);

  const handleNextStep = () => {
    if (step === 1) {
      if (!businessName.trim() || !town.trim() || !district.trim() || !pincode.trim()) {
        toast.error('Please fill in all basic info and location fields');
        return;
      }
      if (!/^\d{6}$/.test(pincode)) {
        toast.error('Pincode must be exactly 6 digits');
        return;
      }
    }
    if (step === 2) {
      if (!categoryId) {
        toast.error('Please select a business category');
        return;
      }
      if (!bio.trim() || bio.length > 200) {
        toast.error('Bio is required and must be under 200 characters');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!serviceTitle.trim() || !servicePrice) {
      toast.error('Please provide a standard service package title and price');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Register Provider
      const providerPayload = {
        businessName: businessName.trim(),
        categoryId,
        phone,
        bio: bio.trim(),
        town: town.trim(),
        district: district.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        lat: 28.57, // Default Haryana/Delhi region coords
        lng: 77.32,
        basePrice: Number(basePrice),
        priceUnit,
        priceDescription: 'Base inspection and consulting charges.'
      };

      const providerRes = await axiosInstance.post('/providers/register', providerPayload);
      const newProvider = providerRes.data.data.provider;

      // 2. Create the first custom service (linked to this provider)
      try {
        await axiosInstance.post('/services', {
          title: serviceTitle.trim(),
          description: `Standard service package for ${serviceTitle.trim()}. Done by fully certified professionals.`,
          price: Number(servicePrice),
          priceType: 'fixed',
          duration: Number(serviceDuration),
        });
      } catch (svcErr) {
        console.warn('Custom service creation failed, but provider registered successfully:', svcErr.message);
      }

      // Update Redux state with verified provider profile
      dispatch(setCredentials({ provider: newProvider }));

      // Complete onboarding and move to step 4
      setStep(4);
      toast.success('Professional onboarding complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete provider registration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        
        {/* Progress Tracker Navigation Bar */}
        {step < 4 && (
          <div className="mb-8" aria-label="Progress">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-3">
              <span className={step === 1 ? 'text-orange-600' : 'text-slate-800'}>1. Basic Info</span>
              <span className={step === 2 ? 'text-orange-600' : step > 2 ? 'text-slate-800' : ''}>2. Category</span>
              <span className={step === 3 ? 'text-orange-600' : ''}>3. Pricing</span>
            </div>
            
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-600 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: Basic Info & Address */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Briefcase className="w-5 h-5 text-orange-600" />
                Tell us about your business
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Let local customers know your business name and details.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Business / Provider Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sharma Electric Works"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-600" />
                Work Area & Location
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Town / City *</label>
                  <input
                    type="text"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    placeholder="e.g. Rohtak"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">District *</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Rohtak"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">State *</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 124001"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Category and Bio */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Briefcase className="w-5 h-5 text-orange-600" />
                Category & Experience
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Select the category that best represents your core skills.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Business Category *
              </label>
              {loadingCats ? (
                <div className="py-2.5 text-xs text-slate-400 animate-pulse">Loading categories...</div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-semibold text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Short Bio (Max 200 chars) *
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength="200"
                rows="3"
                placeholder="Briefly explain your specialty..."
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Base Pricing & First Service */}
        {step === 3 && (
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <BadgeIndianRupee className="w-5 h-5 text-orange-600" />
                Setup Base Pricing & Package
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Setup your base billing rate and your first service package detail.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Base Price (₹) *</label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pricing Unit *</label>
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                >
                  <option value="per_hour">Per Hour</option>
                  <option value="per_job">Per Job</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Create First Service Package
              </h3>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Package Title *</label>
                <input
                  type="text"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="e.g. Standard Electrician Visit"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Package Price (₹) *</label>
                  <input
                    type="number"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Est. Duration (Mins) *</label>
                  <input
                    type="number"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Submit & Done</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Completed Onboarding */}
        {step === 4 && (
          <div className="text-center space-y-6 py-6 animate-scaleUp">
            <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Onboarding Successful!</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Your professional profile has been saved. You can now accept incoming jobs and track your earnings!
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full max-w-xs py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;

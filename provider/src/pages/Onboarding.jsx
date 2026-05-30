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
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4 text-[#1A1A1A]">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-[#EEEEEE] p-8 shadow-md">
        
        {/* Progress Tracker Navigation Bar */}
        {step < 4 && (
          <div className="mb-8" aria-label="Progress">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-3">
              <span className={step === 1 ? 'text-[#FF4500]' : 'text-[#666666]'}>1. Basic Info</span>
              <span className={step === 2 ? 'text-[#FF4500]' : step > 2 ? 'text-[#666666]' : ''}>2. Category</span>
              <span className={step === 3 ? 'text-[#FF4500]' : ''}>3. Pricing</span>
            </div>
            
            <div className="h-1.5 bg-[#F8F8F8] rounded-full overflow-hidden border border-[#EEEEEE]">
              <div
                className="h-full bg-[#FF4500] transition-all duration-300 shadow-sm"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: Basic Info & Address */}
        {step === 1 && (
          <BasicInfoStep
            businessName={businessName}
            setBusinessName={setBusinessName}
            town={town}
            setTown={setTown}
            district={district}
            setDistrict={setDistrict}
            stateName={stateName}
            setStateName={setStateName}
            pincode={pincode}
            setPincode={setPincode}
            next={handleNextStep}
          />
        )}

        {/* STEP 2: Category and Bio */}
        {step === 2 && (
          <CategoryStep
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            categories={categories}
            loadingCats={loadingCats}
            experience={experience}
            setExperience={setExperience}
            bio={bio}
            setBio={setBio}
            onPrev={handlePrevStep}
            next={handleNextStep}
          />
        )}

        {/* STEP 3: Base Pricing & First Service */}
        {step === 3 && (
          <PricingStep
            basePrice={basePrice}
            setBasePrice={setBasePrice}
            priceUnit={priceUnit}
            setPriceUnit={setPriceUnit}
            serviceTitle={serviceTitle}
            setServiceTitle={setServiceTitle}
            servicePrice={servicePrice}
            setServicePrice={setServicePrice}
            serviceDuration={serviceDuration}
            setServiceDuration={setServiceDuration}
            onPrev={handlePrevStep}
            next={handleFormSubmit}
            submitting={submitting}
          />
        )}

        {/* STEP 4: Completed Onboarding */}
        {step === 4 && (
          <div className="text-center space-y-6 py-6 animate-scaleUp">
            <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Onboarding Successful!</h2>
              <p className="text-sm text-[#666666] max-w-sm mx-auto leading-relaxed">
                Your professional profile has been saved. You can now accept incoming jobs and track your earnings!
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full max-w-xs py-3.5 bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold rounded-xl text-sm shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
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

// --- Child Step Components ---

export const BasicInfoStep = ({
  businessName,
  setBusinessName,
  town,
  setTown,
  district,
  setDistrict,
  stateName,
  setStateName,
  pincode,
  setPincode,
  onNext,
  next
}) => {
  const handleNext = () => {
    const handler = onNext || next;
    if (typeof handler === 'function') {
      handler();
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#FF4500]" />
          Tell us about your business
        </h2>
        <p className="text-xs text-[#666666] font-semibold mt-1">Let local customers know your business name and details.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#666666] uppercase tracking-widest mb-2.5">
          Business / Provider Name *
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Sharma Electric Works"
          required
          className="w-full px-4 py-3.5 bg-white border border-[#DDDDDD] rounded-xl text-sm placeholder:text-slate-400 focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none transition-all font-medium text-[#1A1A1A]"
          style={{ minHeight: '44px' }}
        />
      </div>

      <div className="border-t border-[#EEEEEE] pt-5 space-y-4">
        <h3 className="text-sm font-extrabold text-[#1A1A1A] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FF4500]" />
          Work Area & Location
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#666666] mb-1.5">Town / City *</label>
            <input
              type="text"
              value={town}
              onChange={(e) => setTown(e.target.value)}
              placeholder="e.g. Rohtak"
              required
              className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#666666] mb-1.5">District *</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Rohtak"
              required
              className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#666666] mb-1.5">State *</label>
            <input
              type="text"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#666666] mb-1.5">Pincode *</label>
            <input
              type="text"
              maxLength="6"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 124001"
              required
              className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="w-full py-3.5 bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-5 shadow-sm"
      >
        <span>Next</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export const CategoryStep = ({
  categoryId,
  setCategoryId,
  categories,
  loadingCats,
  experience,
  setExperience,
  bio,
  setBio,
  onPrev,
  onNext,
  next
}) => {
  const handleNext = () => {
    const handler = onNext || next;
    if (typeof handler === 'function') {
      handler();
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#FF4500]" />
          Category & Experience
        </h2>
        <p className="text-xs text-[#666666] font-semibold mt-1">Select the category that best represents your core skills.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#666666] uppercase tracking-widest mb-2.5">
          Business Category *
        </label>
        {loadingCats ? (
          <div className="py-2.5 text-xs text-[#666666] animate-pulse">Loading categories...</div>
        ) : (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full px-4 py-3.5 bg-white border border-[#DDDDDD] rounded-xl text-sm focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-semibold text-[#1A1A1A]"
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
        <label className="block text-xs font-bold text-[#666666] uppercase tracking-widest mb-2.5">
          Years of Experience
        </label>
        <input
          type="number"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="e.g. 5"
          className="w-full px-4 py-3.5 bg-white border border-[#DDDDDD] rounded-xl text-sm placeholder:text-slate-400 focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
          style={{ minHeight: '44px' }}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#666666] uppercase tracking-widest mb-2.5">
          Short Bio (Max 200 chars) *
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength="200"
          rows="3"
          placeholder="Briefly explain your specialty..."
          required
          className="w-full p-4 bg-white border border-[#DDDDDD] rounded-xl text-xs placeholder:text-slate-400 focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
        />
      </div>

      <div className="flex gap-4 mt-5">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3.5 border border-[#DDDDDD] text-[#666666] hover:text-[#1A1A1A] font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3.5 bg-[#FF4500] hover:bg-[#cc3700] text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const PricingStep = ({
  basePrice,
  setBasePrice,
  priceUnit,
  setPriceUnit,
  serviceTitle,
  setServiceTitle,
  servicePrice,
  setServicePrice,
  serviceDuration,
  setServiceDuration,
  onPrev,
  next,
  submitting
}) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof next === 'function') {
      await next(e);
    } else {
      console.error('PricingStep: next prop is not a function', next);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
          <BadgeIndianRupee className="w-5 h-5 text-[#FF4500]" />
          Setup Base Pricing & Package
        </h2>
        <p className="text-xs text-[#666666] font-semibold mt-1">Setup your base billing rate and your first service package detail.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-[#666666] mb-1.5">Base Price (₹) *</label>
          <input
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#666666] mb-1.5">Pricing Unit *</label>
          <select
            value={priceUnit}
            onChange={(e) => setPriceUnit(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-semibold text-[#1A1A1A]"
          >
            <option value="per_hour">Per Hour</option>
            <option value="per_job">Per Job</option>
            <option value="negotiable">Negotiable</option>
          </select>
        </div>
      </div>

      <div className="border-t border-[#EEEEEE] pt-5 space-y-4">
        <h3 className="text-xs font-black text-[#FF4500] uppercase tracking-widest">
          Create First Service Package
        </h3>

        <div>
          <label className="block text-[10px] font-bold text-[#666666] mb-1.5">Package Title *</label>
          <input
            type="text"
            value={serviceTitle}
            onChange={(e) => setServiceTitle(e.target.value)}
            placeholder="e.g. Standard Electrician Visit"
            required
            className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#666666] mb-1.5">Package Price (₹) *</label>
            <input
              type="number"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#666666] mb-1.5">Est. Duration (Mins) *</label>
            <input
              type="number"
              value={serviceDuration}
              onChange={(e) => setServiceDuration(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white border border-[#DDDDDD] rounded-xl text-xs focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 focus:outline-none font-medium text-[#1A1A1A]"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-5">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3.5 border border-[#DDDDDD] text-[#666666] hover:text-[#1A1A1A] font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-3.5 bg-[#FF4500] hover:bg-[#cc3700] disabled:bg-[#FF4500]/50 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
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
  );
};

export default Onboarding;

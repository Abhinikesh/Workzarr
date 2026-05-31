import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { axiosInstance } from '../../lib/axios';
import { toast } from 'sonner';

const SERVICE_CATEGORIES = [
  'Electrician', 'Plumber', 'AC Repair', 'Carpenter',
  'Cleaner', 'Painter', 'Tutor', 'Mechanic',
  'Home Nurse', 'Computer Repair', 'Pest Control', 'Appliance Repair',
  'Security Camera', 'Gardening', 'Other',
];

export default function ProviderRegister() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    category: '', city: '', phone: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState(1); // 1 = personal, 2 = professional

  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'provider') {
      const token = localStorage.getItem('accessToken') || '';
      const refreshToken = localStorage.getItem('refreshToken') || '';
      window.location.href = `http://localhost:3002/login?token=${token}&refreshToken=${refreshToken}`;
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.city.trim() || !form.phone.trim()) {
      toast.error('Please fill in all professional details');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error('Enter a valid 10-digit Indian phone number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/provider/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        category: form.category,
        city: form.city,
        phone: form.phone,
        role: 'provider',
      });
      const { accessToken, refreshToken, user: registeredUser } = data.data;
      dispatch(setCredentials({ user: registeredUser, accessToken, refreshToken }));
      toast.success('Your provider account is ready! Syncing dashboard...');

      // Redirect seamlessly to Provider App port 3002 dashboard passing tokens
      setTimeout(() => {
        window.location.href = `http://localhost:3002/login?token=${accessToken}&refreshToken=${refreshToken}`;
      }, 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = '/api/v1/auth/google?role=provider';
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px', boxSizing: 'border-box',
    borderRadius: 12, border: '1.5px solid #EEEEEE',
    fontSize: 14.5, color: '#1A1A1A', backgroundColor: '#FFFFFF',
    outline: 'none', transition: 'all 0.2s', fontWeight: 600,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif', backgroundColor: '#FFFFFF' }}>

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div style={{
        width: '42%',
        backgroundColor: '#FFF0EB',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', position: 'relative', overflow: 'hidden',
        borderRight: '1px solid #FFE0D6',
      }} className="auth-left-panel">

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              backgroundColor: '#FF4500',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 69, 0, 0.25)',
            }}>
              <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 20 }}>W</span>
            </div>
            <span style={{ color: '#1A1A1A', fontWeight: 900, fontSize: 22, letterSpacing: '-0.8px' }}>Workzarr</span>
          </Link>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, margin: 'auto 0', padding: '40px 0' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: '#FFFFFF', border: '1px solid #FFE0D6',
            borderRadius: 99, padding: '6px 16px', marginBottom: 24,
          }}>
            <span style={{ fontSize: 14 }}>🚀</span>
            <span style={{ color: '#FF4500', fontSize: 12, fontWeight: 800 }}>Free to join · Earn more today</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 900, color: '#1A1A1A',
            lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 16,
          }}>
            Start earning<br />
            <span style={{ color: '#FF4500' }}>on your terms.</span>
          </h2>
          <p style={{ color: '#666666', fontSize: 14.5, lineHeight: 1.6, fontWeight: 500, maxWidth: 310, marginBottom: 36 }}>
            Register as a specialist and start receiving service bookings in your area.
          </p>

          {/* Earnings card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #FFE0D6',
            borderRadius: 16, padding: 20, marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}>
            <div style={{ color: '#666666', fontSize: 12, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Average Partner Earnings</div>
            <div style={{ color: '#FF4500', fontSize: 32, fontWeight: 900, marginBottom: 4 }}>₹45,000+</div>
            <div style={{ color: '#666666', fontSize: 13, fontWeight: 600 }}>Top providers earn up to ₹90,000/month</div>
          </div>

          {[
            { label: '5K+', desc: 'Active specialists' },
            { label: '50K+', desc: 'Doorstep bookings per month' },
            { label: '4.8★', desc: 'Partner rating avg' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ color: '#FF4500', fontWeight: 900, fontSize: 18, minWidth: 60 }}>{s.label}</div>
              <div style={{ color: '#333333', fontSize: 13.5, fontWeight: 700 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        <p style={{ position: 'relative', zIndex: 1, color: '#999999', fontSize: 11, fontWeight: 700, margin: 0 }}>
          © {new Date().getFullYear()} Workzarr · Provider Portal · Bharat Service Hub
        </p>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div style={{
        flex: 1, backgroundColor: '#F8F8F8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          
          {/* Provider badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: '#FFF0EB', borderRadius: 999, padding: '6px 14px',
            marginBottom: 20, border: '1px solid #FFE0D6',
          }}>
            <span style={{ fontSize: 14 }}>🔧</span>
            <span style={{ color: '#FF4500', fontSize: 12, fontWeight: 800 }}>Provider Registration</span>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: step >= s ? '#FF4500' : '#EEEEEE',
                  color: step >= s ? '#FFFFFF' : '#999999',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                  transition: 'all 0.3s',
                }}>{s}</div>
                {s < 2 && <div style={{ flex: 1, height: 2, backgroundColor: step > s ? '#FF4500' : '#EEEEEE', transition: 'all 0.3s' }} />}
              </React.Fragment>
            ))}
            <span style={{ fontSize: 13, color: '#666666', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {step === 1 ? 'Personal Info' : 'Professional Details'}
            </span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', marginBottom: 6, letterSpacing: '-0.5px' }}>
              {step === 1 ? 'Create your account' : 'Tell us your expertise'}
            </h1>
            <p style={{ color: '#666666', fontSize: 14, fontWeight: 600 }}>
              {step === 1 ? 'Free to join. Start receiving bookings today.' : 'Help customers find you for the right services.'}
            </p>
          </div>

          {step === 1 && (
            <>
              {/* Google */}
              <button type="button" onClick={handleGoogle} style={{
                width: '100%', padding: '13px 20px',
                backgroundColor: '#FFFFFF', border: '1.5px solid #EEEEEE',
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                fontSize: 14, fontWeight: 800, color: '#1A1A1A',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                transition: 'all 0.2s', marginBottom: 20,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF4500'; e.currentTarget.style.backgroundColor = '#FFF0EB'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#EEEEEE'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#EEEEEE' }} />
                <span style={{ color: '#999999', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>or</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#EEEEEE' }} />
              </div>

              <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</label>
                  <input type="text" value={form.name} onChange={handleChange('name')} placeholder="Rajesh Kumar" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                    onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Address</label>
                  <input type="email" value={form.email} onChange={handleChange('email')} placeholder="you@example.com" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                    onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange('password')} placeholder="Min. 6 characters" required style={{ ...inputStyle, paddingRight: 46 }}
                      onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                      onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontSize: 16 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" style={{
                  width: '100%', padding: '14px', marginTop: 4,
                  backgroundColor: '#FF4500',
                  color: '#FFFFFF', border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 69, 0, 0.2)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E03D00'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FF4500'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  Continue →
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Service Category */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Service Category <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select value={form.category} onChange={handleChange('category')} required
                  style={{ ...inputStyle, paddingRight: 16, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                  onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }}>
                  <option value="">Select your primary service</option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  City <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input type="text" value={form.city} onChange={handleChange('city')} placeholder="e.g. Bengaluru, Mumbai" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                  onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }} />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Phone Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#666666', fontSize: 14, fontWeight: 800,
                  }}>+91</div>
                  <input
                    type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit mobile number" required maxLength={10}
                    style={{ ...inputStyle, paddingLeft: 52 }}
                    onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                    onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }}
                  />
                </div>
              </div>

              {/* Info note */}
              <div style={{
                backgroundColor: '#FFF0EB', border: '1px solid #FFE0D6',
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                <p style={{ color: '#FF4500', fontSize: 13, fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
                  Your profile will be reviewed within 24 hours. You'll receive a verification call before going live.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: '0 0 auto', padding: '14px 20px',
                  backgroundColor: '#FFFFFF', color: '#666666',
                  border: '1.5px solid #EEEEEE', borderRadius: 12,
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F8F8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                  ← Back
                </button>
                <button type="submit" disabled={loading} style={{
                  flex: 1, padding: '14px',
                  backgroundColor: loading ? '#FFA380' : '#FF4500',
                  color: '#FFFFFF', border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(255, 69, 0, 0.2)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundColor = '#E03D00'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FF4500'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {loading ? 'Creating Partner Account...' : 'Join as Partner 🚀'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, color: '#666666', fontSize: 13.5, fontWeight: 600 }}>
            Already registered?{' '}
            <Link to="/provider/login" style={{ color: '#FF4500', fontWeight: 800, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}>
              Sign in
            </Link>
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #EEEEEE', marginTop: 24, paddingTop: 16 }}>
            <p style={{ textAlign: 'center', color: '#666666', fontSize: 12.5, fontWeight: 700, margin: 0 }}>
              Looking to book a service?{' '}
              <Link to="/register" style={{ color: '#FF4500', fontWeight: 800, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                Customer Sign Up →
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { axiosInstance } from '../../lib/axios';
import { toast } from 'sonner';

const PERKS = [
  { icon: '🚀', text: 'Instant access to 5,000+ verified local specialists' },
  { icon: '📍', text: 'Active coverage in 120+ Indian municipal cities' },
  { icon: '💳', text: 'Multiple transparent payment methods available' },
  { icon: '🔔', text: 'Real-time service updates and location tracking' },
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]      = useState(false);

  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      const { accessToken, refreshToken, user } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success('Account created! Welcome to Workzarr 🎉');
      navigate('/home', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = '/api/v1/auth/google';
  };

  const passwordStrength = () => {
    if (!form.password) return null;
    if (form.password.length < 6) return { level: 'Weak', color: '#EF4444', width: '33%' };
    if (form.password.length < 10) return { level: 'Medium', color: '#F59E0B', width: '66%' };
    return { level: 'Strong', color: '#10B981', width: '100%' };
  };

  const strength = passwordStrength();

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
        padding: '48px 52px',
        position: 'relative', overflow: 'hidden',
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
            <span style={{ color: '#1A1A1A', fontWeight: 900, fontSize: 22, letterSpacing: '-0.8px' }}>
              Workzarr
            </span>
          </Link>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, margin: 'auto 0', padding: '40px 0' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: '#FFFFFF', border: '1px solid #FFE0D6',
            borderRadius: 99, padding: '6px 16px', marginBottom: 24,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#FF4500', display: 'inline-block' }} />
            <span style={{ color: '#FF4500', fontSize: 12, fontWeight: 800 }}>Join 50,000+ happy customers</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 900, color: '#1A1A1A',
            lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 16,
          }}>
            Get any service,<br />
            <span style={{ color: '#FF4500' }}>anytime, anywhere.</span>
          </h2>
          <p style={{ color: '#666666', fontSize: 14.5, lineHeight: 1.6, fontWeight: 500, maxWidth: 300, marginBottom: 36 }}>
            Create your account and connect with top-rated local professionals in under 2 minutes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERKS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FFE0D6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {p.icon}
                </div>
                <span style={{ color: '#333333', fontSize: 13.5, fontWeight: 700 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', zIndex: 1, color: '#999999', fontSize: 11, fontWeight: 700, margin: 0 }}>
          © {new Date().getFullYear()} Workzarr · Powered by Bharat Service Hub
        </p>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div style={{
        flex: 1, backgroundColor: '#F8F8F8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', marginBottom: 8, letterSpacing: '-0.5px' }}>
              Create your account ✨
            </h1>
            <p style={{ color: '#666666', fontSize: 14, fontWeight: 600 }}>
              Free to join. Access background-verified local pros today.
            </p>
          </div>

          {/* Google */}
          <button type="button" onClick={handleGoogle} style={{
            width: '100%', padding: '13px 20px',
            backgroundColor: '#FFFFFF', border: '1.5px solid #EEEEEE',
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 14, fontWeight: 800, color: '#1A1A1A',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 0.2s', marginBottom: 24,
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

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#EEEEEE' }} />
            <span style={{ color: '#999999', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#EEEEEE' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Full name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</label>
              <input type="text" value={form.name} onChange={handleChange('name')} placeholder="Rajesh Kumar" required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Address</label>
              <input type="email" value={form.email} onChange={handleChange('email')} placeholder="you@example.com" required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }} />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Min. 6 characters"
                  required
                  style={{ ...inputStyle, paddingRight: 46 }}
                  onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                  onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontSize: 16 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {strength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, backgroundColor: '#EEEEEE', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, backgroundColor: strength.color, borderRadius: 4, transition: 'all 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: strength.color, marginTop: 4, display: 'block' }}>{strength.level} password</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Confirm password"
                  required
                  style={{
                    ...inputStyle, paddingRight: 46,
                    borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#EF4444' : '#EEEEEE',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#FF4500'; }}
                  onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontSize: 16 }}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 700, marginTop: 4, display: 'block' }}>Passwords don't match</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', marginTop: 4,
                backgroundColor: loading ? '#FFA380' : '#FF4500',
                color: '#FFFFFF', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(255, 69, 0, 0.2)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundColor = '#E03D00'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FF4500'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, color: '#666666', fontSize: 13.5, fontWeight: 600 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#FF4500', fontWeight: 800, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}>
              Sign in
            </Link>
          </p>

          {/* Provider link */}
          <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #EEEEEE', marginTop: 24, paddingTop: 16 }}>
            <p style={{ textAlign: 'center', color: '#666666', fontSize: 12.5, fontWeight: 700, margin: 0 }}>
              Are you a service provider?{' '}
              <Link to="/provider/register" style={{ color: '#FF4500', fontWeight: 800, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                Register as a Partner →
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

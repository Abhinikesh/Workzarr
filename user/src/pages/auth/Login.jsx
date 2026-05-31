import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { axiosInstance } from '../../lib/axios';
import { toast } from 'sonner';

const BENEFITS = [
  { icon: '🛡️', text: 'Verified & background-checked specialists' },
  { icon: '⚡', text: 'Book any local service in under 2 minutes' },
  { icon: '🔒', text: 'Secure payments held until job completion' },
  { icon: '⭐', text: 'Transparent reviews from real local families' },
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    // Check if redirect query exists
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirectTo') || '/home';
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success(`Welcome back, ${user.name || 'there'}!`);
      
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirectTo');
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate(user.name ? '/home' : '/complete-profile', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = '/api/v1/auth/google';
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

        {/* Main copy */}
        <div style={{ position: 'relative', zIndex: 1, margin: 'auto 0', padding: '40px 0' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#FFFFFF',
            border: '1px solid #FFE0D6',
            borderRadius: 99, padding: '6px 16px', marginBottom: 24,
          }}>
            <span style={{ color: '#FF4500', fontSize: 12, fontWeight: 800 }}>
              Trusted by 50,000+ customers
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 900, color: '#1A1A1A',
            lineHeight: 1.15, letterSpacing: '-1.2px', marginBottom: 16,
          }}>
            Your home,<br />
            <span style={{ color: '#FF4500' }}>always looked after.</span>
          </h2>
          <p style={{ color: '#666666', fontSize: 14.5, lineHeight: 1.6, fontWeight: 500, maxWidth: 320, marginBottom: 36 }}>
            Sign in to instantly access background-verified home service professionals active in your city.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FFE0D6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {b.icon}
                </div>
                <span style={{ color: '#333333', fontSize: 13.5, fontWeight: 700 }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: '#999999', fontSize: 11, fontWeight: 700, margin: 0 }}>
            © {new Date().getFullYear()} Workzarr · Powered by Bharat Service Hub
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div style={{
        flex: 1,
        backgroundColor: '#F8F8F8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          
          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', marginBottom: 8, letterSpacing: '-0.5px' }}>
              Welcome back 👋
            </h1>
            <p style={{ color: '#666666', fontSize: 14, fontWeight: 600 }}>
              Sign in to book and track local services
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            style={{
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

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#333333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                  borderRadius: 12, border: '1.5px solid #EEEEEE',
                  fontSize: 14.5, color: '#1A1A1A', backgroundColor: '#FFFFFF',
                  outline: 'none', transition: 'all 0.2s', fontWeight: 600,
                }}
                onFocus={e => { e.target.style.borderColor = '#FF4500'; e.target.style.backgroundColor = '#FFFFFF'; }}
                onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#333333', textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
                <a href="#" style={{ fontSize: 12, color: '#FF4500', fontWeight: 700, textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    width: '100%', padding: '13px 46px 13px 16px', boxSizing: 'border-box',
                    borderRadius: 12, border: '1.5px solid #EEEEEE',
                    fontSize: 14.5, color: '#1A1A1A', backgroundColor: '#FFFFFF',
                    outline: 'none', transition: 'all 0.2s', fontWeight: 600,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#FF4500'; e.target.style.backgroundColor = '#FFFFFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#EEEEEE'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#999999',
                    fontSize: 16, padding: 4,
                  }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p style={{ textAlign: 'center', marginTop: 24, color: '#666666', fontSize: 13.5, fontWeight: 600 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#FF4500', fontWeight: 800, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}>
              Create one
            </Link>
          </p>

          {/* Provider link */}
          <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #EEEEEE', marginTop: 24, paddingTop: 16 }}>
            <p style={{ textAlign: 'center', color: '#666666', fontSize: 12.5, fontWeight: 700, margin: 0 }}>
              Are you a service provider?{' '}
              <Link to="/provider/login" style={{ color: '#FF4500', fontWeight: 800, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                Provider Portal Login →
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

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginAdmin } from '../store/slices/authSlice';
import { ShieldCheck, CreditCard, Clock, Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((s) => s.auth);

  // Already logged in → skip login page
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginAdmin({ email, password }));
    if (loginAdmin.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: '#F8F8F8' }}>
      {/* Left Column: Brand Story & Trust Points */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden" style={{ backgroundColor: '#FFF0EB' }}>
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{ backgroundColor: '#FF4500' }}>
            <span className="text-white font-black text-lg">W</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight" style={{ color: '#1A1A1A' }}>Workzarr</span>
        </div>

        {/* Middle: Brand Tagline and Trust Points */}
        <div className="relative z-10 my-auto py-12 lg:py-0">
          <span className="font-extrabold uppercase tracking-wider text-[10px] mb-2 block" style={{ color: '#FF4500' }}>
            Bharat Service Hub
          </span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4" style={{ color: '#1A1A1A', lineHeight: '1.15' }}>
            Manage India's trusted <span style={{ color: '#FF4500' }}>service marketplace</span>
          </h2>
          <p className="text-sm font-semibold mb-10 max-w-md leading-relaxed" style={{ color: '#666666' }}>
            Connecting millions of families with background-verified service professionals across India's growing towns and cities.
          </p>

          <div className="space-y-5 max-w-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <ShieldCheck className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Verified Providers</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>100% background and credential checked local partners.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <CreditCard className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Escrow & Payments</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>Milestone-based payouts and transparent marketplace commission.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#FFE0D6' }}>
                <Clock className="w-5.5 h-5.5" style={{ color: '#FF4500' }} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>Real-time Operations</h4>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>Instant dispatch algorithms and 30-min matching service level agreements.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 text-xs font-bold" style={{ color: '#999999' }}>
          &copy; {new Date().getFullYear()} Workzarr Admin. Bharat Service Hub Operations.
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16" style={{ backgroundColor: '#F8F8F8' }}>
        <div className="w-full max-w-md rounded-2xl p-8 lg:p-10 shadow-sm border" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
          <div className="mb-8">
            <span className="font-extrabold uppercase tracking-wider text-[10px] mb-1 block" style={{ color: '#FF4500' }}>
              Workzarr Portal
            </span>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#1A1A1A' }}>Welcome Back</h1>
            <p className="text-xs font-semibold mt-1.5" style={{ color: '#666666' }}>Sign in to manage the Bharat Service Hub platform</p>
          </div>

          {/* Error message block */}
          {error && (
            <div className="mb-6 p-4 border rounded-xl text-xs font-semibold flex items-center gap-2" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#DC2626' }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#999999' }}>
                Email Address
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
                  placeholder="admin@localserve.com"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#999999' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: '#999999' }}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-semibold"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', color: '#1A1A1A' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 text-white font-extrabold rounded-xl shadow-sm hover:shadow-md transition-all text-xs flex items-center justify-center gap-2 mt-4 cursor-pointer"
              style={{ backgroundColor: '#FF4500' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Dev Hint box */}
          <div className="mt-8 p-4 rounded-xl border text-center" style={{ backgroundColor: '#F8F8F8', borderColor: '#EEEEEE' }}>
            <p className="text-[11px] font-semibold" style={{ color: '#666666' }}>
              <span className="font-extrabold" style={{ color: '#1A1A1A' }}>Seed credentials:</span><br />
              admin@localserve.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

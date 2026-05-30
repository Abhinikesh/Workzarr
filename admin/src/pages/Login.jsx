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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Column: Brand Story & Trust Points */}
      <div className="w-full lg:w-1/2 bg-[#0f172a] text-white flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-600/30">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Workzarr</span>
        </div>

        {/* Middle: Brand Tagline and Trust Points */}
        <div className="relative z-10 my-auto py-12 lg:py-0">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Bharat ka apna <span className="text-orange-500">service hub</span>
          </h2>
          <p className="text-slate-400 text-base lg:text-lg mb-12 max-w-md">
            Connecting millions of families with trusted, local service professionals across India's small towns.
          </p>

          <div className="space-y-6 max-w-sm">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Verified Providers</h4>
                <p className="text-sm text-slate-400">100% background and skill-verified local partners.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Secure Payments</h4>
                <p className="text-sm text-slate-400">Milestone-based escrow and transparent pricing.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">30-Min Response</h4>
                <p className="text-sm text-slate-400">Fast, reliable matching for emergency services.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Workzarr. All rights reserved. Made for Bharat.
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-8 lg:p-10 shadow-sm">
          <div className="mb-8">
            <span className="text-orange-500 font-bold uppercase tracking-wider text-xs mb-1 block">
              Admin Portal
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-1.5">Sign in with your administrative credentials</p>
          </div>

          {/* Error message block */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold rounded-xl shadow-sm hover:shadow-md active:transform active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 mt-4 cursor-pointer"
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
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              <span className="font-bold text-slate-700">Seed credentials:</span><br />
              admin@localserve.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

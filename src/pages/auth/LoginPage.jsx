import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginAdmin } from '../../store/slices/authSlice';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid administrative email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true }
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    const resultAction = await dispatch(loginAdmin(data));
    if (loginAdmin.fulfilled.match(resultAction)) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-inter">
      {/* Left: Illustration & Branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 items-center justify-center p-12">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="relative z-10 max-w-lg text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/40">
              <ShieldCheck size={36} className="text-indigo-600" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">LocalServe</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-6">Admin Control Center</h2>
          <p className="text-indigo-100 text-lg leading-relaxed mb-10 opacity-90">
            Securely manage your marketplace, track financial performance, and oversee provider operations from a unified command center.
          </p>

          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              'Real-time Analytics', 'Provider Verification', 
              'Secure Transactions', 'Audit Compliance'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                <span className="text-xs font-bold text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="mb-10 lg:hidden text-center">
             <div className="inline-flex items-center gap-2 text-indigo-600 font-extrabold text-2xl mb-2">
                <ShieldCheck size={28} /> LocalServe
             </div>
          </div>

          <div className="mb-10">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome Back
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Sign in to your administrative account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-in shake duration-300">
                <div className="w-2 h-8 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Administrative Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@localserve.in"
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border ${errors.email ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/10 group-hover:border-slate-300 dark:group-hover:border-slate-700'} rounded-2xl outline-none focus:border-indigo-600 focus:ring-4 transition-all text-sm font-semibold`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`block w-full pl-11 pr-12 py-3.5 bg-white dark:bg-slate-900 border ${errors.password ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/10 group-hover:border-slate-300 dark:group-hover:border-slate-700'} rounded-2xl outline-none focus:border-indigo-600 focus:ring-4 transition-all text-sm font-semibold`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="w-4 h-4 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  Stay logged in
                </span>
              </label>
              <button type="button" className="text-sm font-extrabold text-indigo-600 hover:text-indigo-700 transition-colors">
                Reset Key?
              </button>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-indigo-400"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} />}
              Sign In to Command Center
            </button>
          </form>

          <footer className="mt-12 text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
               &copy; 2026 LocalServe. Internal Access Only.
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

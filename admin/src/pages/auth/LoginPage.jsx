import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../../store/slices/authSlice';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    const result = await dispatch(loginAdmin(data));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/dashboard');
    }
  };

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Welcome back, please login to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium animate-in shake duration-500">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@localserve.com"
                  className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium`}
                />
              </div>
              {errors.email && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Forgot password?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-900/50 border ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-xs font-bold text-red-500 ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Sign In to Dashboard
                  <ShieldCheck size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-500 font-medium">
          Protected by enterprise-grade security. <br />
          &copy; 2026 LocalServe Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

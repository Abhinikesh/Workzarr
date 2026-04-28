import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Ghost } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
      <div className="relative mb-12">
        {/* Abstract 404 Illustration */}
        <div className="w-64 h-64 bg-indigo-600/5 dark:bg-indigo-500/5 rounded-full flex items-center justify-center animate-pulse">
           <Ghost size={120} className="text-indigo-600/20 dark:text-indigo-400/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
           <h1 className="text-[120px] font-black text-slate-900 dark:text-white tracking-tighter opacity-10">404</h1>
        </div>
      </div>

      <div className="text-center max-w-md space-y-6">
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Lost in Space?</h2>
        <p className="text-lg font-medium text-slate-500 leading-relaxed">
          The administrative page you are looking for has been moved, deleted, or never existed in this dimension.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
           <button 
             onClick={() => navigate(-1)}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:shadow-xl transition-all"
           >
              <ArrowLeft size={20} />
              Go Back
           </button>
           <button 
             onClick={() => navigate('/')}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
           >
              <Home size={20} />
              Return Dashboard
           </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="mt-20 flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em]">
         <Search size={12} /> Lost Resource Protocol Active
      </div>
    </div>
  );
};

export default NotFoundPage;

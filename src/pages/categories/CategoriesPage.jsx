import React, { useState, useEffect } from 'react';
import { 
  Grid, Plus, MoreVertical, 
  Trash2, Edit3, TrendingUp, 
  Users, Briefcase, Eye, 
  Activity, CheckCircle2, XCircle,
  MoveVertical, Search, Filter
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/ui/Modal';
import axios from '../../lib/axios';
import { toast } from 'sonner';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/admin/categories');
      setCategories(data.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`/admin/categories/${id}/status`, { isActive: !currentStatus });
      toast.success('Category status updated');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Market Categories" 
        subtitle="Manage service sectors, provider tags and listing hierarchy"
        actions={
          <button 
            onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add New Category
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {categories.map((category) => (
           <div key={category._id} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
                 <button 
                   onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                   className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                 >
                    <Edit3 size={18} />
                 </button>
              </div>

              <div className="flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <img src={category.icon} alt={category.name} className="w-10 h-10 object-contain" />
                 </div>
                 <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{category.name}</h3>
                 <p className="text-xs font-medium text-slate-400 mb-8 line-clamp-2 max-w-xs">{category.description}</p>
                 
                 <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Providers</p>
                       <p className="text-lg font-extrabold text-slate-900 dark:text-white">{category.stats?.providerCount || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Bookings</p>
                       <p className="text-lg font-extrabold text-slate-900 dark:text-white">{category.stats?.bookingCount || 0}</p>
                    </div>
                 </div>

                 <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-700/50 w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${category.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                       <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{category.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <button 
                      onClick={() => handleToggleStatus(category._id, category.isActive)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                        category.isActive 
                         ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                         : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                       {category.isActive ? 'Disable' : 'Enable'}
                    </button>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Performance Metrics</h3>
         </div>
         <DataTable 
           columns={[
             { key: 'name', label: 'Category', render: (row) => <span className="font-extrabold text-slate-900 dark:text-white">{row.name}</span> },
             { key: 'revenue', label: 'Total Revenue', render: (row) => <span className="text-xs font-bold text-slate-600">{row.stats?.totalRevenue || '₹0'}</span> },
             { key: 'rating', label: 'Avg Rating', render: (row) => (
               <div className="flex items-center gap-1.5 font-bold text-amber-500">
                  <TrendingUp size={14} /> {row.stats?.avgRating || '0.0'}
               </div>
             )},
             { key: 'growth', label: 'Growth (MoM)', render: (row) => (
               <Badge label={`+${row.stats?.growth || 0}%`} variant="success" size="sm" />
             )}
           ]}
           data={categories}
           isLoading={loading}
         />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
         <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
                  <input className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none" placeholder="e.g. Home Cleaning" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Display Order</label>
                  <input type="number" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none" placeholder="0" />
               </div>
               <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Detailed Description</label>
                  <textarea className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none h-24" placeholder="Brief overview for users..." />
               </div>
            </div>
            <div className="pt-6">
               <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20">
                  {editingCategory ? 'Save Changes' : 'Create Category'}
               </button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;

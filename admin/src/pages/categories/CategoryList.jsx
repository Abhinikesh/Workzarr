import React, { useState, useEffect } from 'react';
import { 
  Grid, Plus, Edit2, Trash2, Image as ImageIcon, 
  CheckCircle, XCircle, Search, Save, X
} from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import axios from '../../lib/axios';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.patch(\`/admin/categories/\${editingCategory._id}\`, formData);
      } else {
        await axios.post('/admin/categories', formData);
      }
      setModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '' });
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will hide the category from users.')) return;
    try {
      await axios.delete(\`/admin/categories/\${id}\`);
      fetchCategories();
    } catch (error) {
       alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'icon',
      label: 'Icon',
      render: (row) => (
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
          {row.icon ? <img src={row.icon} alt="" className="w-6 h-6" /> : <ImageIcon size={20} className="text-slate-400" />}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Category Name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
        </div>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider \${
          row.isActive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-100 text-red-600 dark:bg-red-500/10'
        }\`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setEditingCategory(row);
              setFormData({ name: row.name, description: row.description || '', icon: row.icon || '' });
              setModalOpen(true);
            }}
            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row._id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Catalog</h2>
          <p className="text-slate-500">Configure service categories and taxonomy</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', description: '', icon: '' });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus size={18} />
          New Category
        </button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={loading}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                placeholder="e.g. Home Cleaning"
              />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium min-h-[100px]"
                placeholder="Brief description of services in this category"
              />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Icon URL</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                placeholder="https://example.com/icon.png"
              />
           </div>

           <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryList;

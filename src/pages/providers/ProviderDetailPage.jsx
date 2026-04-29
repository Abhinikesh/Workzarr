import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ShieldCheck, ShieldAlert, Star, 
  MapPin, Phone, Briefcase, IndianRupee, 
  FileText, CheckCircle2, XCircle, Clock,
  MoreVertical, Download, ExternalLink,
  Crown, Image as ImageIcon, Wallet, 
  TrendingUp, History, MessageSquare, ListFilter
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import Badge from '../../components/shared/Badge';
import RatingDisplay from '../../components/shared/RatingDisplay';
import DataTable from '../../components/ui/DataTable';
import ImagePreview from '../../components/shared/ImagePreview';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import ProvidersService from '../../services/providers.service';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ProviderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [rejectModal, setRejectModal] = useState({ isOpen: false, doc: null, reason: '' });

  const fetchProvider = async () => {
    try {
      const data = await ProvidersService.getProviderById(id);
      setProvider(data.data);
    } catch (error) {
      console.error('Failed to fetch provider', error);
      navigate('/providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const handleDocAction = async (docId, status, reason = '') => {
    await ProvidersService.verifyDocument(id, docId, status, reason);
    fetchProvider();
    setRejectModal({ isOpen: false, doc: null, reason: '' });
  };

  if (loading) return <div className="p-8"><LoadingSkeleton variant="table" /></div>;
  if (!provider) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/providers')} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-5">
            <Avatar name={provider.businessName} src={provider.logo} size="lg" />
            <div>
               <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{provider.businessName}</h2>
                 {provider.subscription?.plan === 'premium' && <Crown size={20} className="text-amber-400 fill-amber-400" />}
               </div>
               <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                 <Badge label={provider.category?.name} variant="info" size="sm" />
                 <span className="text-slate-300">•</span>
                 <RatingDisplay rating={provider.stats?.averageRating} count={provider.stats?.totalReviews} showCount />
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
           <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:shadow-lg transition-all flex items-center gap-2">
             Adjust Earnings
           </button>
           <button 
             onClick={async () => {
               await ProvidersService.approveVerification(provider._id);
               fetchProvider();
             }}
             disabled={provider.isVerified}
             className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
           >
             <ShieldCheck size={18} />
             {provider.isVerified ? 'Verified Account' : 'Approve Profile'}
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl w-fit overflow-x-auto">
         {['profile', 'documents', 'bookings', 'earnings', 'reviews'].map((tab) => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-6 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all whitespace-nowrap ${
               activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
             }`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700">
                   <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6">Business Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                         <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Business Name</p>
                         <p className="font-bold text-slate-700 dark:text-slate-300">{provider.businessName}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Service Radius</p>
                         <p className="font-bold text-slate-700 dark:text-slate-300">{provider.serviceRadius} km</p>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                         <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Business Bio</p>
                         <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{provider.bio}</p>
                      </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700">
                   <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6">Service Gallery</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {provider.gallery?.map((img, i) => (
                        <ImagePreview key={i} src={img} alt={`Gallery ${i + 1}`} />
                      ))}
                      {(!provider.gallery || provider.gallery.length === 0) && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl text-slate-300">
                           <ImageIcon size={40} className="mb-2" />
                           <p className="text-xs font-bold uppercase tracking-widest">No gallery images</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-slate-900 p-8 rounded-[32px] text-white">
                   <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Payout Wallet</p>
                      <Wallet size={20} className="text-indigo-400" />
                   </div>
                   <h4 className="text-4xl font-extrabold mb-8">{formatCurrency(provider.wallet?.balance || 0)}</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                         <span className="text-xs font-medium text-white/60">Total Earnings</span>
                         <span className="text-xs font-bold">{formatCurrency(provider.stats?.totalEarnings)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                         <span className="text-xs font-medium text-white/60">Pending Payouts</span>
                         <span className="text-xs font-bold text-amber-400">{formatCurrency(provider.wallet?.pendingPayouts)}</span>
                      </div>
                   </div>
                   <button className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20">
                      Process Payout
                   </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Document Verification</h3>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-slate-400">Progress:</span>
                   <div className="w-48 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000" 
                        style={{ width: `${(provider.documents?.filter(d => d.status === 'verified').length / (provider.documents?.length || 1)) * 100}%` }} 
                      />
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                {provider.documents?.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[24px] border border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                           <ImagePreview src={doc.fileUrl} type={doc.fileUrl?.endsWith('.pdf') ? 'pdf' : 'image'} alt={doc.type} />
                        </div>
                        <div>
                           <p className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">{doc.type.replace('_', ' ')}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Uploaded on {formatDate(doc.uploadedAt)}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-4">
                        {doc.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => setRejectModal({ isOpen: true, doc })}
                               className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                               title="Reject Document"
                             >
                                <XCircle size={20} />
                             </button>
                             <button 
                               onClick={() => handleDocAction(doc._id, 'verified')}
                               className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                               title="Approve Document"
                             >
                                <CheckCircle2 size={20} />
                             </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                             <div className="text-right">
                                <Badge label={doc.status} variant={doc.status === 'verified' ? 'success' : 'danger'} size="sm" />
                                {doc.verifiedAt && <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Verified on {formatDate(doc.verifiedAt)}</p>}
                             </div>
                             {doc.status === 'rejected' && (
                               <button 
                                 onClick={() => handleDocAction(doc._id, 'pending')}
                                 className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                 title="Reset to Pending"
                               >
                                  <Clock size={18} />
                               </button>
                             )}
                          </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={rejectModal.isOpen} 
        onClose={() => setRejectModal({ isOpen: false, doc: null, reason: '' })}
        title="Reject Document"
        size="sm"
        footer={
          <button 
            onClick={() => handleDocAction(rejectModal.doc._id, 'rejected', rejectModal.reason)}
            disabled={!rejectModal.reason}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            Confirm Rejection
          </button>
        }
      >
        <div className="space-y-4">
           <p className="text-sm font-medium text-slate-500">Please provide a reason for rejecting the <span className="font-bold text-slate-900 dark:text-white">{rejectModal.doc?.type}</span>. This will be shown to the provider.</p>
           <textarea 
             value={rejectModal.reason}
             onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
             placeholder="e.g. Image is blurry, ID expired, etc."
             className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-red-500 h-32 text-sm"
           />
        </div>
      </Modal>
    </div>
  );
};

export default ProviderDetailPage;

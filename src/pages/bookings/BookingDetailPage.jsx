import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Clock, User, 
  Briefcase, MapPin, IndianRupee, CreditCard,
  MessageSquare, AlertTriangle, CheckCircle2,
  XCircle, ArrowRight, ShieldCheck, History,
  ExternalLink, Copy, Phone
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import Badge from '../../components/shared/Badge';
import CopyButton from '../../components/shared/CopyButton';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import BookingsService from '../../services/bookings.service';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', reason: '' });

  const fetchBookingData = async () => {
    try {
      const [bookingRes, timelineRes] = await Promise.all([
        BookingsService.getBookingById(id),
        BookingsService.getTimeline(id)
      ]);
      setBooking(bookingRes.data);
      setTimeline(timelineRes.data);
    } catch (error) {
      console.error('Failed to fetch booking details', error);
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingData();
  }, [id]);

  const handleAdminAction = async () => {
    try {
      if (actionModal.type === 'REFUND') {
        await BookingsService.processRefund(id, booking.totalPrice, actionModal.reason);
      } else {
        await BookingsService.updateStatus(id, actionModal.type.toLowerCase(), actionModal.reason);
      }
      fetchBookingData();
      setActionModal({ isOpen: false, type: '', reason: '' });
    } catch (error) {
       console.error('Admin action failed', error);
    }
  };

  if (loading) return <div className="p-8"><LoadingSkeleton variant="table" /></div>;
  if (!booking) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/bookings')} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg">
            <ChevronLeft size={24} />
          </button>
          <div>
             <div className="flex items-center gap-3 mb-1">
               <h2 className="text-xl font-mono font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                 Booking #{booking._id.slice(-8).toUpperCase()}
               </h2>
               <StatusBadge status={booking.status} />
             </div>
             <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
               Created {formatDate(booking.createdAt, 'dd MMM yyyy, hh:mm a')} <span className="text-slate-300">•</span> <CopyButton text={booking._id} size="sm" />
             </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setActionModal({ isOpen: true, type: 'CANCELLED' })}
             className="px-5 py-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all border border-red-100 dark:border-red-900/30"
           >
             Force Cancel
           </button>
           {booking.paymentStatus === 'captured' && (
             <button 
               onClick={() => setActionModal({ isOpen: true, type: 'REFUND' })}
               className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-2xl font-bold text-sm hover:bg-amber-500 hover:text-white transition-all border border-amber-100 dark:border-amber-900/30"
             >
               Process Refund
             </button>
           )}
           <button 
             onClick={() => setActionModal({ isOpen: true, type: 'COMPLETED' })}
             className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all"
           >
             Mark Completed
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column: Entities & Timeline */}
         <div className="lg:col-span-2 space-y-8">
            {/* Timeline Card */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                     <History size={20} className="text-indigo-500" /> Fulfillment Timeline
                  </h3>
               </div>
               <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700/50">
                  {timeline.map((step, i) => (
                    <div key={i} className="flex gap-6 relative z-10">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 transition-all \${
                         step.isCompleted ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                       }\`}>
                          <CheckCircle2 size={16} />
                       </div>
                       <div>
                          <p className={`text-sm font-extrabold \${step.isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}\`}>
                             {step.status.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                             {step.timestamp ? formatDate(step.timestamp, 'hh:mm a, dd MMM') : 'Awaiting fulfillment'}
                          </p>
                          {step.note && (
                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 italic">
                               "{step.note}"
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Entities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Customer Card */}
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                     <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Customer Information</p>
                     <Link to={\`/users/\${booking.user?._id}\`} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                        <ExternalLink size={16} />
                     </Link>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                     <Avatar name={booking.user?.name} src={booking.user?.avatar} size="lg" />
                     <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{booking.user?.name}</h4>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><Phone size={12} /> {booking.user?.phone}</p>
                     </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-2">Service Address</p>
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                        <MapPin size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                        {booking.address?.addressLine}, {booking.address?.town}, {booking.address?.district}
                     </p>
                  </div>
               </div>

               {/* Provider Card */}
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                     <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Service Provider</p>
                     <Link to={\`/providers/\${booking.provider?._id}\`} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                        <ExternalLink size={16} />
                     </Link>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                     <Avatar name={booking.provider?.businessName} src={booking.provider?.logo} size="lg" />
                     <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{booking.provider?.businessName}</h4>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">{booking.category?.name}</p>
                     </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-2">Assigned Professional</p>
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed flex items-center gap-2">
                        <User size={14} className="text-indigo-500" />
                        {booking.provider?.ownerName || 'Business Account'}
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Financials & Actions */}
         <div className="space-y-8">
            {/* Payment Card */}
            <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl shadow-slate-900/40">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-extrabold flex items-center gap-2">
                     <IndianRupee size={20} className="text-emerald-400" /> Transaction details
                  </h3>
                  <Badge label={booking.paymentStatus} variant={booking.paymentStatus === 'captured' ? 'success' : 'warning'} size="sm" />
               </div>
               
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                     <span className="text-xs font-medium text-white/50">Base Price</span>
                     <span className="text-sm font-bold">{formatCurrency(booking.basePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                     <span className="text-xs font-medium text-white/50">Platform Commission</span>
                     <span className="text-sm font-bold text-emerald-400">+{formatCurrency(booking.commission)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                     <span className="text-sm font-extrabold uppercase tracking-widest text-indigo-400">Grand Total</span>
                     <span className="text-2xl font-extrabold">{formatCurrency(booking.totalPrice)}</span>
                  </div>
               </div>

               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/40">
                     <span>Payment Method</span>
                     <span className="text-white flex items-center gap-1"><CreditCard size={12} /> {booking.paymentMethod?.toUpperCase() || 'RAZORPAY'}</span>
                  </div>
                  {booking.razorpayOrderId && (
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Order ID</span>
                       <CopyButton text={booking.razorpayOrderId} label="" />
                    </div>
                  )}
               </div>
            </div>

            {/* Admin Override Card */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
               <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-amber-500" /> Governance Actions
               </h3>
               <div className="space-y-4">
                  <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6">
                     As an administrator, you can override the automated fulfillment lifecycle. These actions are irreversible and will be logged in the <span className="font-extrabold text-indigo-600">Admin Audit Logs</span>.
                  </p>
                  <button className="w-full py-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 group">
                     <MessageSquare size={18} className="text-slate-300 group-hover:text-white transition-colors" />
                     View Communication Log
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Action Override Modal */}
      <Modal 
        isOpen={actionModal.isOpen} 
        onClose={() => setActionModal({ isOpen: false, type: '', reason: '' })}
        title={\`Force Administrative \${actionModal.type}\`}
        size="sm"
        footer={
          <button 
            onClick={handleAdminAction}
            disabled={!actionModal.reason}
            className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
          >
            Confirm Override Action
          </button>
        }
      >
        <div className="space-y-6">
           <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-4">
              <AlertTriangle size={24} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                 You are performing a manual override. The provider and customer will both be notified of this administrative decision.
              </p>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Internal Override Reason</label>
              <textarea 
                value={actionModal.reason}
                onChange={(e) => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why this manual override is being performed..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 h-32 text-sm"
              />
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingDetailPage;

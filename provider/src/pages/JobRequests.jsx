import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Inbox, MapPin, Calendar, Clock, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const JobRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await axiosInstance.get('/bookings');
      const all = res.data.data.bookings || [];
      const pending = all.filter((b) => b.status === 'pending');
      setRequests(pending);
    } catch (err) {
      toast.error('Failed to load job requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestAction = async (id, actionVal) => {
    try {
      await axiosInstance.patch(`/bookings/${id}/status`, {
        status: actionVal === 'accept' ? 'accepted' : 'cancelled',
        cancellationReason: actionVal === 'decline' ? 'Provider declined request' : undefined
      });
      toast.success(actionVal === 'accept' ? 'Job accepted successfully!' : 'Job request declined');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job request');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Incoming Job Requests</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req._id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-500 transition-all shadow-sm space-y-4"
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-extrabold text-xs shrink-0">
                      {getInitials(req.customer?.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">{req.serviceInfo?.title || 'Home Gig'}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Client: <span className="text-slate-800 font-bold">{req.customer?.name || 'Local Family'}</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-orange-600 text-sm">₹{req.totalAmount}</span>
                </div>

                {/* Date slot & location details */}
                <div className="border-y border-slate-50 py-3 space-y-2 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {new Date(req.scheduledDate || req.scheduledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} • {req.scheduledSlot || 'Slot'}
                    </span>
                  </p>
                  
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{req.address?.fullAddress}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRequestAction(req._id, 'accept')}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Accept Gig
                  </button>
                  <button
                    onClick={() => handleRequestAction(req._id, 'decline')}
                    className="flex-1 py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No pending invitations</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              You are all caught up! New gig booking invitations in your local area will show up here.
            </p>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default JobRequests;

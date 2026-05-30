import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Inbox, MapPin, Calendar, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen pb-20 lg:pb-8" style={{ backgroundColor: '#F8F8F8' }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#1A1A1A' }}>Incoming Job Requests</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF4500' }} />
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req._id}
                className="rounded-2xl p-5 transition-all shadow-sm space-y-4 border"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FF4500'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#EEEEEE'}
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full border flex items-center justify-center font-extrabold text-xs shrink-0"
                      style={{ backgroundColor: '#FFF0EB', borderColor: '#FFC0AC', color: '#FF4500' }}>
                      {getInitials(req.customer?.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold" style={{ color: '#1A1A1A' }}>{req.serviceInfo?.title || 'Home Gig'}</h4>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>
                        Client: <span className="font-bold" style={{ color: '#1A1A1A' }}>{req.customer?.name || 'Local Family'}</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm" style={{ color: '#FF4500' }}>₹{req.totalAmount}</span>
                </div>

                {/* Date slot & location details */}
                <div className="py-3.5 space-y-2 text-xs font-semibold" style={{ borderTop: '1px solid #F5F5F5', borderBottom: '1px solid #F5F5F5', color: '#666666' }}>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" style={{ color: '#999999' }} />
                    <span>
                      {new Date(req.scheduledDate || req.scheduledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} • {req.scheduledSlot || 'Slot'}
                    </span>
                  </p>
                  
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#999999' }} />
                    <span>{req.address?.fullAddress}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRequestAction(req._id, 'accept')}
                    className="flex-1 py-3 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                    style={{ backgroundColor: '#16A34A' }}
                  >
                    Accept Gig
                  </button>
                  <button
                    onClick={() => handleRequestAction(req._id, 'decline')}
                    className="flex-1 py-3 border font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                    style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-16 text-center flex flex-col items-center justify-center border"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 border"
              style={{ backgroundColor: '#F8F8F8', borderColor: '#EEEEEE' }}>
              <Inbox className="w-6 h-6" style={{ color: '#CCCCCC' }} />
            </div>
            <h3 className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>No pending invitations</h3>
            <p className="text-xs max-w-sm mt-2 leading-relaxed" style={{ color: '#999999' }}>
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

import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { IndianRupee, ArrowUpRight, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EarningsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        const res = await axiosInstance.get('/bookings');
        const list = res.data.data.bookings || [];
        // Only keep completed bookings for earnings calculations
        setBookings(list.filter((b) => b.status === 'completed'));
      } catch (err) {
        console.warn('Failed to load completed gigs list');
      } finally {
        setLoading(false);
      }
    };
    fetchEarningsData();
  }, []);

  const totalEarnings = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingPayout = 0; // standard mock payout state

  const handleWithdrawalRequest = () => {
    toast.success('Withdrawal request submitted! Processing with bank partner.');
  };

  // Simple static array for 7-day earnings bars in Haryana/Delhi local service gig operations
  const mockWeekEarnings = [
    { day: 'Mon', amount: 450 },
    { day: 'Tue', amount: 800 },
    { day: 'Wed', amount: 250 },
    { day: 'Thu', amount: 600 },
    { day: 'Fri', amount: 1100 },
    { day: 'Sat', amount: 1350 },
    { day: 'Sun', amount: 900 }
  ];

  const maxWeeklyVal = Math.max(...mockWeekEarnings.map(w => w.amount));

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-8">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Earnings Hub</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Earnings metric summary card block */}
            <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
              
              <div className="relative z-10 flex justify-between items-baseline">
                <div>
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block mb-1">
                    All-Time Earnings
                  </span>
                  <h2 className="text-4xl font-extrabold flex items-center">
                    ₹{totalEarnings}
                  </h2>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    This Month
                  </span>
                  <p className="text-xl font-bold text-slate-200">₹{totalEarnings}</p>
                </div>
              </div>

              {/* Pending withdrawal */}
              <div className="relative z-10 border-t border-slate-800 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="text-xs">
                  <span className="text-slate-400">Available Balance: </span>
                  <span className="text-orange-500 font-bold">₹{totalEarnings}</span>
                </div>

                <button
                  onClick={handleWithdrawalRequest}
                  disabled={totalEarnings === 0}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>Request Withdrawal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simple inline SVG bar chart for weekly earnings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-orange-600" />
                Weekly Earnings Breakdown
              </h3>

              <div className="flex items-end justify-between h-40 pt-4 px-2">
                {mockWeekEarnings.map((w, index) => {
                  const percentHeight = (w.amount / maxWeeklyVal) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 space-y-2 group">
                      <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{w.amount}
                      </span>
                      {/* Bar */}
                      <div
                        className="w-8 bg-orange-100 hover:bg-orange-600 transition-colors rounded-t-sm"
                        style={{ height: `${percentHeight * 0.8}px` }}
                      />
                      <span className="text-[10px] font-bold text-slate-500">{w.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed Gig Transactions History List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-orange-600" />
                Transaction Statement
              </h3>

              {bookings.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {bookings.map((b) => {
                    const platformFee = 20; // commission
                    const netEarned = b.totalAmount - platformFee;

                    return (
                      <div key={b._id} className="py-4.5 first:pt-0 last:pb-0 flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800">{b.serviceInfo?.title || 'Gig Job'}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Booking ID: {b._id.substring(b._id.length - 8).toUpperCase()} • {new Date(b.updatedAt).toLocaleDateString()}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            Gross: ₹{b.totalAmount} | Commission: ₹{platformFee}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-green-600 text-sm">₹{netEarned}</span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Net Payout</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                  No completed transaction payouts found.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default EarningsPage;

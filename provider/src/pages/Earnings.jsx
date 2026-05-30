import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { ArrowUpRight, TrendingUp, Calendar, Loader2 } from 'lucide-react';
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

  const handleWithdrawalRequest = () => {
    toast.success('Withdrawal request submitted! Processing with bank partner.');
  };

  // Simple static array for 7-day earnings bars
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
    <div className="min-h-screen bg-[#F8F8F8] pb-24 lg:pb-12 text-[#1A1A1A]">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl lg:text-3xl font-black text-[#1A1A1A] tracking-tight">Earnings Hub</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#FF4500] animate-spin" />
          </div>
        ) : (
          <>
            {/* Earnings metric summary card block */}
            <div className="bg-white border border-[#EEEEEE] rounded-2xl p-6 relative overflow-hidden shadow-sm">
              {/* Subtle decoration glow */}
              <div className="absolute right-0 top-0 w-[200px] h-[200px] bg-[#FFF0EB] rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 flex justify-between items-baseline">
                <div>
                  <span className="text-[10px] font-black text-[#FF4500] uppercase tracking-widest block mb-2">
                    All-Time Earnings
                  </span>
                  <h2 className="text-4xl font-black flex items-center tracking-tight text-[#1A1A1A]">
                    ₹{totalEarnings}
                  </h2>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] font-black text-[#666666] uppercase tracking-widest block mb-2">
                    This Month
                  </span>
                  <p className="text-xl font-extrabold text-[#1A1A1A]">₹{totalEarnings}</p>
                </div>
              </div>

              {/* Pending withdrawal */}
              <div className="relative z-10 border-t border-[#EEEEEE] mt-6 pt-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="text-xs font-bold text-[#666666]">
                  Available Balance: <span className="text-[#FF4500] font-black">₹{totalEarnings}</span>
                </div>

                <button
                  onClick={handleWithdrawalRequest}
                  disabled={totalEarnings === 0}
                  className="px-5 py-3 bg-[#FF4500] hover:bg-[#cc3700] disabled:bg-slate-200 disabled:text-slate-400 disabled:border-transparent text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow-sm"
                >
                  <span>Request Withdrawal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekly earnings bar breakdown */}
            <div className="bg-white border border-[#EEEEEE] rounded-2xl p-6 space-y-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-[#1A1A1A] flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp className="w-4.5 h-4.5 text-[#FF4500]" />
                Weekly Earnings Breakdown
              </h3>

              <div className="flex items-end justify-between h-40 pt-4 px-2">
                {mockWeekEarnings.map((w, index) => {
                  const percentHeight = (w.amount / maxWeeklyVal) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 space-y-2.5 group">
                      <span className="text-[9px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{w.amount}
                      </span>
                      {/* Bar */}
                      <div
                        className="w-8 bg-[#FFF0EB] hover:bg-[#FF4500] transition-all duration-300 rounded-t-md border border-[#FFC0AC] hover:border-[#FF4500]"
                        style={{ height: `${percentHeight * 0.8}px` }}
                      />
                      <span className="text-[10px] font-bold text-slate-500">{w.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed Gig Transactions History List */}
            <div className="bg-white border border-[#EEEEEE] rounded-2xl p-6 space-y-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-[#1A1A1A] flex items-center gap-2 uppercase tracking-wider">
                <Calendar className="w-4.5 h-4.5 text-[#FF4500]" />
                Transaction Statement
              </h3>

              {bookings.length > 0 ? (
                <div className="divide-y divide-[#EEEEEE] text-xs">
                  {bookings.map((b) => {
                    const platformFee = 20; // commission
                    const netEarned = b.totalAmount - platformFee;

                    return (
                      <div key={b._id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <h4 className="font-extrabold text-[#1A1A1A] text-sm truncate">{b.serviceInfo?.title || 'Gig Job'}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            Booking ID: {b._id.substring(b._id.length - 8).toUpperCase()} • {new Date(b.updatedAt).toLocaleDateString()}
                          </p>
                          <p className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
                            Gross: ₹{b.totalAmount} | Commission: ₹{platformFee}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-green-600 text-base">₹{netEarned}</span>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Net Payout</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-bold">
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

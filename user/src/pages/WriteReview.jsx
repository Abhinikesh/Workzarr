import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Star, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const WriteReviewPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axiosInstance.get(`/bookings/${bookingId}`);
        setBooking(res.data.data.booking);
      } catch (err) {
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/reviews', {
        bookingId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      toast.success('Thank you! Review submitted successfully.');
      navigate('/bookings', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h3 className="text-base font-bold text-slate-800">Booking not found</h3>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg text-xs"
        >
          Go back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Info card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block mb-1">
            Rate Service Experience
          </span>
          <h2 className="text-lg font-extrabold text-slate-800">{booking.serviceInfo?.title || 'Home Service'}</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Partner: <span className="text-slate-700 font-bold">{booking.provider?.businessName || 'Local Expert'}</span>
          </p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Stars Selection */}
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tap to Rate
            </label>
            
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform active:scale-90 cursor-pointer"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'text-orange-500 fill-orange-500'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              {rating === 5 && 'Excellent! 🌟'}
              {rating === 4 && 'Very Good! 👍'}
              {rating === 3 && 'Good! 🙂'}
              {rating === 2 && 'Fair! 😕'}
              {rating === 1 && 'Poor! 😞'}
            </span>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Review Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Excellent work, very professional"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Tell us more about your experience
            </label>
            <textarea
              id="comment"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the behavior of the provider? Was the issue fully resolved?"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-extrabold rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Submit Review'
            )}
          </button>
        </form>

      </main>

      <BottomNav />
    </div>
  );
};

export default WriteReviewPage;

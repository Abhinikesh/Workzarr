import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Star, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LABELS = ['', 'Poor!', 'Fair!', 'Good!', 'Very Good!', 'Excellent!'];
const EMOJIS = ['', '😞', '😕', '🙂', '👍', '🌟'];

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
      } catch {
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (rating < 1 || rating > 5) { toast.error('Please select a rating'); return; }

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8F8' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FF4500' }} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#F8F8F8' }}>
        <h3 className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>Booking not found</h3>
        <button
          onClick={() => navigate('/bookings')}
          className="px-6 py-3 text-xs font-extrabold rounded-xl cursor-pointer"
          style={{ backgroundColor: '#FF4500', color: '#FFFFFF' }}
        >
          Go back to Bookings
        </button>
      </div>
    );
  }

  const activeRating = hoverRating || rating;

  return (
    <div className="min-h-screen pb-24 lg:pb-12" style={{ backgroundColor: '#F8F8F8' }}>
      <Header />

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          style={{ color: '#666666' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Service Info Card */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-1" style={{ color: '#FF4500' }}>
            Rate Your Experience
          </span>
          <h2 className="text-lg font-extrabold" style={{ color: '#1A1A1A' }}>
            {booking.serviceInfo?.title || 'Home Service'}
          </h2>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#666666' }}>
            Partner: <span style={{ color: '#1A1A1A' }}>{booking.provider?.businessName || 'Local Expert'}</span>
          </p>
        </div>

        {/* Review Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 shadow-sm space-y-6"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
        >

          {/* Star Rating */}
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <label className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#999999' }}>
              Tap to Rate
            </label>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform active:scale-90 cursor-pointer"
                >
                  <Star
                    className="w-10 h-10 transition-colors"
                    style={{
                      color: star <= activeRating ? '#FF4500' : '#EEEEEE',
                      fill: star <= activeRating ? '#FF4500' : '#EEEEEE',
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="text-center">
              <span className="text-xl">{EMOJIS[activeRating]}</span>
              <p className="text-sm font-extrabold mt-1" style={{ color: '#1A1A1A' }}>
                {LABELS[activeRating]}
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="rev-title" className="block text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#666666' }}>
              Review Title
            </label>
            <input
              id="rev-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Excellent work, very professional"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #DDDDDD',
                color: '#1A1A1A',
                minHeight: '44px',
              }}
              onFocus={e => e.target.style.borderColor = '#FF4500'}
              onBlur={e => e.target.style.borderColor = '#DDDDDD'}
            />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="rev-comment" className="block text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#666666' }}>
              Tell us more
            </label>
            <textarea
              id="rev-comment"
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="How was the behavior of the provider? Was the issue fully resolved?"
              className="w-full p-4 rounded-xl text-xs font-medium focus:outline-none transition-all resize-none"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #DDDDDD',
                color: '#1A1A1A',
              }}
              onFocus={e => e.target.style.borderColor = '#FF4500'}
              onBlur={e => e.target.style.borderColor = '#DDDDDD'}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 font-extrabold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor: '#FF4500',
              color: '#FFFFFF',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
          </button>
        </form>

      </main>

      <BottomNav />
    </div>
  );
};

export default WriteReviewPage;

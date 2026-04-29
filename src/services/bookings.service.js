import axios from '../lib/axios';
import { toast } from 'sonner';

/**
 * Service for administrative booking management and overrides
 */
const BookingsService = {
  /**
   * Get paginated bookings with filters
   */
  getBookings: async (params) => {
    try {
      const { data } = await axios.get('/admin/bookings', { params });
      return data;
    } catch (error) {
      toast.error('Failed to fetch bookings');
      throw error;
    }
  },

  /**
   * Get single booking detailed view
   */
  getBookingById: async (id) => {
    try {
      const { data } = await axios.get(`/admin/bookings/${id}`);
      return data;
    } catch (error) {
      toast.error('Failed to fetch booking details');
      throw error;
    }
  },

  /**
   * Force update booking status (admin override)
   */
  updateStatus: async (id, status, reason = '') => {
    try {
      const { data } = await axios.patch(`/admin/bookings/${id}/status`, { status, reason });
      toast.success(`Booking status updated to ${status}`);
      return data;
    } catch (error) {
      toast.error('Failed to update booking status');
      throw error;
    }
  },

  /**
   * Process refund for a booking
   */
  processRefund: async (id, amount, reason) => {
    try {
      const { data } = await axios.post(`/admin/bookings/${id}/refund`, { amount, reason });
      toast.success('Refund processed successfully');
      return data;
    } catch (error) {
      toast.error('Failed to process refund');
      throw error;
    }
  },

  /**
   * Get booking timeline/audit log
   */
  getTimeline: async (id) => {
    try {
      const { data } = await axios.get(`/admin/bookings/${id}/timeline`);
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export default BookingsService;

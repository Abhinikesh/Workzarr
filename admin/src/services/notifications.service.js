import axios from '../lib/axios';
import { toast } from 'sonner';

/**
 * Service for administrative notification broadcasting and alert monitoring
 */
const NotificationsService = {
  /**
   * Broadcast notification to a segment
   */
  sendBroadcast: async (payload) => {
    try {
      const { data } = await axios.post('/admin/notifications/broadcast', payload);
      toast.success('Broadcast initiated successfully');
      return data;
    } catch (error) {
      toast.error('Failed to send broadcast');
      throw error;
    }
  },

  /**
   * Get history of sent broadcasts
   */
  getBroadcastHistory: async (params) => {
    try {
      const { data } = await axios.get('/admin/notifications/history', { params });
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get system alerts for admins
   */
  getSystemAlerts: async () => {
    try {
      const { data } = await axios.get('/admin/notifications/alerts');
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export default NotificationsService;

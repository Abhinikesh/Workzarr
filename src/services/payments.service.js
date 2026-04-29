import axios from '../lib/axios';
import { toast } from 'sonner';

/**
 * Service for administrative payment and payout management
 */
const PaymentsService = {
  /**
   * Get paginated transactions
   */
  getTransactions: async (params) => {
    try {
      const { data } = await axios.get('/admin/payments/transactions', { params });
      return data;
    } catch (error) {
      toast.error('Failed to fetch transactions');
      throw error;
    }
  },

  /**
   * Get payout requests
   */
  getPayouts: async (params) => {
    try {
      const { data } = await axios.get('/admin/payments/payouts', { params });
      return data;
    } catch (error) {
      toast.error('Failed to fetch payouts');
      throw error;
    }
  },

  /**
   * Process a payout manually
   */
  processPayout: async (payoutId, referenceId) => {
    try {
      const { data } = await axios.post(`/admin/payments/payouts/${payoutId}/process`, { referenceId });
      toast.success('Payout marked as processed');
      return data;
    } catch (error) {
      toast.error('Failed to process payout');
      throw error;
    }
  },

  /**
   * Get payment summary metrics
   */
  getSummary: async (period = 'month') => {
    try {
      const { data } = await axios.get(`/admin/payments/summary?period=${period}`);
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export default PaymentsService;

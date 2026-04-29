import axios from '../lib/axios';
import { toast } from 'sonner';

/**
 * Service for administrative provider management and verification
 */
const ProvidersService = {
  /**
   * Get paginated providers with filters
   */
  getProviders: async (params) => {
    try {
      const { data } = await axios.get('/admin/providers', { params });
      return data;
    } catch (error) {
      toast.error('Failed to fetch providers');
      throw error;
    }
  },

  /**
   * Get single provider detailed profile
   */
  getProviderById: async (id) => {
    try {
      const { data } = await axios.get(`/admin/providers/${id}`);
      return data;
    } catch (error) {
      toast.error('Failed to fetch provider details');
      throw error;
    }
  },

  /**
   * Get pending verification queue
   */
  getPendingVerifications: async () => {
    try {
      const { data } = await axios.get('/admin/providers/pending-verification');
      return data;
    } catch (error) {
      toast.error('Failed to fetch verification queue');
      throw error;
    }
  },

  /**
   * Approve or Reject a specific document
   */
  verifyDocument: async (providerId, docId, status, reason = '') => {
    try {
      const { data } = await axios.patch(`/admin/providers/${providerId}/documents/${docId}`, { status, reason });
      toast.success(`Document ${status === 'verified' ? 'approved' : 'rejected'}`);
      return data;
    } catch (error) {
      toast.error('Failed to update document status');
      throw error;
    }
  },

  /**
   * Final verification approval for provider profile
   */
  approveVerification: async (id) => {
    try {
      const { data } = await axios.post(`/admin/providers/${id}/approve-verification`);
      toast.success('Provider verified successfully');
      return data;
    } catch (error) {
      toast.error('Verification approval failed');
      throw error;
    }
  },

  /**
   * Feature or Unfeature a provider
   */
  toggleFeatured: async (id, isFeatured) => {
    try {
      const { data } = await axios.patch(`/admin/providers/${id}/featured`, { isFeatured });
      toast.success(`Provider ${isFeatured ? 'featured' : 'unfeatured'} successfully`);
      return data;
    } catch (error) {
      toast.error('Failed to update featured status');
      throw error;
    }
  },

  /**
   * Block/Unblock provider
   */
  toggleStatus: async (id, status) => {
    try {
      const { data } = await axios.patch(`/admin/providers/${id}/status`, { status });
      toast.success(`Provider ${status === 'blocked' ? 'blocked' : 'active'}`);
      return data;
    } catch (error) {
      toast.error('Failed to update provider status');
      throw error;
    }
  },

  /**
   * Manual earnings adjustment (admin override)
   */
  adjustEarnings: async (id, amount, reason) => {
    try {
      const { data } = await axios.post(`/admin/providers/${id}/adjust-earnings`, { amount, reason });
      toast.success('Earnings adjusted successfully');
      return data;
    } catch (error) {
      toast.error('Failed to adjust earnings');
      throw error;
    }
  }
};

export default ProvidersService;

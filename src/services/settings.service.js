import axios from '../lib/axios';
import { toast } from 'sonner';

/**
 * Service for managing platform-wide business rules and settings
 */
const SettingsService = {
  /**
   * Get all platform settings
   */
  getSettings: async () => {
    try {
      const { data } = await axios.get('/admin/settings');
      return data;
    } catch (error) {
      toast.error('Failed to load settings');
      throw error;
    }
  },

  /**
   * Update specific setting group
   */
  updateSettings: async (group, payload) => {
    try {
      const { data } = await axios.patch(`/admin/settings/${group}`, payload);
      toast.success(`${group.charAt(0).toUpperCase() + group.slice(1)} settings updated`);
      return data;
    } catch (error) {
      toast.error('Failed to update settings');
      throw error;
    }
  },

  /**
   * Toggle platform maintenance mode
   */
  toggleMaintenance: async (payload) => {
    try {
      const { data } = await axios.post('/admin/settings/maintenance', payload);
      toast.warning(`Maintenance mode ${payload.enabled ? 'Enabled' : 'Disabled'}`);
      return data;
    } catch (error) {
      toast.error('Failed to toggle maintenance mode');
      throw error;
    }
  },

  /**
   * Get audit logs for platform changes
   */
  getAuditLogs: async (params) => {
    try {
      const { data } = await axios.get('/admin/settings/audit-logs', { params });
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export default SettingsService;

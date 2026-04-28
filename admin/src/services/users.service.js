import axios from '../lib/axios';
import { toast } from 'sonner';

/**
 * Service for administrative user management operations
 */
const UsersService = {
  /**
   * Get paginated users with filters
   */
  getUsers: async (params) => {
    try {
      const { data } = await axios.get('/admin/users', { params });
      return data;
    } catch (error) {
      toast.error('Failed to fetch users');
      throw error;
    }
  },

  /**
   * Get single user detailed profile
   */
  getUserById: async (id) => {
    try {
      const { data } = await axios.get(\`/admin/users/\${id}\`);
      return data;
    } catch (error) {
      toast.error('Failed to fetch user details');
      throw error;
    }
  },

  /**
   * Block or Unblock a user
   */
  toggleUserStatus: async (id, status) => {
    try {
      const { data } = await axios.patch(\`/admin/users/\${id}/status\`, { status });
      toast.success(\`User \${status === 'blocked' ? 'blocked' : 'unblocked'} successfully\`);
      return data;
    } catch (error) {
      toast.error('Failed to update user status');
      throw error;
    }
  },

  /**
   * Send notification to a specific user
   */
  sendNotification: async (id, notification) => {
    try {
      const { data } = await axios.post(\`/admin/users/\${id}/notify\`, notification);
      toast.success('Notification sent successfully');
      return data;
    } catch (error) {
      toast.error('Failed to send notification');
      throw error;
    }
  },

  /**
   * Delete user account
   */
  deleteUser: async (id) => {
    try {
      await axios.delete(\`/admin/users/\${id}\`);
      toast.success('User account deleted');
    } catch (error) {
      toast.error('Failed to delete user');
      throw error;
    }
  }
};

export default UsersService;

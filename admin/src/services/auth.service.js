import axios from '../lib/axios';
import { toast } from 'sonner';

/**
 * Service for administrative authentication and session management
 */
const AuthService = {
  /**
   * Admin Login
   */
  login: async (credentials) => {
    try {
      const { data } = await axios.post('/admin/auth/login', credentials);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Authentication failed';
      toast.error(message);
      throw error;
    }
  },

  /**
   * Admin Logout
   */
  logout: async () => {
    try {
      await axios.post('/admin/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Refresh Access Token
   */
  refreshToken: async () => {
    try {
      const { data } = await axios.post('/admin/auth/refresh-token');
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get Current Session Data
   */
  getCurrentAdmin: async () => {
    try {
      const { data } = await axios.get('/admin/auth/me');
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export default AuthService;

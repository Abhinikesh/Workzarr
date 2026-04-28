import { axiosInstance } from '../lib/axios';

/**
 * Fetch top-level dashboard statistics
 * @returns {Promise<Object>}
 */
export const getDashboardStats = async () => {
  const { data } = await axiosInstance.get('/admin/dashboard/stats');
  return data;
};

/**
 * Fetch booking trends for charts
 * @param {string} period - 'day', 'week', 'month', 'year'
 * @returns {Promise<Object>}
 */
export const getBookingTrends = async (period = 'week') => {
  const { data } = await axiosInstance.get('/admin/dashboard/trends', { params: { period } });
  return data;
};

/**
 * Fetch recent activities/logs for dashboard
 * @returns {Promise<Object>}
 */
export const getRecentActivities = async () => {
  const { data } = await axiosInstance.get('/admin/dashboard/recent-activity');
  return data;
};

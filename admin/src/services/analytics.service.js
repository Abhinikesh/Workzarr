import axios from '../lib/axios';

/**
 * Service for deep analytics and platform health reporting
 */
const AnalyticsService = {
  /**
   * Get revenue and commission data points
   */
  getRevenueAnalytics: async (period) => {
    try {
      const { data } = await axios.get(\`/admin/analytics/revenue?period=\${period}\`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get booking funnel and status conversion stats
   */
  getBookingAnalytics: async (period) => {
    try {
      const { data } = await axios.get(\`/admin/analytics/bookings?period=\${period}\`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get category-wise performance breakdown
   */
  getCategoryPerformance: async () => {
    try {
      const { data } = await axios.get('/admin/analytics/categories');
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get geographic heat-map data (town-wise)
   */
  getGeoAnalytics: async () => {
    try {
      const { data } = await axios.get('/admin/analytics/geo');
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export default AnalyticsService;

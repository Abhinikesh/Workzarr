import { axiosInstance } from '../lib/axios';

/**
 * Fetch all categories with optional filters
 * @param {Object} params - Query parameters (page, limit, search)
 * @returns {Promise<Object>}
 */
export const getCategories = async (params) => {
  const { data } = await axiosInstance.get('/admin/categories', { params });
  return data;
};

/**
 * Create a new service category
 * @param {FormData|Object} categoryData 
 * @returns {Promise<Object>}
 */
export const createCategory = async (categoryData) => {
  const { data } = await axiosInstance.post('/admin/categories', categoryData);
  return data;
};

/**
 * Update an existing category
 * @param {string} categoryId 
 * @param {FormData|Object} categoryData 
 * @returns {Promise<Object>}
 */
export const updateCategory = async (categoryId, categoryData) => {
  const { data } = await axiosInstance.patch(`/admin/categories/${categoryId}`, categoryData);
  return data;
};

/**
 * Toggle category active status
 * @param {string} categoryId 
 * @returns {Promise<Object>}
 */
export const toggleCategoryStatus = async (categoryId) => {
  const { data } = await axiosInstance.patch(`/admin/categories/${categoryId}/toggle`);
  return data;
};

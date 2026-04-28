'use strict';

const sanitizeHtml = require('sanitize-html');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const logger       = require('../utils/logger');
const redisClient  = require('../config/redis');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  TRANSFORMATIONS
} = require('../utils/cloudinary');

const Category = require('../models/Category');
const Provider = require('../models/Provider');

const CATEGORIES_CACHE_KEY = 'all_categories';
const CATEGORIES_CACHE_TTL = 1800; // 30 min

const sanitize = (str) =>
  str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim() : str;

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// ─── 1. getAllCategories ───────────────────────────────────────────────────────
const getAllCategories = asyncHandler(async (req, res) => {
  const cached = await redisClient.get(CATEGORIES_CACHE_KEY);
  if (cached) {
    logger.info('Cache hit', { key: CATEGORIES_CACHE_KEY });
    return ApiResponse.success(res, 200, 'Categories fetched.', JSON.parse(cached));
  }

  logger.info('Cache miss', { key: CATEGORIES_CACHE_KEY });

  const categories = await Category.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean();

  // Attach provider count for each category in parallel
  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const providerCount = await Provider.countDocuments({
        category: cat._id,
        isActive: true,
        isVerified: true
      });
      return { ...cat, providerCount };
    })
  );

  await redisClient.setEx(CATEGORIES_CACHE_KEY, CATEGORIES_CACHE_TTL, JSON.stringify({ categories: withCounts }));

  return ApiResponse.success(res, 200, 'Categories fetched.', { categories: withCounts });
});

// ─── 2. getCategoryById ───────────────────────────────────────────────────────
const getCategoryById = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  const query      = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

  const category = await Category.findOne(query).lean();
  if (!category) throw ApiError.notFound('Category not found.');

  const providerCount = await Provider.countDocuments({
    category:   category._id,
    isActive:   true,
    isVerified: true
  });

  return ApiResponse.success(res, 200, 'Category fetched.', { category: { ...category, providerCount } });
});

// ─── 3. createCategory (admin only) ───────────────────────────────────────────
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, displayOrder } = req.body;

  if (!name) throw ApiError.badRequest('Category name is required.');

  const slug     = slugify(name.trim());
  const existing = await Category.findOne({ $or: [{ name: name.trim() }, { slug }] });
  if (existing) throw ApiError.conflict('A category with this name already exists.');

  let iconUrl = req.body.iconUrl || null;

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder:         'localserve/categories/icons',
      transformation: TRANSFORMATIONS.THUMBNAIL,
      resource_type:  'image'
    });
    iconUrl = result.url;
  }

  if (!iconUrl) throw ApiError.badRequest('Category icon is required (upload a file or provide iconUrl).');

  const category = await Category.create({
    name:         name.trim(),
    slug,
    icon:         iconUrl,
    description:  description ? sanitize(description) : undefined,
    displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0
  });

  await redisClient.del(CATEGORIES_CACHE_KEY);

  logger.info('Category created', { categoryId: category._id, name: category.name });
  return ApiResponse.success(res, 201, 'Category created.', { category });
});

// ─── 4. updateCategory (admin only) ───────────────────────────────────────────
const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found.');

  const { name, description, displayOrder } = req.body;

  if (name && name.trim() !== category.name) {
    const duplicate = await Category.findOne({ name: name.trim(), _id: { $ne: categoryId } });
    if (duplicate) throw ApiError.conflict('Another category already has this name.');
    category.name = name.trim();
    // slug auto-updated by pre('save') hook on the model
  }

  if (description !== undefined) category.description = sanitize(description);
  if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);

  // New icon uploaded
  if (req.file) {
    // Delete old icon
    if (category.icon) {
      const parts      = category.icon.split('/');
      const oldPublicId = parts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
      try { await deleteFromCloudinary(oldPublicId); } catch (e) {
        logger.warn('Could not delete old category icon', { error: e.message });
      }
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      folder:         'localserve/categories/icons',
      transformation: TRANSFORMATIONS.THUMBNAIL,
      resource_type:  'image'
    });
    category.icon = result.url;
  }

  await category.save();
  await redisClient.del(CATEGORIES_CACHE_KEY);

  logger.info('Category updated', { categoryId: category._id });
  return ApiResponse.success(res, 200, 'Category updated.', { category });
});

// ─── 5. toggleCategoryStatus (admin only) ─────────────────────────────────────
const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found.');

  category.isActive = !category.isActive;
  await category.save();

  await redisClient.del(CATEGORIES_CACHE_KEY);

  logger.info('Category status toggled', { categoryId: category._id, isActive: category.isActive });
  return ApiResponse.success(res, 200, `Category is now ${category.isActive ? 'active' : 'inactive'}.`, {
    categoryId: category._id,
    isActive:   category.isActive
  });
});

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus
};

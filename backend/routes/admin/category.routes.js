const express = require('express');
const categoryController = require('../../controllers/admin/category.controller');
const router = express.Router();

// GET /admin/categories — list all categories with provider/booking counts
router.get('/', categoryController.getAllCategories);

// GET /admin/categories/analytics — per-category revenue analytics
router.get('/analytics', categoryController.getCategoryAnalytics);

// PATCH /admin/categories/:id/status — toggle active/inactive
router.patch('/:id/status', categoryController.toggleCategoryStatus);

// PATCH /admin/categories/reorder — bulk reorder
router.patch('/reorder', categoryController.reorderCategories);

module.exports = router;

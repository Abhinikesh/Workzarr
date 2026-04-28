const express = require('express');
const categoryController = require('../../controllers/admin/category.controller');
const router = express.Router();

router.patch('/reorder', categoryController.reorderCategories);
router.get('/analytics', categoryController.getCategoryAnalytics);

module.exports = router;

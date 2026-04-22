'use strict';

const express = require('express');
const ctrl    = require('../controllers/category.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

const router = express.Router();

// Public
router.get('/',          ctrl.getAllCategories);
router.get('/:idOrSlug', ctrl.getCategoryById);

// Admin only
router.post(
  '/',
  protect,
  restrictTo('admin'),
  ...uploadAvatar,
  ctrl.createCategory
);

router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  ...uploadAvatar,
  ctrl.updateCategory
);

router.patch(
  '/:id/toggle',
  protect,
  restrictTo('admin'),
  ctrl.toggleCategoryStatus
);

module.exports = router;

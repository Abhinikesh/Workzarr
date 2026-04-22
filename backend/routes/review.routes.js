'use strict';

const express = require('express');
const ctrl = require('../controllers/review.controller');
const { protect, restrictTo, providerOnly } = require('../middleware/auth.middleware');
const { uploadReviewImages } = require('../middleware/upload.middleware');

const router = express.Router();

router.post(
  '/',
  protect,
  restrictTo('customer'),
  ...uploadReviewImages,
  ctrl.createReview
);

router.get(
  '/provider/:providerId',
  ctrl.getProviderReviews
);

router.post(
  '/:reviewId/reply',
  protect,
  providerOnly,
  ctrl.replyToReview
);

router.get(
  '/mine',
  protect,
  providerOnly,
  ctrl.getMyReviews
);

router.patch(
  '/admin/:reviewId/toggle',
  protect,
  restrictTo('admin'),
  ctrl.adminToggleReviewVisibility
);

module.exports = router;

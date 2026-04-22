'use strict';

const express  = require('express');
const ctrl     = require('../controllers/provider.controller');
const { protect, providerOnly, restrictTo } = require('../middleware/auth.middleware');
const { uploadAvatar, uploadGallery, uploadDocument } = require('../middleware/upload.middleware');
const {
  validate,
  registerProviderSchema,
  updateProviderSchema,
  updateAvailabilitySchema,
  uploadDocumentSchema,
  searchProviderSchema
} = require('../validators/provider.validator');

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────────────

// GET /api/v1/providers/search?lat=&lng=&...
router.get(
  '/search',
  validate(searchProviderSchema, 'query'),
  ctrl.searchProviders
);

// GET /api/v1/providers/top?lat=&lng=&categoryId=&limit=
router.get('/top', ctrl.getTopProvidersByCategory);

// GET /api/v1/providers/:providerId
router.get('/:providerId', ctrl.getProviderById);

// ─── Protected: any authenticated user can register as provider ───────────────

router.post(
  '/register',
  protect,
  validate(registerProviderSchema),
  ctrl.registerProvider
);

// ─── Provider-only routes ─────────────────────────────────────────────────────

router.get(
  '/me/profile',
  protect,
  providerOnly,
  ctrl.getMyProviderProfile
);

router.patch(
  '/me/profile',
  protect,
  providerOnly,
  validate(updateProviderSchema),
  ctrl.updateProviderProfile
);

// Avatar upload: multer middleware array then controller
router.patch(
  '/me/avatar',
  protect,
  providerOnly,
  ...uploadAvatar,                   // [multer, magicBytesCheck]
  ctrl.uploadProviderAvatar
);

// Gallery upload
router.post(
  '/me/gallery',
  protect,
  providerOnly,
  ...uploadGallery,
  ctrl.uploadGalleryImages
);

// Delete a gallery image
router.delete(
  '/me/gallery',
  protect,
  providerOnly,
  ctrl.deleteGalleryImage
);

// Document upload
router.post(
  '/me/documents',
  protect,
  providerOnly,
  ...uploadDocument,
  validate(uploadDocumentSchema),
  ctrl.uploadProviderDocument
);

// Availability
router.patch(
  '/me/availability',
  protect,
  providerOnly,
  validate(updateAvailabilitySchema),
  ctrl.updateAvailability
);

// Stats
router.get(
  '/me/stats',
  protect,
  providerOnly,
  ctrl.getProviderStats
);

module.exports = router;

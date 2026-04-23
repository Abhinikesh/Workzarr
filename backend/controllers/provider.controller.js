'use strict';

const mongoose     = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const logger       = require('../utils/logger');
const redisClient  = require('../config/redis');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignedUrl,
  TRANSFORMATIONS
} = require('../utils/cloudinary');

const Provider     = require('../models/Provider');
const User         = require('../models/User');
const Category     = require('../models/Category');
const Notification = require('../models/Notification');
const Booking      = require('../models/Booking');
const Review       = require('../models/Review');
const Service      = require('../models/Service');
const Payout       = require('../models/Payout');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROVIDER_CACHE_TTL  = 300;  // 5 min
const TOP_CACHE_TTL       = 600;  // 10 min
const SEARCH_CACHE_TTL    = 120;  // 2 min

const sanitize = (str) =>
  str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim() : str;

const computeRank = (provider) =>
  (provider.rating.average * 20) +
  (provider.stats.completedJobs * 0.1) +
  (provider.subscription && provider.subscription.plan === 'premium' && provider.subscription.isActive ? 30 : 0) +
  (provider.isVerified ? 20 : 0) -
  (provider.stats.cancelledJobs * 2);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const invalidateSearchCache = async (lat, lng, radius = 50) => {
  try {
    // Pattern-delete search keys — ioredis does not support SCAN natively, so we use keys()
    const keys = await redisClient.keys('search:*');
    if (keys.length) await redisClient.del(...keys);
  } catch (err) {
    logger.warn('Cache invalidation warning (search)', { error: err.message });
  }
};

// ─── 1. registerProvider ──────────────────────────────────────────────────────
const registerProvider = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const existing = await Provider.findOne({ userId });
  if (existing) throw ApiError.conflict('You already have a provider profile.');

  const {
    businessName, categoryId, phone, bio,
    town, district, state, pincode, lat, lng,
    serviceRadius, basePrice, priceUnit, priceDescription
  } = req.body;

  if (!isValidObjectId(categoryId)) throw ApiError.badRequest('Invalid category ID.');

  const [category, phoneTaken] = await Promise.all([
    Category.findOne({ _id: categoryId, isActive: true }),
    Provider.findOne({ phone })
  ]);

  if (!category)   throw ApiError.badRequest('Category not found or is inactive.');
  if (phoneTaken)  throw ApiError.conflict('This phone number is already registered by another provider.');

  const provider = await Provider.create({
    userId,
    businessName: businessName.trim(),
    category:     categoryId,
    phone,
    bio:          bio ? sanitize(bio) : undefined,
    location: {
      town, district, state, pincode,
      coordinates: { type: 'Point', coordinates: [lng, lat] }
    },
    serviceRadius: serviceRadius || 10,
    pricing: {
      basePrice,
      priceUnit,
      description: priceDescription ? priceDescription.trim() : undefined
    }
  });

  await User.findByIdAndUpdate(userId, { role: 'provider' });
  await invalidateSearchCache();

  const populated = await provider.populate('category', 'name icon slug');

  logger.info('Provider registered', { providerId: provider._id, userId });
  return ApiResponse.success(res, 201, 'Provider profile created successfully.', { provider: populated });
});

// ─── 2. getMyProviderProfile ──────────────────────────────────────────────────
const getMyProviderProfile = asyncHandler(async (req, res) => {
  const cacheKey = `provider_profile:${req.provider._id}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    logger.info('Cache hit', { key: cacheKey });
    return ApiResponse.success(res, 200, 'Provider profile fetched.', JSON.parse(cached));
  }

  logger.info('Cache miss', { key: cacheKey });

  const provider = await Provider.findById(req.provider._id)
    .populate('category', 'name icon slug')
    .populate('userId', 'name phone email avatar')
    .lean();

  if (!provider) throw ApiError.notFound('Provider profile not found.');

  // Sign document URLs
  if (provider.documents && provider.documents.length) {
    provider.documents = provider.documents.map((doc) => ({
      ...doc,
      url: doc.publicId ? generateSignedUrl(doc.publicId, 3600) : doc.url
    }));
  }

  await redisClient.setEx(cacheKey, PROVIDER_CACHE_TTL, JSON.stringify(provider));
  return ApiResponse.success(res, 200, 'Provider profile fetched.', { provider });
});

// ─── 3. updateProviderProfile ─────────────────────────────────────────────────
const updateProviderProfile = asyncHandler(async (req, res) => {
  const provider = req.provider;

  const {
    businessName, categoryId, phone, bio,
    town, district, state, pincode, lat, lng,
    serviceRadius, basePrice, priceUnit, priceDescription
  } = req.body;

  if (categoryId) {
    if (!isValidObjectId(categoryId)) throw ApiError.badRequest('Invalid category ID.');
    const cat = await Category.findOne({ _id: categoryId, isActive: true });
    if (!cat) throw ApiError.badRequest('Category not found or inactive.');
  }

  if (phone && phone !== provider.phone) {
    const taken = await Provider.findOne({ phone, _id: { $ne: provider._id } });
    if (taken) throw ApiError.conflict('Phone number already in use by another provider.');
  }

  const $set = {};
  if (businessName)    $set.businessName          = businessName.trim();
  if (categoryId)      $set.category              = categoryId;
  if (phone)           $set.phone                 = phone;
  if (bio !== undefined) $set.bio                 = sanitize(bio);
  if (town)            $set['location.town']      = town;
  if (district)        $set['location.district']  = district;
  if (state)           $set['location.state']     = state;
  if (pincode)         $set['location.pincode']   = pincode;
  if (lat !== undefined && lng !== undefined) {
    $set['location.coordinates'] = { type: 'Point', coordinates: [lng, lat] };
  }
  if (serviceRadius !== undefined) $set.serviceRadius       = serviceRadius;
  if (basePrice !== undefined)     $set['pricing.basePrice'] = basePrice;
  if (priceUnit)                   $set['pricing.priceUnit'] = priceUnit;
  if (priceDescription !== undefined) $set['pricing.description'] = priceDescription.trim();

  const updated = await Provider.findByIdAndUpdate(
    provider._id,
    { $set },
    { new: true, runValidators: true }
  ).populate('category', 'name icon slug').lean();

  // Recompute rank
  const rank = computeRank(updated);
  await Provider.findByIdAndUpdate(provider._id, { rank });
  updated.rank = rank;

  // Invalidate caches
  await Promise.all([
    redisClient.del(`provider_profile:${provider._id}`),
    redisClient.del(`provider_public:${provider._id}`),
    invalidateSearchCache()
  ]);

  logger.info('Provider profile updated', { providerId: provider._id });
  return ApiResponse.success(res, 200, 'Provider profile updated.', { provider: updated });
});

// ─── 4. uploadAvatar ─────────────────────────────────────────────────────────
const uploadProviderAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded. Please attach an image.');

  const provider = req.provider;

  // Delete old image if exists
  if (provider.profileImage) {
    // Extract publicId from URL (last two path segments: folder/filename)
    const parts = provider.profileImage.split('/');
    const oldPublicId = parts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
    try {
      await deleteFromCloudinary(oldPublicId);
    } catch (e) {
      logger.warn('Could not delete old avatar from Cloudinary', { error: e.message });
    }
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder:         `localserve/providers/avatars/${provider._id}`,
    transformation: TRANSFORMATIONS.AVATAR,
    resource_type:  'image'
  });

  await Promise.all([
    Provider.findByIdAndUpdate(provider._id, { profileImage: result.url }),
    User.findByIdAndUpdate(provider.userId, { avatar: result.url })
  ]);

  await Promise.all([
    redisClient.del(`provider_profile:${provider._id}`),
    redisClient.del(`provider_public:${provider._id}`)
  ]);

  logger.info('Provider avatar uploaded', { providerId: provider._id });
  return ApiResponse.success(res, 200, 'Avatar uploaded successfully.', { profileImage: result.url });
});

// ─── 5. uploadGalleryImages ───────────────────────────────────────────────────
const uploadGalleryImages = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) {
    throw ApiError.badRequest('No files uploaded.');
  }

  const provider = req.provider;

  if (provider.gallery.length + req.files.length > 6) {
    throw ApiError.badRequest(
      `Maximum 6 gallery images allowed. You have ${provider.gallery.length} and are trying to add ${req.files.length}.`
    );
  }

  const uploads = await Promise.all(
    req.files.map((file) =>
      uploadToCloudinary(file.buffer, {
        folder:         `localserve/providers/gallery/${provider._id}`,
        transformation: TRANSFORMATIONS.GALLERY,
        resource_type:  'image'
      })
    )
  );

  const newUrls   = uploads.map((u) => u.url);
  const updatedDoc = await Provider.findByIdAndUpdate(
    provider._id,
    { $push: { gallery: { $each: newUrls } } },
    { new: true }
  );

  await Promise.all([
    redisClient.del(`provider_profile:${provider._id}`),
    redisClient.del(`provider_public:${provider._id}`)
  ]);

  logger.info('Gallery images uploaded', { providerId: provider._id, count: newUrls.length });
  return ApiResponse.success(res, 200, 'Gallery images uploaded.', { gallery: updatedDoc.gallery });
});

// ─── 6. deleteGalleryImage ────────────────────────────────────────────────────
const deleteGalleryImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) throw ApiError.badRequest('publicId is required.');

  const provider = req.provider;

  // Verify ownership: publicId folder must contain provider._id
  if (!publicId.includes(provider._id.toString())) {
    throw ApiError.forbidden('This image does not belong to your gallery.');
  }

  // Derive URL from publicId to pull from gallery array
  const imageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;

  await deleteFromCloudinary(publicId);

  const updatedDoc = await Provider.findByIdAndUpdate(
    provider._id,
    { $pull: { gallery: { $regex: publicId.split('/').pop() } } },
    { new: true }
  );

  await Promise.all([
    redisClient.del(`provider_profile:${provider._id}`),
    redisClient.del(`provider_public:${provider._id}`)
  ]);

  logger.info('Gallery image deleted', { providerId: provider._id, publicId });
  return ApiResponse.success(res, 200, 'Gallery image deleted.', { gallery: updatedDoc.gallery });
});

// ─── 7. uploadDocument ───────────────────────────────────────────────────────
const uploadProviderDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded.');

  const { docType } = req.body;
  if (!docType) throw ApiError.badRequest('docType is required.');

  const provider = req.provider;

  if (docType === 'aadhaar') {
    const hasAadhaar = provider.documents.some((d) => d.docType === 'aadhaar');
    if (hasAadhaar) throw ApiError.conflict('Aadhaar document is already uploaded. Only one allowed.');
  }

  const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';
  const result = await uploadToCloudinary(req.file.buffer, {
    folder:         `localserve/providers/documents/${provider._id}`,
    transformation: resourceType === 'image' ? TRANSFORMATIONS.DOCUMENT : undefined,
    resource_type:  resourceType
  });

  const newDoc = {
    docType,
    url:      result.url,
    publicId: result.publicId,
    verified: false
  };

  const updatedDoc = await Provider.findByIdAndUpdate(
    provider._id,
    { $push: { documents: newDoc } },
    { new: true }
  );

  // Notify admin
  const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
  if (admin) {
    await Notification.create({
      recipient: admin._id,
      type:      'account_verified',
      title:     'New Document Submitted',
      body:      `Provider ${provider._id} submitted a new ${docType} document for verification.`,
      data:      { providerId: provider._id, docType },
      channel:   'in_app'
    });
  }

  // Return documents with signed URLs
  const docsWithSignedUrls = updatedDoc.documents.map((doc) => ({
    _id:        doc._id,
    docType:    doc.docType,
    url:        doc.publicId ? generateSignedUrl(doc.publicId, 3600) : doc.url,
    verified:   doc.verified,
    verifiedAt: doc.verifiedAt
  }));

  logger.info('Document uploaded', { providerId: provider._id, docType });
  return ApiResponse.success(res, 201, 'Document uploaded and pending verification.', { documents: docsWithSignedUrls });
});

// ─── 8. updateAvailability ────────────────────────────────────────────────────
const updateAvailability = asyncHandler(async (req, res) => {
  const { isAvailable, schedule } = req.body;
  const provider = req.provider;

  const $set = { 'availability.isAvailable': isAvailable };
  if (schedule && schedule.length === 7) {
    $set['availability.schedule'] = schedule;
  }

  const updated = await Provider.findByIdAndUpdate(
    provider._id,
    { $set },
    { new: true }
  );

  await Promise.all([
    redisClient.setEx(`provider_available:${provider._id}`, 86400, String(isAvailable)),
    redisClient.del(`provider_profile:${provider._id}`),
    invalidateSearchCache()
  ]);

  logger.info('Availability updated', { providerId: provider._id, isAvailable });
  return ApiResponse.success(res, 200, 'Availability updated.', { availability: updated.availability });
});

const part2 = require('./provider.controller.part2');

module.exports = {
  registerProvider,
  getMyProviderProfile,
  updateProviderProfile,
  uploadProviderAvatar,
  uploadGalleryImages,
  deleteGalleryImage,
  uploadProviderDocument,
  updateAvailability,
  searchProviders:              part2.searchProviders,
  getProviderById:              part2.getProviderById,
  getProviderStats:             part2.getProviderStats,
  getTopProvidersByCategory:    part2.getTopProvidersByCategory
};

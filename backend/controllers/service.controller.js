'use strict';

const mongoose     = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const asyncHandler = require('./asyncHandler');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const logger       = require('../utils/logger');
const redisClient  = require('../config/redis');

const Service  = require('../models/Service');
const Provider = require('../models/Provider');
const Booking  = require('../models/Booking');

const sanitize = (str) =>
  str ? sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim() : str;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const invalidateProviderCache = async (providerId) => {
  await Promise.all([
    redisClient.del(`provider_profile:${providerId}`),
    redisClient.del(`provider_public:${providerId}`)
  ]);
};

// ─── 1. createService ─────────────────────────────────────────────────────────
const createService = asyncHandler(async (req, res) => {
  const provider = req.provider;

  const { title, description, price, priceType, duration } = req.body;

  if (!title)     throw ApiError.badRequest('Service title is required.');
  if (!price && price !== 0) throw ApiError.badRequest('Service price is required.');
  if (!priceType) throw ApiError.badRequest('priceType is required.');
  if (!duration)  throw ApiError.badRequest('Service duration is required.');

  const service = await Service.create({
    provider: provider._id,
    category: provider.category,
    title:    title.trim(),
    description: description ? sanitize(description) : undefined,
    price,
    priceType,
    duration
  });

  await invalidateProviderCache(provider._id);

  logger.info('Service created', { serviceId: service._id, providerId: provider._id });
  return ApiResponse.success(res, 201, 'Service created.', { service });
});

// ─── 2. getMyServices ─────────────────────────────────────────────────────────
const getMyServices = asyncHandler(async (req, res) => {
  const provider = req.provider;

  const services = await Service.find({ provider: provider._id }).lean();

  // Attach booking count for each service
  const withCounts = await Promise.all(
    services.map(async (svc) => {
      const bookingCount = await Booking.countDocuments({ service: svc._id });
      return { ...svc, bookingCount };
    })
  );

  return ApiResponse.success(res, 200, 'Services fetched.', { services: withCounts });
});

// ─── 3. updateService ─────────────────────────────────────────────────────────
const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const provider = req.provider;

  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid service ID.');

  const service = await Service.findOne({ _id: id, provider: provider._id });
  if (!service) throw ApiError.notFound('Service not found or you do not own it.');

  const { title, description, price, priceType, duration } = req.body;

  if (title !== undefined)       service.title       = title.trim();
  if (description !== undefined) service.description = sanitize(description);
  if (price !== undefined)       service.price       = price;
  if (priceType !== undefined)   service.priceType   = priceType;
  if (duration !== undefined)    service.duration    = duration;

  await service.save();
  await invalidateProviderCache(provider._id);

  logger.info('Service updated', { serviceId: service._id });
  return ApiResponse.success(res, 200, 'Service updated.', { service });
});

// ─── 4. toggleServiceStatus ───────────────────────────────────────────────────
const toggleServiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const provider = req.provider;

  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid service ID.');

  const service = await Service.findOne({ _id: id, provider: provider._id });
  if (!service) throw ApiError.notFound('Service not found or you do not own it.');

  service.isActive = !service.isActive;
  await service.save();
  await invalidateProviderCache(provider._id);

  logger.info('Service status toggled', { serviceId: service._id, isActive: service.isActive });
  return ApiResponse.success(res, 200, `Service is now ${service.isActive ? 'active' : 'inactive'}.`, {
    serviceId: service._id,
    isActive:  service.isActive
  });
});

// ─── 5. deleteService ─────────────────────────────────────────────────────────
const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const provider = req.provider;

  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid service ID.');

  const service = await Service.findOne({ _id: id, provider: provider._id });
  if (!service) throw ApiError.notFound('Service not found or you do not own it.');

  const activeBookings = await Booking.countDocuments({
    service: service._id,
    status:  { $in: ['pending', 'accepted', 'arriving', 'in_progress'] }
  });

  if (activeBookings > 0) {
    throw ApiError.badRequest(
      `Cannot delete service: it has ${activeBookings} active or pending booking(s). Resolve them first.`
    );
  }

  // Soft delete — set isActive false rather than destroying record
  service.isActive = false;
  await service.save();

  await invalidateProviderCache(provider._id);

  logger.info('Service soft-deleted', { serviceId: service._id });
  return ApiResponse.success(res, 200, 'Service removed successfully.', { serviceId: service._id });
});

// ─── 6. getProviderServices (public) ─────────────────────────────────────────
const getProviderServices = asyncHandler(async (req, res) => {
  const { providerId } = req.params;

  if (!isValidObjectId(providerId)) throw ApiError.badRequest('Invalid provider ID.');

  const providerExists = await Provider.exists({ _id: providerId, isActive: true });
  if (!providerExists) throw ApiError.notFound('Provider not found.');

  const services = await Service.find({ provider: providerId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  return ApiResponse.success(res, 200, 'Services fetched.', { services });
});

module.exports = {
  createService,
  getMyServices,
  updateService,
  toggleServiceStatus,
  deleteService,
  getProviderServices
};

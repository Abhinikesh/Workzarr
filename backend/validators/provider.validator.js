'use strict';

const Joi    = require('joi');
const ApiError = require('../utils/ApiError');

// ─── Reusable primitives ──────────────────────────────────────────────────────
const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Must be a valid MongoDB ObjectId (24 hex characters)' });

const indianPhone = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .messages({ 'string.pattern.base': 'Must be a valid 10-digit Indian mobile number starting with 6-9' });

const timeHHMM = Joi.string()
  .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
  .messages({ 'string.pattern.base': 'Time must be in HH:MM 24-hour format (e.g. 09:00)' });

// ─── Helper: validate schema against req.body or req.query ───────────────────
const validate = (schema, source = 'body') => (req, res, next) => {
  const target = source === 'query' ? req.query : req.body;
  const { error, value } = schema.validate(target, {
    abortEarly:   false,
    stripUnknown: true
  });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return next(ApiError.badRequest('Validation failed', messages));
  }

  // Replace the source with the sanitised/coerced value
  if (source === 'query') {
    req.query = value;
  } else {
    req.body = value;
  }

  next();
};

// ─── 1. registerProviderSchema ────────────────────────────────────────────────
const registerProviderSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(100).required()
    .messages({ 'string.min': 'Business name must be at least 2 characters' }),

  categoryId: objectId.required()
    .messages({ 'any.required': 'Category is required' }),

  phone: indianPhone.required()
    .messages({ 'any.required': 'Phone number is required' }),

  bio: Joi.string().trim().max(500).optional().allow(''),

  town:     Joi.string().trim().required(),
  district: Joi.string().trim().required(),
  state:    Joi.string().trim().required(),
  pincode:  Joi.string().pattern(/^\d{6}$/).required()
    .messages({ 'string.pattern.base': 'Pincode must be exactly 6 digits' }),

  lat: Joi.number().min(-90).max(90).required()
    .messages({ 'number.min': 'Latitude must be between -90 and 90', 'number.max': 'Latitude must be between -90 and 90' }),
  lng: Joi.number().min(-180).max(180).required()
    .messages({ 'number.min': 'Longitude must be between -180 and 180', 'number.max': 'Longitude must be between -180 and 180' }),

  serviceRadius: Joi.number().min(1).max(50).default(10),

  basePrice:        Joi.number().min(0).required(),
  priceUnit:        Joi.string().valid('per_hour', 'per_job', 'negotiable').required(),
  priceDescription: Joi.string().trim().max(200).optional().allow('')
});

// ─── 2. updateProviderSchema ──────────────────────────────────────────────────
const updateProviderSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(100),
  categoryId:   objectId,
  phone:        indianPhone,
  bio:          Joi.string().trim().max(500).allow(''),
  town:         Joi.string().trim(),
  district:     Joi.string().trim(),
  state:        Joi.string().trim(),
  pincode:      Joi.string().pattern(/^\d{6}$/)
    .messages({ 'string.pattern.base': 'Pincode must be exactly 6 digits' }),
  lat:              Joi.number().min(-90).max(90),
  lng:              Joi.number().min(-180).max(180),
  serviceRadius:    Joi.number().min(1).max(50),
  basePrice:        Joi.number().min(0),
  priceUnit:        Joi.string().valid('per_hour', 'per_job', 'negotiable'),
  priceDescription: Joi.string().trim().max(200).allow('')
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

// ─── 3. updateAvailabilitySchema ─────────────────────────────────────────────
const scheduleEntrySchema = Joi.object({
  day:       Joi.number().integer().min(0).max(6).required(),
  startTime: timeHHMM.required(),
  endTime:   timeHHMM.required(),
  isOff:     Joi.boolean().default(false)
}).custom((val, helpers) => {
  // Only validate times when the day is not marked off
  if (!val.isOff) {
    const [sh, sm] = val.startTime.split(':').map(Number);
    const [eh, em] = val.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;
    if (startMins >= endMins) {
      return helpers.error('any.invalid', { message: `Day ${val.day}: startTime must be earlier than endTime` });
    }
  }
  return val;
});

const updateAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean().required(),
  schedule:    Joi.array()
    .items(scheduleEntrySchema)
    .length(7)
    .optional()
    .messages({ 'array.length': 'Schedule must include all 7 days (0=Sun … 6=Sat)' })
});

// ─── 4. uploadDocumentSchema ──────────────────────────────────────────────────
const uploadDocumentSchema = Joi.object({
  docType: Joi.string().valid('aadhaar', 'certificate', 'photo').required()
    .messages({ 'any.only': 'docType must be one of: aadhaar, certificate, photo' })
});

// ─── 5. searchProviderSchema (query params) ───────────────────────────────────
const searchProviderSchema = Joi.object({
  lat:         Joi.number().min(-90).max(90).required()
    .messages({ 'any.required': 'lat (latitude) is required for location-based search' }),
  lng:         Joi.number().min(-180).max(180).required()
    .messages({ 'any.required': 'lng (longitude) is required for location-based search' }),
  categoryId:  objectId.optional(),
  radius:      Joi.number().min(1).max(50).default(10),
  minRating:   Joi.number().min(1).max(5).optional(),
  maxPrice:    Joi.number().min(0).optional(),
  isAvailable: Joi.boolean().optional(),
  sortBy:      Joi.string().valid('rating', 'price', 'distance', 'relevance').default('relevance'),
  page:        Joi.number().integer().min(1).default(1),
  limit:       Joi.number().integer().min(1).max(20).default(10)
});

module.exports = {
  validate,
  registerProviderSchema,
  updateProviderSchema,
  updateAvailabilitySchema,
  uploadDocumentSchema,
  searchProviderSchema
};

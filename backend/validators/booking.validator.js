'use strict';

const Joi = require('joi');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'ObjectId validation');

// Helper to validate request payload
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((x) => x.message).join(', ');
      return next(ApiError.badRequest(`Validation error: ${messages}`));
    }
    req[property] = value;
    next();
  };
};

const createBookingSchema = Joi.object({
  providerId: objectId.required(),
  serviceId: objectId.required(),
  categoryId: objectId.required(),
  scheduledAt: Joi.date()
    .iso()
    .min(new Date(Date.now() + 30 * 60 * 1000)) // At least 30 minutes in future
    .max(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // Max 30 days in future
    .required()
    .messages({
      'date.min': 'Booking must be scheduled at least 30 minutes in advance.',
      'date.max': 'Booking cannot be scheduled more than 30 days in advance.'
    }),
  address: Joi.object({
    fullAddress: Joi.string().max(300).required(),
    landmark: Joi.string().max(100).allow(''),
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).required(),
  paymentMethod: Joi.string().valid('cash', 'upi', 'card').required(),
  notes: Joi.string().max(300).allow('')
});

const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid('accepted', 'arriving', 'in_progress', 'completed', 'cancelled', 'no_show')
    .required(),
  cancellationReason: Joi.string().when('status', {
    is: 'cancelled',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  otp: Joi.string().length(4).pattern(/^[0-9]+$/).when('status', {
    is: 'in_progress',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }).messages({
    'string.pattern.base': 'OTP must be exactly 4 digits.',
    'string.length': 'OTP must be exactly 4 digits.'
  })
});

const rescheduleBookingSchema = Joi.object({
  scheduledAt: Joi.date()
    .iso()
    .min(new Date(Date.now() + 30 * 60 * 1000))
    .max(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    .required()
    .messages({
      'date.min': 'Booking must be scheduled at least 30 minutes in advance.',
      'date.max': 'Booking cannot be scheduled more than 30 days in advance.'
    })
});

const getBookingsSchema = Joi.object({
  status: Joi.string().valid('pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled', 'no_show', 'all').default('all'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sortBy: Joi.string().valid('newest', 'oldest', 'scheduled').default('newest'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
});

module.exports = {
  validate,
  createBookingSchema,
  updateBookingStatusSchema,
  rescheduleBookingSchema,
  getBookingsSchema
};

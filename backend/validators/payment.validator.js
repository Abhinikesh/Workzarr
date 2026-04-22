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

// 1. createOrderSchema
const createOrderSchema = Joi.object({
  bookingId: objectId.required(),
  paymentMethod: Joi.string().valid('upi', 'card').required()
});

// 2. verifyPaymentSchema
const verifyPaymentSchema = Joi.object({
  bookingId: objectId.optional(), // Can be optional for subscriptions, handled in controller
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required()
});

// 3. requestPayoutSchema
const requestPayoutSchema = Joi.object({
  amount: Joi.number().min(100).required().messages({
    'number.min': 'Minimum payout amount is ₹100'
  }),
  method: Joi.string().valid('upi', 'bank_transfer').required(),
  upiId: Joi.string().pattern(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/).when('method', {
    is: 'upi',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }).messages({
    'string.pattern.base': 'Invalid UPI ID format'
  }),
  bankDetails: Joi.object({
    accountNumber: Joi.string().required(),
    ifsc: Joi.string().length(11).uppercase().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
      'string.pattern.base': 'Invalid IFSC code format'
    }),
    accountHolderName: Joi.string().required()
  }).when('method', {
    is: 'bank_transfer',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

// 4. subscriptionPurchaseSchema
const subscriptionPurchaseSchema = Joi.object({
  plan: Joi.string().valid('premium').required(),
  duration: Joi.string().valid('monthly', 'quarterly', 'yearly').required(),
  paymentMethod: Joi.string().valid('upi', 'card').required()
});

module.exports = {
  validate,
  createOrderSchema,
  verifyPaymentSchema,
  requestPayoutSchema,
  subscriptionPurchaseSchema
};

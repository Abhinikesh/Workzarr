const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const sendOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Valid 10-digit Indian phone number is required starting with 6-9',
      'any.required': 'Phone number is required'
    }),
  purpose: Joi.string().valid('login', 'register').required()
});

const verifyOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'OTP must be exactly 6 digits',
      'any.required': 'OTP is required'
    }),
  purpose: Joi.string().valid('login', 'register').required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const completeProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().optional(),
  town: Joi.string().required(),
  district: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'Pincode must be exactly 6 digits'
    })
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return next(ApiError.badRequest('Validation failed', errorMessages));
  }
  next();
};

module.exports = {
  sendOTPSchema,
  verifyOTPSchema,
  refreshTokenSchema,
  completeProfileSchema,
  validate
};

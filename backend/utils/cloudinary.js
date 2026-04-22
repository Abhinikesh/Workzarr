'use strict';

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const ApiError = require('./ApiError');
const logger = require('./logger');

// ─── Configure SDK ────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true
});

// ─── Transformation Presets ───────────────────────────────────────────────────
const TRANSFORMATIONS = {
  AVATAR: [
    { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }
  ],
  GALLERY: [
    { width: 800, height: 600, crop: 'fill', quality: 'auto:good', fetch_format: 'auto' }
  ],
  DOCUMENT: [
    { quality: 'auto', flags: 'preserve_transparency', fetch_format: 'auto' }
  ],
  THUMBNAIL: [
    { width: 150, height: 150, crop: 'fill', quality: 'auto:low', fetch_format: 'auto' }
  ]
};

/**
 * Upload a file buffer to Cloudinary using upload_stream.
 *
 * @param {Buffer} fileBuffer   - Raw file buffer from multer memory storage
 * @param {Object} options
 * @param {string} options.folder          - Cloudinary folder path
 * @param {string} [options.public_id]     - Optional explicit public_id
 * @param {Array}  [options.transformation] - Transformation preset array
 * @param {string} [options.resource_type] - 'image' | 'raw' | 'video' (default: 'image')
 * @returns {Promise<{url, publicId, width, height, format, size}>}
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  const {
    folder,
    public_id,
    transformation,
    resource_type = 'image'
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type,
      overwrite: true,
      invalidate:  true,
      ...(public_id    && { public_id }),
      ...(transformation && { transformation })
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error', { error: error.message, folder });
          return reject(
            ApiError.internal(`File upload failed: ${error.message}`)
          );
        }

        logger.info('Cloudinary upload success', {
          publicId: result.public_id,
          bytes:    result.bytes
        });

        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          width:    result.width    || null,
          height:   result.height   || null,
          format:   result.format   || null,
          size:     result.bytes    || null
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete a Cloudinary asset by its public_id.
 *
 * @param {string} publicId      - Cloudinary public_id
 * @param {string} resourceType  - 'image' | 'raw' | 'video' (default: 'image')
 * @returns {Promise<{result: string}>}
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate:    true
    });

    logger.info('Cloudinary delete success', { publicId, result: result.result });
    return { result: result.result };
  } catch (error) {
    logger.error('Cloudinary delete error', { publicId, error: error.message });
    throw ApiError.internal(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Generate a temporary signed URL for a private Cloudinary asset.
 *
 * @param {string} publicId   - Cloudinary public_id
 * @param {number} expiresIn  - Seconds until URL expires (default: 3600)
 * @returns {string} Signed URL
 */
const generateSignedUrl = (publicId, expiresIn = 3600) => {
  try {
    const signedUrl = cloudinary.url(publicId, {
      sign_url:      true,
      type:          'authenticated',
      expires_at:    Math.floor(Date.now() / 1000) + expiresIn,
      resource_type: 'image'
    });

    logger.info('Cloudinary signed URL generated', { publicId, expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error('Cloudinary signed URL error', { publicId, error: error.message });
    throw ApiError.internal(`Failed to generate signed URL: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  TRANSFORMATIONS,
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignedUrl
};

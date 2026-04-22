'use strict';

const multer  = require('multer');
const ApiError = require('../utils/ApiError');

// ─── Memory storage (no temp files) ──────────────────────────────────────────
const memoryStorage = multer.memoryStorage();

// ─── Magic-bytes signatures for allowed image types ──────────────────────────
const IMAGE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF]
  ],
  'image/jpg': [
    [0xFF, 0xD8, 0xFF]
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47]
  ],
  'image/webp': [
    // RIFF....WEBP
    null // checked separately via string match
  ]
};

/**
 * Validate that a buffer's leading bytes match the expected magic bytes
 * for a given mimetype. For webp we do a string check on bytes 8–11.
 */
const validateMagicBytes = (buffer, mimetype) => {
  if (!buffer || buffer.length < 4) return false;

  if (mimetype === 'image/webp' || mimetype === 'image/jpg') {
    // WEBP: bytes 0-3 = "RIFF", bytes 8-11 = "WEBP"
    if (mimetype === 'image/webp') {
      const riff = buffer.slice(0, 4).toString('ascii');
      const webp = buffer.slice(8, 12).toString('ascii');
      return riff === 'RIFF' && webp === 'WEBP';
    }
    // jpg same as jpeg
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  const sigs = IMAGE_SIGNATURES[mimetype];
  if (!sigs) return false;

  return sigs.some((sig) => {
    if (!sig) return false;
    return sig.every((byte, idx) => buffer[idx] === byte);
  });
};

/**
 * Build a multer file filter that:
 *  1. Checks the mimetype whitelist
 *  2. Validates magic bytes
 */
const buildImageFilter = (allowedMimetypes) => (req, file, cb) => {
  if (!allowedMimetypes.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Invalid file type "${file.mimetype}". Allowed: ${allowedMimetypes.join(', ')}`
      ),
      false
    );
  }
  // Magic-bytes validated after upload completes (buffer available post-upload)
  // We flag for post-processing validation on req
  cb(null, true);
};

/**
 * Post-upload middleware factory: validates magic bytes on all uploaded files.
 * Call this after the multer middleware for full validation.
 */
const validateMagicBytesMiddleware = (allowedMimetypes) => (req, res, next) => {
  const files = req.file
    ? [req.file]
    : req.files
    ? Array.isArray(req.files) ? req.files : Object.values(req.files).flat()
    : [];

  for (const file of files) {
    if (!validateMagicBytes(file.buffer, file.mimetype)) {
      return next(
        ApiError.badRequest(
          `File "${file.originalname}" has an invalid or corrupted content. Upload rejected.`
        )
      );
    }
  }
  next();
};

/**
 * Convert a multer error into an ApiError before passing to Express error handler.
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest('File is too large. Check the size limit for this upload.'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(ApiError.badRequest('Too many files uploaded at once.'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(ApiError.badRequest(`Unexpected field "${err.field}". Check the field name.`));
    }
    return next(ApiError.badRequest(`Upload error: ${err.message}`));
  }
  // Pass ApiErrors (from file filter) directly through
  next(err);
};

// ─── Allowed mime type sets ────────────────────────────────────────────────
const IMAGE_MIMETYPES    = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DOCUMENT_MIMETYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// ─── 1. uploadAvatar ──────────────────────────────────────────────────────────
const _avatarMulter = multer({
  storage:  memoryStorage,
  limits:   { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: buildImageFilter(IMAGE_MIMETYPES)
});

const uploadAvatar = [
  (req, res, next) => _avatarMulter.single('avatar')(req, res, (err) => handleMulterError(err, req, res, next)),
  validateMagicBytesMiddleware(IMAGE_MIMETYPES)
];

// ─── 2. uploadGallery ─────────────────────────────────────────────────────────
const _galleryMulter = multer({
  storage:  memoryStorage,
  limits:   { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: buildImageFilter(IMAGE_MIMETYPES)
});

const uploadGallery = [
  (req, res, next) => _galleryMulter.array('gallery', 6)(req, res, (err) => handleMulterError(err, req, res, next)),
  validateMagicBytesMiddleware(IMAGE_MIMETYPES)
];

// ─── 3. uploadDocument ────────────────────────────────────────────────────────
const _documentFilter = (req, file, cb) => {
  if (!DOCUMENT_MIMETYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Invalid file type "${file.mimetype}". Allowed: JPEG, PNG, PDF`
      ),
      false
    );
  }
  cb(null, true);
};

const _documentMulter = multer({
  storage:    memoryStorage,
  limits:     { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: _documentFilter
});

const uploadDocument = [
  (req, res, next) => _documentMulter.single('document')(req, res, (err) => handleMulterError(err, req, res, next)),
  (req, res, next) => {
    // PDFs skip magic-byte image checks
    if (req.file && req.file.mimetype !== 'application/pdf') {
      return validateMagicBytesMiddleware(['image/jpeg', 'image/png'])(req, res, next);
    }
    // Minimal PDF magic check: starts with %PDF
    if (req.file && req.file.mimetype === 'application/pdf') {
      const pdfMagic = req.file.buffer.slice(0, 4).toString('ascii');
      if (pdfMagic !== '%PDF') {
        return next(ApiError.badRequest('File appears to be invalid or corrupted PDF.'));
      }
    }
    next();
  }
];

// ─── 4. uploadReviewImages ────────────────────────────────────────────────────
const _reviewMulter = multer({
  storage:    memoryStorage,
  limits:     { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: buildImageFilter(IMAGE_MIMETYPES)
});

const uploadReviewImages = [
  (req, res, next) => _reviewMulter.array('images', 3)(req, res, (err) => handleMulterError(err, req, res, next)),
  validateMagicBytesMiddleware(IMAGE_MIMETYPES)
];

module.exports = {
  uploadAvatar,
  uploadGallery,
  uploadDocument,
  uploadReviewImages,
  handleMulterError
};

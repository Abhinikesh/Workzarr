'use strict';

const express = require('express');
const ctrl    = require('../controllers/service.controller');
const { protect, providerOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// Public
router.get('/provider/:providerId', ctrl.getProviderServices);

// Provider only
router.post('/',           protect, providerOnly, ctrl.createService);
router.get('/mine',        protect, providerOnly, ctrl.getMyServices);
router.patch('/:id',       protect, providerOnly, ctrl.updateService);
router.patch('/:id/toggle',protect, providerOnly, ctrl.toggleServiceStatus);
router.delete('/:id',      protect, providerOnly, ctrl.deleteService);

module.exports = router;

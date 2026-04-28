const express = require('express');
const providerController = require('../../controllers/admin/provider.controller');
const router = express.Router();

router.get('/', providerController.getAllProviders);
router.get('/pending-verifications', providerController.getPendingVerifications);
router.get('/:providerId', providerController.getProviderById);
router.patch('/:providerId/verify', providerController.verifyProvider);
router.patch('/:providerId/document', providerController.verifyProviderDocument);
router.patch('/:providerId/feature', providerController.featureProvider);
router.patch('/:providerId/earnings', providerController.adjustProviderEarnings);

module.exports = router;

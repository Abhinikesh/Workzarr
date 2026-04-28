const express = require('express');
const settingsController = require('../../controllers/admin/settings.controller');
const router = express.Router();

router.get('/', settingsController.getPlatformSettings);
router.patch('/', settingsController.updatePlatformSettings);
router.patch('/maintenance', settingsController.toggleMaintenanceMode);

module.exports = router;

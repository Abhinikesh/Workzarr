const express = require('express');
const notificationController = require('../../controllers/admin/notification.controller');
const router = express.Router();

router.post('/broadcast', notificationController.sendBroadcastNotification);
router.get('/broadcast/history', notificationController.getBroadcastHistory);
router.delete('/broadcast/:id', notificationController.cancelScheduledBroadcast);
router.get('/stats', notificationController.getNotificationStats);

module.exports = router;

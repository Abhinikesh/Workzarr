const express = require('express');
const auditController = require('../../controllers/admin/audit.controller');
const router = express.Router();

router.get('/', auditController.getAuditLogs);
router.get('/summary', auditController.getAdminActivitySummary);

module.exports = router;

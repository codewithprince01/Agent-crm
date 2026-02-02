const express = require('express');
const router = express.Router();
const AuditLogController = require('../controllers/auditLogController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware, roles } = require('../middlewares/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware(roles.SUPER_ADMIN_ONLY), AuditLogController.getAllLogs);

router.get('/:id', authMiddleware, roleMiddleware(roles.SUPER_ADMIN_ONLY), AuditLogController.getLogById);

router.get(
  '/entity/:entity/:entityId',
  authMiddleware,
  roleMiddleware(roles.SUPER_ADMIN_ONLY),
  AuditLogController.getEntityLogs
);

module.exports = router;

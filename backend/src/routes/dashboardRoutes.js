const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware, roles } = require('../middlewares/roleMiddleware');

router.get('/admin', authMiddleware, roleMiddleware(roles.ALL_ADMINS), DashboardController.getAdminStats);

router.get('/agent', authMiddleware, roleMiddleware(roles.AGENT_ONLY), DashboardController.getAgentStats);

router.get('/student', authMiddleware, roleMiddleware(roles.STUDENT_ONLY), DashboardController.getStudentStats);

module.exports = router;

import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';
import * as citizenController from '../controllers/citizenController.js';

const router = express.Router();

// Middleware: All routes require authentication and 'citizen' or 'user' role
router.use(authMiddleware);
router.use(checkRole(['citizen', 'user']));

// Help Request Management
router.post('/request', citizenController.createHelpRequest);
router.get('/requests', citizenController.getMyRequests);
router.get('/request/:requestId', citizenController.getRequestDetails);
router.delete('/request/:requestId', citizenController.deleteRequest);

// View Organizer Events
router.get('/events', citizenController.getAllEvents);

// Notifications
router.get('/notifications', citizenController.getNotifications);

// Help Request Analytics (Citizen Only)
router.get('/analytics/help-requests', citizenController.getHelpRequestAnalytics);

export default router;

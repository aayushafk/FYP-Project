import express from 'express';
import User from '../models/User.js';
import Request from '../models/Request.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Middleware: All routes require authentication and 'admin' role
router.use(authMiddleware);
router.use(checkRole('admin'));

// GET /api/admin/pending-organizers – List all organizers pending verification
router.get('/pending-organizers', async (req, res) => {
    try {
        const organizers = await User.find({
            role: 'organizer',
            isAdminVerified: false
        }).select('-password').sort({ createdAt: -1 });
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending organizers', error: error.message });
    }
});

// GET /api/admin/users – List all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// PATCH /api/admin/verify/:id – General Verify or Suspend
router.patch('/verify/:id', async (req, res) => {
    try {
        const { isVerified } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isVerified = isVerified;
        await user.save();
        res.json({ message: `User status updated to ${isVerified}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status', error: error.message });
    }
});

// GET /api/admin/metrics – Return platform stats
router.get('/metrics', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRequests = await Request.countDocuments();
        const completedRequests = await Request.countDocuments({ status: 'Completed' });
        const totalEvents = await Event.countDocuments();
        const activeVolunteers = await User.countDocuments({ role: 'volunteer' });

        res.json({
            totalUsers,
            totalRequests,
            completedRequests,
            totalEvents,
            activeVolunteers
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching metrics', error: error.message });
    }
});

// GET /api/admin/notifications - Get notifications for admin
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

// PATCH /api/admin/verify-organizer/:id - Verify organizer and send message
router.patch('/verify-organizer/:id', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'organizer' });
        if (!user) return res.status(404).json({ message: 'Organizer not found' });

        user.isAdminVerified = true;
        await user.save();

        // Notify organizer
        await Notification.create({
            user: user._id,
            type: 'event_verification',
            message: 'You can now create and manage events. Your account has been verified by an administrator.',
            relatedId: req.user._id
        });

        res.json({ message: 'Organizer verified and notified successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying organizer', error: error.message });
    }
});

// GET /api/admin/organizer-activity/:organizerId - View all activities by a specific organizer
router.get('/organizer-activity/:organizerId', async (req, res) => {
    try {
        const events = await Event.find({ createdBy: req.params.organizerId });
        const requests = await Request.find({ createdBy: req.params.organizerId });

        res.json({
            events,
            requests
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching organizer activity', error: error.message });
    }
});

export default router;

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

// GET /api/admin/analytics/help-requests - Get system-wide help request analytics
router.get('/analytics/help-requests', async (req, res) => {
    try {
        // Total requests
        const totalRequests = await Request.countDocuments();

        // Requests by status
        const requestsByStatus = await Request.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Requests by category
        const requestsByCategory = await Request.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Requests by location (group by location string)
        const requestsByLocation = await Request.aggregate([
            { 
                $group: { 
                    _id: '$location', 
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { count: -1 } },
            { $limit: 10 } // Top 10 locations
        ]);

        // Active volunteers (volunteers who have been assigned to requests)
        const activeVolunteers = await Request.distinct('assignedTo', { assignedTo: { $ne: null } });

        // Average completion time (for completed requests)
        const completedRequests = await Request.find({ 
            status: 'Completed',
            createdAt: { $exists: true }
        }).select('createdAt updatedAt');

        let avgCompletionTime = 0;
        if (completedRequests.length > 0) {
            const totalTime = completedRequests.reduce((sum, req) => {
                const completionTime = new Date(req.updatedAt) - new Date(req.createdAt);
                return sum + completionTime;
            }, 0);
            avgCompletionTime = Math.round(totalTime / completedRequests.length / (1000 * 60 * 60)); // Convert to hours
        }

        // Monthly growth (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyGrowth = await Request.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: sixMonthsAgo } 
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            totalRequests,
            requestsByStatus: requestsByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            requestsByCategory: requestsByCategory.map(item => ({
                category: item._id,
                count: item.count
            })),
            requestsByLocation: requestsByLocation.map(item => ({
                location: item._id || 'Unknown',
                count: item.count
            })),
            activeVolunteersCount: activeVolunteers.length,
            avgCompletionTimeHours: avgCompletionTime,
            monthlyGrowth: monthlyGrowth.map(item => ({
                year: item._id.year,
                month: item._id.month,
                count: item.count,
                label: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
            }))
        });
    } catch (error) {
        console.error('Error fetching admin analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
});

// PATCH /api/admin/disable-user/:id – Toggle disable/enable a user account
router.patch('/disable-user/:id', async (req, res) => {
    try {
        const { isDisabled } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot disable admin accounts' });

        user.isDisabled = isDisabled;
        await user.save();

        await Notification.create({
            user: user._id,
            type: 'account_status',
            message: isDisabled
                ? 'Your account has been disabled by an administrator. Contact support if you believe this is a mistake.'
                : 'Your account has been re-enabled by an administrator.',
            relatedId: req.user._id
        });

        res.json({ message: `Account ${isDisabled ? 'disabled' : 'enabled'} successfully`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating account status', error: error.message });
    }
});

// PATCH /api/admin/reject-organizer/:id – Reject a pending organizer application
router.patch('/reject-organizer/:id', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'organizer' });
        if (!user) return res.status(404).json({ message: 'Organizer not found' });

        // Mark as rejected by disabling their account (they were never approved)
        user.isDisabled = true;
        await user.save();

        await Notification.create({
            user: user._id,
            type: 'account_status',
            message: 'Your organizer application has been reviewed and was not approved at this time.',
            relatedId: req.user._id
        });

        res.json({ message: 'Organizer application rejected', user });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting organizer', error: error.message });
    }
});

// GET /api/admin/volunteer-ratings/:volunteerId – Get all ratings for a volunteer
router.get('/volunteer-ratings/:volunteerId', async (req, res) => {
    try {
        const { volunteerId } = req.params;
        const mongoose = require('mongoose');

        // Find all events where this volunteer has ratings in their assignments
        const events = await Event.aggregate([
            {
                $match: {
                    'volunteerAssignments.volunteerId': new mongoose.Types.ObjectId(volunteerId),
                    'volunteerAssignments.status': 'Completed'
                }
            },
            {
                $unwind: '$volunteerAssignments'
            },
            {
                $match: {
                    'volunteerAssignments.volunteerId': new mongoose.Types.ObjectId(volunteerId),
                    'volunteerAssignments.status': 'Completed'
                }
            },
            {
                $project: {
                    eventTitle: '$title',
                    eventId: '$_id',
                    ratings: '$volunteerAssignments.ratings',
                    completedAt: '$volunteerAssignments.completedAt'
                }
            },
            {
                $unwind: {
                    path: '$ratings',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'ratings.ratedBy',
                    foreignField: '_id',
                    as: 'ratedByUser'
                }
            },
            {
                $sort: { completedAt: -1 }
            }
        ]);

        res.json(events);
    } catch (error) {
        console.error('Error fetching volunteer ratings:', error);
        res.status(500).json({ message: 'Error fetching volunteer ratings', error: error.message });
    }
});

export default router;

import express from 'express';
import Event from '../models/Event.js';
import Request from '../models/Request.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import EventMessage from '../models/EventMessage.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';
import { notifyVolunteersBySkills, getSkillAnalytics } from '../services/skillService.js';
import { validateSkills } from '../utils/skills.js';
import * as organizerController from '../controllers/organizerController.js';

const router = express.Router();

// Middleware: All routes require authentication and 'organizer' role
router.use(authMiddleware);
router.use(checkRole('organizer'));

// Helper: check if organizer is verified by admin
const isVerified = (req, res, next) => {
    if (!req.user.isAdminVerified) {
        return res.status(403).json({
            message: 'Access denied. Your account is pending administrator verification.'
        });
    }
    next();
};

// New controller-based routes
router.get('/my-events', isVerified, organizerController.getMyEvents);
router.get('/event/:eventId/details', isVerified, organizerController.getEventDetails);
router.put('/event/:eventId/update', isVerified, organizerController.updateEvent);
router.get('/help-requests', isVerified, organizerController.getAllRequests);

// POST /api/organizer/event – Create a new event
router.post('/event', isVerified, async (req, res) => {
    try {
        console.log('Received event creation request with body:', req.body);
        console.log('startDateTime:', req.body.startDateTime);
        console.log('endDateTime:', req.body.endDateTime);
        console.log('location:', req.body.location);

        // Validate required skills if provided
        if (req.body.requiredSkills && Array.isArray(req.body.requiredSkills)) {
            if (req.body.requiredSkills.length > 0 && !validateSkills(req.body.requiredSkills, 'volunteer')) {
                return res.status(400).json({ 
                    message: 'Some skills are invalid',
                    providedSkills: req.body.requiredSkills
                });
            }
        }

        // Prepare event data - let Mongoose handle datetime conversion
        const eventData = {
            title: req.body.title,
            description: req.body.description,
            startDateTime: req.body.startDateTime,
            endDateTime: req.body.endDateTime,
            location: req.body.location,
            organizer: req.user._id,
            createdBy: req.user._id,
            contactInfo: req.body.contactInfo || '',
            requiredSkills: req.body.requiredSkills || [],
            volunteersNeeded: req.body.volunteersNeeded || 0
        };

        console.log('Creating event with data:', eventData);

        const newEvent = new Event(eventData);
        const savedEvent = await newEvent.save();

        console.log('Event saved to database:', savedEvent);
        console.log('Saved event _id:', savedEvent._id);
        console.log('Saved event startDateTime:', savedEvent.startDateTime);
        console.log('Saved event location:', savedEvent.location);

        // Notify all citizens about the new event
        try {
            const citizens = await User.find({ role: { $in: ['citizen', 'user'] } }).select('_id');
            if (citizens.length > 0) {
                const citizenNotifications = citizens.map(citizen => ({
                    user: citizen._id,
                    type: 'new_event_created',
                    message: `New event "${savedEvent.title}" has been created! Check it out and join the conversation.`,
                    relatedId: savedEvent._id,
                    relatedType: 'Event'
                }));
                await Notification.insertMany(citizenNotifications);
                console.log(`Notified ${citizens.length} citizens about new event`);
            }
        } catch (citizenNotifyError) {
            console.error('Error notifying citizens:', citizenNotifyError);
        }

        // Send skill-based notifications to volunteers
        if (savedEvent.requiredSkills && savedEvent.requiredSkills.length > 0) {
            try {
                const notifications = await notifyVolunteersBySkills(savedEvent);
                return res.status(201).json({
                    event: savedEvent,
                    notificationsSent: notifications.length,
                    message: `Event created and ${notifications.length} volunteers notified based on skills`
                });
            } catch (notificationError) {
                console.error('Error sending notifications:', notificationError);
                return res.status(201).json({
                    event: savedEvent,
                    message: 'Event created but skill notifications could not be sent'
                });
            }
        } else {
            return res.status(201).json({ event: savedEvent });
        }
    } catch (error) {
        console.error('Error creating event:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's a Mongoose validation error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error',
                details: messages,
                error: error.message 
            });
        }
        
        res.status(400).json({ 
            message: 'Error creating event', 
            error: error.message,
            details: error.errors || {}
        });
    }
});

// GET /api/organizer/events – List all events created by the organizer
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});

// GET /api/organizer/requests – View all community help requests
router.get('/requests', async (req, res) => {
    try {
        const requests = await Request.find().populate('createdBy', 'fullName email').sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
});

// PUT /api/organizer/assign/:requestId – Assign volunteer to a request
router.put('/assign/:requestId', isVerified, async (req, res) => {
    try {
        const { volunteerId } = req.body;
        const request = await Request.findById(req.params.requestId);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        const volunteer = await User.findOne({ _id: volunteerId, role: 'volunteer' });
        if (!volunteer) return res.status(400).json({ message: 'Invalid volunteer ID' });

        request.assignedTo = volunteerId;
        request.status = 'Assigned';
        await request.save();

        res.json({ message: 'Volunteer assigned successfully', request });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning volunteer', error: error.message });
    }
});

// GET /api/organizer/volunteers – List volunteers with filtering by skill
router.get('/volunteers', async (req, res) => {
    try {
        const { skill } = req.query;
        let query = { role: 'volunteer' };

        if (skill) {
            query.skills = { $in: [new RegExp(skill, 'i')] };
        }

        const volunteers = await User.find(query).select('fullName email skills phoneNumber');
        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching volunteers', error: error.message });
    }
});

// GET /api/organizer/skill-analytics – Get skill usage analytics
router.get('/skill-analytics', async (req, res) => {
    try {
        const analytics = await getSkillAnalytics(req.user._id);
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching skill analytics', error: error.message });
    }
});

// PATCH /api/organizer/event/:eventId - Update event details or status
router.patch('/event/:eventId', isVerified, async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, createdBy: req.user._id });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        Object.assign(event, req.body);
        await event.save();
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: 'Error updating event', error: error.message });
    }
});

// DELETE /api/organizer/event/:eventId – Delete an event created by organizer
router.delete('/event/:eventId', isVerified, async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Verify that the organizer owns this event
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete events you created' });
        }

        // Delete the event
        await Event.findByIdAndDelete(req.params.eventId);

        // Delete associated event chat messages
        await EventMessage.deleteMany({ eventId: req.params.eventId });

        // Delete associated notifications (for volunteers and citizens)
        await Notification.deleteMany({
            relatedId: req.params.eventId,
            relatedType: 'Event'
        });

        res.json({ 
            message: 'Event deleted successfully',
            eventId: req.params.eventId 
        });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting event', error: error.message });
    }
});

// GET /api/organizer/events/:eventId - Get specific event details created by organizer
router.get('/events/:eventId', isVerified, async (req, res) => {
    try {
        const event = await Event.findOne({ 
            _id: req.params.eventId, 
            createdBy: req.user._id 
        })
            .populate('organizer', 'fullName email phoneNumber organizationName')
            .populate('createdBy', 'fullName email phoneNumber organizationName')
            .populate('assignedVolunteers', 'fullName email skills phoneNumber');

        if (!event) {
            return res.status(404).json({ 
                message: 'Event not found or you do not have permission to view it' 
            });
        }

        res.json({ event });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ 
            message: 'Error fetching event details', 
            error: error.message 
        });
    }
});

export default router;

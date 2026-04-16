import express from 'express';
import Request from '../models/Request.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';
import { 
    getSkillMatchedEvents, 
    getSkillMatchedRequests,
    notifyVolunteersByRequestSkills 
} from '../services/skillService.js';
import { VOLUNTEER_SKILLS, validateSkills } from '../uploads/utils/skills.js';
import * as volunteerController from '../controllers/volunteerController.js';

const router = express.Router();

// Public route: GET /api/volunteer/search?skills=skill1,skill2 – Search volunteers by skills
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { skills } = req.query;

        if (!skills) {
            return res.status(400).json({ message: 'Skills query parameter is required' });
        }

        // Parse skills from comma-separated string
        const skillsArray = skills.split(',').map(s => s.trim());

        // Find volunteers with any of the required skills
        const volunteers = await User.find({
            role: 'volunteer',
            skills: { $in: skillsArray }
        }).select('-password').sort({ createdAt: -1 });

        // Return volunteers grouped by matching skills
        const volunteersWithMatches = volunteers.map(volunteer => {
            const matchingSkills = volunteer.skills.filter(s => skillsArray.includes(s));
            return {
                ...volunteer.toObject(),
                matchingSkills,
                matchCount: matchingSkills.length
            };
        }).sort((a, b) => b.matchCount - a.matchCount);

        res.json({
            searchedSkills: skillsArray,
            totalMatches: volunteersWithMatches.length,
            volunteers: volunteersWithMatches
        });
    } catch (error) {
        res.status(500).json({ message: 'Error searching volunteers', error: error.message });
    }
});

// Middleware: All routes below require authentication and 'volunteer' role
router.use(authMiddleware);
router.use(checkRole('volunteer'));

// Core volunteer event management (using controllers)
router.get('/available-events', volunteerController.getAvailableEvents);
router.post('/event/:eventId/accept', volunteerController.acceptEvent);
router.post('/event/:eventId/decline', volunteerController.declineEvent);
router.put('/event/:eventId/status', volunteerController.updateEventStatus);
router.get('/my-events', volunteerController.getMyAssignedEvents);

// GET /api/volunteer/skills – Get available volunteer skills list
router.get('/skills/available', async (req, res) => {
    try {
        res.json({
            availableSkills: VOLUNTEER_SKILLS,
            totalSkills: VOLUNTEER_SKILLS.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching skills', error: error.message });
    }
});

// GET /api/volunteer/profile/ratings – Get volunteer's rating summary
router.get('/profile/ratings', authMiddleware, async (req, res) => {
    try {
        const volunteerId = req.user._id;

        // Find all events where this volunteer participated
        const events = await Event.find({
            'volunteerAssignments.volunteerId': volunteerId
        })
        .populate('volunteerAssignments.ratings.ratedBy', 'fullName role')
        .select('title volunteerAssignments');

        // Extract all ratings for this volunteer from all events
        let allRatings = [];
        
        events.forEach(event => {
            const volunteerAssignment = event.volunteerAssignments.find(
                va => va.volunteerId.toString() === volunteerId.toString()
            );
            
            if (volunteerAssignment && volunteerAssignment.ratings && volunteerAssignment.ratings.length > 0) {
                volunteerAssignment.ratings.forEach(rating => {
                    allRatings.push({
                        stars: rating.rating,
                        comment: rating.feedback,
                        raterRole: rating.role,
                        eventTitle: event.title,
                        createdAt: rating.createdAt
                    });
                });
            }
        });

        // Calculate aggregations
        const ratingCount = allRatings.length;
        const avgRating = ratingCount > 0
            ? (allRatings.reduce((sum, r) => sum + r.stars, 0) / ratingCount).toFixed(1)
            : 0;

        // Rating breakdown
        const ratingBreakdown = {
            5: allRatings.filter(r => r.stars === 5).length,
            4: allRatings.filter(r => r.stars === 4).length,
            3: allRatings.filter(r => r.stars === 3).length,
            2: allRatings.filter(r => r.stars === 2).length,
            1: allRatings.filter(r => r.stars === 1).length
        };

        // Recent feedback (last 3)
        const recentFeedback = allRatings
            .filter(r => r.comment && r.comment.trim().length > 0)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .map(r => ({
                stars: r.stars,
                comment: r.comment,
                raterRole: r.raterRole,
                eventTitle: r.eventTitle || 'Event',
                createdAt: r.createdAt
            }));

        res.json({
            avgRating: parseFloat(avgRating),
            ratingCount,
            ratingBreakdown,
            recentFeedback
        });
    } catch (error) {
        console.error('Error fetching volunteer ratings:', error);
        res.status(500).json({ message: 'Error fetching ratings', error: error.message });
    }
});

// GET /api/volunteer/profile/skills – Get user's current skills
router.get('/profile/skills', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('skills fullName role');
        res.json({
            fullName: user.fullName,
            role: user.role,
            skills: user.skills,
            skillCount: user.skills.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching skills', error: error.message });
    }
});

// PUT /api/volunteer/profile/skills – Update user's skills
router.put('/profile/skills', async (req, res) => {
    try {
        const { skills } = req.body;

        if (!Array.isArray(skills)) {
            return res.status(400).json({ message: 'Skills must be an array' });
        }

        // Validate skills
        if (!validateSkills(skills, 'volunteer')) {
            return res.status(400).json({ 
                message: 'Invalid skills provided',
                validSkills: VOLUNTEER_SKILLS
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { skills: skills },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'Skills updated successfully',
            skills: user.skills
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating skills', error: error.message });
    }
});

// PUT /api/volunteer/profile – Update entire volunteer profile
router.put('/profile', async (req, res) => {
    try {
        const { skills, phoneNumber } = req.body;
        const updateData = {};

        if (skills) {
            if (!Array.isArray(skills)) {
                return res.status(400).json({ message: 'Skills must be an array' });
            }
            if (!validateSkills(skills, 'volunteer')) {
                return res.status(400).json({ 
                    message: 'Invalid skills provided'
                });
            }
            updateData.skills = skills;
        }

        if (phoneNumber) {
            updateData.phoneNumber = phoneNumber;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user: user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

// GET /api/volunteer/skill-matched-events – Get events matching volunteer skills
router.get('/skill-matched-events', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const status = req.query.status || 'upcoming';

        const result = await getSkillMatchedEvents(req.user._id, { limit, offset, status });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching skill-matched events', error: error.message });
    }
});

// GET /api/volunteer/events – Get all available events
router.get('/events', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const status = req.query.status || 'upcoming';

        const events = await Event.find({ status: status })
            .populate('organizer', 'fullName organizationName')
            .sort({ startDateTime: -1 })
            .limit(limit)
            .skip(offset);

        const total = await Event.countDocuments({ status: status });

        res.json({
            total,
            limit,
            offset,
            events: events
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});

// GET /api/volunteer/skill-matched-requests – Get requests matching volunteer skills
router.get('/skill-matched-requests', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const category = req.query.category || null;

        const result = await getSkillMatchedRequests(req.user._id, { limit, offset, category });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching skill-matched requests', error: error.message });
    }
});

// GET /api/volunteer/skill-notifications – Get unread skill-matched notifications
router.get('/skill-notifications', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const notifications = await Notification.find({
            user: req.user._id,
            type: { $in: ['skill_matched_event', 'skill_matched_request'] },
            read: false
        })
            .populate('relatedId')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(offset);

        const total = await Notification.countDocuments({
            user: req.user._id,
            type: { $in: ['skill_matched_event', 'skill_matched_request'] },
            read: false
        });

        res.json({
            total,
            limit,
            offset,
            notifications
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

// POST /api/volunteer/skill-notifications/:notificationId/mark-read – Mark notification as read
router.post('/skill-notifications/:notificationId/mark-read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.notificationId,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
});

// GET /api/volunteer/assignments – Get accepted requests
router.get('/assignments', async (req, res) => {
    try {
        const assignments = await Request.find({
            assignedTo: req.user._id,
            status: { $in: ['Assigned', 'In Progress'] }
        }).sort({ updatedAt: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assignments', error: error.message });
    }
});

// GET /api/volunteer/matches – Skill-based matching
router.get('/matches', async (req, res) => {
    try {
        const userSkills = req.user.skills;
        const matches = await Request.find({
            requiredSkills: { $in: userSkills },
            assignedTo: null,
            status: 'Pending'
        }).sort({ createdAt: -1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: 'Error matching requests', error: error.message });
    }
});

// POST /api/volunteer/accept/:id – Accept a task
router.post('/accept/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.assignedTo) {
            return res.status(400).json({ message: 'Request already assigned' });
        }

        request.assignedTo = req.user._id;
        request.status = 'Assigned';
        await request.save();

        res.json({ message: 'Request accepted successfully', request });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting request', error: error.message });
    }
});

// POST /api/volunteer/complete/:id – Mark as complete
router.post('/complete/:id', async (req, res) => {
    try {
        const request = await Request.findOne({ _id: req.params.id, assignedTo: req.user._id });

        if (!request) {
            return res.status(404).json({ message: 'Request not found or not assigned to you' });
        }

        request.status = 'Completed';
        await request.save();

        res.json({ message: 'Request marked as completed', request });
    } catch (error) {
        res.status(500).json({ message: 'Error completing request', error: error.message });
    }
});

// POST /api/volunteer/event/:eventId/request – Request to join an event
router.post('/event/:eventId/request', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if volunteer already has this event
        if (event.assignedVolunteers.includes(req.user._id)) {
            return res.status(400).json({ message: 'You have already joined this event' });
        }

        const volunteer = await User.findById(req.user._id);

        // Skill validation
        const skillValidation = validateEventJoin(event, volunteer);
        
        if (!skillValidation.canJoin) {
            return res.status(400).json({ 
                message: skillValidation.message,
                requiredSkills: event.requiredSkills,
                volunteerSkills: volunteer.skills,
                skillGap: skillValidation.skillGap
            });
        }

        // Add volunteer to assigned volunteers
        event.assignedVolunteers.push(req.user._id);
        await event.save();

        // Create notification for organizer
        await Notification.create({
            user: event.organizer,
            type: 'volunteer_joined_event',
            relatedId: event._id,
            relatedType: 'Event',
            message: `${volunteer.fullName} has requested to join your event "${event.title}"`,
            metadata: {
                volunteerId: req.user._id,
                volunteerName: volunteer.fullName,
                volunteerSkills: volunteer.skills
            }
        });

        res.status(200).json({
            message: 'Successfully joined the event',
            event: event,
            skillMatch: skillValidation
        });
    } catch (error) {
        res.status(500).json({ message: 'Error joining event', error: error.message });
    }
});

// GET /api/volunteer/events/:eventId – Get specific event with skill match info
router.get('/events/:eventId', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId)
            .populate('organizer', 'fullName organizationName email phoneNumber')
            .populate('createdBy', 'fullName organizationName email phoneNumber')
            .populate('assignedVolunteers', 'fullName email skills phoneNumber');
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // BACKWARD COMPATIBILITY: Ensure all volunteers have status
        let eventData = event.toObject();
        if (eventData.volunteerAssignments && eventData.volunteerAssignments.length > 0) {
            eventData.volunteerAssignments = eventData.volunteerAssignments.map(assignment => {
                if (!assignment.status) {
                    assignment.status = eventData.trackingStatus || 'Assigned';
                }
                return assignment;
            });
        }

        let skillMatch = null;
        let hasJoined = false;
        
        if (req.user) {
            try {
                const volunteer = await User.findById(req.user._id);
                if (volunteer) {
                    skillMatch = validateEventJoin(event, volunteer);
                    hasJoined = event.assignedVolunteers.some(v => 
                        v._id.toString() === req.user._id.toString()
                    );
                }
            } catch (userError) {
                console.error('Error validating user skills:', userError);
            }
        }

        res.json({
            event: eventData,
            skillMatch: skillMatch,
            hasJoined: hasJoined
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
});

// GET /api/volunteer/my-events – Get events volunteer has joined
router.get('/my-events', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const status = req.query.status || 'upcoming';

        const events = await Event.find({
            assignedVolunteers: req.user._id,
            status: status
        })
            .populate('organizer', 'fullName organizationName')
            .sort({ startDateTime: -1 })
            .limit(limit)
            .skip(offset);

        const total = await Event.countDocuments({
            assignedVolunteers: req.user._id,
            status: status
        });

        res.json({
            total,
            limit,
            offset,
            events
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});

// Helper function to validate if a volunteer can join an event
const normalizeSkill = (skill = '') => (
    typeof skill === 'string' ? skill.trim().toLowerCase() : ''
);

const normalizeSkillList = (skills = []) => (
    Array.isArray(skills)
        ? skills.filter((skill) => typeof skill === 'string' && skill.trim().length > 0).map((skill) => skill.trim())
        : []
);

const hasGeneralSupportSkill = (skills = []) => (
    normalizeSkillList(skills).some((skill) => normalizeSkill(skill) === 'general support')
);

const getMatchedSkills = (requiredSkills = [], volunteerSkills = []) => {
    const normalizedVolunteerSkills = new Set(normalizeSkillList(volunteerSkills).map(normalizeSkill));

    return normalizeSkillList(requiredSkills).filter(
        (requiredSkill) => normalizedVolunteerSkills.has(normalizeSkill(requiredSkill))
    );
};

const validateEventJoin = (event, volunteer) => {
    const requiredSkills = normalizeSkillList(event.requiredSkills);
    const volunteerSkills = normalizeSkillList(volunteer.skills);

    if (requiredSkills.length === 0) {
        return {
            canJoin: true,
            message: 'This event has no specific skill requirements',
            skillMatch: 100,
            isOpenToAll: true,
            matchedSkills: []
        };
    }

    // If "General Support" is in required skills, anyone can join
    const eventHasGeneralSupport = hasGeneralSupportSkill(requiredSkills);
    const volunteerHasGeneralSupport = hasGeneralSupportSkill(volunteerSkills);

    if (eventHasGeneralSupport || volunteerHasGeneralSupport) {
        return {
            canJoin: true,
            message: 'This event is open to all volunteers (General Support)',
            skillMatch: 100,
            isOpenToAll: true,
            matchedSkills: ['General Support']
        };
    }

    // Check for skill matches
    const matchedSkills = getMatchedSkills(requiredSkills, volunteerSkills);

    const skillMatch = requiredSkills.length > 0
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 0;

    if (matchedSkills.length > 0) {
        return {
            canJoin: true,
            message: `You have ${matchedSkills.length} of ${requiredSkills.length} required skills`,
            skillMatch,
            isOpenToAll: false,
            matchedSkills,
            skillGap: requiredSkills.filter(skill => !matchedSkills.includes(skill))
        };
    }

    return {
        canJoin: false,
        message: `You don't have the required skills for this event. Required: ${requiredSkills.join(', ')}`,
        skillMatch: 0,
        isOpenToAll: false,
        matchedSkills: [],
        skillGap: requiredSkills
    };
};

// POST /api/volunteer/join-event/:eventId – Join an event (alias endpoint)
router.post('/join-event/:eventId', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if volunteer already has this event
        if (event.assignedVolunteers && event.assignedVolunteers.some(v => v.toString() === req.user._id.toString())) {
            return res.status(400).json({ message: 'You have already joined this event' });
        }

        const volunteer = await User.findById(req.user._id);

        // Skill validation - but allow if no skills required (General Support)
        if (event.requiredSkills && event.requiredSkills.length > 0) {
            const requiredSkills = normalizeSkillList(event.requiredSkills);
            const volunteerSkills = normalizeSkillList(volunteer.skills);

            const hasGeneralSupport = hasGeneralSupportSkill(requiredSkills);
            const volunteerHasGeneralSupport = hasGeneralSupportSkill(volunteerSkills);
            const hasMatchingSkill = getMatchedSkills(requiredSkills, volunteerSkills).length > 0;
            
            if (!hasGeneralSupport && !volunteerHasGeneralSupport && !hasMatchingSkill) {
                return res.status(400).json({ 
                    message: 'You do not have the required skills for this event',
                    requiredSkills,
                    yourSkills: volunteerSkills
                });
            }
        }

        // Add volunteer to assigned volunteers if not already there
        if (!event.assignedVolunteers) {
            event.assignedVolunteers = [];
        }
        event.assignedVolunteers.push(req.user._id);
        await event.save();

        // Create notification for organizer
        await Notification.create({
            user: event.organizer,
            type: 'volunteer_joined_event',
            relatedId: event._id,
            relatedType: 'Event',
            message: `${volunteer.fullName} has joined your event "${event.title}"`,
            metadata: {
                volunteerId: req.user._id,
                volunteerName: volunteer.fullName,
                volunteerSkills: volunteer.skills || []
            }
        });

        res.status(200).json({
            message: 'Successfully joined the event',
            event: event
        });
    } catch (error) {
        res.status(500).json({ message: 'Error joining event', error: error.message });
    }
});

// GET /api/volunteer/notifications – Get all notifications for current volunteer
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate({
                path: 'relatedId',
                select: 'title description startDateTime endDateTime location volunteersNeeded requiredSkills organizer _id'
            })
            .sort({ createdAt: -1 });
        
        // Filter out notifications with undefined relatedId (in case reference was deleted)
        const validNotifications = notifications.filter(n => n.relatedId !== null);
        
        console.log(`Fetched ${notifications.length} notifications for user ${req.user._id}, ${validNotifications.length} with valid references`);
        
        res.json(validNotifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

// GET /api/volunteer/notifications/unread – Get unread notifications count
router.get('/notifications/unread/count', authMiddleware, async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({ 
            user: req.user._id,
            read: false 
        });
        
        res.json({ unreadCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unread count', error: error.message });
    }
});

// PUT /api/volunteer/notifications/:notificationId/read – Mark notification as read
router.put('/notifications/:notificationId/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.notificationId,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
});

// DELETE /api/volunteer/notifications/:notificationId – Delete/dismiss notification
router.delete('/notifications/:notificationId', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully', notification });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
});

// PATCH /api/volunteer/events/:eventId/status – Update event tracking status
router.patch('/events/:eventId/status', authMiddleware, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { newStatus } = req.body;
        const volunteerId = req.user._id;

        // Validate status value
        const validStatuses = ['Pending', 'Assigned', 'In Progress', 'Completed'];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({
                message: 'Invalid status',
                validStatuses
            });
        }

        // Find event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if volunteer is assigned to this event
        const isAssigned = event.assignedVolunteers?.includes(volunteerId) ||
                          event.assignedVolunteers?.some(v => v.toString() === volunteerId.toString()) ||
                          event.volunteerAssignments?.some(va => va.volunteerId?.toString() === volunteerId.toString());

        if (!isAssigned) {
            return res.status(403).json({
                message: 'You are not assigned to this event'
            });
        }

        // Find or create volunteer assignment
        let volunteerAssignment = event.volunteerAssignments?.find(
            va => va.volunteerId?.toString() === volunteerId.toString()
        );

        if (!volunteerAssignment) {
            if (!event.volunteerAssignments) {
                event.volunteerAssignments = [];
            }
            volunteerAssignment = {
                volunteerId,
                status: 'Assigned',
                assignedAt: new Date()
            };
            event.volunteerAssignments.push(volunteerAssignment);
            volunteerAssignment = event.volunteerAssignments[event.volunteerAssignments.length - 1];
        }

        const currentStatus = volunteerAssignment.status;

        // Validate status transition
        const validTransitions = {
            'Assigned': ['In Progress'],
            'In Progress': ['Completed'],
            'Pending': ['Assigned'],
            'Completed': [] // Can't transition from Completed
        };

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            return res.status(400).json({
                message: `Cannot transition from ${currentStatus} to ${newStatus}`,
                currentStatus,
                allowedTransitions: validTransitions[currentStatus]
            });
        }

        // Update status and timestamps
        volunteerAssignment.status = newStatus;

        if (newStatus === 'In Progress' && !volunteerAssignment.startedAt) {
            volunteerAssignment.startedAt = new Date();
        }

        if (newStatus === 'Completed' && !volunteerAssignment.completedAt) {
            volunteerAssignment.completedAt = new Date();
        }

        // Update the array in event
        const assignmentIndex = event.volunteerAssignments.findIndex(
            va => va.volunteerId?.toString() === volunteerId.toString()
        );
        if (assignmentIndex >= 0) {
            event.volunteerAssignments[assignmentIndex] = volunteerAssignment;
        }

        // Check if all volunteers completed
        const allCompleted = event.volunteerAssignments?.every(
            va => va.status === 'Completed'
        );
        if (allCompleted && newStatus === 'Completed') {
            event.trackingStatus = 'Completed';
        } else if (newStatus === 'In Progress') {
            event.trackingStatus = 'In Progress';
        } else if (newStatus === 'Assigned') {
            event.trackingStatus = 'Assigned';
        }

        // Save event
        await event.save();

        res.json({
            message: `Status updated to ${newStatus}`,
            event: {
                _id: event._id,
                title: event.title,
                trackingStatus: event.trackingStatus,
                volunteerAssignments: event.volunteerAssignments
            }
        });
    } catch (error) {
        console.error('Error updating event status:', error);
        res.status(500).json({
            message: 'Error updating status',
            error: error.message
        });
    }
});

export default router;


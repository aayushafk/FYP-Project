import express from 'express';
import Event from '../models/Event.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/events/:eventId - Get event details (accessible to all authenticated users)
 * This endpoint provides full event information including assigned volunteers
 */
router.get('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const event = await Event.findById(eventId)
      .populate('createdBy', 'fullName email organizationName')
      .populate('organizer', 'fullName email organizationName')
      .populate('assignedVolunteers', 'fullName email skills')
      .populate('volunteerAssignments.volunteerId', 'fullName email skills');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add additional context based on user role
    let eventData = event.toObject();

    // BACKWARD COMPATIBILITY: Ensure all volunteers have status
    // If any volunteer in volunteerAssignments is missing status, use event.trackingStatus as fallback
    if (eventData.volunteerAssignments && eventData.volunteerAssignments.length > 0) {
      eventData.volunteerAssignments = eventData.volunteerAssignments.map(assignment => {
        if (!assignment.status) {
          // Use event trackingStatus or default to 'Assigned'
          assignment.status = eventData.trackingStatus || 'Assigned';
        }
        return assignment;
      });
    }

    if (userRole === 'volunteer') {
      // Check if volunteer is assigned to this event
      const isAssigned = event.assignedVolunteers.some(v => v._id.toString() === userId.toString());
      eventData.isAssigned = isAssigned;
      
      // Calculate matching skills for the volunteer
      const volunteer = req.user;
      if (volunteer.skills) {
        const matchingSkills = event.requiredSkills.filter(skill => 
          volunteer.skills.includes(skill)
        );
        eventData.matchingSkills = matchingSkills;
        eventData.matchCount = matchingSkills.length;
      }
    }

    res.json({ event: eventData });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ 
      message: 'Error fetching event details', 
      error: error.message 
    });
  }
});

export default router;

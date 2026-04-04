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

/**
 * POST /api/events/:eventId/rate-volunteer - Rate a volunteer
 * Only citizens (event creator) and organizers can rate volunteers
 * Requires volunteer to have completed status
 */
router.post('/:eventId/rate-volunteer', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { volunteerId, rating, feedback } = req.body;
    const raterId = req.user._id;
    const raterRole = req.user.role;

    // Validate input
    if (!volunteerId || !rating || !feedback) {
      return res.status(400).json({ message: 'Volunteer ID, rating, and feedback are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (feedback.length < 10) {
      return res.status(400).json({ message: 'Feedback must be at least 10 characters long' });
    }

    // Only citizens and organizers can rate
    if (raterRole !== 'citizen' && raterRole !== 'organizer') {
      return res.status(403).json({ message: 'Only citizens and organizers can rate volunteers' });
    }

    // Fetch the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify rater is part of this event
    const isEventCreator = event.createdBy.toString() === raterId.toString();
    const isEventOrganizer = event.organizer && event.organizer.toString() === raterId.toString();
    
    if (!isEventCreator && !isEventOrganizer) {
      return res.status(403).json({ 
        message: 'You can only rate volunteers for events you created or organized' 
      });
    }

    // Find the volunteer assignment
    const volunteerAssignment = event.volunteerAssignments.find(
      va => va.volunteerId.toString() === volunteerId.toString()
    );

    if (!volunteerAssignment) {
      return res.status(404).json({ message: 'Volunteer not found in this event' });
    }

    // Check if volunteer has completed the event
    if (volunteerAssignment.status !== 'Completed') {
      return res.status(400).json({ 
        message: 'You can only rate volunteers who have completed the event' 
      });
    }

    // Initialize ratings array if it doesn't exist
    if (!volunteerAssignment.ratings) {
      volunteerAssignment.ratings = [];
    }

    // Check if rater has already rated this volunteer for this event
    const existingRating = volunteerAssignment.ratings.find(
      r => r.ratedBy.toString() === raterId.toString()
    );

    if (existingRating) {
      return res.status(400).json({ 
        message: 'You have already rated this volunteer for this event' 
      });
    }

    // Add the new rating
    volunteerAssignment.ratings.push({
      ratedBy: raterId,
      role: raterRole,
      rating: rating,
      feedback: feedback,
      createdAt: new Date()
    });

    await event.save();

    // Populate the updated event data
    const updatedEvent = await Event.findById(eventId)
      .populate('createdBy', 'fullName email organizationName')
      .populate('organizer', 'fullName email organizationName')
      .populate('assignedVolunteers', 'fullName email skills')
      .populate('volunteerAssignments.volunteerId', 'fullName email skills')
      .populate('volunteerAssignments.ratings.ratedBy', 'fullName role');

    res.json({ 
      message: 'Rating submitted successfully',
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Error rating volunteer:', error);
    res.status(500).json({ 
      message: 'Error submitting rating', 
      error: error.message 
    });
  }
});

export default router;

import Event from '../models/Event.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getSkillMatchedEvents } from '../services/skillService.js';

/**
 * Get all available events/requests for volunteers (skill-matched)
 */
export const getAvailableEvents = async (req, res) => {
  try {
    const volunteer = await User.findById(req.user._id);
    
    if (!volunteer || !volunteer.skills || volunteer.skills.length === 0) {
      return res.json({ events: [], message: 'No skills added yet. Please add your skills to see matching events.' });
    }

    // Get all events (both organizer and citizen types)
    const allEvents = await Event.find({
      status: { $ne: 'cancelled' }
    })
    .populate('organizer', 'fullName organizationName')
    .populate('createdBy', 'fullName email')
    .populate('assignedVolunteers', 'fullName skills')
    .sort({ createdAt: -1 });

    // ONLY show events that match volunteer's skills
    const matchedEvents = allEvents
      .map(event => {
        const matchingSkills = event.requiredSkills.filter(
          skill => volunteer.skills.includes(skill)
        );
        return {
          ...event.toObject(),
          matchingSkills,
          matchCount: matchingSkills.length,
          isMatched: matchingSkills.length > 0
        };
      })
      .filter(event => event.isMatched) // Only include matched events
      .sort((a, b) => b.matchCount - a.matchCount);

    res.json({ events: matchedEvents });
  } catch (error) {
    console.error('Error fetching available events:', error);
    res.status(500).json({ 
      message: 'Error fetching events', 
      error: error.message 
    });
  }
};

/**
 * Accept/Join an event or help request
 */
export const acceptEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if volunteer already has an assignment (either Accepted or Declined)
    const existingAssignmentIndex = event.volunteerAssignments.findIndex(
      a => a.volunteerId.toString() === req.user._id.toString()
    );

    if (existingAssignmentIndex !== -1) {
      const existingAssignment = event.volunteerAssignments[existingAssignmentIndex];
      
      // If already accepted, just return success (idempotent operation)
      if (existingAssignment.participationStatus === 'Accepted') {
        const populatedEvent = await Event.findById(eventId)
          .populate('createdBy', 'fullName email')
          .populate('organizer', 'fullName organizationName')
          .populate('assignedVolunteers', 'fullName email skills')
          .populate('volunteerAssignments.volunteerId', 'fullName email skills');

        return res.json({ 
          message: 'Already accepted event',
          event: populatedEvent
        });
      }
      
      // If previously declined, update to accepted
      event.volunteerAssignments[existingAssignmentIndex].participationStatus = 'Accepted';
      event.volunteerAssignments[existingAssignmentIndex].status = 'Assigned';
      event.volunteerAssignments[existingAssignmentIndex].assignedAt = new Date();
    } else {
      // Create new assignment
      event.volunteerAssignments.push({
        volunteerId: req.user._id,
        participationStatus: 'Accepted',
        status: 'Assigned',
        assignedAt: new Date()
      });
    }
    
    // Add volunteer to assignedVolunteers if not already there
    if (!event.assignedVolunteers.includes(req.user._id)) {
      event.assignedVolunteers.push(req.user._id);
    }
    
    // Update global status from Pending to Assigned if it was pending
    if (event.trackingStatus === 'Pending') {
      event.trackingStatus = 'Assigned';
    }

    await event.save();

    // Notify event creator
    const notificationMessage = event.type === 'citizen'
      ? `Volunteer ${req.user.fullName} accepted your help request "${event.title}"`
      : `Volunteer ${req.user.fullName} joined your event "${event.title}"`;

    await Notification.create({
      user: event.createdBy,
      type: 'volunteer_accepted',
      message: notificationMessage,
      relatedId: event._id,
      relatedType: 'Event'
    });

    // Populate the event data before sending response
    const populatedEvent = await Event.findById(eventId)
      .populate('createdBy', 'fullName email')
      .populate('organizer', 'fullName organizationName')
      .populate('assignedVolunteers', 'fullName email skills')
      .populate('volunteerAssignments.volunteerId', 'fullName email skills');

    res.json({ 
      message: 'Successfully accepted event',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error accepting event:', error);
    res.status(400).json({ 
      message: 'Error accepting event', 
      error: error.message 
    });
  }
};

/**
 * Decline an event or help request
 */
export const declineEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if volunteer already has an assignment
    const existingAssignmentIndex = event.volunteerAssignments.findIndex(
      a => a.volunteerId.toString() === req.user._id.toString()
    );

    if (existingAssignmentIndex !== -1) {
      const existingAssignment = event.volunteerAssignments[existingAssignmentIndex];
      
      // If already declined, return error
      if (existingAssignment.participationStatus === 'Declined') {
        return res.status(400).json({ message: 'You have already declined this event' });
      }
      
      // If previously accepted, update to declined and remove from assignedVolunteers
      event.volunteerAssignments[existingAssignmentIndex].participationStatus = 'Declined';
      event.volunteerAssignments[existingAssignmentIndex].status = 'Pending';
      event.assignedVolunteers = event.assignedVolunteers.filter(
        v => v.toString() !== req.user._id.toString()
      );
    } else {
      // Create new decline assignment
      event.volunteerAssignments.push({
        volunteerId: req.user._id,
        participationStatus: 'Declined',
        status: 'Pending',
        assignedAt: new Date()
      });
    }

    await event.save();

    // Populate the event data before sending response
    const populatedEvent = await Event.findById(eventId)
      .populate('createdBy', 'fullName email')
      .populate('organizer', 'fullName organizationName')
      .populate('assignedVolunteers', 'fullName email skills')
      .populate('volunteerAssignments.volunteerId', 'fullName email skills');

    res.json({ 
      message: 'Event declined',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error declining event:', error);
    res.status(400).json({ 
      message: 'Error declining event', 
      error: error.message 
    });
  }
};

/**
 * Update event status (only assigned volunteers can update)
 */
export const updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    // Validate status transition
    const validStatuses = ['Assigned', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be: Assigned, In Progress, or Completed' 
      });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if volunteer is assigned to this event
    if (!event.assignedVolunteers.includes(req.user._id)) {
      return res.status(403).json({ 
        message: 'You are not assigned to this event' 
      });
    }

    // Find volunteer's assignment
    const volunteerAssignment = event.volunteerAssignments.find(
      a => a.volunteerId.toString() === req.user._id.toString()
    );

    if (!volunteerAssignment) {
      return res.status(404).json({ message: 'Volunteer assignment not found' });
    }

    const currentStatus = volunteerAssignment.status;
    
    // Define status progression (cannot go backwards)
    const statusOrder = ['Assigned', 'In Progress', 'Completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(status);
    
    if (newIndex < currentIndex) {
      return res.status(400).json({ 
        message: `Cannot move status backwards from ${currentStatus} to ${status}` 
      });
    }
    
    if (currentStatus === 'Completed') {
      return res.status(400).json({ 
        message: 'Cannot update status once completed' 
      });
    }

    // Update individual volunteer status
    volunteerAssignment.status = status;
    
    if (status === 'In Progress' && !volunteerAssignment.startedAt) {
      volunteerAssignment.startedAt = new Date();
    }
    
    if (status === 'Completed' && !volunteerAssignment.completedAt) {
      volunteerAssignment.completedAt = new Date();
    }

    // Update global event tracking status
    // If any volunteer is "In Progress", event should be "In Progress"
    // If all volunteers are "Completed", event should be "Completed"
    const allStatuses = event.volunteerAssignments.map(a => a.status);
    const allCompleted = allStatuses.every(s => s === 'Completed');
    const anyInProgress = allStatuses.some(s => s === 'In Progress');
    
    if (allCompleted) {
      event.trackingStatus = 'Completed';
    } else if (anyInProgress || status === 'In Progress') {
      event.trackingStatus = 'In Progress';
    }
    
    await event.save();

    // Notify event creator
    await Notification.create({
      user: event.createdBy,
      type: 'status_updated',
      message: `Status updated to "${status}" for "${event.title}"`,
      relatedId: event._id,
      relatedType: 'Event'
    });

    const populatedEvent = await Event.findById(eventId)
      .populate('createdBy', 'fullName email')
      .populate('organizer', 'fullName organizationName')
      .populate('assignedVolunteers', 'fullName email skills')
      .populate('volunteerAssignments.volunteerId', 'fullName email skills');

    res.json({ 
      message: 'Status updated successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({ 
      message: 'Error updating status', 
      error: error.message 
    });
  }
};

/**
 * Get events the volunteer is assigned to
 */
export const getMyAssignedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      assignedVolunteers: req.user._id
    })
    .populate('createdBy', 'fullName email phoneNumber')
    .populate('organizer', 'fullName organizationName')
    .populate('assignedVolunteers', 'fullName skills')
    .sort({ createdAt: -1 });

    res.json({ events });
  } catch (error) {
    console.error('Error fetching assigned events:', error);
    res.status(500).json({ 
      message: 'Error fetching assigned events', 
      error: error.message 
    });
  }
};

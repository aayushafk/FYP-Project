import Event from '../models/Event.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getSkillMatchedEvents } from '../services/skillService.js';
import { getIo } from '../uploads/utils/socketManager.js';

const emitVolunteerStatusUpdate = ({ eventId, volunteerId, volunteerName, fromStatus, newStatus }) => {
  const io = getIo();
  if (!io) return;

  io.to(`event_${eventId}`).emit('volunteerStatusUpdated', {
    eventId: eventId.toString(),
    volunteerId: volunteerId.toString(),
    volunteerName,
    fromStatus,
    newStatus,
    timestamp: new Date(),
    message: newStatus === 'Completed'
      ? `${volunteerName} completed the task`
      : `${volunteerName} status updated to ${newStatus}`
  });
};

/**
 * Get all available events/requests for volunteers (skill-matched)
 */
export const getAvailableEvents = async (req, res) => {
  try {
    const volunteer = await User.findById(req.user._id);
    const volunteerSkills = Array.isArray(volunteer?.skills) ? volunteer.skills : [];

    // Get all events (both organizer and citizen types)
    const allEvents = await Event.find({
      status: { $ne: 'cancelled' }
    })
    .populate('organizer', 'fullName organizationName')
    .populate('createdBy', 'fullName email')
    .populate('assignedVolunteers', 'fullName skills')
    .sort({ createdAt: -1 });

    // Filter and match events based on volunteer's skills OR "General Support"
    const matchedEvents = allEvents
      .map(event => {
        const requiredSkills = Array.isArray(event.requiredSkills) ? event.requiredSkills.filter(Boolean) : [];

        // Check if event has "General Support" in required skills
        const hasGeneralSupport = requiredSkills.includes('General Support');
        
        // Check if volunteer's skills match event's required skills
        const matchingSkills = hasGeneralSupport
          ? ['General Support']
          : requiredSkills.filter(skill => volunteerSkills.includes(skill));
        
        // Event is matched if: has General Support OR has matching skills
        const isMatched = hasGeneralSupport || matchingSkills.length > 0;
        
        return {
          ...event.toObject(),
          matchingSkills,
          matchCount: hasGeneralSupport ? 1 : matchingSkills.length,
          isMatched: isMatched,
          hasGeneralSupport: hasGeneralSupport
        };
      })
      .filter(event => {
        // Only include matched events
        if (!event.isMatched) return false;
        
        // For citizen help requests, keep visible while active and not full.
        if (event.type === 'citizen') {
          if (event.trackingStatus === 'Completed') return false;

          if (event.volunteersNeeded > 0) {
            const assignedCount = Array.isArray(event.assignedVolunteers)
              ? event.assignedVolunteers.length
              : 0;
            if (assignedCount >= event.volunteersNeeded) return false;
          }

          return true;
        }
        
        // For organizer events, show if they match skills
        return true;
      })
      .filter(event => {
        // Exclude events where volunteer is already assigned
        const assignedVolunteerIds = event.assignedVolunteers.map(v => v._id ? v._id.toString() : v.toString());
        return !assignedVolunteerIds.includes(volunteer._id.toString());
      })
      .sort((a, b) => {
        // Sort by emergency first (emergency requests at top)
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        // Then by match count (better skill matches first)
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        // Finally by date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

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

    let previousAssignmentStatus = 'Pending';

    if (existingAssignmentIndex !== -1) {
      const existingAssignment = event.volunteerAssignments[existingAssignmentIndex];
      previousAssignmentStatus = existingAssignment.status || 'Pending';
      
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
      
      // Check volunteer limit before allowing previously declined volunteer to re-accept
      if (event.volunteersNeeded > 0 && event.assignedVolunteers.length >= event.volunteersNeeded) {
        return res.status(400).json({ 
          message: 'Volunteer limit reached. The required number of volunteers for this event is already full.'
        });
      }
      
      // If previously declined, update to accepted
      event.volunteerAssignments[existingAssignmentIndex].participationStatus = 'Accepted';
      event.volunteerAssignments[existingAssignmentIndex].status = 'Assigned';
      event.volunteerAssignments[existingAssignmentIndex].assignedAt = new Date();
    } else {
      // Check volunteer limit before creating new assignment
      if (event.volunteersNeeded > 0 && event.assignedVolunteers.length >= event.volunteersNeeded) {
        return res.status(400).json({ 
          message: 'Volunteer limit reached. The required number of volunteers for this event is already full.'
        });
      }
      
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

    emitVolunteerStatusUpdate({
      eventId: event._id,
      volunteerId: req.user._id,
      volunteerName: req.user.fullName,
      fromStatus: previousAssignmentStatus,
      newStatus: 'Assigned'
    });

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

    let previousAssignmentStatus = 'Assigned';

    if (existingAssignmentIndex !== -1) {
      const existingAssignment = event.volunteerAssignments[existingAssignmentIndex];
      previousAssignmentStatus = existingAssignment.status || 'Assigned';
      
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

    emitVolunteerStatusUpdate({
      eventId: event._id,
      volunteerId: req.user._id,
      volunteerName: req.user.fullName,
      fromStatus: previousAssignmentStatus,
      newStatus: 'Pending'
    });

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

    emitVolunteerStatusUpdate({
      eventId: event._id,
      volunteerId: req.user._id,
      volunteerName: req.user.fullName,
      fromStatus: currentStatus,
      newStatus: status
    });

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

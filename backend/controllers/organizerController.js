import Event from '../models/Event.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { notifyVolunteersBySkills } from '../services/skillService.js';
import { validateSkills } from '../uploads/utils/skills.js';

/**
 * Create a new event (organizer-created)
 */
export const createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category,
      location, 
      startDateTime, 
      endDateTime,
      requiredSkills,
      volunteersNeeded,
      contactInfo
    } = req.body;

    // Validate skills if provided
    if (requiredSkills && requiredSkills.length > 0) {
      if (!validateSkills(requiredSkills, 'volunteer')) {
        return res.status(400).json({ 
          message: 'Some skills are invalid',
          providedSkills: requiredSkills
        });
      }
    }

    // Create event with type 'organizer'
    const newEvent = new Event({
      title,
      description,
      category,
      location,
      startDateTime,
      endDateTime,
      type: 'organizer',
      organizer: req.user._id,
      createdBy: req.user._id,
      requiredSkills: requiredSkills || [],
      volunteersNeeded: volunteersNeeded || 0,
      contactInfo: contactInfo || '',
      trackingStatus: 'Pending',
      status: 'upcoming'
    });

    await newEvent.save();

    // Notify citizens about new event
    try {
      const citizens = await User.find({ role: 'citizen' }).select('_id');
      if (citizens.length > 0) {
        const citizenNotifications = citizens.map(citizen => ({
          user: citizen._id,
          type: 'new_event_created',
          message: `New event "${newEvent.title}" has been created!`,
          relatedId: newEvent._id,
          relatedType: 'Event'
        }));
        await Notification.insertMany(citizenNotifications);
      }
    } catch (notifyError) {
      console.error('Error notifying citizens:', notifyError);
    }

    // Notify volunteers with matching skills
    if (requiredSkills && requiredSkills.length > 0) {
      try {
        await notifyVolunteersBySkills(newEvent);
      } catch (notifyError) {
        console.error('Error notifying volunteers:', notifyError);
      }
    }

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ 
      message: 'Error creating event', 
      error: error.message 
    });
  }
};

/**
 * Get all events created by the organizer
 */
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ 
      createdBy: req.user._id,
      type: 'organizer'
    })
    .populate('assignedVolunteers', 'fullName email phoneNumber skills')
    .sort({ createdAt: -1 });

    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      message: 'Error fetching events', 
      error: error.message 
    });
  }
};

/**
 * Get details of a specific event
 */
export const getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({
      _id: eventId,
      createdBy: req.user._id,
      type: 'organizer'
    })
    .populate('organizer', 'fullName email phoneNumber organizationName')
    .populate('assignedVolunteers', 'fullName email phoneNumber skills');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ 
      message: 'Error fetching event details', 
      error: error.message 
    });
  }
};

/**
 * Update event details
 */
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    // Validate skills if being updated
    if (updates.requiredSkills && !validateSkills(updates.requiredSkills, 'volunteer')) {
      return res.status(400).json({ message: 'Invalid skills provided' });
    }

    const event = await Event.findOneAndUpdate(
      { _id: eventId, createdBy: req.user._id, type: 'organizer' },
      updates,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ 
      message: 'Event updated successfully',
      event 
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ 
      message: 'Error updating event', 
      error: error.message 
    });
  }
};


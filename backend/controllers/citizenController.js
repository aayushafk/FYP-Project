import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { notifyVolunteersBySkills } from '../services/skillService.js';

/**
 * Create a new help request (citizen-created event)
 */
export const createHelpRequest = async (req, res) => {
  try {
    const { title, description, category, location, requiredSkills } = req.body;

    console.log('Creating help request with data:', { title, description, category, location, requiredSkills, userId: req.user._id });

    // Create help request as an event with type 'citizen'
    const newRequest = new Event({
      title,
      description,
      category,
      location,
      type: 'citizen',
      createdBy: req.user._id,
      requiredSkills: requiredSkills || [],
      trackingStatus: 'Pending',
      status: 'upcoming'
    });

    console.log('About to save help request...');
    await newRequest.save();
    console.log('Help request saved successfully:', newRequest._id);

    // Notify volunteers with matching skills
    if (requiredSkills && requiredSkills.length > 0) {
      try {
        console.log('Notifying volunteers with skills:', requiredSkills);
        await notifyVolunteersBySkills(newRequest);
      } catch (notificationError) {
        console.error('Error notifying volunteers:', notificationError);
      }
    }

    res.status(201).json({
      message: 'Help request created successfully',
      request: newRequest
    });
  } catch (error) {
    console.error('Error creating help request:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(400).json({ 
      message: 'Error creating help request', 
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
};

/**
 * Get all help requests created by the citizen
 */
export const getMyRequests = async (req, res) => {
  try {
    const requests = await Event.find({ 
      createdBy: req.user._id,
      type: 'citizen'
    })
    .populate('assignedVolunteers', 'fullName email phoneNumber skills')
    .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ 
      message: 'Error fetching requests', 
      error: error.message 
    });
  }
};

/**
 * Get details of a specific request
 */
export const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Event.findOne({
      _id: requestId,
      createdBy: req.user._id,
      type: 'citizen'
    })
    .populate('createdBy', 'fullName email phoneNumber')
    .populate('assignedVolunteers', 'fullName email phoneNumber skills');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Error fetching request details:', error);
    res.status(500).json({ 
      message: 'Error fetching request details', 
      error: error.message 
    });
  }
};

/**
 * Delete a help request
 */
export const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Event.findOne({
      _id: requestId,
      createdBy: req.user._id,
      type: 'citizen'
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or unauthorized' });
    }

    await Event.findByIdAndDelete(requestId);

    res.json({ message: 'Help request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ 
      message: 'Error deleting request', 
      error: error.message 
    });
  }
};

/**
 * Get all organizer-created events (view-only for citizens)
 */
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ type: 'organizer' })
      .populate('organizer', 'fullName organizationName')
      .populate('assignedVolunteers', 'fullName skills')
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
 * Get notifications for citizen
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id
    }).sort({ createdAt: -1 }).limit(20);
    
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Error fetching notifications', 
      error: error.message 
    });
  }
};

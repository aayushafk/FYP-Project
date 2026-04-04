import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import {
  notifyVolunteersBySkills,
  getAIRecommendedVolunteers,
  getAIRecommendedVolunteersForRequests
} from '../services/skillService.js';

/**
 * Create a new help request (citizen-created event)
 */
export const createHelpRequest = async (req, res) => {
  try {
    const { title, description, category, location, requiredSkills } = req.body;

    console.log('Creating help request with data:', { title, description, category, location, requiredSkills, userId: req.user._id });

    // Emergency keyword detection (case-insensitive)
    const emergencyKeywords = [
      'immediately',
      'immediate',
      'emergency',
      'urgent',
      'asap',
      'critical',
      'right now',
      'help fast'
    ];
    
    // Match urgency keywords from both title and description to avoid missing emergency intent.
    const searchableText = `${title || ''} ${description || ''}`.toLowerCase();
    const isEmergency = emergencyKeywords.some(keyword => searchableText.includes(keyword));
    const requestPriority = isEmergency ? 'HIGH' : 'NORMAL';
    const requestType = isEmergency ? 'Emergency' : 'Normal';

    // Determine which skills to use based on citizen's selection and emergency status
    let skillsArray;
    
    if (isEmergency) {
      // EMERGENCY: Set flag to notify ALL volunteers (handled in skillService)
      skillsArray = requiredSkills && requiredSkills.length > 0 ? requiredSkills : [];
      console.log('🚨 Emergency detected! Will notify ALL volunteers regardless of skills.');
    } else if (requiredSkills && requiredSkills.length > 0) {
      // NORMAL: Use citizen's selected skill for targeted notifications
      skillsArray = requiredSkills;
      console.log('Normal request - will notify volunteers with matching skills:', skillsArray);
    } else {
      // NO SKILL SELECTED: Use empty array (no notifications)
      skillsArray = [];
      console.log('No skill selected - no volunteer notifications will be sent');
    }

    // Create help request as an event with type 'citizen'
    const newRequest = new Event({
      title,
      description,
      category,
      location,
      type: 'citizen',
      createdBy: req.user._id,
      requiredSkills: skillsArray,
      trackingStatus: 'Pending',
      status: 'upcoming',
      isEmergency: isEmergency,
      priority: requestPriority,
      requestType: requestType
    });

    console.log('About to save help request...');
    console.log('Emergency status:', isEmergency);
    await newRequest.save();
    console.log('Help request saved successfully:', newRequest._id);

    const aiRecommendations = await getAIRecommendedVolunteers({
      requiredSkills: skillsArray,
      location,
      limit: isEmergency ? 10 : 5,
      includeAvailability: true
    });

    const aiRecommendedVolunteerIds = (aiRecommendations.recommendations || [])
      .map((recommendation) => recommendation?.volunteerId)
      .filter(Boolean)
      .map((id) => id.toString());

    // Notify volunteers based on emergency status and selected skills
    try {
      if (isEmergency || (skillsArray && skillsArray.length > 0)) {
        console.log('Notifying volunteers - Emergency:', isEmergency, '| Skills:', skillsArray);
        await notifyVolunteersBySkills(newRequest, {
          restrictToVolunteerIds: isEmergency ? null : aiRecommendedVolunteerIds
        });
        console.log('Notifications sent successfully');
      } else {
        console.log('No skills selected and not emergency - skipping volunteer notifications');
      }
    } catch (notificationError) {
      console.error('Error notifying volunteers:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      message: 'Help request created successfully',
      request: newRequest,
      aiRecommendedVolunteers: aiRecommendations.recommendations,
      recommendationTitle: aiRecommendations.title
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
    .populate('volunteerAssignments.volunteerId', 'fullName name username email')
    .sort({ createdAt: -1 })
    .lean();

    const recommendationsByRequestId = await getAIRecommendedVolunteersForRequests(requests, {
      limit: 3,
      includeAvailability: true
    });

    const requestsWithRecommendations = requests.map((request) => ({
      ...request,
      aiRecommendedVolunteers: recommendationsByRequestId[request._id.toString()] || []
    }));

    res.json({ requests: requestsWithRecommendations });
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
    .populate('assignedVolunteers', 'fullName email phoneNumber skills')
    .populate('volunteerAssignments.volunteerId', 'fullName name username email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const aiRecommendations = await getAIRecommendedVolunteers({
      requiredSkills: request.requiredSkills || [],
      location: request.location || '',
      limit: 3,
      includeAvailability: true
    });

    res.json({
      request,
      aiRecommendedVolunteers: aiRecommendations.recommendations,
      recommendationTitle: aiRecommendations.title
    });
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

/**
 * Get help request analytics for the logged-in citizen
 */
export const getHelpRequestAnalytics = async (req, res) => {
  try {
    const citizenId = req.user._id;

    // Get all help requests created by this citizen (type: 'citizen')
    const myRequests = await Event.find({
      createdBy: citizenId,
      type: 'citizen'
    });

    // Total requests
    const totalRequests = myRequests.length;

    // Requests by status
    const pending = myRequests.filter(r => r.trackingStatus === 'Pending').length;
    const inProgress = myRequests.filter(r => r.trackingStatus === 'In Progress').length;
    const completed = myRequests.filter(r => r.trackingStatus === 'Completed').length;
    const assigned = myRequests.filter(r => r.trackingStatus === 'Assigned').length;

    // Average volunteer response time (time from creation to first volunteer assignment)
    let avgResponseTime = 0;
    const assignedRequests = myRequests.filter(r => r.assignedVolunteers && r.assignedVolunteers.length > 0);
    
    if (assignedRequests.length > 0) {
      const totalResponseTime = assignedRequests.reduce((sum, req) => {
        // Calculate time difference in milliseconds
        const responseTime = new Date(req.updatedAt) - new Date(req.createdAt);
        return sum + responseTime;
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / assignedRequests.length / (1000 * 60)); // Convert to minutes
    }

    // Total volunteers assigned across all requests
    const allVolunteers = new Set();
    myRequests.forEach(req => {
      if (req.assignedVolunteers && Array.isArray(req.assignedVolunteers)) {
        req.assignedVolunteers.forEach(vol => {
          allVolunteers.add(vol.toString());
        });
      }
    });

    // Requests created over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const requestsOverTime = myRequests
      .filter(r => new Date(r.createdAt) >= sixMonthsAgo)
      .reduce((acc, req) => {
        const date = new Date(req.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthYear] = (acc[monthYear] || 0) + 1;
        return acc;
      }, {});

    // Convert to array format for charts
    const timelineData = Object.entries(requestsOverTime)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, count]) => ({ label, count }));

    res.json({
      totalRequests,
      statusDistribution: {
        Pending: pending,
        Assigned: assigned,
        'In Progress': inProgress,
        Completed: completed
      },
      avgResponseTimeMinutes: avgResponseTime,
      totalVolunteersAssigned: allVolunteers.size,
      requestsOverTime: timelineData
    });
  } catch (error) {
    console.error('Error fetching citizen analytics:', error);
    res.status(500).json({
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

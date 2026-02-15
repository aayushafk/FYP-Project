import express from 'express';
import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware: All routes require authentication
router.use(authMiddleware);

// POST /api/feedback/event/:eventId/volunteer/:volunteerId - Submit feedback for a volunteer
router.post('/event/:eventId/volunteer/:volunteerId', async (req, res) => {
  try {
    const { eventId, volunteerId } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Only organizers and citizens can submit feedback
    if (req.user.role !== 'organizer' && req.user.role !== 'citizen' && req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only organizers and citizens can submit feedback' });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is completed
    if (event.trackingStatus !== 'Completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted for completed events' });
    }

    // Verify volunteer exists and was assigned to this event
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const isVolunteerAssigned = event.assignedVolunteers.some(
      v => v.toString() === volunteerId.toString()
    );

    if (!isVolunteerAssigned) {
      return res.status(400).json({ message: 'This volunteer was not assigned to this event' });
    }

    // Check if user is authorized to rate
    // Organizers: must be the event organizer
    // Citizens: must be the event creator (for help requests)
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isCitizenCreator = req.user.role === 'citizen' && isCreator;
    
    if (!isOrganizer && !isCreator) {
      return res.status(403).json({ message: 'You are not authorized to rate volunteers for this event' });
    }

    // Check for duplicate feedback
    const existingFeedback = await Feedback.findOne({
      eventId,
      volunteerId,
      ratedBy: req.user._id
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this volunteer' });
    }

    // Create feedback
    const feedback = new Feedback({
      eventId,
      volunteerId,
      ratedBy: req.user._id,
      ratedByRole: req.user.role,
      rating,
      comment: comment || ''
    });

    await feedback.save();
    await feedback.populate('ratedBy', 'fullName email role');

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
});

// GET /api/feedback/event/:eventId - Get all feedback for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const feedbacks = await Feedback.find({ eventId })
      .populate('volunteerId', 'fullName email')
      .populate('ratedBy', 'fullName email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      eventId,
      feedbackCount: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    console.error('Error fetching event feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

// GET /api/feedback/volunteer/:volunteerId - Get all feedback for a volunteer
router.get('/volunteer/:volunteerId', async (req, res) => {
  try {
    const { volunteerId } = req.params;

    // Verify volunteer exists
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const feedbacks = await Feedback.find({ volunteerId })
      .populate('eventId', 'title type')
      .populate('ratedBy', 'fullName email role')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(2) : 0;

    res.json({
      success: true,
      volunteerId,
      totalFeedback: feedbacks.length,
      averageRating: parseFloat(averageRating),
      feedbacks
    });
  } catch (error) {
    console.error('Error fetching volunteer feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
});

// GET /api/feedback/volunteer/:volunteerId/stats - Get volunteer rating statistics
router.get('/volunteer/:volunteerId/stats', async (req, res) => {
  try {
    const { volunteerId } = req.params;

    // Verify volunteer exists
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const feedbacks = await Feedback.find({ volunteerId });

    // Calculate statistics
    const totalRatings = feedbacks.length;
    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = totalRatings > 0 ? (totalRating / totalRatings).toFixed(2) : 0;

    // Rating distribution
    const ratingDistribution = {
      5: feedbacks.filter(f => f.rating === 5).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      1: feedbacks.filter(f => f.rating === 1).length
    };

    res.json({
      success: true,
      volunteerId,
      totalRatings,
      averageRating: parseFloat(averageRating),
      ratingDistribution
    });
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

export default router;

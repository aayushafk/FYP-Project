import express from 'express';
import UserVolunteerMessage from '../models/UserVolunteerMessage.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware: All routes require authentication
router.use(authMiddleware);

// POST /api/user-volunteer-chat/send - Send a message
router.post('/send', async (req, res) => {
  try {
    const { eventId, recipientId, messageType, content, locationData } = req.body;

    // Validate required fields
    if (!eventId || !recipientId || !content) {
      return res.status(400).json({ 
        message: 'Event ID, recipient ID, and content are required' 
      });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify recipient exists and has appropriate role
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Permission check: Verify user can communicate with volunteer
    const sendingAsUser = req.user.role === 'citizen' || req.user.role === 'user';
    const sendingAsVolunteer = req.user.role === 'volunteer';

    if (sendingAsUser && recipient.role !== 'volunteer') {
      return res.status(403).json({ 
        message: 'Users can only message volunteers' 
      });
    }

    if (sendingAsVolunteer && recipient.role !== 'citizen' && recipient.role !== 'user') {
      return res.status(403).json({ 
        message: 'Volunteers can only message users' 
      });
    }

    // Verify volunteer is assigned to the event
    if (sendingAsUser) {
      const isVolunteerAssigned = event.assignedVolunteers.some(v => 
        v.toString() === recipientId
      );
      if (!isVolunteerAssigned) {
        return res.status(403).json({ 
          message: 'This volunteer is not assigned to this event' 
        });
      }
    }

    // Verify user created the request/event
    if (sendingAsVolunteer) {
      const isUserEventCreator = event.createdBy && event.createdBy.toString() === recipientId;
      if (!isUserEventCreator) {
        return res.status(403).json({ 
          message: 'Can only message the user who created this event' 
        });
      }
    }

    // Create message
    const message = new UserVolunteerMessage({
      eventId,
      senderId: req.user._id,
      senderRole: req.user.role === 'citizen' ? 'user' : req.user.role,
      recipientId,
      messageType: messageType || 'text',
      content,
      locationData: messageType === 'location' ? locationData : undefined
    });

    await message.save();
    await message.populate('senderId', 'fullName email role');
    await message.populate('recipientId', 'fullName email role');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: 'Error sending message', 
      error: error.message 
    });
  }
});

// GET /api/user-volunteer-chat/messages/:eventId - Get messages for an event
router.get('/messages/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Permission check: User can see messages if they created the event
    // Volunteer can see messages if they're assigned to the event
    const isEventCreator = event.createdBy && event.createdBy.toString() === req.user._id.toString();
    const isAssignedVolunteer = event.assignedVolunteers.some(v => 
      v.toString() === req.user._id.toString()
    );

    if (!isEventCreator && !isAssignedVolunteer && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You do not have access to these messages' 
      });
    }

    // Get messages
    const messages = await UserVolunteerMessage.find({ eventId })
      .populate('senderId', 'fullName email role')
      .populate('recipientId', 'fullName email role')
      .sort({ timestamp: 1 })
      .limit(100);

    // Mark relevant messages as read
    if (req.user.role === 'volunteer' || isEventCreator) {
      await UserVolunteerMessage.updateMany(
        { 
          eventId, 
          recipientId: req.user._id,
          isRead: false 
        },
        { 
          isRead: true,
          readAt: new Date()
        }
      );
    }

    res.json({
      eventId,
      messageCount: messages.length,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      message: 'Error fetching messages', 
      error: error.message 
    });
  }
});

// GET /api/user-volunteer-chat/conversation/:eventId/:userId - Get conversation with specific person
router.get('/conversation/:eventId/:userId', async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get messages between current user and specified user
    const messages = await UserVolunteerMessage.find({
      eventId,
      $or: [
        { senderId: req.user._id, recipientId: userId },
        { senderId: userId, recipientId: req.user._id }
      ]
    })
      .populate('senderId', 'fullName email role')
      .populate('recipientId', 'fullName email role')
      .sort({ timestamp: 1 })
      .limit(50);

    // Mark messages as read
    await UserVolunteerMessage.updateMany(
      {
        eventId,
        senderId: userId,
        recipientId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      eventId,
      userId,
      messageCount: messages.length,
      messages
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ 
      message: 'Error fetching conversation', 
      error: error.message 
    });
  }
});

// GET /api/user-volunteer-chat/unread/:eventId - Get unread message count
router.get('/unread/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const unreadCount = await UserVolunteerMessage.countDocuments({
      eventId,
      recipientId: req.user._id,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ 
      message: 'Error fetching unread count', 
      error: error.message 
    });
  }
});

// DELETE /api/user-volunteer-chat/:messageId - Delete/hide a message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await UserVolunteerMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender or admin can delete
    if (message.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot delete this message' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      message: 'Error deleting message', 
      error: error.message 
    });
  }
});

export default router;

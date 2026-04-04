import express from 'express'
import Message from '../models/Message.js'
import User from '../models/User.js'
import Event from '../models/Event.js'
import EventMessage from '../models/EventMessage.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Middleware: All routes require authentication
router.use(authMiddleware)

// POST /api/chat/send – Send a message
router.post('/send', async (req, res) => {
  try {
    const { receiverId, content, eventId } = req.body

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' })
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' })
    }

    // Verify event if provided
    if (eventId) {
      const event = await Event.findById(eventId)
      if (!event) {
        return res.status(404).json({ message: 'Event not found' })
      }
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      eventId: eventId || null,
      timestamp: new Date()
    })

    await message.save()
    await message.populate('sender', 'fullName email')
    await message.populate('receiver', 'fullName email')

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    })
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message })
  }
})

// GET /api/chat/conversation/:userId – Get conversation between current user and another user
router.get('/conversation/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // Verify user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get all messages between the two users (both directions)
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'fullName email role')
      .populate('receiver', 'fullName email role')
      .sort({ timestamp: 1 })

    res.json({
      conversation: messages,
      participants: {
        user1: req.user._id,
        user2: userId
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversation', error: error.message })
  }
})

// GET /api/chat/event/:eventId – Get all messages related to an event (legacy - redirects to event chat)
// NOTE: Moved to EVENT CHAT ENDPOINTS section below

// GET /api/chat/inbox – Get all conversations for the current user
router.get('/inbox', async (req, res) => {
  try {
    // Get all unique conversations for current user
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
      .populate('sender', 'fullName email role')
      .populate('receiver', 'fullName email role')
      .sort({ timestamp: -1 })

    // Group by conversation partner
    const conversations = {}
    messages.forEach((msg) => {
      const partnerId = msg.sender._id.toString() === req.user._id.toString() 
        ? msg.receiver._id.toString() 
        : msg.sender._id.toString()
      
      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partnerId,
          partnerName: msg.sender._id.toString() === req.user._id.toString() 
            ? msg.receiver.fullName 
            : msg.sender.fullName,
          partnerEmail: msg.sender._id.toString() === req.user._id.toString() 
            ? msg.receiver.email 
            : msg.sender.email,
          lastMessage: msg.content,
          lastMessageTime: msg.timestamp,
          unreadCount: 0
        }
        
        // Count unread messages for this conversation
        const unread = messages.filter(m => 
          m.receiver._id.toString() === req.user._id.toString() && 
          !m.isRead &&
          (m.sender._id.toString() === partnerId || m.receiver._id.toString() === partnerId)
        )
        conversations[partnerId].unreadCount = unread.length
      }
    })

    res.json(Object.values(conversations))
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inbox', error: error.message })
  }
})

// PATCH /api/chat/mark-read/:messageId – Mark a message as read
router.patch('/mark-read/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }

    message.isRead = true
    await message.save()

    res.json({ message: 'Message marked as read', data: message })
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read', error: error.message })
  }
})

// ===== EVENT CHAT ENDPOINTS =====

// GET /api/chat/event/:eventId – Fetch all messages for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params
    
    // Verify event exists
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Verify user is organizer, joined volunteer, or has access
    const organizerId = event.organizer?._id || event.organizer
    const isEventOrganizer = organizerId && organizerId.toString() === req.user._id.toString()
    const isVolunteer = event.assignedVolunteers?.some(v => {
      const volunteerId = v._id || v
      return volunteerId.toString() === req.user._id.toString()
    })
    const isCitizen = req.user.role === 'citizen' || req.user.role === 'user'
    const hasOrganizerRole = req.user.role === 'organizer'
    
    // Allow access if user is the event organizer, an assigned volunteer, a citizen, or has organizer role
    if (!isEventOrganizer && !isVolunteer && !isCitizen && !hasOrganizerRole) {
      return res.status(403).json({ message: 'Access denied. You are not part of this event.' })
    }
    const messages = await EventMessage.find({ eventId })
      .sort({ timestamp: 1 })
      .limit(100)

    // Transform messages to use nested sender structure (matching socket format)
    const transformedMessages = messages.map(msg => ({
      _id: msg._id,
      eventId: msg.eventId,
      message: msg.message,
      sender: {
        id: msg.senderId,
        name: msg.senderName,
        role: msg.senderRole
      },
      timestamp: msg.timestamp,
      image: msg.image,
      location: msg.location
    }))

    res.json({
      success: true,
      eventId,
      messageCount: transformedMessages.length,
      messages: transformedMessages
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event messages', error: error.message })
  }
})

// POST /api/chat/event/:eventId – Save a message for an event  
router.post('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params
    const { message, image, location } = req.body

    // Require either message content OR image OR location
    if ((!message || message.trim() === '') && !image && !location) {
      return res.status(400).json({ message: 'Message content, image, or location is required' })
    }

    // Verify event exists
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Verify user is organizer, joined volunteer, or has access
    const organizerId = event.organizer?._id || event.organizer
    const isEventOrganizer = organizerId && organizerId.toString() === req.user._id.toString()
    const isVolunteer = event.assignedVolunteers?.some(v => {
      const volunteerId = v._id || v
      return volunteerId.toString() === req.user._id.toString()
    })
    const isCitizen = req.user.role === 'citizen' || req.user.role === 'user'
    const hasOrganizerRole = req.user.role === 'organizer'
    
    if (!isEventOrganizer && !isVolunteer && !isCitizen && !hasOrganizerRole) {
      return res.status(403).json({ message: 'Access denied. You cannot chat in this event.' })
    }

    // Create message with optional image and location
    const messageData = {
      eventId,
      senderId: req.user._id,
      senderName: req.user.fullName,
      senderRole: req.user.role,
      message
    }

    if (image) {
      messageData.image = image
    }

    if (location && location.lat && location.lng) {
      messageData.location = location
    }

    const eventMessage = new EventMessage(messageData)

    await eventMessage.save()

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: eventMessage
    })
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message })
  }
})

export default router

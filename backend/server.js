import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import http from 'http'
import { Server } from 'socket.io'
import authRoutes from './routes/authRoutes.js'
import requestRoutes from './routes/requestRoutes.js'
import citizenRoutes from './routes/citizenRoutes.js'
import volunteerRoutes from './routes/volunteerRoutes.js'
import organizerRoutes from './routes/organizerRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import userVolunteerChatRoutes from './routes/userVolunteerChatRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import EventMessage from './models/EventMessage.js'
import UserVolunteerMessage from './models/UserVolunteerMessage.js'
import Event from './models/Event.js'

dotenv.config()

// Debug: Log JWT_SECRET to ensure it's loaded
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO')

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Socket.IO Authentication Middleware (NON-BLOCKING)
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token
  
  if (!token) {
    console.log('⚠️ Socket connection without token - allowing as guest')
    socket.isAuthenticated = false
    socket.user = null
    return next() // Always allow connection
  }

  // Get JWT_SECRET with fallback
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this'

  try {
    const decoded = jwt.verify(token, jwtSecret)
    
    // Import User model to fetch full user data
    const User = mongoose.model('User')
    const user = await User.findById(decoded.userId).select('-password')
    
    if (user) {
      // Attach full user object to socket
      socket.user = {
        _id: user._id.toString(),
        name: user.fullName,
        role: user.role,
        email: user.email
      }
      socket.isAuthenticated = true
      console.log('✅ Socket authenticated:', user.fullName, user.role)
    } else {
      console.log('⚠️ User not found, allowing as guest')
      socket.isAuthenticated = false
      socket.user = null
    }
    next()
  } catch (error) {
    console.error('⚠️ Socket token invalid, allowing as guest:', error.message)
    socket.isAuthenticated = false
    socket.user = null
    next() // Still allow connection as guest
  }
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/citizen', citizenRoutes)
app.use('/api/volunteer', volunteerRoutes)
app.use('/api/organizer', organizerRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/user-volunteer-chat', userVolunteerChatRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/feedback', feedbackRoutes)

// Public Event Routes
// GET /api/events/:eventId - Get event details (public)
app.get('/api/events/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('organizer', 'fullName email phoneNumber organizationName')
      .populate('createdBy', 'fullName email phoneNumber organizationName')
      .populate('assignedVolunteers', 'fullName email skills')
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }
    
    res.json({ event })
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({ message: 'Error fetching event', error: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'UnityAid API is running' })
})

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Join event chat room
  socket.on('joinEventChat', (data) => {
    const { eventId, userId, userName, userRole } = data
    const roomName = `event_${eventId}`
    
    socket.join(roomName)
    socket.userId = userId
    socket.userName = userName
    socket.userRole = userRole
    socket.eventId = eventId
    
    // Notify others that user joined
    io.to(roomName).emit('userJoined', {
      message: `${userName} joined the chat`,
      timestamp: new Date()
    })
  })

  // Send message with optional image and location
  socket.on('sendMessage', async (data) => {
    try {
      // SECURITY: Must be authenticated to send messages
      if (!socket.isAuthenticated || !socket.user) {
        console.error('❌ Unauthorized: User not authenticated')
        socket.emit('messageError', { error: 'You must be logged in to send messages' })
        return
      }

      console.log('📨 Received sendMessage event:', data);
      console.log('👤 Authenticated user:', socket.user);

      const { eventId, message, image, location } = data
      const roomName = `event_${eventId}`
      
      // SECURITY: Use authenticated user info from JWT - DO NOT trust frontend data
      const messageData = {
        eventId,
        senderId: socket.user._id,
        senderName: socket.user.name,
        senderRole: socket.user.role,
        message
      }

      // Add optional image if provided
      if (image) {
        messageData.image = image
      }

      // Add optional location if provided
      if (location) {
        if (location.lat && location.lng) {
          messageData.location = {
            lat: location.lat,
            lng: location.lng,
            address: location.address || ''
          }
        } else if (location.address) {
          messageData.location = {
            address: location.address
          }
        }
      }
      
      console.log('💾 Saving message to database:', messageData);

      // Save message to database
      const newMessage = new EventMessage(messageData)
      await newMessage.save()
      
      console.log('✅ Message saved with ID:', newMessage._id);

      // Build message payload with sender object structure
      const messagePayload = {
        _id: newMessage._id,
        eventId,
        message,
        sender: {
          id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        },
        timestamp: newMessage.timestamp
      }

      // Add optional fields to payload
      if (image) {
        messagePayload.image = image
      }

      if (messageData.location) {
        messagePayload.location = messageData.location
      }

      console.log('📡 Broadcasting message to room:', roomName);
      // Broadcast to all users in the event room
      io.to(roomName).emit('receiveMessage', messagePayload)
      
      console.log(`✅ Message sent by ${socket.user.name} (${socket.user.role})${image ? ' with image' : ''}${location ? ' with location' : ''}`)
    } catch (error) {
      console.error('❌ Error saving message:', error)
      socket.emit('messageError', { error: 'Failed to send message' })
    }
  })

  // Leave event chat room
  socket.on('leaveEventChat', () => {
    const roomName = `event_${socket.eventId}`
    socket.leave(roomName)
    
    io.to(roomName).emit('userLeft', {
      message: `${socket.userName} left the chat`,
      timestamp: new Date()
    })
  })

  // Direct messaging
  socket.on('joinDirectChat', (data) => {
    const { userId, recipientId } = data
    const roomName = `direct_${[userId, recipientId].sort().join('_')}`
    
    socket.join(roomName)
    socket.userId = userId
    socket.directChatRooms = socket.directChatRooms || {}
    socket.directChatRooms[recipientId] = roomName
  })

  socket.on('sendDirectMessage', async (data) => {
    try {
      const { recipientId, message } = data
      const roomName = `direct_${[socket.userId, recipientId].sort().join('_')}`
      
      // Emit to the recipient
      io.to(roomName).emit('receiveDirectMessage', {
        sender: { _id: socket.userId },
        receiver: { _id: recipientId },
        content: message,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Error sending direct message:', error)
      socket.emit('messageError', { error: 'Failed to send message' })
    }
  })

  socket.on('leaveDirectChat', () => {
    if (socket.directChatRooms) {
      Object.values(socket.directChatRooms).forEach(room => {
        socket.leave(room)
      })
      socket.directChatRooms = {}
    }
  })

  // User-Volunteer Help Chat
  socket.on('joinHelpRoom', (data) => {
    const { eventId, userId } = data
    const roomName = `help_${eventId}`
    
    socket.join(roomName)
    socket.userId = userId
    socket.helpEventId = eventId
    
    console.log(`User ${userId} joined help room for event ${eventId}`)
  })

  socket.on('sendHelpMessage', async (data) => {
    try {
      const { eventId, recipientId, messageType, content, locationData, imageUrl } = data
      
      // Create message object
      const messageData = {
        eventId,
        senderId: socket.userId,
        senderRole: data.senderRole || 'user',
        recipientId,
        messageType,
        content
      }
      
      // Add location data if provided
      if (messageType === 'location' && locationData) {
        messageData.locationData = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address
        }
      }
      
      // Add image data if provided
      if (messageType === 'image' && imageUrl) {
        messageData.imageData = {
          url: imageUrl,
          fileName: data.fileName,
          uploadedAt: new Date()
        }
      }
      
      // Save to database
      const newMessage = new UserVolunteerMessage(messageData)
      await newMessage.save()
      await newMessage.populate('senderId', 'fullName email')
      await newMessage.populate('recipientId', 'fullName email')
      
      // Broadcast to help room
      const roomName = `help_${eventId}`
      io.to(roomName).emit('receiveHelpMessage', {
        _id: newMessage._id,
        eventId,
        sender: {
          _id: newMessage.senderId._id,
          fullName: newMessage.senderId.fullName,
          email: newMessage.senderId.email
        },
        recipient: {
          _id: newMessage.recipientId._id,
          fullName: newMessage.recipientId.fullName,
          email: newMessage.recipientId.email
        },
        messageType,
        content,
        locationData: messageType === 'location' ? locationData : undefined,
        imageUrl: messageType === 'image' ? imageUrl : undefined,
        timestamp: newMessage.timestamp,
        isRead: false
      })
    } catch (error) {
      console.error('Error sending help message:', error)
      socket.emit('helpMessageError', { error: 'Failed to send help message' })
    }
  })

  socket.on('leaveHelpRoom', () => {
    const roomName = `help_${socket.helpEventId}`
    socket.leave(roomName)
    console.log(`User ${socket.userId} left help room for event ${socket.helpEventId}`)
  })

  // Status Tracking
  socket.on('joinEventRoom', (data) => {
    const { eventId, userId, userName, userRole } = data
    const roomName = `event_${eventId}`
    
    socket.join(roomName)
    socket.userId = userId
    socket.userName = userName
    socket.userRole = userRole
    socket.eventId = eventId
    
    console.log(`User ${userName} (${userRole}) joined event room ${eventId}`)
  })

  socket.on('volunteerStatusUpdate', async (data) => {
    try {
      // SECURITY: Verify user is authenticated and is a volunteer
      if (!socket.isAuthenticated || !socket.user) {
        console.error('❌ Unauthorized: User not authenticated for status update')
        socket.emit('statusUpdateError', { error: 'You must be logged in to update status' })
        return
      }

      if (socket.user.role !== 'volunteer') {
        console.error('❌ Unauthorized: Only volunteers can update status')
        socket.emit('statusUpdateError', { error: 'Only volunteers can update event status' })
        return
      }

      const { eventId, volunteerId, volunteerName, newStatus, fromStatus } = data
      const roomName = `event_${eventId}`
      
      // Verify the volunteer is updating their own status
      if (volunteerId !== socket.user._id) {
        console.error('❌ Unauthorized: Volunteer trying to update another volunteer\'s status')
        socket.emit('statusUpdateError', { error: 'You can only update your own status' })
        return
      }
      
      // Emit status update to all clients in the event room
      io.to(roomName).emit('volunteerStatusUpdated', {
        eventId,
        volunteerId,
        volunteerName,
        newStatus,
        fromStatus,
        timestamp: new Date(),
        message: newStatus === 'Completed' 
          ? `${volunteerName} completed the task`
          : `${volunteerName} status updated to ${newStatus}`
      })
      
      console.log(`✅ Status updated by ${socket.user.name} (volunteer) for event ${eventId}: ${fromStatus} → ${newStatus}`)
    } catch (error) {
      console.error('Error handling status update:', error)
      socket.emit('statusUpdateError', { error: 'Failed to update status' })
    }
  })

  socket.on('leaveEventRoom', (data) => {
    const { eventId } = data
    const roomName = `event_${eventId}`
    socket.leave(roomName)
    console.log(`User ${socket.userId} left event room ${eventId}`)
  })

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
    if (socket.eventId) {
      const roomName = `event_${socket.eventId}`
      io.to(roomName).emit('userLeft', {
        message: `${socket.userName} disconnected`,
        timestamp: new Date()
      })
    }
  })
})

// Database connection
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unityaid'

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully')
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Socket.IO server ready for connections`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  })

export default app
export { io }


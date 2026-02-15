import { io } from 'socket.io-client'

// Socket.IO connects to root URL, not /api
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

let socket = null
let messageListener = null
let userJoinedListener = null
let userLeftListener = null
let messageErrorListener = null
let directMessageListener = null

const socketService = {
  // Initialize Socket.IO connection
  initializeSocket() {
    // If socket exists and is connected, return it
    if (socket && socket.connected) {
      return socket
    }

    // If socket exists but disconnected, clean it up
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
    }

    const token = localStorage.getItem('token')

    console.log('🔌 Initializing new socket connection to:', SOCKET_URL)
    console.log('🔑 Token present:', !!token)

    socket = io(SOCKET_URL, {
      auth: {
        token: token  // Send token for authentication
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000
    })

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message)
    })

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })

    return socket
  },

  // Ensure socket is connected (returns a promise)
  async ensureConnected(timeout = 10000) {
    // If socket exists and is connected, return it
    if (socket && socket.connected) {
      console.log('✅ Socket already connected')
      return socket
    }

    // Clean up any existing disconnected socket
    if (socket && !socket.connected) {
      console.log('🧹 Cleaning up disconnected socket')
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
    }

    // Initialize new socket
    console.log('🔄 Creating new socket connection')
    this.initializeSocket()

    // If already connected after initialization, return immediately
    if (socket.connected) {
      console.log('✅ Socket connected immediately')
      return socket
    }

    // Wait for connection
    console.log('⏳ Waiting for socket connection...')
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        socket.off('connect', onConnect)
        socket.off('connect_error', onError)
        reject(new Error('Socket connection timeout - please check if backend server is running'))
      }, timeout)

      const onConnect = () => {
        console.log('✅ Socket connection established')
        clearTimeout(timeoutId)
        socket.off('connect', onConnect)
        socket.off('connect_error', onError)
        resolve(socket)
      }

      const onError = (error) => {
        console.error('❌ Socket connection failed:', error.message)
        clearTimeout(timeoutId)
        socket.off('connect', onConnect)
        socket.off('connect_error', onError)
        reject(new Error(`Failed to connect: ${error.message || 'Unknown error'}`))
      }

      socket.once('connect', onConnect)
      socket.once('connect_error', onError)
    })
  },

  // Connect wrapper (for backward compatibility)
  connect(userId, userName, userRole) {
    this.initializeSocket()
    return socket
  },

  // Check if connected
  isConnected() {
    return socket && socket.connected
  },

  // Get socket instance
  getSocket() {
    if (!socket) {
      return this.initializeSocket()
    }
    return socket
  },

  // Event chat methods
  joinEventChat(eventId, userId, userName, userRole) {
    const s = this.getSocket()
    s.emit('joinEventChat', { eventId, userId, userName, userRole })
  },

  sendMessage(eventId, message, image = null, location = null) {
    const s = this.getSocket()
    if (!s.connected) {
      console.error('Socket not connected when trying to send message')
      throw new Error('Socket not connected')
    }
    
    const messageData = { eventId, message }
    
    if (image) {
      messageData.image = image
    }
    
    if (location) {
      messageData.location = location
    }
    
    console.log('📡 Emitting sendMessage event:', messageData)
    s.emit('sendMessage', messageData)
    console.log('✅ sendMessage event emitted')
  },

  onReceiveMessage(callback) {
    const s = this.getSocket()
    messageListener = callback
    s.on('receiveMessage', callback)
  },

  onUserJoined(callback) {
    const s = this.getSocket()
    userJoinedListener = callback
    s.on('userJoined', callback)
  },

  onUserLeft(callback) {
    const s = this.getSocket()
    userLeftListener = callback
    s.on('userLeft', callback)
  },

  onMessageError(callback) {
    const s = this.getSocket()
    messageErrorListener = callback
    s.on('messageError', callback)
  },

  removeMessageListener() {
    const s = this.getSocket()
    if (messageListener) {
      s.off('receiveMessage', messageListener)
      messageListener = null
    }
  },

  removeUserJoinedListener() {
    const s = this.getSocket()
    if (userJoinedListener) {
      s.off('userJoined', userJoinedListener)
      userJoinedListener = null
    }
  },

  removeUserLeftListener() {
    const s = this.getSocket()
    if (userLeftListener) {
      s.off('userLeft', userLeftListener)
      userLeftListener = null
    }
  },

  removeMessageErrorListener() {
    const s = this.getSocket()
    if (messageErrorListener) {
      s.off('messageError', messageErrorListener)
      messageErrorListener = null
    }
  },

  leaveEventChat() {
    const s = this.getSocket()
    s.emit('leaveEventChat')
  },

  // Direct messaging methods
  joinDirectChat(userId, recipientId) {
    const s = this.getSocket()
    s.emit('joinDirectChat', { userId, recipientId })
  },

  sendDirectMessage(recipientId, message) {
    const s = this.getSocket()
    s.emit('sendDirectMessage', { recipientId, message })
  },

  onDirectMessage(callback) {
    const s = this.getSocket()
    directMessageListener = callback
    s.on('receiveDirectMessage', callback)
  },

  leaveDirectChat() {
    const s = this.getSocket()
    s.emit('leaveDirectChat')
  },

  // Status tracking methods
  joinEventRoom(eventId, userId, userName, userRole) {
    const s = this.getSocket()
    s.emit('joinEventRoom', { eventId, userId, userName, userRole })
  },

  updateStatus(eventId, volunteerId, volunteerName, newStatus, fromStatus) {
    const s = this.getSocket()
    s.emit('volunteerStatusUpdate', { eventId, volunteerId, volunteerName, newStatus, fromStatus })
  },

  onStatusUpdated(callback) {
    const s = this.getSocket()
    s.on('volunteerStatusUpdated', callback)
  },

  offStatusUpdated(callback) {
    const s = this.getSocket()
    if (callback) {
      s.off('volunteerStatusUpdated', callback)
    } else {
      s.off('volunteerStatusUpdated')
    }
  },

  leaveEventRoom(eventId) {
    const s = this.getSocket()
    s.emit('leaveEventRoom', { eventId })
  },

  // Disconnect
  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }
}

export default socketService
export { socketService }

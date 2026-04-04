import { createContext, useCallback, useEffect, useState } from 'react'
import socketService from '../services/socketService'

const StatusContext = createContext()

export const StatusProvider = ({ children }) => {
  const [statusUpdates, setStatusUpdates] = useState({})
  const [socket, setSocket] = useState(null)
  const [currentEventRoom, setCurrentEventRoom] = useState(null)
  const [loading, setLoading] = useState(false)

  // Initialize Socket.IO
  useEffect(() => {
    // Use the shared socket service instead of creating a new socket
    const sharedSocket = socketService.getSocket()

    if (sharedSocket) {
      sharedSocket.on('connect', () => {
        console.log('Socket connected for status tracking')
      })

      sharedSocket.on('volunteerStatusUpdated', (data) => {
        console.log('Status update received:', data)
        setStatusUpdates(prev => ({
          ...prev,
          [data.eventId]: {
            volunteerId: data.volunteerId,
            volunteerName: data.volunteerName,
            status: data.newStatus,
            fromStatus: data.fromStatus,
            timestamp: data.timestamp,
            message: data.message
          }
        }))
      })

      sharedSocket.on('statusUpdateError', (error) => {
        console.error('Status update error:', error)
      })

      setSocket(sharedSocket)
    }

    return () => {
      if (sharedSocket) {
        sharedSocket.off('volunteerStatusUpdated')
        sharedSocket.off('statusUpdateError')
      }
    }
  }, [])

  // Join event room
  const joinEventRoom = useCallback((eventId, userId, userName, userRole) => {
    if (!socket) return

    setCurrentEventRoom(eventId)
    socket.emit('joinEventRoom', {
      eventId,
      userId,
      userName,
      userRole
    })
  }, [socket])

  // Leave event room
  const leaveEventRoom = useCallback((eventId) => {
    if (!socket) return

    socket.emit('leaveEventRoom', { eventId })
    setCurrentEventRoom(null)
  }, [socket])

  // Update status
  const updateStatus = useCallback(
    async (eventId, newStatus, volunteerData) => {
      if (!socket) return

      setLoading(true)

      try {
        // Emit socket event for real-time update
        socket.emit('volunteerStatusUpdate', {
          eventId,
          volunteerId: volunteerData.volunteerId,
          volunteerName: volunteerData.volunteerName,
          newStatus,
          fromStatus: volunteerData.currentStatus
        })

        // Return success
        return { success: true, newStatus }
      } catch (error) {
        console.error('Error updating status:', error)
        return { success: false, error }
      } finally {
        setLoading(false)
      }
    },
    [socket]
  )

  // Get status for event
  const getEventStatus = useCallback((eventId) => {
    return statusUpdates[eventId] || null
  }, [statusUpdates])

  // Clear status updates for event
  const clearEventStatus = useCallback((eventId) => {
    setStatusUpdates(prev => {
      const updated = { ...prev }
      delete updated[eventId]
      return updated
    })
  }, [])

  const value = {
    socket,
    statusUpdates,
    currentEventRoom,
    loading,
    joinEventRoom,
    leaveEventRoom,
    updateStatus,
    getEventStatus,
    clearEventStatus,
    setLoading
  }

  return (
    <StatusContext.Provider value={value}>
      {children}
    </StatusContext.Provider>
  )
}

export { StatusContext }

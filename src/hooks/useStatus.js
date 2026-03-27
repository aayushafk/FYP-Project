import { useContext } from 'react'
import { StatusContext } from '../contexts/StatusContext'

/**
 * Custom hook to use the StatusContext
 * Provides access to status tracking functionality
 */
export const useStatus = () => {
  const context = useContext(StatusContext)

  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider')
  }

  return context
}

/**
 * Custom hook to manage status updates for a specific event
 * @param {string} eventId - The event ID
 * @returns {object} Status management functions and data
 */
export const useEventStatus = (eventId) => {
  const {
    statusUpdates,
    loading,
    updateStatus,
    getEventStatus,
    clearEventStatus,
    socket
  } = useStatus()

  const eventStatus = getEventStatus(eventId)
  
  const handleStatusUpdate = async (newStatus, volunteerData) => {
    return updateStatus(eventId, newStatus, volunteerData)
  }

  const clearStatus = () => {
    clearEventStatus(eventId)
  }

  return {
    eventStatus,
    loading,
    handleStatusUpdate,
    clearStatus,
    socket
  }
}

export default useStatus

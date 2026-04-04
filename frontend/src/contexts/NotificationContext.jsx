import React, { createContext, useContext, useState, useCallback } from 'react'

// Create Notification Context
const NotificationContext = createContext()

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notification) => {
    const id = Date.now()
    const newNotification = {
      id,
      timestamp: new Date(),
      isRead: false,
      ...notification
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    return id
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notif => {
        if (notif.id === id && !notif.isRead) {
          setUnreadCount(c => Math.max(0, c - 1))
          return { ...notif, isRead: true }
        }
        return notif
      })
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
    setUnreadCount(0)
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.isRead)
  }, [notifications])

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    getUnreadNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Custom hook to use Notification Context
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext

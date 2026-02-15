import React, { createContext, useContext, useState, useCallback } from 'react'

// Create Toast Context
const ToastContext = createContext()

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    const toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message, duration = 3000) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message, duration = 5000) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const warning = useCallback((message, duration = 4000) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  const info = useCallback((message, duration = 3000) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

// Custom hook to use Toast Context
export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

export default ToastContext

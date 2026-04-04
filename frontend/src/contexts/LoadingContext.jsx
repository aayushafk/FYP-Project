import React, { createContext, useContext, useState, useCallback } from 'react'

// Create Loading Context
const LoadingContext = createContext()

// Loading Provider Component
export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({})

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const isLoading = useCallback((key) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const setMultipleLoading = useCallback((updates) => {
    setLoadingStates(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  const clearAllLoading = useCallback(() => {
    setLoadingStates({})
  }, [])

  const value = {
    loadingStates,
    setLoading,
    isLoading,
    setMultipleLoading,
    clearAllLoading
  }

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  )
}

// Custom hook to use Loading Context
export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

export default LoadingContext

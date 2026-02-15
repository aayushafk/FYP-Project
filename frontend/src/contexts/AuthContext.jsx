import React, { createContext, useContext, useState, useCallback } from 'react'

// Create Auth Context
const AuthContext = createContext()

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load user from localStorage on mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token') // Changed from 'authToken' to 'token'

    console.log('🔐 AuthContext loading:', { hasUser: !!storedUser, hasToken: !!token });

    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('✅ User loaded from localStorage:', userData);
        setUser(userData)
        setIsAuthenticated(true)
      } catch (err) {
        console.error('Failed to parse stored user:', err)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    } else {
      console.log('⚠️ No user in localStorage');
    }
    setLoading(false)
  }, [])

  const login = useCallback((userData, token) => {
    console.log('🔑 Login called with:', { user: userData?.fullName, role: userData?.role });
    setUser(userData)
    setIsAuthenticated(true)
    setError(null)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token) // Changed from 'authToken' to 'token'
  }, [])

  const logout = useCallback(() => {
    console.log('👋 Logout called');
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token') // Changed from 'authToken' to 'token'
    localStorage.removeItem('refreshToken')
  }, [])

  const updateUser = useCallback((userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  const setAuthError = useCallback((errorMessage) => {
    setError(errorMessage)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const isVolunteer = user?.role === 'volunteer'
  const isOrganizer = user?.role === 'organizer'
  const isCitizen = user?.role === 'citizen'
  const isAdmin = user?.role === 'admin'

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    updateUser,
    setAuthError,
    clearError,
    isVolunteer,
    isOrganizer,
    isCitizen,
    isAdmin,
    userRole: user?.role
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

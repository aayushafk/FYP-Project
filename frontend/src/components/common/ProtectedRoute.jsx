import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  const parsedUserRole = (() => {
    try {
      const parsedUser = storedUser ? JSON.parse(storedUser) : null
      return parsedUser?.role
    } catch {
      return null
    }
  })()
  const rawRole = (parsedUserRole || localStorage.getItem('role') || '').toLowerCase()
  const userRole = rawRole === 'user' ? 'citizen' : rawRole
  const location = useLocation()

  if (!token) {
    // User is not logged in
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Token exists but role is missing/corrupt
  if (!userRole) {
    return <Navigate to="/login" replace />
  }

  // If allowedRoles is defined, check if user has the correct role
  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map(role => role.toLowerCase())
    : null

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    // User does not have the correct role

    // Redirect to the correct dashboard if they are logged in with a different role
    if (userRole === 'citizen') return <Navigate to="/dashboard/user" replace />
    if (userRole === 'volunteer') return <Navigate to="/dashboard/volunteer" replace />
    if (userRole === 'organizer') return <Navigate to="/dashboard/organizer" replace />
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />

    // Fallback
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

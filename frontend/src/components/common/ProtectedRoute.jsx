import { Navigate, useLocation } from 'react-router-dom'

const notifyAccessDenied = (userRole, allowedRoles, attemptedPath) => {
  if (typeof window === 'undefined') return

  const prettyRole = userRole || 'unknown role'
  const prettyAllowedRoles = Array.isArray(allowedRoles) && allowedRoles.length > 0
    ? allowedRoles.join(', ')
    : 'authorized roles'

  const message = `Access denied. You are logged in as ${prettyRole}. This page is only for: ${prettyAllowedRoles}.`

  // Prevent duplicate alerts caused by quick re-renders.
  const dedupeKey = 'access_denied_last_notice'
  const now = Date.now()

  try {
    const raw = window.sessionStorage.getItem(dedupeKey)
    const lastNotice = raw ? JSON.parse(raw) : null
    if (lastNotice && lastNotice.path === attemptedPath && (now - lastNotice.time) < 1500) {
      return
    }
    window.sessionStorage.setItem(dedupeKey, JSON.stringify({ path: attemptedPath, time: now }))
  } catch (_) {
    // If storage is unavailable, still show the alert.
  }

  window.alert(message)
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token')
  const rawRole = localStorage.getItem('role')?.toLowerCase()
  const userRole = rawRole === 'user' ? 'citizen' : rawRole
  const location = useLocation()

  if (!token) {
    // User is not logged in
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If allowedRoles is defined, check if user has the correct role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // User does not have the correct role
    notifyAccessDenied(userRole, allowedRoles, location.pathname)

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

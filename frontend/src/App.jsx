import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Homepage from './pages/Homepage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminLogin from './pages/auth/AdminLogin'
import UserDashboard from './pages/dashboards/UserDashboard'
import VolunteerDashboard from './pages/dashboards/VolunteerDashboard'
import OrganizerDashboard from './pages/dashboards/OrganizerDashboard'
import CreateRequest from './pages/dashboards/CreateRequest'
import RequestDetails from './pages/dashboards/RequestDetails'
import EventDetails from './pages/EventDetails'
import CreateEventPage from './pages/CreateEventPage'
import OrganizerEventDetails from './pages/OrganizerEventDetails'
import MessagesPage from './pages/MessagesPage'
import EventDetailPage from './pages/EventDetailPage'
import CreateHelpRequestPage from './pages/CreateHelpRequestPage'
import HelpRequestDetail from './pages/HelpRequestDetail'

import { ProtectedRoute } from './components/common'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import socketService from './services/socketService'
import { StatusProvider } from './contexts/StatusContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppContent() {
  const { user } = useAuth()

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (token && user?._id) {
      // Initialize Socket.IO when app loads and user is authenticated
      console.log('🔌 Initializing socket connection for authenticated user:', user._id)
      socketService.initializeSocket()
      
      // Join event chat will be done by individual pages as needed
    } else {
      console.log('⏭️ Skipping socket initialization - no authenticated user')
      // Disconnect socket if user logs out
      if (!user?._id) {
        socketService.disconnect()
      }
    }

    return () => {
      // Cleanup socket connection on app unmount
      // socketService.disconnect()
    }
  }, [user?._id])

  return (
    <StatusProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Citizen Dashboard */}
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Legacy citizen paths (kept for backward compatibility) */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Create Help Request (Citizen) */}
        <Route
          path="/citizen/request/create"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CreateHelpRequestPage />
            </ProtectedRoute>
          }
        />

        {/* Create Request */}
        <Route
          path="/request/create"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CreateRequest />
            </ProtectedRoute>
          }
        />

        {/* Request Details */}
        <Route
          path="/request/:id"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <RequestDetails />
            </ProtectedRoute>
          }
        />

        {/* Help Request Detail - Citizen */}
        <Route
          path="/dashboard/user/help-request/:id"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <HelpRequestDetail />
            </ProtectedRoute>
          }
        />

        {/* Volunteer Dashboard */}
        <Route
          path="/volunteer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Help Request Detail - Volunteer */}
        <Route
          path="/dashboard/volunteer/help-request/:id"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <HelpRequestDetail />
            </ProtectedRoute>
          }
        />

        {/* Legacy volunteer path */}
        <Route
          path="/dashboard/volunteer"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Organizer Dashboard */}
        <Route
          path="/organizer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Legacy organizer path */}
        <Route
          path="/dashboard/organizer"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Create Event Page */}
        <Route
          path="/organizer/event/create"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />

        {/* Organizer Event Details */}
        <Route
          path="/organizer/event/:eventId"
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerEventDetails />
            </ProtectedRoute>
          }
        />

        {/* Event Details (Volunteer View) */}
        <Route
          path="/event/:eventId"
          element={
            <ProtectedRoute allowedRoles={['volunteer', 'organizer', 'admin', 'citizen']}>
              <EventDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Legacy Event Details Route */}
        <Route
          path="/events/:eventId"
          element={
            <ProtectedRoute allowedRoles={['volunteer', 'organizer', 'admin', 'citizen']}>
              <EventDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Messages */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={['volunteer', 'organizer', 'admin', 'citizen']}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </StatusProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'

const UserDashboard = () => {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  const [assistanceRequests, setAssistanceRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('role')

    if (!token || !storedRole) {
      navigate('/login', { replace: true })
      return
    }

    // Check if role matches (case-insensitive)
    if (storedRole.toLowerCase() !== 'user') {
      // Redirect to correct dashboard based on role
      navigate(`/dashboard/${storedRole.toLowerCase()}`, { replace: true })
      return
    }

    if (authUser) {
      setUser(authUser)
    }

    // Fetch user data
    fetchUserData()
  }, [navigate])

  const fetchUserData = async () => {
    try {
      // Placeholder API calls
      // const eventsResponse = await api.get('/events/public')
      // const requestsResponse = await api.get('/assistance/my-requests')
      
      // Mock data
      setEvents([
        { id: 1, title: 'Community Cleanup Day', date: '2024-02-15', location: 'Central Park', status: 'upcoming' },
        { id: 2, title: 'Food Drive', date: '2024-02-20', location: 'Community Center', status: 'upcoming' },
        { id: 3, title: 'Emergency Response Training', date: '2024-02-10', location: 'City Hall', status: 'completed' }
      ])
      
      setAssistanceRequests([
        { id: 1, type: 'Medical Assistance', status: 'pending', date: '2024-02-05' },
        { id: 2, type: 'Food Support', status: 'approved', date: '2024-01-28' }
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    navigate('/')
  }

  const handleRequestAssistance = () => {
    // Navigate to request assistance page
    alert('Request Assistance feature - to be implemented')
  }

  if (isLoading) {
    return (
      <div className="full-height page-background flex-center">
        <div className="text-center">
          <div className="animate-spin rounded-full" style={{width: '3rem', height: '3rem', borderBottom: '2px solid var(--primary-600)', margin: '0 auto'}}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="full-height page-background">
      {/* Header */}
      <header className="white-background shadow-sm border-b border-gray-200">
        <div style={{maxWidth: '80rem', margin: '0 auto'}} className="px-4 py-4">
          <div className="flex-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-700">UnityAid</h1>
              <p className="text-sm text-gray-600">User Dashboard</p>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-600">Welcome, {user?.fullName || 'User'}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{maxWidth: '80rem', margin: '0 auto'}} className="px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <button
            onClick={handleRequestAssistance}
            className="px-6 py-3 bg-emergency-600 text-white rounded-lg font-medium hover:bg-emergency-700 shadow-lg"
          >
            Request Assistance
          </button>
        </div>

        <div className="grid gap-6" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
          {/* Upcoming Events */}
          <div className="white-background rounded-lg shadow-lg p-6">
            <div className="flex-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Community Events</h2>
              <span className="text-sm text-gray-500">{events.filter(e => e.status === 'upcoming').length} events</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {events.filter(e => e.status === 'upcoming').map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-1">{event.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 gap-4">
                    <span>📅 {event.date}</span>
                    <span>📍 {event.location}</span>
                  </div>
                  <button className="mt-2 text-sm text-primary-600 font-medium">
                    View Details →
                  </button>
                </div>
              ))}
              {events.filter(e => e.status === 'upcoming').length === 0 && (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              )}
            </div>
          </div>

          {/* My Assistance Requests */}
          <div className="white-background rounded-lg shadow-lg p-6">
            <div className="flex-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">My Assistance Requests</h2>
              <span className="text-sm text-gray-500">{assistanceRequests.length} requests</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {assistanceRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex-between mb-2">
                    <h3 className="font-medium text-gray-800">{request.type}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      request.status === 'approved' ? 'bg-green-100 text-green-700' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Requested on: {request.date}</p>
                </div>
              ))}
              {assistanceRequests.length === 0 && (
                <p className="text-gray-500 text-center py-4">No assistance requests</p>
              )}
            </div>
          </div>

          {/* Community Resources */}
          <div className="white-background rounded-lg shadow-lg p-6" style={{gridColumn: 'span 1 / -1'}}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Community Resources</h2>
            <div className="grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Emergency Contacts</h3>
                <p className="text-sm text-gray-600">Quick access to emergency services and support</p>
                <button className="mt-2 text-sm text-primary-600 font-medium">
                  View Contacts →
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Community Guidelines</h3>
                <p className="text-sm text-gray-600">Learn about community safety and protocols</p>
                <button className="mt-2 text-sm text-primary-600 font-medium">
                  Read Guidelines →
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Volunteer Opportunities</h3>
                <p className="text-sm text-gray-600">Discover ways to help your community</p>
                <button className="mt-2 text-sm text-primary-600 font-medium">
                  Browse Opportunities →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDashboard


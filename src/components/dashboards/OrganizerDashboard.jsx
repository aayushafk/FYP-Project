import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import CreateEventModal from '../features/events/CreateEventModal'
import { useAuth } from '../../contexts/AuthContext'

const OrganizerDashboard = () => {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalVolunteers: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('role')

    if (!token || !storedRole) {
      navigate('/login', { replace: true })
      return
    }

    // Check if role matches (case-insensitive)
    if (storedRole.toLowerCase() !== 'organizer') {
      // Redirect to correct dashboard based on role
      navigate(`/dashboard/${storedRole.toLowerCase()}`, { replace: true })
      return
    }

    if (authUser) {
      setUser(authUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }

    fetchOrganizerData()
  }, [navigate])

  const fetchOrganizerData = async () => {
    try {
      // Placeholder API calls
      // const eventsResponse = await api.get('/organizer/events')
      // const volunteersResponse = await api.get('/organizer/volunteers')
      // const statsResponse = await api.get('/organizer/stats')
      
      // Mock data
      setEvents([
        { id: 1, title: 'Community Cleanup Day', date: '2024-02-15', location: 'Central Park', volunteers: 18, maxVolunteers: 20, status: 'active' },
        { id: 2, title: 'Food Drive', date: '2024-02-20', location: 'Community Center', volunteers: 12, maxVolunteers: 15, status: 'active' },
        { id: 3, title: 'Emergency Response Training', date: '2024-02-10', location: 'City Hall', volunteers: 25, maxVolunteers: 25, status: 'completed' }
      ])
      
      setVolunteers([
        { id: 1, name: 'John Doe', email: 'john@example.com', skills: ['Medical', 'Rescue'], eventsAttended: 5 },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', skills: ['Logistics', 'Transportation'], eventsAttended: 8 },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', skills: ['General Support'], eventsAttended: 3 }
      ])
      
      setStats({
        totalEvents: 12,
        activeEvents: 2,
        totalVolunteers: 45
      })
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

  const handleCreateEvent = () => {
    setIsCreateEventModalOpen(true)
  }

  const handleEventCreated = (newEvent) => {
    // Add the new event to the list
    setEvents([newEvent, ...events])
    // Update stats
    setStats({
      ...stats,
      totalEvents: stats.totalEvents + 1,
      activeEvents: stats.activeEvents + 1
    })
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
              <p className="text-sm text-gray-600">Organizer Dashboard</p>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-600">Welcome, {user?.fullName || 'Organizer'}</span>
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
            onClick={handleCreateEvent}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 shadow-lg"
          >
            + Create New Event
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 mb-8" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
          <div className="white-background rounded-lg shadow-lg p-6" style={{borderLeft: '4px solid var(--blue-500)'}}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Events</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
          </div>
          <div className="white-background rounded-lg shadow-lg p-6" style={{borderLeft: '4px solid var(--green-500)'}}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Events</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.activeEvents}</p>
          </div>
          <div className="white-background rounded-lg shadow-lg p-6" style={{borderLeft: '4px solid var(--purple-500)'}}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Volunteers</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalVolunteers}</p>
          </div>
        </div>

        <div className="grid gap-6" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
          {/* My Events */}
          <div className="white-background rounded-lg shadow-lg p-6">
            <div className="flex-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">My Events</h2>
              <span className="text-sm text-gray-500">{events.length} events</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {events.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex-between mb-2">
                    <h3 className="font-medium text-gray-800">{event.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'active' ? 'bg-green-100 text-green-700' :
                      event.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 gap-4 mb-2">
                    <span>📅 {event.date}</span>
                    <span>📍 {event.location}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Volunteers</span>
                      <span className="font-medium">{event.volunteers} / {event.maxVolunteers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(event.volunteers / event.maxVolunteers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                      Manage
                    </button>
                    <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-gray-500 text-center py-4">No events created yet</p>
              )}
            </div>
          </div>

          {/* Volunteers */}
          <div className="white-background rounded-lg shadow-lg p-6">
            <div className="flex-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Volunteers</h2>
              <span className="text-sm text-gray-500">{volunteers.length} volunteers</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {volunteers.map((volunteer) => (
                <div key={volunteer.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-1">{volunteer.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{volunteer.email}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {volunteer.skills.map((skill, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{volunteer.eventsAttended} events attended</span>
                    <button className="text-sm text-primary-600 font-medium">
                      View Profile →
                    </button>
                  </div>
                </div>
              ))}
              {volunteers.length === 0 && (
                <p className="text-gray-500 text-center py-4">No volunteers yet</p>
              )}
            </div>
          </div>

          {/* Event Management Tools */}
          <div className="white-background rounded-lg shadow-lg p-6" style={{gridColumn: 'span 1 / -1'}}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Management Tools</h2>
            <div className="grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">📊 Analytics</h3>
                <p className="text-sm text-gray-600 mb-3">View event performance and volunteer engagement metrics</p>
                <button className="text-sm text-primary-600 font-medium">
                  View Analytics →
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">📝 Reports</h3>
                <p className="text-sm text-gray-600 mb-3">Generate and download event reports and summaries</p>
                <button className="text-sm text-primary-600 font-medium">
                  Generate Report →
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">⚙️ Settings</h3>
                <p className="text-sm text-gray-600 mb-3">Manage your organizer profile and preferences</p>
                <button className="text-sm text-primary-600 font-medium">
                  Open Settings →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onEventCreated={handleEventCreated}
        />
      </main>
    </div>
  )
}

export default OrganizerDashboard


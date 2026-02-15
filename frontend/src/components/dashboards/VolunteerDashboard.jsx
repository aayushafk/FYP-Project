import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'

const VolunteerDashboard = () => {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [availableEvents, setAvailableEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [stats, setStats] = useState({
    totalHours: 0,
    eventsAttended: 0,
    upcomingEvents: 0
  })
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
    if (storedRole.toLowerCase() !== 'volunteer') {
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

    fetchVolunteerData()
  }, [navigate])

  const fetchVolunteerData = async () => {
    try {
      // Placeholder API calls
      // const availableResponse = await api.get('/events/available')
      // const myEventsResponse = await api.get('/volunteer/my-events')
      // const statsResponse = await api.get('/volunteer/stats')
      
      // Mock data
      setAvailableEvents([
        { id: 1, title: 'Community Cleanup Day', date: '2024-02-15', location: 'Central Park', volunteersNeeded: 20, skills: ['General Support', 'Logistics'] },
        { id: 2, title: 'Food Drive', date: '2024-02-20', location: 'Community Center', volunteersNeeded: 15, skills: ['Food Service', 'Transportation'] },
        { id: 3, title: 'Medical Outreach', date: '2024-02-18', location: 'Health Clinic', volunteersNeeded: 10, skills: ['Medical', 'Communication'] }
      ])
      
      setMyEvents([
        { id: 4, title: 'Emergency Response Training', date: '2024-02-10', location: 'City Hall', status: 'confirmed', hours: 4 },
        { id: 5, title: 'Shelter Setup', date: '2024-02-12', location: 'Community Center', status: 'confirmed', hours: 6 }
      ])
      
      setStats({
        totalHours: 25,
        eventsAttended: 8,
        upcomingEvents: 2
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

  const handleJoinEvent = async (eventId) => {
    try {
      // await api.post(`/events/${eventId}/join`)
      alert(`Successfully joined event!`)
      fetchVolunteerData()
    } catch (error) {
      alert('Failed to join event. Please try again.')
    }
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
              <p className="text-sm text-gray-600">Volunteer Dashboard</p>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-600">Welcome, {user?.fullName || 'Volunteer'}</span>
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
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
          <div className="white-background rounded-lg shadow-lg p-6" style={{borderLeft: '4px solid var(--green-500)'}}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Volunteer Hours</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalHours}</p>
          </div>
          <div className="white-background rounded-lg shadow-lg p-6" style={{borderLeft: '4px solid var(--blue-500)'}}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Events Attended</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.eventsAttended}</p>
          </div>
          <div className="white-background rounded-lg shadow-lg p-6" style={{borderLeft: '4px solid var(--purple-500)'}}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Upcoming Events</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
          </div>
        </div>

        <div className="grid gap-6" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
          {/* Available Events */}
          <div className="white-background rounded-lg shadow-lg p-6">
            <div className="flex-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Available Events</h2>
              <span className="text-sm text-gray-500">{availableEvents.length} events</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {availableEvents.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">{event.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 gap-4 mb-2">
                    <span>📅 {event.date}</span>
                    <span>📍 {event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {event.volunteersNeeded} volunteers needed
                    </span>
                    <div className="flex gap-1">
                      {event.skills.map((skill, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinEvent(event.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    style={{width: '100%'}}
                  >
                    Join Event
                  </button>
                </div>
              ))}
              {availableEvents.length === 0 && (
                <p className="text-gray-500 text-center py-4">No available events</p>
              )}
            </div>
          </div>

          {/* My Events */}
          <div className="white-background rounded-lg shadow-lg p-6">
            <div className="flex-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">My Events</h2>
              <span className="text-sm text-gray-500">{myEvents.length} events</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {myEvents.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex-between mb-2">
                    <h3 className="font-medium text-gray-800">{event.title}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 gap-4 mb-2">
                    <span>📅 {event.date}</span>
                    <span>📍 {event.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hours: {event.hours}</span>
                    <button className="text-sm text-primary-600 font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
              {myEvents.length === 0 && (
                <p className="text-gray-500 text-center py-4">No events joined yet</p>
              )}
            </div>
          </div>

          {/* My Skills */}
          <div className="white-background rounded-lg shadow-lg p-6" style={{gridColumn: 'span 1 / -1'}}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user?.skills?.map((skill, idx) => (
                <span key={idx} className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium">
                  {skill}
                </span>
              )) || (
                <p className="text-gray-500">No skills listed</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default VolunteerDashboard


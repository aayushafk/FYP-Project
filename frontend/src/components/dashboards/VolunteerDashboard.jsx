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
      // Fetch available events and help requests
      const availableResponse = await api.get('/volunteer/available-events');
      const myEventsResponse = await api.get('/volunteer/my-events');
      
      setAvailableEvents(availableResponse.data.events || []);
      setMyEvents(myEventsResponse.data.events || []);
      
      // Calculate stats
      const completedEvents = myEventsResponse.data.events.filter(e => {
        const assignment = e.volunteerAssignments?.find(
          a => a.volunteerId?._id === authUser._id || a.volunteerId === authUser._id
        );
        return assignment?.status === 'Completed';
      });
      
      setStats({
        totalHours: completedEvents.length * 4, // Estimate 4 hours per event
        eventsAttended: completedEvents.length,
        upcomingEvents: myEventsResponse.data.events.filter(e => e.status !== 'completed').length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
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
      await api.post(`/volunteer/event/${eventId}/accept`);
      showToast({ type: 'success', message: 'Successfully joined!' });
      fetchVolunteerData();
    } catch (error) {
      showToast({ type: 'error', message: error.response?.data?.message || 'Failed to join. Please try again.' });
    }
  }

  const showToast = ({ type, message }) => {
    alert(message); // Simple alert for now, can be replaced with proper toast
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
      {/* CSS for pulse animation */}
      <style>{`
        @keyframes emergency-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
          }
        }
        .emergency-card {
          animation: emergency-pulse 2s ease-in-out infinite;
        }
      `}</style>
      
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
              <h2 className="text-xl font-semibold text-gray-800">Available Opportunities</h2>
              <span className="text-sm text-gray-500">{availableEvents.length} opportunities</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {availableEvents.map((event) => (
                <div 
                  key={event._id} 
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    event.isEmergency && event.type === 'citizen' 
                      ? 'border-red-400 bg-red-50 emergency-card' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => navigate(`/event/${event._id}`)}
                  style={event.isEmergency && event.type === 'citizen' ? {
                    borderWidth: '2px',
                    backgroundColor: '#fef2f2'
                  } : {}}
                >
                  {/* Emergency Badge */}
                  {event.isEmergency && event.type === 'citizen' && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm font-bold bg-red-600 text-white px-3 py-1.5 rounded shadow-md uppercase tracking-wide">
                        🚨 EMERGENCY
                      </span>
                      <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                        Immediate Response Needed
                      </span>
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    {event.type === 'citizen' ? (
                      <span className="text-xs font-semibold bg-teal-100 text-teal-800 px-2 py-1 rounded">
                        🧑‍💼 From Citizen
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        📅 Organizer Event
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-800 mb-2">{event.title}</h3>
                  
                  {/* Creator Name for Citizen Requests */}
                  {event.type === 'citizen' && event.createdBy && (
                    <div className="text-xs text-gray-600 mb-2">
                      By: {event.createdBy.fullName || 'Citizen'}
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600 gap-4 mb-2">
                    <span>📍 {event.location}</span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{event.description}</p>
                  
                  {event.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {event.requiredSkills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                      {event.requiredSkills.length > 3 && (
                        <span className="text-xs text-gray-500">+{event.requiredSkills.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mb-3">
                    Created: {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinEvent(event._id);
                    }}
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                      event.isEmergency && event.type === 'citizen'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    style={{width: '100%'}}
                  >
                    {event.isEmergency && event.type === 'citizen' ? '🚨 Respond Immediately' : '✅ Participate'}
                  </button>
                </div>
              ))}
              {availableEvents.length === 0 && (
                <p className="text-gray-500 text-center py-4">No available opportunities</p>
              )}
            </div>
          </div>

          {/* My Events */}
          <div className="white-background rounded-lg shadow-lg p-6">
            <div className="flex-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">My Participations</h2>
              <span className="text-sm text-gray-500">{myEvents.length} events</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {myEvents.map((event) => {
                const myAssignment = event.volunteerAssignments?.find(
                  a => a.volunteerId?._id === authUser._id || a.volunteerId === authUser._id
                );
                const myStatus = myAssignment?.status || 'Pending';
                
                return (
                  <div 
                    key={event._id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    {/* Type Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      {event.type === 'citizen' ? (
                        <span className="text-xs font-semibold bg-teal-100 text-teal-800 px-2 py-1 rounded">
                          🧑‍💼 Help Request
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          📅 Event
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        myStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                        myStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        myStatus === 'Assigned' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {myStatus}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-gray-800 mb-2">{event.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 gap-4 mb-2">
                      <span>📍 {event.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event/${event._id}`);
                        }}
                        className="text-sm text-primary-600 font-medium hover:text-primary-700"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
              {myEvents.length === 0 && (
                <p className="text-gray-500 text-center py-4">No participations yet</p>
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


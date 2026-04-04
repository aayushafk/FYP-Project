// Event Card Component with Skill Matching Display
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const EventCard = ({ event, volunteerSkills = [], onEventJoined, userRole = 'volunteer' }) => {
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')
  const [joinStatus, setJoinStatus] = useState(null) // 'success', 'error', null
  const [hasJoined, setHasJoined] = useState(false)

  const getSkillMatch = () => {
    if (!Array.isArray(event.requiredSkills) || !Array.isArray(volunteerSkills)) {
      return { matches: [], percentage: 0, isOpenToAll: false }
    }

    const isOpenToAll = event.requiredSkills.includes('General Support')
    if (isOpenToAll) {
      return { matches: ['General Support'], percentage: 100, isOpenToAll: true }
    }

    const matched = volunteerSkills.filter(skill => event.requiredSkills.includes(skill))
    const percentage = event.requiredSkills.length > 0
      ? Math.round((matched.length / event.requiredSkills.length) * 100)
      : 0

    return { matches: matched, percentage, isOpenToAll: false }
  }

  const getLabel = (skillMatch) => {
    if (skillMatch.isOpenToAll) {
      return { text: 'Open to All Volunteers', color: 'green', icon: '🌍' }
    }
    if (skillMatch.percentage === 100) {
      return { text: 'Skill Match', color: 'blue', icon: '✓' }
    }
    if (skillMatch.percentage > 0) {
      return { text: `${skillMatch.percentage}% Match`, color: 'yellow', icon: '⚠️' }
    }
    return { text: 'No Special Skills Required', color: 'gray', icon: '👥' }
  }

  const handleJoinEvent = async () => {
    try {
      setIsJoining(true)
      setJoinMessage('')
      setJoinStatus(null)

      const response = await api.post(`/volunteer/event/${event._id}/request`)
      
      setJoinStatus('success')
      setJoinMessage('Successfully joined the event!')
      setHasJoined(true)
      
      // Notify parent component
      if (onEventJoined) {
        onEventJoined(event)
      }

      // Clear message after 3 seconds
      setTimeout(() => {
        setJoinMessage('')
        setJoinStatus(null)
      }, 3000)
    } catch (error) {
      setJoinStatus('error')
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join event'
      setJoinMessage(errorMessage)
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setJoinMessage('')
        setJoinStatus(null)
      }, 5000)
    } finally {
      setIsJoining(false)
    }
  }

  const skillMatch = getSkillMatch()
  const label = getLabel(skillMatch)

  const colorClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Safe date formatting with fallback
  const formatEventDate = (dateString) => {
    try {
      if (!dateString) return 'Date not available'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch (e) {
      return 'Invalid date'
    }
  }

  const formatEventTime = (dateString) => {
    try {
      if (!dateString) return ''
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid time'
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    } catch (e) {
      return 'Invalid time'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with Title and Badge */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${colorClasses[label.color]}`}>
            {label.icon} {label.text}
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-5 space-y-4">
        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">📅</span>
            <div>
              <p className="font-medium text-gray-900">{formatEventDate(event.startDateTime)}</p>
              <p className="text-xs">{formatEventTime(event.startDateTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">📍</span>
            <p className="font-medium text-gray-900">{event.location || 'Location not available'}</p>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">👥</span>
            <p className="font-medium text-gray-900">{event.volunteersNeeded} Volunteers</p>
          </div>
          {event.contactInfo && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">📞</span>
              <p className="font-medium text-gray-900">{event.contactInfo}</p>
            </div>
          )}
        </div>

        {/* Skills Section */}
        {event.requiredSkills && event.requiredSkills.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Required / Preferred Skills</p>
            <div className="flex flex-wrap gap-2">
              {event.requiredSkills.map((skill) => {
                const hasSkill = volunteerSkills.includes(skill)
                return (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      skill === 'General Support'
                        ? 'bg-green-100 text-green-700'
                        : hasSkill
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {skill === 'General Support' ? '🌍' : hasSkill ? '✓' : ''}
                    {skill}
                  </span>
                )
              })}
            </div>

            {/* Match Details */}
            {skillMatch.percentage > 0 && skillMatch.percentage < 100 && (
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700 font-medium">
                📊 {skillMatch.percentage}% of required skills match your profile
              </div>
            )}

            {/* Skill Gap Warning */}
            {userRole === 'volunteer' && skillMatch.percentage > 0 && skillMatch.percentage < 100 && (
              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                <strong>Missing skills:</strong> {event.requiredSkills.filter(s => !volunteerSkills.includes(s)).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Expand Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showDetails ? '▼ Hide Details' : '▶ Show Details'}
        </button>

        {/* Expanded Details */}
        {showDetails && (
          <div className="pt-3 border-t border-gray-200 space-y-3">
            {event.volunteerRoles && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">VOLUNTEER ROLES</p>
                <p className="text-sm text-gray-600">{event.volunteerRoles}</p>
              </div>
            )}
            {event.isRepeating && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">FREQUENCY</p>
                <p className="text-sm text-gray-600">Repeating Event</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">STATUS</p>
              <p className="text-sm text-gray-600 capitalize">{event.status || 'Upcoming'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Display */}
      {joinMessage && (
        <div className={`px-5 py-3 ${
          joinStatus === 'success'
            ? 'bg-green-50 border-t border-green-200 text-green-700'
            : 'bg-red-50 border-t border-red-200 text-red-700'
        } text-sm font-medium`}>
          {joinStatus === 'success' ? '✓' : '✕'} {joinMessage}
        </div>
      )}

      {/* Action Footer */}
      {userRole === 'volunteer' && (
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex gap-2">
          <button
            onClick={handleJoinEvent}
            disabled={isJoining || hasJoined}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
              hasJoined
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
            }`}
          >
            {isJoining ? '⏳ Joining...' : hasJoined ? '✓ Joined' : 'Join Event'}
          </button>
          <button 
            onClick={() => navigate(`/event/${event._id}`)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium text-sm"
          >
            View Details
          </button>
        </div>
      )}
}

export default EventCard

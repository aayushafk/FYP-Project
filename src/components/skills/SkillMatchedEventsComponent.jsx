import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'

const SkillMatchedEvents = () => {
  const [events, setEvents] = useState([])
  const [volunteer, setVolunteer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterBy, setFilterBy] = useState('all') // 'all', 'matched', 'general'
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      setVolunteer(user)
    }
    fetchEvents()
  }, [user])

  const fetchEvents = async () => {
    try {
      const response = await api.get('/volunteer/events')
      setEvents(response.data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSkillMatch = (eventSkills, volunteerSkills) => {
    if (!Array.isArray(eventSkills) || !Array.isArray(volunteerSkills)) {
      return { matches: [], percentage: 0, isOpen: false }
    }

    const isOpenToAll = eventSkills.includes('General Support')
    if (isOpenToAll) {
      return { matches: ['General Support'], percentage: 100, isOpen: true }
    }

    const matched = volunteerSkills.filter(skill => eventSkills.includes(skill))
    const percentage = eventSkills.length > 0 ? Math.round((matched.length / eventSkills.length) * 100) : 0

    return { matches: matched, percentage, isOpen: false }
  }

  const filteredEvents = events.filter(event => {
    const skillMatch = getSkillMatch(event.requiredSkills, volunteer?.skills || [])
    
    if (filterBy === 'matched') {
      return skillMatch.matches.length > 0
    }
    if (filterBy === 'general') {
      return skillMatch.isOpen
    }
    return true
  })

  const getEventLabel = (event, skillMatch) => {
    if (skillMatch.isOpen) {
      return 'Open to All Volunteers'
    }
    if (skillMatch.percentage === 100) {
      return 'Skill Match'
    }
    if (skillMatch.percentage > 0) {
      return 'Partial Match'
    }
    return 'No Special Skills Required'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Options */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterBy('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterBy === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Events ({events.length})
        </button>
        <button
          onClick={() => setFilterBy('matched')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterBy === 'matched'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Matches Your Skills
        </button>
        <button
          onClick={() => setFilterBy('general')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterBy === 'general'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Open to All
        </button>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No events found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => {
            const skillMatch = getSkillMatch(event.requiredSkills, volunteer?.skills || [])
            const label = getEventLabel(event, skillMatch)

            return (
              <div key={event._id} className="bg-white rounded-lg shadow border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    skillMatch.isOpen
                      ? 'bg-green-100 text-green-700'
                      : skillMatch.percentage === 100
                      ? 'bg-blue-100 text-blue-700'
                      : skillMatch.percentage > 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {label}
                  </div>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>📅 {new Date(event.startDateTime).toLocaleDateString()}</div>
                  <div>📍 {event.location}</div>
                  <div>👥 {event.volunteersNeeded} volunteers needed</div>
                  <div>⏰ {new Date(event.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>

                {/* Skills Section */}
                {event.requiredSkills && event.requiredSkills.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {event.requiredSkills.map(skill => {
                        const isMatch = volunteer?.skills?.includes(skill)
                        return (
                          <span
                            key={skill}
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              skill === 'General Support'
                                ? 'bg-green-100 text-green-700'
                                : isMatch
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {skill === 'General Support' ? '🌍 ' : ''}
                            {skill}
                            {isMatch && skill !== 'General Support' && ' ✓'}
                          </span>
                        )
                      })}
                    </div>
                    
                    {skillMatch.matches.length > 0 && skillMatch.percentage < 100 && (
                      <p className="text-xs text-blue-700 mt-2">
                        {skillMatch.percentage}% of required skills match
                      </p>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm">
                  View Event Details
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SkillMatchedEvents

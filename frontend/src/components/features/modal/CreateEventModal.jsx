import { useState } from 'react'
import api from '../../../utils/api'

const VOLUNTEER_SKILLS = [
  'General Support',
  'First Aid',
  'Medical Assistance',
  'Food Distribution',
  'Logistics & Transport',
  'Crowd Management',
  'Teaching & Tutoring',
  'Disaster Relief',
  'Counseling Support',
  'Technical Support',
  'Translation'
];

const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    volunteersNeeded: 0,
    isRepeating: false,
    requiredSkills: [],
    volunteerRoles: '',
    contactInfo: ''
  })

  const [selectedSkills, setSelectedSkills] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill)
      } else {
        return [...prev, skill]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Event title is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Event description is required')
      }
      if (!formData.startDateTime) {
        throw new Error('Start date and time are required')
      }
      if (!formData.endDateTime) {
        throw new Error('End date and time are required')
      }
      if (new Date(formData.startDateTime) >= new Date(formData.endDateTime)) {
        throw new Error('End date must be after start date')
      }
      if (!formData.location.trim()) {
        throw new Error('Location is required')
      }

      const eventData = {
        ...formData,
        requiredSkills: selectedSkills,
        volunteersNeeded: parseInt(formData.volunteersNeeded) || 0
      }

      const response = await api.post('/organizer/event', eventData)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        location: '',
        volunteersNeeded: 0,
        isRepeating: false,
        requiredSkills: [],
        volunteerRoles: '',
        contactInfo: ''
      })
      setSelectedSkills([])

      if (onEventCreated) {
        onEventCreated(response.data.event)
      }

      onClose()
    } catch (err) {
      setError(err.message || 'Error creating event')
      console.error('Error creating event:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Community Cleanup Day"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the event and what volunteers will do"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Central Park, Downtown"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={formData.startDateTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={formData.endDateTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information
              </label>
              <input
                type="text"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleInputChange}
                placeholder="Phone or email for event coordination"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Volunteer Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Volunteer Requirements</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volunteers Needed
                </label>
                <input
                  type="number"
                  name="volunteersNeeded"
                  value={formData.volunteersNeeded}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volunteer Roles
                </label>
                <input
                  type="text"
                  name="volunteerRoles"
                  value={formData.volunteerRoles}
                  onChange={handleInputChange}
                  placeholder="e.g., Team Lead, Helper"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isRepeating"
                  checked={formData.isRepeating}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Is this a repeating event?</span>
              </label>
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Required / Preferred Skills</h3>
            <p className="text-sm text-gray-600">Select the skills needed for volunteers on this event</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Select "General Support" to notify all registered volunteers. 
                Select specific skills to notify only volunteers with those skills.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {VOLUNTEER_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all text-left ${
                    selectedSkills.includes(skill)
                      ? skill === 'General Support'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {skill === 'General Support' ? '🌍 ' : ''}{skill}
                </button>
              ))}
            </div>

            {selectedSkills.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Selected Skills ({selectedSkills.length}):
                </p>
                {selectedSkills.includes('General Support') && (
                  <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-700 font-medium">
                    ✓ All registered volunteers will be notified about this event
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map(skill => (
                    <span
                      key={skill}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        skill === 'General Support'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className="font-bold hover:opacity-70"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEventModal

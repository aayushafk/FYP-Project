import { useState, useEffect } from 'react'
import api from '../../utils/api'
import SkillSelectorComponent from '../skills/SkillSelectorComponent'
import { useAuth } from '../../contexts/AuthContext'

const VolunteerProfileSetup = () => {
  const [user, setUser] = useState(null)
  const [skills, setSkills] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const { user: authUser } = useAuth()

  useEffect(() => {
    if (authUser) {
      setUser(authUser)
      setSkills(authUser.skills || [])
    }
  }, [authUser])

  const handleSaveSkills = async () => {
    if (skills.length === 0) {
      setError('Please select at least one skill')
      return
    }

    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await api.put('/volunteer/profile', { skills })
      
      // Update local storage
      const updatedUser = { ...user, skills }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      setMessage('Skills updated successfully!')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating skills')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
        <p className="text-gray-600 mt-1">Manage your skills and preferences</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Volunteer Info */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <p className="text-gray-900">{user?.fullName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <p className="text-gray-900">{user?.phoneNumber || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <p className="text-gray-900 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Skills</h3>
        
        <SkillSelectorComponent
          selectedSkills={skills}
          onSkillsChange={setSkills}
          required={true}
          error={null}
        />

        <div className="flex gap-3">
          <button
            onClick={handleSaveSkills}
            disabled={isLoading || skills.length === 0}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => setSkills(user?.skills || [])}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Skills Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How Skills Work</h4>
        <ul className="text-sm text-blue-900 space-y-1">
          <li>• <strong>General Support</strong> - Select if you're willing to help with any volunteer work</li>
          <li>• <strong>Specific Skills</strong> - Select skills where you have expertise or experience</li>
          <li>• <strong>Notifications</strong> - You'll get notified about events matching your skills</li>
          <li>• <strong>Flexibility</strong> - You can still join any event, skills just help with matching</li>
        </ul>
      </div>
    </div>
  )
}

export default VolunteerProfileSetup

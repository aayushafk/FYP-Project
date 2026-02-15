import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import AuthLayout from '../../components/layouts/AuthLayout'
import { Card, CardBody } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import SkillSelectorComponent from '../../components/skills/SkillSelectorComponent'


const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'citizen',
    skills: [],
    phoneNumber: '',
    // Organizer fields
    organizationName: '',
    registrationNumber: '',
    officialEmail: '',
    organizationAddress: '',
    contactNumber: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const navigate = useNavigate()

  const roles = [
    { value: 'citizen', label: 'Citizen' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'organizer', label: 'Organizer' }
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (type === 'checkbox' && name === 'skills') {
      setFormData(prev => ({
        ...prev,
        skills: checked
          ? [...prev.skills, value]
          : prev.skills.filter(skill => skill !== value)
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (registerError) setRegisterError('')
  }

  const handleSkillsChange = (skills) => {
    setFormData(prev => ({ ...prev, skills }))
    if (errors.skills) {
      setErrors(prev => ({ ...prev, skills: '' }))
    }
    if (registerError) setRegisterError('')
  }

  const handleRoleChange = (roleValue) => {
    setFormData(prev => ({ ...prev, role: roleValue }))
    // Reset role specific errors potentially?
    if (registerError) setRegisterError('')
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    else if (formData.fullName.trim().length < 2) newErrors.fullName = 'Full name must be at least 2 characters'

    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address'

    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (!formData.role) newErrors.role = 'Please select a role'

    // Phone number validation
    if (formData.role === 'citizen' || formData.role === 'volunteer') {
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
    }

    // Skills validation for volunteer
    if (formData.role === 'volunteer') {
      if (!formData.skills || formData.skills.length === 0) {
        newErrors.skills = 'Please select at least one skill'
      }
    }

    // Organizer validations
    if (formData.role === 'organizer') {
      if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required'
      if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required'
      if (!formData.officialEmail.trim()) newErrors.officialEmail = 'Official email is required'

      if (!formData.organizationAddress.trim()) newErrors.organizationAddress = 'Organization address is required'
      if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setRegisterError('')

    if (!validate()) {
      // Show first error in the form
      const firstErrorKey = Object.keys(errors)[0]
      if (firstErrorKey === 'skills') {
        setRegisterError('Please select at least one skill to continue')
      }
      return
    }

    setIsLoading(true)

    try {
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      }

      if (formData.role === 'citizen' || formData.role === 'volunteer') {
        registrationData.phoneNumber = formData.phoneNumber
      }

      if (formData.role === 'volunteer') {
        registrationData.skills = formData.skills
        console.log('Volunteer skills:', formData.skills)
      }

      if (formData.role === 'organizer') {
        registrationData.organizationName = formData.organizationName
        registrationData.registrationNumber = formData.registrationNumber
        registrationData.officialEmail = formData.officialEmail
        registrationData.organizationAddress = formData.organizationAddress
        registrationData.contactNumber = formData.contactNumber
      }

      console.log('Final registration data:', registrationData)
      const response = await api.post('/auth/register', registrationData)

      if (response.data && response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('role', response.data.user.role)
        // Redirect based on role
        if (formData.role === 'citizen') navigate('/dashboard/user')
        else if (formData.role === 'volunteer') navigate('/dashboard/volunteer')
        else if (formData.role === 'organizer') navigate('/dashboard/organizer')
        else navigate('/')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Registration error:', error)
      console.error('Error response:', error.response?.data)
      
      let errorMessage = 'Registration failed. Please try again.'
      
      // Try to extract detailed error message from backend
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      // Special handling for skills errors
      if (error.response?.data?.code === 'NO_SKILLS_SELECTED') {
        errorMessage = '⚠️ Please select at least one skill before registering as a volunteer'
      } else if (error.response?.data?.code === 'NO_SKILLS') {
        errorMessage = '⚠️ Skills selection is required for volunteers'
      } else if (error.response?.data?.code === 'SKILLS_NOT_ARRAY') {
        errorMessage = '⚠️ There was an error with your skills selection. Please try again.'
      } else if (error.response?.data?.code === 'INVALID_SKILLS') {
        errorMessage = `⚠️ Invalid skills: ${error.response.data.invalidSkills?.join(', ') || 'unknown'}`
      }

      setRegisterError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create an Account"
      subtitle={
        <span>
          Already have an account? {' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </span>
      }
    >
      <Card>
        <CardBody className="space-y-6">
          {registerError && (
            <Alert variant="error" className="mb-4">
              {registerError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to register as...
              </label>
              <div className="grid grid-cols-3 gap-3 p-1 bg-gray-50 rounded-lg">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleChange(role.value)}
                    className={`
                      py-2 px-1 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-all duration-200
                      ${formData.role === role.value
                        ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Organizer Note */}
            {formData.role === 'organizer' && (
              <Alert variant="warning">
                Organizer accounts require admin verification before creating events.
              </Alert>
            )}

            {/* Common Fields */}
            <Input
              id="fullName"
              name="fullName"
              label="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="Full name"
              required
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
                required
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="••••••••"
                required
              />
            </div>

            {/* citizen & volunteer Fields */}
            {(formData.role === 'citizen' || formData.role === 'volunteer') && (
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                placeholder="Number"
                required
              />
            )}

            {/* volunteer Skills */}
            {formData.role === 'volunteer' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-900">
                    Select Your Skills <span className="text-red-500">*</span>
                  </label>
                  {formData.skills.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {formData.skills.length} selected
                    </span>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Tip:</strong> Select "General Support" if you're open to any task. Choose specific skills that match your expertise.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['General Support', 'First Aid', 'Medical Assistance', 'Food Distribution', 'Logistics & Transport', 'Crowd Management', 'Teaching & Tutoring', 'Disaster Relief', 'Counseling Support', 'Technical Support', 'Translation'].map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillsChange(
                        formData.skills.includes(skill)
                          ? formData.skills.filter(s => s !== skill)
                          : [...formData.skills, skill]
                      )}
                      className={`px-3 py-2 rounded-lg border-2 font-medium transition-all text-sm text-left ${
                        formData.skills.includes(skill)
                          ? skill === 'General Support'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {skill === 'General Support' && formData.skills.includes(skill) ? '✓ ' : ''}
                      {skill}
                    </button>
                  ))}
                </div>

                {formData.skills.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Your Selected Skills</p>
                    {formData.skills.includes('General Support') && (
                      <div className="mb-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-700 font-medium">
                        ✓ Open to participate in any volunteer opportunity
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map(skill => (
                        <div
                          key={skill}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            skill === 'General Support'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleSkillsChange(formData.skills.filter(s => s !== skill))}
                            className="ml-1 hover:opacity-70 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.skills && (
                  <div className="text-sm text-red-600 font-medium">
                    {errors.skills}
                  </div>
                )}

                {formData.skills.length === 0 && (
                  <div className="text-sm text-gray-600">
                    Please select at least one skill
                  </div>
                )}
              </div>
            )}

            {/* Using SkillSelectorComponent as fallback - can be used elsewhere */}
            {/* {formData.role === 'volunteer' && (
              <SkillSelectorComponent
                selectedSkills={formData.skills}
                onSkillsChange={handleSkillsChange}
                error={errors.skills}
                required={true}
              />
            )} */}

            {/* organizer Fields */}
            {formData.role === 'organizer' && (
              <div className="space-y-4 border-t border-gray-100 pt-4 mt-4">
                <h3 className="font-semibold text-gray-900">Organization Details</h3>

                <Input
                  id="organizationName"
                  name="organizationName"
                  label="Organization Name"
                  value={formData.organizationName}
                  onChange={handleChange}
                  error={errors.organizationName}
                  required
                />

                <Input
                  id="registrationNumber"
                  name="registrationNumber"
                  label="Registration Number"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  error={errors.registrationNumber}
                  required
                />

                <Input
                  id="officialEmail"
                  name="officialEmail"
                  type="email"
                  label="Official Email"
                  value={formData.officialEmail}
                  onChange={handleChange}
                  error={errors.officialEmail}
                  required
                />

                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  label="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  error={errors.contactNumber}
                  required
                />

                <div className="w-full">
                  <label htmlFor="organizationAddress" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Organization Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="organizationAddress"
                    name="organizationAddress"
                    rows="3"
                    value={formData.organizationAddress}
                    onChange={handleChange}
                    className={`
                      block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm outline-none transition-all
                      focus:ring-2 focus:ring-primary-500 focus:border-transparent
                      ${errors.organizationAddress
                        ? 'border-red-300 bg-red-50 focus:ring-red-500'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                      }
                    `}
                  />
                  {errors.organizationAddress && (
                    <p className="mt-1 text-sm text-red-600 animate-fadeIn">{errors.organizationAddress}</p>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </form>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

export default Register

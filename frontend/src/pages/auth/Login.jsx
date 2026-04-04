import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import { Card, CardBody } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { useAuth } from '../../contexts/AuthContext'

const Login = () => {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'citizen' // Default role
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  useEffect(() => {
    const disabledNotice = sessionStorage.getItem('auth_disabled_notice')
    if (disabledNotice) {
      setLoginError(disabledNotice)
      sessionStorage.removeItem('auth_disabled_notice')
    }
  }, [])

  const roles = [
    { value: 'citizen', label: 'Citizen' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'organizer', label: 'Organizer' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear field-specific error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    // Clear global error
    if (loginError) setLoginError('')
  }

  const handleRoleChange = (roleValue) => {
    setFormData(prev => ({ ...prev, role: roleValue }))
    if (loginError) setLoginError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')

    if (!validate()) return

    setIsLoading(true)

    try {
      const response = await axios.post(`${baseUrl}/api/auth/login`, {
        email: formData.email,
        password: formData.password,
        role: formData.role
      })

      if (response.data && response.data.token && response.data.user) {
        // Update both localStorage AND AuthContext state
        login(response.data.user, response.data.token)
        localStorage.setItem('role', response.data.user.role)

        const role = response.data.user.role?.toLowerCase();
        // Redirect based on role
        if (role === 'citizen' || role === 'user') navigate('/dashboard/user')
        else if (role === 'volunteer') navigate('/dashboard/volunteer')
        else if (role === 'organizer') navigate('/dashboard/organizer')
        else if (role === 'admin') navigate('/admin/dashboard')
        else navigate('/')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Login error:', error)
      const isUnauthorized = error.response?.status === 401
      const errorMessage = isUnauthorized
        ? 'Invalid credentials'
        : (error.response?.data?.message ||
          error.response?.data?.error ||
          'Login failed. Please try again.')
      setLoginError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle=""
    >
      <Card className="hover:shadow-xl transition-all">
        <CardBody className="space-y-6">
          {loginError && (
            <Alert variant="error" className="mb-4 animate-slideInDown">
              {loginError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection Tabs */}
            <div className="animate-slideInUp">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-lg">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleChange(role.value)}
                    className={`
                      py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-300 relative
                      ${formData.role === role.value
                        ? 'bg-white text-primary-700 shadow-md ring-2 ring-primary-300 scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                      }
                    `}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-slideInUp" style={{animationDelay: '0.1s'}}>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1 animate-slideInUp" style={{animationDelay: '0.2s'}}>
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <div className="flex justify-end items-center gap-4">
                <Link
                  to="/register"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition-all"
                >
                  Create an account
                </Link>
                <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition-all">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full animate-slideInUp"
              style={{animationDelay: '0.3s'}}
              size="lg"
              variant="primary"
            >
              Sign in as {roles.find(r => r.value === formData.role)?.label}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Admin Login Link */}
      <div className="mt-6 text-center animate-slideInUp" style={{animationDelay: '0.4s'}}>
        <Link
          to="/admin/login"
          className="text-sm text-gray-500 hover:text-primary-600 transition-colors font-medium"
        >
          Access Admin Portal
        </Link>
      </div>
    </AuthLayout>
  )
}

export default Login

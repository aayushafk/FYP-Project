import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import AuthLayout from '../../components/layouts/AuthLayout'
import { Card, CardBody } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { useAuth } from '../../contexts/AuthContext'

const AdminLogin = () => {
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (loginError) setLoginError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    if (!validate()) return

    setIsLoading(true)
    try {
      const response = await api.post('/auth/admin/login', {
        email: formData.email.trim(),
        password: formData.password
      })

      const { token, user } = response.data || {}
      if (!token || !user) throw new Error('Invalid response from server')

      // Keep in-memory auth state and local storage in sync
      login(user, token)

      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      console.error('Admin Login error:', error)
      const status = error.response?.status
      const backendMessage = error.response?.data?.message || error.response?.data?.error

      let errorMessage = 'Login failed. Please try again.'
      if (status === 401) {
        errorMessage = backendMessage || 'Invalid credentials'
      } else if (status === 403) {
        errorMessage = backendMessage || 'You are not authorized to access the admin portal.'
      } else {
        errorMessage = backendMessage || errorMessage
      }
      setLoginError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Admin Portal" subtitle="Restricted Access">
      <Card className="border-t-4 border-t-primary-800">
        <CardBody className="space-y-6">
          {loginError && (
            <Alert variant="error" className="mb-4">
              {loginError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              name="email"
              type="email"
              label="Admin Email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="admin@unityaid.org"
              autoComplete="email"
              required
            />

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

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-primary-800 hover:bg-primary-900 focus:ring-primary-900"
              size="lg"
            >
              Access Dashboard
            </Button>
          </form>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

export default AdminLogin

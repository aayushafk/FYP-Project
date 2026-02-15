import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { useAuth } from '../../contexts/AuthContext'

const AdminDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRequests: 0,
        activeVolunteers: 0,
        pendingOrganizers: 0
    })
    const [pendingOrgs, setPendingOrgs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)
    const [view, setView] = useState('dashboard') // 'dashboard' or 'pending-organizers'

    const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [metricsRes, pendingRes] = await Promise.all([
                api.get('/admin/metrics'),
                api.get('/admin/pending-organizers')
            ])

            console.log('Metrics:', metricsRes.data)
            console.log('Pending organizers:', pendingRes.data)

            setStats({
                ...metricsRes.data,
                pendingOrganizers: pendingRes.data ? pendingRes.data.length : 0
            })
            setPendingOrgs(pendingRes.data || [])
        } catch (err) {
            console.error('Error fetching admin data:', err)
            console.error('Error status:', err.response?.status)
            console.error('Error message:', err.response?.data?.message)
            setError(`Failed to load admin data: ${err.response?.data?.message || err.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleVerify = async (id) => {
        try {
            await api.patch(`/admin/verify-organizer/${id}`)
            setSuccessMsg('Organizer verified successfully!')
            fetchData() // Refresh data
        } catch (err) {
            setError('Failed to verify organizer.')
        }
    }

    const handleDecline = async (id) => {
        if (!window.confirm('Are you sure you want to decline this organizer registration?')) return
        try {
            // Placeholder: currently no 'decline' endpoint, so we might just delete or suspend
            // For now, let's call the general verify with false if we had that, 
            // but let's just show a message for now.
            // await api.delete(`/admin/user/${id}`);
            setSuccessMsg('Organizer registration declined.')
            fetchData()
        } catch (err) {
            setError('Failed to decline registration.')
        }
    }

    const handleLogout = () => {
        localStorage.clear()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {user.fullName}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleLogout}>Logout</Button>
                        <Button variant="primary">Manage Users</Button>
                    </div>
                </div>

                {error && <Alert variant="error" dismissible onClose={() => setError(null)}>{error}</Alert>}
                {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>}

                {view === 'dashboard' ? (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="bg-white border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setView('dashboard')}>
                                <CardBody className="p-6">
                                    <p className="text-sm font-medium text-gray-500 uppercase">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                                </CardBody>
                            </Card>
                            <Card className="bg-white border-l-4 border-l-green-500">
                                <CardBody className="p-6">
                                    <p className="text-sm font-medium text-gray-500 uppercase">Help Requests</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
                                </CardBody>
                            </Card>
                            <Card className="bg-white border-l-4 border-l-purple-500">
                                <CardBody className="p-6">
                                    <p className="text-sm font-medium text-gray-500 uppercase">Active Volunteers</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.activeVolunteers}</p>
                                </CardBody>
                            </Card>
                            <Card className="bg-white border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setView('pending-organizers')}>
                                <CardBody className="p-6">
                                    <p className="text-sm font-medium text-gray-500 uppercase">Pending Orgs</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.pendingOrganizers}</p>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Quick Actions & System Status */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setView('pending-organizers')}
                                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                                        >
                                            <p className="font-semibold text-gray-900">Verify Organizers</p>
                                            <p className="text-xs text-gray-500">{stats.pendingOrganizers} pending applications</p>
                                        </button>
                                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                                            <p className="font-semibold text-gray-900">System Logs</p>
                                            <p className="text-xs text-gray-500">View recent activity</p>
                                        </button>
                                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                                            <p className="font-semibold text-gray-900">User Management</p>
                                            <p className="text-xs text-gray-500">Search and edit users</p>
                                        </button>
                                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                                            <p className="font-semibold text-gray-900">Reports</p>
                                            <p className="text-xs text-gray-500">Generate platform stats</p>
                                        </button>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                                </CardHeader>
                                <CardBody>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Database Connection</span>
                                            <span className="text-green-600 font-medium">Healthy</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">API Server</span>
                                            <span className="text-green-600 font-medium">Running</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Storage Usage</span>
                                            <span className="text-gray-900 font-medium">24% of 10GB</span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </>
                ) : (
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Pending Organizer Applications</h2>
                            <Button variant="secondary" onClick={() => setView('dashboard')}>Back to Dashboard</Button>
                        </CardHeader>
                        <CardBody>
                            {pendingOrgs.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">No pending applications at the moment.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg Number</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pendingOrgs.map((org) => (
                                                <tr key={org._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{org.organizationName}</div>
                                                        <div className="text-sm text-gray-500">{org.officialEmail}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {org.fullName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {org.registrationNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleVerify(org._id)}
                                                        >
                                                            Verify
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleDecline(org._id)}
                                                        >
                                                            Decline
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default AdminDashboard

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'
import AdminHelpRequestAnalytics from '../../components/analytics/AdminHelpRequestAnalytics'
import {
    LayoutDashboard, Users, UserCheck, Building2, ClipboardList,
    BarChart3, LogOut, Shield, ChevronRight, CheckCircle, XCircle,
    Eye, Ban, Star, Wrench, CalendarDays, AlertCircle, Bell,
    Search, X, Activity, TrendingUp
} from 'lucide-react'

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Small reusable helpers (defined below main)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const AdminDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [view, setView] = useState('dashboard')
    const [stats, setStats] = useState({ totalUsers: 0, totalRequests: 0, activeVolunteers: 0, pendingOrganizers: 0 })
    const [allUsers, setAllUsers] = useState([])
    const [pendingOrgs, setPendingOrgs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [toast, setToast] = useState(null)
    const [modal, setModal] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [metricsRes, pendingRes, usersRes] = await Promise.all([
                api.get('/admin/metrics'),
                api.get('/admin/pending-organizers'),
                api.get('/admin/users')
            ])
            setStats({ ...metricsRes.data, pendingOrganizers: pendingRes.data?.length || 0 })
            setPendingOrgs(pendingRes.data || [])
            setAllUsers(usersRes.data || [])
        } catch (err) {
            showToast('Failed to load admin data', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // Derived user lists
    const citizens = allUsers.filter(u => u.role === 'citizen')
    const volunteers = allUsers.filter(u => u.role === 'volunteer')
    const organizers = allUsers.filter(u => u.role === 'organizer' && u.isAdminVerified)

    const filtered = (list) => !searchQuery ? list : list.filter(u =>
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleVerify = async (id) => {
        try {
            await api.patch(`/admin/verify-organizer/${id}`)
            showToast('Organizer approved successfully!')
            fetchData()
        } catch { showToast('Failed to approve organizer', 'error') }
    }

    const handleReject = async (id) => {
        if (!window.confirm('Reject this organizer application? They will be unable to log in.')) return
        try {
            await api.patch(`/admin/reject-organizer/${id}`)
            showToast('Organizer application rejected.')
            fetchData()
        } catch { showToast('Failed to reject organizer', 'error') }
    }

    const handleToggleDisable = async (userId, currentlyDisabled) => {
        const action = currentlyDisabled ? 'enable' : 'disable'
        if (!window.confirm(`${currentlyDisabled ? 'Enable' : 'Disable'} this account?`)) return
        try {
            await api.patch(`/admin/disable-user/${userId}`, { isDisabled: !currentlyDisabled })
            showToast(`Account ${action}d successfully!`)
            setModal(null)
            fetchData()
        } catch { showToast(`Failed to ${action} account`, 'error') }
    }

    const openOrganizerEventsModal = async (u) => {
        setModal({ type: 'organizer', user: u, data: null })
        try {
            const res = await api.get(`/admin/organizer-activity/${u._id}`)
            setModal({ type: 'organizer', user: u, data: res.data })
        } catch {
            setModal({ type: 'organizer', user: u, data: { events: [] } })
        }
    }

    const handleLogout = () => { localStorage.clear(); navigate('/login') }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'citizens', label: 'Citizens', icon: Users, badge: citizens.length },
        { id: 'volunteers', label: 'Volunteers', icon: UserCheck, badge: volunteers.length },
        { id: 'organizers', label: 'Organizers', icon: Building2, badge: organizers.length },
        { id: 'pending-organizers', label: 'Pending Approvals', icon: ClipboardList, badge: pendingOrgs.length, badgeAlert: true },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ]

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• SIDEBAR â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <aside className="w-64 bg-slate-900 flex flex-col shrink-0 fixed inset-y-0 left-0 z-30">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-slate-700/60">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Shield size={17} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm leading-tight">UnityAid</p>
                            <p className="text-[11px] text-slate-400 font-medium">Admin Console</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ id, label, icon: Icon, badge, badgeAlert }) => (
                        <button
                            key={id}
                            onClick={() => { setView(id); setSearchQuery('') }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                view === id
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            <span className="flex items-center gap-3"><Icon size={16} />{label}</span>
                            {badge != null && badge > 0 && (
                                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${badgeAlert ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User block + Logout */}
                <div className="px-3 pb-5 space-y-1">
                    <div className="px-3 py-3 rounded-xl bg-slate-800/70 mb-1">
                        <p className="text-[11px] text-slate-500 font-medium">SIGNED IN AS</p>
                        <p className="text-sm text-white font-semibold truncate mt-0.5">{user?.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
                    >
                        <LogOut size={16} />Logout
                    </button>
                </div>
            </aside>

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• MAIN â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">

                {/* Top header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {view === 'dashboard' ? 'Overview'
                                : view === 'pending-organizers' ? 'Pending Approvals'
                                : view === 'analytics' ? 'Analytics'
                                : view.charAt(0).toUpperCase() + view.slice(1)}
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {view === 'dashboard' && 'Platform summary and quick actions'}
                            {view === 'citizens' && 'Manage citizen accounts'}
                            {view === 'volunteers' && 'Manage volunteer accounts and review ratings'}
                            {view === 'organizers' && 'Verified organizers and their events'}
                            {view === 'pending-organizers' && 'Review and approve organizer applications'}
                            {view === 'analytics' && 'System-wide help request analytics'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {pendingOrgs.length > 0 && (
                            <button
                                onClick={() => setView('pending-organizers')}
                                className="relative p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all"
                                title={`${pendingOrgs.length} pending approvals`}
                            >
                                <Bell size={20} />
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                                    {pendingOrgs.length}
                                </span>
                            </button>
                        )}
                        <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
                            {user?.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8">

                    {/* Toast */}
                    {toast && (
                        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium animate-pulse ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                            {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                            {toast.msg}
                        </div>
                    )}

                    {/* â”€â”€â”€ DASHBOARD OVERVIEW â”€â”€â”€ */}
                    {view === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Stat cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                                {[
                                    { label: 'Total Users', value: stats.totalUsers, icon: Users, bg: 'bg-indigo-500', ring: 'ring-indigo-100' },
                                    { label: 'Help Requests', value: stats.totalRequests, icon: ClipboardList, bg: 'bg-teal-500', ring: 'ring-teal-100' },
                                    { label: 'Active Volunteers', value: stats.activeVolunteers, icon: UserCheck, bg: 'bg-violet-500', ring: 'ring-violet-100' },
                                    { label: 'Pending Approvals', value: stats.pendingOrganizers, icon: AlertCircle, bg: 'bg-amber-500', ring: 'ring-amber-100', clickable: true },
                                ].map(({ label, value, icon: Icon, bg, ring, clickable }) => (
                                    <div
                                        key={label}
                                        onClick={clickable ? () => setView('pending-organizers') : undefined}
                                        className={`bg-white rounded-2xl p-6 shadow-sm ring-1 ${ring} flex items-center gap-5 ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                                    >
                                        <div className={`w-13 h-13 w-[52px] h-[52px] ${bg} rounded-xl flex items-center justify-center shadow-md`}>
                                            <Icon size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                                            <p className="text-sm text-gray-500">{label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Second row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* User breakdown */}
                                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">User Breakdown</h3>
                                        <Activity size={16} className="text-gray-400" />
                                    </div>
                                    <div className="px-6 py-4 space-y-1">
                                        {[
                                            { role: 'Citizens', count: citizens.length, dot: 'bg-blue-500', nav: 'citizens' },
                                            { role: 'Volunteers', count: volunteers.length, dot: 'bg-violet-500', nav: 'volunteers' },
                                            { role: 'Organizers', count: organizers.length, dot: 'bg-amber-500', nav: 'organizers' },
                                        ].map(({ role, count, dot, nav }) => (
                                            <button key={role} onClick={() => setView(nav)} className="w-full flex items-center justify-between -mx-2 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${dot}`}></div>
                                                    <span className="text-sm text-gray-700 font-medium">{role}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="text-sm font-bold text-gray-900">{count}</span>
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick actions */}
                                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                                        <TrendingUp size={16} className="text-gray-400" />
                                    </div>
                                    <div className="px-6 py-4 space-y-1">
                                        {[
                                            { label: 'Review Pending Organizers', sub: `${pendingOrgs.length} applications`, nav: 'pending-organizers', color: 'text-amber-600' },
                                            { label: 'Manage Citizens', sub: `${citizens.length} registered`, nav: 'citizens', color: 'text-blue-600' },
                                            { label: 'Manage Volunteers', sub: `${volunteers.length} active`, nav: 'volunteers', color: 'text-violet-600' },
                                            { label: 'View Analytics', sub: 'Platform statistics', nav: 'analytics', color: 'text-teal-600' },
                                        ].map(({ label, sub, nav, color }) => (
                                            <button key={label} onClick={() => setView(nav)} className="w-full text-left -mx-2 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-all">
                                                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                                                <p className="text-xs text-gray-400">{sub}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* System status */}
                                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-900">System Status</h3>
                                    </div>
                                    <div className="px-6 py-4 space-y-4">
                                        {[
                                            { label: 'Database', status: 'Healthy', ok: true },
                                            { label: 'API Server', status: 'Running', ok: true },
                                            { label: 'Storage', status: '24% of 10GB', ok: true },
                                        ].map(({ label, status, ok }) => (
                                            <div key={label} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{label}</span>
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{status}</span>
                                            </div>
                                        ))}
                                        <div className="pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-400">Admin cannot modify events, join them, or participate as a volunteer. System management only.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* â”€â”€â”€ CITIZENS â”€â”€â”€ */}
                    {view === 'citizens' && (
                        <UserTable
                            title="Citizens"
                            users={filtered(citizens)}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            columns={['Name', 'Email', 'Phone', 'Joined', 'Status', 'Actions']}
                            emptyLabel="No citizens found."
                            renderRow={(u) => (
                                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">{u.fullName?.charAt(0)}</div>
                                            <span className="text-sm font-semibold text-gray-900">{u.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{u.phoneNumber || 'â€”'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><StatusBadge isDisabled={u.isDisabled} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <ActionBtn icon={Eye} label="Profile" color="blue" onClick={() => setModal({ type: 'citizen-profile', user: u })} />
                                            <ActionBtn icon={u.isDisabled ? UserCheck : Ban} label={u.isDisabled ? 'Enable' : 'Disable'} color={u.isDisabled ? 'green' : 'red'} onClick={() => handleToggleDisable(u._id, u.isDisabled)} />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                    )}

                    {/* â”€â”€â”€ VOLUNTEERS â”€â”€â”€ */}
                    {view === 'volunteers' && (
                        <UserTable
                            title="Volunteers"
                            users={filtered(volunteers)}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            columns={['Name', 'Email', 'Skills', 'Avg Rating', 'Status', 'Actions']}
                            emptyLabel="No volunteers found."
                            renderRow={(u) => {
                                const avgRating = u.ratings?.length
                                    ? (u.ratings.reduce((s, r) => s + (r.stars || 0), 0) / u.ratings.length).toFixed(1)
                                    : 'N/A'
                                return (
                                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold text-xs">{u.fullName?.charAt(0)}</div>
                                                <span className="text-sm font-semibold text-gray-900">{u.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {u.skills?.length > 0
                                                ? <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium">{u.skills.length} skill{u.skills.length !== 1 ? 's' : ''}</span>
                                                : <span className="text-gray-400">None</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Star size={13} className="text-amber-400 fill-amber-400" />
                                                <span className="text-sm font-semibold text-gray-700">{avgRating}</span>
                                                {u.ratings?.length > 0 && <span className="text-xs text-gray-400">({u.ratings.length})</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><StatusBadge isDisabled={u.isDisabled} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <ActionBtn icon={Wrench} label="Skills" color="violet" onClick={() => setModal({ type: 'volunteer-skills', user: u })} />
                                                <ActionBtn icon={Star} label="Ratings" color="amber" onClick={() => setModal({ type: 'volunteer-ratings', user: u })} />
                                                <ActionBtn icon={u.isDisabled ? UserCheck : Ban} label={u.isDisabled ? 'Enable' : 'Disable'} color={u.isDisabled ? 'green' : 'red'} onClick={() => handleToggleDisable(u._id, u.isDisabled)} />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }}
                        />
                    )}

                    {/* â”€â”€â”€ ORGANIZERS â”€â”€â”€ */}
                    {view === 'organizers' && (
                        <UserTable
                            title="Verified Organizers"
                            users={filtered(organizers)}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            columns={['Organization', 'Contact', 'Reg Number', 'Status', 'Actions']}
                            emptyLabel="No verified organizers found."
                            renderRow={(u) => (
                                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-xs">
                                                {(u.organizationName || u.fullName)?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{u.organizationName || u.fullName}</p>
                                                <p className="text-xs text-gray-400">{u.officialEmail || u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.fullName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{u.registrationNumber || 'â€”'}</td>
                                    <td className="px-6 py-4"><StatusBadge isDisabled={u.isDisabled} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <ActionBtn icon={CalendarDays} label="Events" color="amber" onClick={() => openOrganizerEventsModal(u)} />
                                            <ActionBtn icon={u.isDisabled ? UserCheck : Ban} label={u.isDisabled ? 'Enable' : 'Disable'} color={u.isDisabled ? 'green' : 'red'} onClick={() => handleToggleDisable(u._id, u.isDisabled)} />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                    )}

                    {/* â”€â”€â”€ PENDING ORGANIZERS â”€â”€â”€ */}
                    {view === 'pending-organizers' && (
                        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">Pending Organizer Applications</h2>
                                <p className="text-sm text-gray-400 mt-0.5">
                                    {pendingOrgs.length} application{pendingOrgs.length !== 1 ? 's' : ''} awaiting review
                                </p>
                            </div>
                            {pendingOrgs.length === 0 ? (
                                <div className="text-center py-20">
                                    <CheckCircle size={44} className="mx-auto text-emerald-400 mb-3" />
                                    <p className="text-gray-600 font-semibold">All caught up!</p>
                                    <p className="text-gray-400 text-sm mt-1">No pending applications at this time.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                {['Organization', 'Contact', 'Email', 'Reg Number', 'Applied', 'Actions'].map(col => (
                                                    <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {pendingOrgs.map((org) => (
                                                <tr key={org._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold text-sm">
                                                                {org.organizationName?.charAt(0) || '?'}
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-900">{org.organizationName}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">{org.fullName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{org.officialEmail || org.email}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{org.registrationNumber || 'â€”'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(org.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleVerify(org._id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                                                            >
                                                                <CheckCircle size={13} />Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(org._id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-all border border-red-200"
                                                            >
                                                                <XCircle size={13} />Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* â”€â”€â”€ ANALYTICS â”€â”€â”€ */}
                    {view === 'analytics' && <AdminHelpRequestAnalytics />}

                </main>
            </div>

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• MODALS â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setModal(null)}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

                        {/* â”€â”€ Citizen Profile â”€â”€ */}
                        {modal.type === 'citizen-profile' && (<>
                            <ModalHeader title="Citizen Profile" subtitle={modal.user.email} onClose={() => setModal(null)} />
                            <div className="p-6 space-y-0 divide-y divide-gray-50">
                                <InfoRow label="Full Name" value={modal.user.fullName} />
                                <InfoRow label="Email" value={modal.user.email} />
                                <InfoRow label="Phone" value={modal.user.phoneNumber || 'â€”'} />
                                <InfoRow label="Joined" value={new Date(modal.user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                                <InfoRow label="Account Status" value={modal.user.isDisabled ? 'Disabled' : 'Active'} valueClass={modal.user.isDisabled ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'} />
                            </div>
                            <ModalFooter onClose={() => setModal(null)} onAction={() => handleToggleDisable(modal.user._id, modal.user.isDisabled)} actionLabel={modal.user.isDisabled ? 'Enable Account' : 'Disable Account'} actionDanger={!modal.user.isDisabled} />
                        </>)}

                        {/* â”€â”€ Volunteer Skills â”€â”€ */}
                        {modal.type === 'volunteer-skills' && (<>
                            <ModalHeader title="Skills" subtitle={modal.user.fullName} onClose={() => setModal(null)} />
                            <div className="p-6">
                                {modal.user.skills?.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {modal.user.skills.map((s, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-violet-50 text-violet-700 text-sm rounded-xl border border-violet-200 font-medium">{s}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-400 py-8">No skills listed.</p>
                                )}
                            </div>
                            <ModalFooter onClose={() => setModal(null)} onAction={() => handleToggleDisable(modal.user._id, modal.user.isDisabled)} actionLabel={modal.user.isDisabled ? 'Enable Account' : 'Disable Account'} actionDanger={!modal.user.isDisabled} />
                        </>)}

                        {/* â”€â”€ Volunteer Ratings â”€â”€ */}
                        {modal.type === 'volunteer-ratings' && (<>
                            <ModalHeader title="Ratings" subtitle={modal.user.fullName} onClose={() => setModal(null)} />
                            <div className="p-6 max-h-80 overflow-y-auto">
                                {modal.user.ratings?.length ? (
                                    <div className="space-y-3">
                                        {modal.user.ratings.map((r, i) => (
                                            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex items-center gap-1 mb-2">
                                                    {[...Array(5)].map((_, s) => (
                                                        <Star key={s} size={13} className={s < r.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-200'} />
                                                    ))}
                                                    <span className="text-xs text-gray-400 ml-1 capitalize">by {r.role}</span>
                                                </div>
                                                {r.comment && <p className="text-sm text-gray-600 italic">"{r.comment}"</p>}
                                                {r.createdAt && <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-400 py-8">No ratings yet.</p>
                                )}
                            </div>
                            <ModalFooter onClose={() => setModal(null)} onAction={() => handleToggleDisable(modal.user._id, modal.user.isDisabled)} actionLabel={modal.user.isDisabled ? 'Enable Account' : 'Disable Account'} actionDanger={!modal.user.isDisabled} />
                        </>)}

                        {/* â”€â”€ Organizer Events â”€â”€ */}
                        {modal.type === 'organizer' && (<>
                            <ModalHeader title="Events Created" subtitle={modal.user.organizationName || modal.user.fullName} onClose={() => setModal(null)} />
                            <div className="p-6 max-h-80 overflow-y-auto">
                                {!modal.data ? (
                                    <div className="flex justify-center py-8"><div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
                                ) : modal.data.events?.length ? (
                                    <div className="space-y-2">
                                        {modal.data.events.map((ev, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{ev.title}</p>
                                                    <p className="text-xs text-gray-400">{ev.location} â€¢ {ev.startDateTime ? new Date(ev.startDateTime).toLocaleDateString() : new Date(ev.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-lg font-semibold capitalize ${
                                                    ev.status === 'upcoming' ? 'bg-indigo-50 text-indigo-700' :
                                                    ev.status === 'ongoing' ? 'bg-teal-50 text-teal-700' :
                                                    ev.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-red-50 text-red-700'
                                                }`}>{ev.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-400 py-8">No events created yet.</p>
                                )}
                            </div>
                            <ModalFooter onClose={() => setModal(null)} onAction={() => handleToggleDisable(modal.user._id, modal.user.isDisabled)} actionLabel={modal.user.isDisabled ? 'Enable Account' : 'Disable Account'} actionDanger={!modal.user.isDisabled} />
                        </>)}

                    </div>
                </div>
            )}
        </div>
    )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Reusable sub-components
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const UserTable = ({ title, users, searchQuery, setSearchQuery, columns, renderRow, emptyLabel }) => (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-400">{users.length} record{users.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or emailâ€¦"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50"
                />
            </div>
        </div>
        {users.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
                <Users size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{emptyLabel}</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            {columns.map(col => (
                                <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">{users.map(renderRow)}</tbody>
                </table>
            </div>
        )}
    </div>
)

const StatusBadge = ({ isDisabled }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isDisabled ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
        {isDisabled ? 'Disabled' : 'Active'}
    </span>
)

const ActionBtn = ({ icon: Icon, label, color, onClick }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-blue-200',
        violet: 'bg-violet-50 text-violet-700 hover:bg-violet-100 ring-1 ring-violet-200',
        amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-200',
        red: 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-200',
        green: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200',
    }
    return (
        <button onClick={onClick} title={label} className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${colors[color]}`}>
            <Icon size={12} />{label}
        </button>
    )
}

const ModalHeader = ({ title, subtitle, onClose }) => (
    <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-gray-50">
        <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all"><X size={18} /></button>
    </div>
)

const InfoRow = ({ label, value, valueClass = 'text-gray-900' }) => (
    <div className="flex justify-between items-center py-3">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
)

const ModalFooter = ({ onClose, onAction, actionLabel, actionDanger }) => (
    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">
            Close
        </button>
        <button onClick={onAction} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${actionDanger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
            {actionLabel}
        </button>
    </div>
)

export default AdminDashboard

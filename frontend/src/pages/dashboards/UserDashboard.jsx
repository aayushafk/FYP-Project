import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { SKILL_LIST } from '../../constants/skills';
import {
    Calendar, MapPin, Users, Clock, Plus, MessageCircle,
    Search, ChevronRight, AlertCircle, CheckCircle,
    ArrowLeft, Send, Home, FileText, Activity, Bell, ExternalLink, Trash2, BarChart3
} from 'lucide-react';
import CitizenHelpRequestAnalytics from '../../components/analytics/CitizenHelpRequestAnalytics';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    // Tab state
    const [activeTab, setActiveTab] = useState('overview');

    // Data states
    const [myRequests, setMyRequests] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Event detail view
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Help request modal
    const [showCreateRequest, setShowCreateRequest] = useState(false);
    const [requestForm, setRequestForm] = useState({
        title: '', description: '', category: 'Medical', location: '', requiredSkills: []
    });
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Messaging
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(true);

    // Fetch data on mount
    useEffect(() => {
        fetchRequests();
        fetchEvents();
        fetchNotifications();
    }, []);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const fetchRequests = async () => {
        try {
            const response = await api.get('/citizen/requests');
            const allRequests = response.data.requests || response.data;
            
            // Filter out help requests associated with specific events
            // Only show standalone help requests (without eventId)
            const standaloneRequests = allRequests.filter(req => !req.eventId);
            setMyRequests(standaloneRequests);
        } catch (err) {
            console.error('Error fetching requests:', err);
            setError('Failed to load your requests.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await api.get('/citizen/events');
            setEvents(Array.isArray(response.data) ? response.data : response.data.events || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/citizen/notifications');
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const markAllNotificationsRead = async () => {
        try {
            await api.post('/citizen/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking notifications:', err);
        }
    };

    // Help request creation
    const handleCreateRequest = async (e) => {
        e.preventDefault();
        
        setRequestSubmitting(true);
        setError(null); // Clear previous errors
        try {
            await api.post('/citizen/request', requestForm);
            setRequestSuccess('Help request created successfully!');
            setShowCreateRequest(false);
            setRequestForm({ title: '', description: '', category: 'Medical', location: '', requiredSkills: [] });
            fetchRequests();
            setTimeout(() => setRequestSuccess(''), 4000);
        } catch (err) {
            console.error('Error creating help request:', err);
            console.error('Error response:', err.response);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create request.';
            setError(`Error creating help request: ${errorMessage}`);
        } finally {
            setRequestSubmitting(false);
        }
    };

    // Delete help request
    const handleDeleteRequest = async (requestId) => {
        setDeleting(true);
        try {
            await api.delete(`/citizen/request/${requestId}`);
            setMyRequests(prev => prev.filter(req => req._id !== requestId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting request:', err);
            setError(err.response?.data?.message || 'Failed to delete request.');
        } finally {
            setDeleting(false);
        }
    };

    const openRequestFromEvent = (event) => {
        setRequestForm({
            title: `Help needed - ${event.title}`,
            description: `Related to event: ${event.title}\n${event.description || ''}`,
            category: 'Other',
            location: event.location || '',
            requiredSkills: []
        });
        setShowCreateRequest(true);
    };

    // Messaging
    const fetchMessages = async (eventId, volunteerId) => {
        setChatLoading(true);
        try {
            const response = await api.get(`/user-volunteer-chat/conversation/${eventId}/${volunteerId}`);
            setChatMessages(response.data.messages || response.data || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setChatMessages([]);
        } finally {
            setChatLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!chatInput.trim() || !selectedEvent || !selectedVolunteer) return;
        try {
            await api.post('/user-volunteer-chat/send', {
                eventId: selectedEvent._id,
                recipientId: selectedVolunteer._id || selectedVolunteer.volunteerId,
                content: chatInput
            });
            setChatInput('');
            fetchMessages(selectedEvent._id, selectedVolunteer._id || selectedVolunteer.volunteerId);
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.response?.data?.message || 'Failed to send message.');
        }
    };

    const openChat = (event, volunteer) => {
        setSelectedEvent(event);
        setSelectedVolunteer(volunteer);
        fetchMessages(event._id, volunteer._id || volunteer.volunteerId);
    };

    // Status helpers
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Assigned': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-teal-100 text-teal-700 border-teal-200';
            case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getEventStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'bg-indigo-100 text-indigo-700';
            case 'ongoing': return 'bg-teal-100 text-teal-700';
            case 'completed': return 'bg-gray-100 text-gray-600';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const filteredEvents = events.filter(event => {
        if (!normalizedSearchQuery) {
            return true;
        }

        const searchableText = [
            event.title,
            event.name,
            event.description,
            event.location,
            event.category,
            event.status,
            ...(Array.isArray(event.requiredSkills)
                ? event.requiredSkills.map(skill => (typeof skill === 'object' ? skill.name || skill.skill : skill))
                : []),
            ...(Array.isArray(event.tags) ? event.tags : []),
            event.organizer?.fullName,
            event.organizer?.name
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
    });

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'requests', label: 'My Requests', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 }
    ];

    const categories = [
        { value: 'Medical', label: 'Medical Assistance' },
        { value: 'Food', label: 'Food & Water' },
        { value: 'Rescue', label: 'Rescue Operation' },
        { value: 'Transport', label: 'Transportation' },
        { value: 'Other', label: 'Other / General' }
    ];

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ─── Dark Gradient Header ─── */}
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-lg ring-2 ring-white/25">
                                {user.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user.fullName?.split(' ')[0]}!</h1>
                                <p className="text-gray-400 mt-0.5">Citizen Dashboard</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCreateRequest(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 rounded-xl text-sm font-medium shadow-md transition-all">
                                <Plus size={16} /> Help Request
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                        {[
                            { label: 'Total Requests', value: myRequests.length, icon: FileText, gradient: 'from-indigo-500 to-violet-500', iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-500' },
                            { label: 'Pending', value: myRequests.filter(r => (r.trackingStatus || r.status) === 'Pending').length, icon: Clock, gradient: 'from-amber-400 to-orange-400', iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-amber-400 to-orange-400' },
                            { label: 'In Progress', value: myRequests.filter(r => (r.trackingStatus || r.status) === 'In Progress' || (r.trackingStatus || r.status) === 'Assigned').length, icon: Activity, gradient: 'from-teal-400 to-cyan-400', iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-teal-400 to-cyan-400' },
                            { label: 'Completed', value: myRequests.filter(r => (r.trackingStatus || r.status) === 'Completed').length, icon: CheckCircle, gradient: 'from-emerald-400 to-green-400', iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-emerald-400 to-green-400' }
                        ].map((s, i) => (
                            <div key={i} className={`bg-gradient-to-br ${s.gradient} backdrop-blur border border-white/10 rounded-xl p-4 shadow-md`}>
                                <div className="flex items-center gap-2 text-white/90 text-xs font-medium mb-1">
                                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                        <s.icon size={12} />
                                    </div>
                                    {s.label}
                                </div>
                                <p className="text-2xl font-bold text-white">{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Tab Navigation ─── */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelectedEvent(null); setSelectedVolunteer(null); }}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-purple-600 text-purple-700'
                                        : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.id === 'requests' && myRequests.length > 0 && (
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{myRequests.length}</span>
                                )}
                                {tab.id === 'events' && events.length > 0 && (
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{events.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Main Content ─── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Toasts */}
                {requestSuccess && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                        <CheckCircle size={20} /> <span className="font-medium">{requestSuccess}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                        <AlertCircle size={20} /> <span className="font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                    </div>
                )}

                {/* New Event Notifications */}
                {showNotifications && notifications.filter(n => !n.read).length > 0 && (
                    <div className="mb-6 bg-white border-l-4 border-l-indigo-400 border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Bell className="text-indigo-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">New Events</h3>
                                    <p className="text-xs text-gray-500">{unreadCount} new event{unreadCount !== 1 ? 's' : ''} created</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={markAllNotificationsRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-all">Mark all read</button>
                                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1">&times;</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {notifications.filter(n => !n.read).slice(0, 3).map(notif => (
                                <div key={notif._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-sm transition-all cursor-pointer group" onClick={() => { if (notif.relatedId) navigate(`/event/${notif.relatedId}`); }}>
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Calendar className="text-indigo-600" size={16} />
                                    </div>
                                    <p className="text-sm text-gray-700 flex-1">{notif.message}</p>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                        <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════ OVERVIEW TAB ════════ */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-6 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white/15">
                                    {user.fullName?.charAt(0) || 'U'}
                                </div>
                                <h3 className="text-lg font-bold text-white mt-3">{user.fullName}</h3>
                                <p className="text-indigo-100 text-sm">{user.email}</p>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-500 text-sm">Role</span>
                                    <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg capitalize">{user.role || 'Citizen'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-500 text-sm">Phone</span>
                                    <span className="text-sm font-medium text-gray-900">{user.phoneNumber || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 text-sm">Requests</span>
                                    <span className="text-sm font-bold text-gray-900">{myRequests.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Requests */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md ring-1 ring-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 border-l-4 border-l-teal-400 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900">Recent Requests</h3>
                                    <p className="text-sm text-gray-400">Your latest help requests</p>
                                </div>
                                <button onClick={() => setActiveTab('requests')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                    View All <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="p-4">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : myRequests.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <FileText className="text-slate-400" size={24} />
                                        </div>
                                        <p className="text-slate-500 font-medium">No requests yet</p>
                                        <p className="text-gray-400 text-sm mt-1">Create your first help request to get assistance</p>
                                        <button onClick={() => setShowCreateRequest(true)} className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm">
                                            Create Request
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {myRequests.slice(0, 4).map(request => {
                                            const status = request.trackingStatus || request.status;
                                            const volunteerCount = request.assignedVolunteers?.length || 0;
                                            return (
                                                <div key={request._id} className={`flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group ${
                                                    request.isEmergency ? 'border-2 border-red-200 bg-red-50' : ''
                                                }`} onClick={() => navigate(`/event/${request._id}`)}>
                                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ${status === 'Pending' ? 'bg-amber-400 ring-amber-200' : status === 'In Progress' ? 'bg-teal-500 ring-teal-200' : status === 'Completed' ? 'bg-emerald-400 ring-emerald-200' : 'bg-gray-400 ring-gray-200'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm font-medium text-slate-800 truncate group-hover:text-green-600 transition-colors">{request.title}</p>
                                                            {request.isEmergency && (
                                                                <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded uppercase">🚨 URGENT</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs text-gray-500">{request.category} {request.createdAt && `• ${new Date(request.createdAt).toLocaleDateString()}`}</p>
                                                            {volunteerCount > 0 && (
                                                                <span className="text-xs text-teal-600 font-medium">• {volunteerCount} volunteer{volunteerCount !== 1 ? 's' : ''}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap ${getStatusColor(status)}`}>{status}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Events Preview */}
                        <div className="lg:col-span-3 bg-white rounded-2xl shadow-md ring-1 ring-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 border-l-4 border-l-indigo-400 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900">Available Events</h3>
                                    <p className="text-sm text-gray-400">Community events where you can request help</p>
                                </div>
                                <button onClick={() => setActiveTab('events')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                    Browse All <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {eventsLoading ? (
                                    <div className="col-span-full flex items-center justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : events.length === 0 ? (
                                    <div className="col-span-full text-center py-12">
                                        <Calendar className="text-gray-300 mx-auto mb-3" size={40} />
                                        <p className="text-gray-500 font-medium">No events available</p>
                                        <p className="text-sm text-gray-400 mt-1">Check back later for community events</p>
                                    </div>
                                                ) : events.slice(0, 3).map(event => (
                                    <div key={event._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group bg-white" onClick={() => { setSelectedEvent(event); setActiveTab('events'); }}>
                                        <div className="flex items-start justify-between mb-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-lg capitalize ${getEventStatusColor(event.status)}`}>{event.status}</span>
                                            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <Calendar className="text-indigo-600" size={14} />
                                            </div>
                                        </div>
                                        <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{event.title}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                                            {event.location && <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>}
                                            {event.startDateTime && <span className="flex items-center gap-1"><Clock size={12} /> {new Date(event.startDateTime).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════ EVENTS TAB – List ════════ */}
                {activeTab === 'events' && !selectedEvent && (
                    <div>
                        <div className="mb-6">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                            </div>
                        </div>

                        {eventsLoading ? (
                            <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="text-center py-20">
                                <Calendar className="text-gray-300 mx-auto mb-4" size={48} />
                                <p className="text-gray-500 text-lg font-medium">No events found</p>
                                <p className="text-sm text-gray-400 mt-1">Try a different search or check back later</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredEvents.map(event => (
                                    <div key={event._id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden hover:shadow-md hover:ring-indigo-300 transition-all duration-300 cursor-pointer group" onClick={() => setSelectedEvent(event)}>
                                        <div className="bg-gray-50 p-4 border-b border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${getEventStatusColor(event.status)}`}>{event.status}</span>
                                                {event.assignedVolunteers?.length > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500"><Users size={12} /> {event.assignedVolunteers.length}</span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-sm text-gray-600 line-clamp-3 mb-4">{event.description}</p>
                                            <div className="space-y-2">
                                                {event.location && <div className="flex items-center gap-2 text-sm text-gray-500"><div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center"><MapPin size={12} className="text-teal-600" /></div><span className="truncate">{event.location}</span></div>}
                                                {event.startDateTime && <div className="flex items-center gap-2 text-sm text-gray-500"><div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center"><Calendar size={12} className="text-orange-600" /></div><span>{new Date(event.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>}
                                            </div>
                                            {event.requiredSkills?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-4">
                                                    {event.requiredSkills.slice(0, 3).map((skill, i) => (
                                                        <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">{typeof skill === 'object' ? skill.name || skill.skill : skill}</span>
                                                    ))}
                                                    {event.requiredSkills.length > 3 && <span className="text-xs text-gray-400">+{event.requiredSkills.length - 3} more</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-4 pb-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={e2 => { e2.stopPropagation(); openRequestFromEvent(event); }} className="flex-1 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 py-2 rounded-xl transition-all text-center shadow-sm">
                                                    Request Help
                                                </button>
                                                <button onClick={e2 => { e2.stopPropagation(); navigate(`/event/${event._id}`); }} className="px-3 py-2 text-violet-500 hover:text-white hover:bg-violet-500 rounded-xl transition-all" title="Join Event Chat">
                                                    <MessageCircle size={18} />
                                                </button>
                                                <button onClick={e2 => { e2.stopPropagation(); setSelectedEvent(event); }} className="px-3 py-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ════════ EVENTS TAB – Detail View ════════ */}
                {activeTab === 'events' && selectedEvent && (
                    <div>
                        <button onClick={() => { setSelectedEvent(null); setSelectedVolunteer(null); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 font-medium mb-6 transition-colors">
                            <ArrowLeft size={16} /> Back to Events
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left – Event Info */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-md ring-1 ring-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-6 text-white">
                                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-lg capitalize bg-white/20 text-white border border-white/20 backdrop-blur mb-3">{selectedEvent.status}</span>
                                    <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                                    {selectedEvent.organizer && (
                                        <p className="text-indigo-100 text-sm mt-1">Organized by {selectedEvent.organizer.fullName || selectedEvent.organizer.name || 'Organizer'}</p>
                                    )}
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-700 leading-relaxed mb-6">{selectedEvent.description}</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        {selectedEvent.location && (
                                            <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                                                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center"><MapPin className="text-teal-600" size={18} /></div>
                                                <div><p className="text-xs text-gray-500">Location</p><p className="text-sm font-medium text-gray-900">{selectedEvent.location}</p></div>
                                            </div>
                                        )}
                                        {selectedEvent.startDateTime && (
                                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Calendar className="text-orange-600" size={18} /></div>
                                                <div><p className="text-xs text-gray-500">Date</p><p className="text-sm font-medium text-gray-900">{new Date(selectedEvent.startDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
                                            </div>
                                        )}
                                    </div>

                                    {selectedEvent.requiredSkills?.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedEvent.requiredSkills.map((skill, i) => (
                                                    <span key={i} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-medium border border-indigo-200">{typeof skill === 'object' ? skill.name || skill.skill : skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={() => openRequestFromEvent(selectedEvent)} className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                                        <Plus size={18} /> Create Help Request for this Event
                                    </button>
                                    <button onClick={() => navigate(`/event/${selectedEvent._id}`)} className="w-full py-3 mt-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                                        <MessageCircle size={18} /> Join Event Chat
                                    </button>
                                </div>
                            </div>

                            {/* Right – Volunteers & Chat */}
                            <div className="space-y-6">
                                {/* Volunteers list */}
                                <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-200 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100 border-l-4 border-l-violet-400">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                                                <Users size={14} className="text-violet-600" />
                                            </div>
                                            Volunteers
                                        </h3>
                                    </div>
                                    <div className="p-4">
                                        {(selectedEvent.assignedVolunteers?.length > 0 || selectedEvent.volunteerAssignments?.length > 0) ? (
                                            <div className="space-y-2">
                                                {(selectedEvent.assignedVolunteers || selectedEvent.volunteerAssignments || []).map((vol, i) => {
                                                    const volunteer = vol.volunteerId || vol;
                                                    const volName = typeof volunteer === 'object' ? (volunteer.fullName || volunteer.name || `Volunteer ${i + 1}`) : `Volunteer ${i + 1}`;
                                                    const volId = typeof volunteer === 'object' ? volunteer._id : volunteer;
                                                    return (
                                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 transition-all cursor-pointer group" onClick={() => openChat(selectedEvent, { _id: volId, fullName: volName })}>
                                                            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 text-sm font-bold">{volName.charAt(0)}</div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{volName}</p>
                                                                <p className="text-xs text-gray-400">Click to message</p>
                                                            </div>
                                                            <MessageCircle size={16} className="text-gray-300 group-hover:text-violet-500 transition-colors" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <Users className="text-gray-300 mx-auto mb-2" size={24} />
                                                <p className="text-sm text-gray-400">No volunteers assigned yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chat panel */}
                                {selectedVolunteer && (
                                    <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-200 overflow-hidden">
                                        <div className="px-5 py-3 border-b border-gray-100 bg-violet-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 text-xs font-bold">{selectedVolunteer.fullName?.charAt(0) || 'V'}</div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{selectedVolunteer.fullName}</p>
                                                    <p className="text-xs text-gray-500">Volunteer</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedVolunteer(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
                                        </div>
                                        <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                                            {chatLoading ? (
                                                <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                                            ) : chatMessages.length === 0 ? (
                                                <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-400">No messages yet. Start the conversation!</p></div>
                                            ) : (
                                                <>
                                                    {chatMessages.map((msg, i) => (
                                                        <div key={i} className={`flex ${msg.sender === user._id || msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                                                                msg.sender === user._id || msg.senderId === user._id
                                                                    ? 'bg-violet-500 text-white rounded-br-sm'
                                                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                                                            }`}>
                                                                {msg.content || msg.message}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div ref={chatEndRef} />
                                                </>
                                            )}
                                        </div>
                                        <div className="p-3 border-t border-gray-100">
                                            <div className="flex gap-2">
                                                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none" />
                                                <button onClick={sendMessage} disabled={!chatInput.trim()} className="p-2 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 text-white rounded-xl transition-all">
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════ REQUESTS TAB ════════ */}
                {activeTab === 'requests' && (
                    <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 border-l-4 border-l-teal-400 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">My Help Requests</h3>
                                <p className="text-sm text-gray-500">{myRequests.length} total request{myRequests.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button onClick={() => setShowCreateRequest(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm">
                                <Plus size={16} /> New Request
                            </button>
                        </div>
                        <div className="p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div></div>
                            ) : myRequests.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="text-slate-300" size={32} /></div>
                                    <p className="text-slate-500 text-lg font-medium">No requests yet</p>
                                    <p className="text-gray-400 text-sm mt-1 mb-4">Create a help request to get assistance from volunteers</p>
                                    <button onClick={() => setShowCreateRequest(true)} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm">Create Your First Request</button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {myRequests.map(request => {
                                        const volunteerCount = request.assignedVolunteers?.length || 0;
                                        return (
                                            <div key={request._id} className={`flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all group border hover:border-gray-200 hover:shadow-sm ${
                                                request.isEmergency ? 'border-2 border-red-300 bg-red-50' : 'border-transparent'
                                            }`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                                                    request.category === 'Medical' ? 'bg-red-50' : request.category === 'Food' ? 'bg-orange-50' : request.category === 'Rescue' ? 'bg-yellow-50' : request.category === 'Transport' ? 'bg-blue-50' : 'bg-gray-50'
                                                }`}>
                                                    {request.category === 'Medical' ? '🏥' : request.category === 'Food' ? '🍽️' : request.category === 'Rescue' ? '🚨' : request.category === 'Transport' ? '🚗' : '📋'}
                                                </div>
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/event/${request._id}`)}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-slate-900 truncate group-hover:text-green-600 transition-colors">{request.title}</h4>
                                                        {request.isEmergency && (
                                                            <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded uppercase shrink-0">🚨 URGENT</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate mt-0.5">{request.description}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                        <span>{request.category}</span>
                                                        {request.location && <span>• {request.location}</span>}
                                                        {request.createdAt && <span>• {new Date(request.createdAt).toLocaleDateString()}</span>}
                                                        {volunteerCount > 0 && (
                                                            <span className="text-teal-600 font-medium">• {volunteerCount} volunteer{volunteerCount !== 1 ? 's' : ''} helping</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${getStatusColor(request.trackingStatus || request.status)}`}>{request.trackingStatus || request.status}</span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm(request);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                                    title="Delete request"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 cursor-pointer" size={16} onClick={() => navigate(`/event/${request._id}`)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════ ANALYTICS TAB ════════ */}
                {activeTab === 'analytics' && (
                    <CitizenHelpRequestAnalytics />
                )}
            </div>

            {/* ─── Create Help Request Modal ─── */}
            {showCreateRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => {
                    setShowCreateRequest(false);
                }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Create Help Request</h3>
                                <p className="text-sm text-gray-500">Describe what you need assistance with</p>
                            </div>
                            <button onClick={() => {
                                setShowCreateRequest(false);
                            }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl leading-none transition-all">&times;</button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input type="text" value={requestForm.title} onChange={e => setRequestForm({ ...requestForm, title: e.target.value })} placeholder="Brief title for your request" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select value={requestForm.category} onChange={e => setRequestForm({ ...requestForm, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white">
                                    {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea rows="4" value={requestForm.description} onChange={e => setRequestForm({ ...requestForm, description: e.target.value })} placeholder="Describe the situation, specific needs, and urgency..." className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (Optional)</label>
                                <select 
                                    value={requestForm.requiredSkills[0] || ''} 
                                    onChange={e => setRequestForm({ ...requestForm, requiredSkills: e.target.value ? [e.target.value] : [] })} 
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                                >
                                    <option value="">Select a skill (optional)</option>
                                    {SKILL_LIST.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">All volunteers across multiple skills will be notified</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location (Optional)</label>
                                <input type="text" value={requestForm.location} onChange={e => setRequestForm({ ...requestForm, location: e.target.value })} placeholder="Your location or address (optional)" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => {
                                    setShowCreateRequest(false);
                                }} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">Cancel</button>
                                <button type="submit" disabled={requestSubmitting} className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2">
                                    {requestSubmitting ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Submitting...</>) : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirmation Modal ─── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Help Request</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <div className="mb-5 p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm font-medium text-gray-900 mb-1">{deleteConfirm.title}</p>
                            <p className="text-xs text-gray-500">{deleteConfirm.category} • {deleteConfirm.location}</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteConfirm(null)} 
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 rounded-xl text-sm font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDeleteRequest(deleteConfirm._id)} 
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete Request
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;

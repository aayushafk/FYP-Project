import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Trash2, Calendar, MapPin, Award, Users, Frown, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import ParticipationDecisionModal from '../../components/modals/ParticipationDecisionModal';
import RatingSummary from '../../components/profile/RatingSummary';
import { useAuth } from '../../contexts/AuthContext';

const VolunteerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [availableHelpRequests, setAvailableHelpRequests] = useState([]);
    const [availableOrganizerEvents, setAvailableOrganizerEvents] = useState([]);
    const [acceptedHelpRequests, setAcceptedHelpRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [eventParticipationStatus, setEventParticipationStatus] = useState({});
    const [showParticipationModal, setShowParticipationModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        if (!user?._id) {
            return;
        }

        fetchNotifications();
        const  interval = setInterval(fetchNotifications, 30000);
        
        // Also refresh when page becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchNotifications();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user?._id]);

    const fetchNotifications = async () => {
        let eventNotifications = [];

        try {
            const response = await api.get('/volunteer/notifications');
            eventNotifications = (response.data || []).filter((notification) =>
                ['skill_matched_event', 'skill_matched_request', 'emergency_help_request'].includes(notification.type)
            );
            setNotifications(eventNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            // Load persisted volunteer data regardless of notification fetch result.
            await Promise.all([
                fetchAvailableHelpRequests(),
                fetchAcceptedHelpRequests(),
                fetchParticipationStatuses(eventNotifications)
            ]);
            setLoading(false);
        }
    };

    const fetchAvailableHelpRequests = async () => {
        try {
            const response = await api.get('/volunteer/available-events');
            const allEvents = response.data.events || [];

            // Show citizen requests that are still active and not full.
            const helpRequests = allEvents.filter((event) => {
                if (event.type !== 'citizen') return false;
                if (event.trackingStatus === 'Completed') return false;

                if (event.volunteersNeeded > 0) {
                    const assignedCount = Array.isArray(event.assignedVolunteers)
                        ? event.assignedVolunteers.length
                        : 0;
                    if (assignedCount >= event.volunteersNeeded) return false;
                }

                return true;
            });

            // Show organizer-created events that volunteers can join.
            const organizerEvents = allEvents.filter((event) => event.type === 'organizer');

            setAvailableHelpRequests(helpRequests);
            setAvailableOrganizerEvents(organizerEvents);
        } catch (error) {
            console.error('Error fetching available help requests:', error);
            setAvailableOrganizerEvents([]);
        }
    };

    const fetchAcceptedHelpRequests = async () => {
        try {
            if (!user?._id) {
                setAcceptedHelpRequests([]);
                return;
            }

            const response = await api.get('/volunteer/my-events');
            const events = response.data?.events || [];

            const acceptedRequests = events.filter((event) => {
                const assignments = Array.isArray(event.volunteerAssignments)
                    ? event.volunteerAssignments
                    : [];

                const myAcceptedAssignment = assignments.find((assignment) => {
                    const volunteerId = assignment?.volunteerId?._id || assignment?.volunteerId;
                    return (
                        volunteerId?.toString() === user?._id?.toString() &&
                        assignment.participationStatus === 'Accepted'
                    );
                });

                if (myAcceptedAssignment) return true;

                const assignedVolunteers = Array.isArray(event.assignedVolunteers)
                    ? event.assignedVolunteers
                    : [];

                return assignedVolunteers.some((volunteer) => {
                    const volunteerId = volunteer?._id || volunteer;
                    return volunteerId?.toString() === user?._id?.toString();
                });
            });

            setAcceptedHelpRequests(acceptedRequests);
        } catch (error) {
            console.error('Error fetching accepted help requests:', error);
            setAcceptedHelpRequests([]);
        }
    };

    const fetchParticipationStatuses = async (eventNotifications) => {
        try {
            const statusMap = {};
            
            // Fetch each event's details to check participation status
            for (const notification of eventNotifications) {
                const eventId = notification.relatedId?._id || notification.relatedId;
                if (eventId) {
                    try {
                        const eventResponse = await api.get(`/events/${eventId}`);
                        const event = eventResponse.data.event; // Backend returns { event: {...} }
                        
                        // Check if user has made a decision
                        if (event.volunteerAssignments && Array.isArray(event.volunteerAssignments)) {
                            const assignment = event.volunteerAssignments.find(
                                a => {
                                    const volunteerId = a.volunteerId?._id || a.volunteerId;
                                    return volunteerId?.toString() === user._id?.toString();
                                }
                            );
                            
                            if (assignment) {
                                statusMap[eventId] = assignment.participationStatus;
                            }
                        }
                    } catch (err) {
                        console.error(`Error fetching event ${eventId}:`, err);
                    }
                }
            }
            
            setEventParticipationStatus(statusMap);
        } catch (error) {
            console.error('Error fetching participation statuses:', error);
        }
    };

    const handleDismissEvent = async (notificationId) => {
        try {
            setDeletingId(notificationId);
            // Delete the notification
            await api.delete(`/volunteer/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('Error dismissing event:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleParticipationDecision = (decision) => {
        // Update local participation status
        if (selectedEvent?._id) {
            setEventParticipationStatus(prev => ({
                ...prev,
                [selectedEvent._id]: decision
            }));
        }
        
        // Close modal
        setShowParticipationModal(false);
        
        // Navigate based on decision
        if (decision === 'Accepted' && selectedEvent?._id) {
            // If accepted, go to event details page
            navigate(`/event/${selectedEvent._id}`);
        } else if (decision === 'Declined') {
            // If declined, stay on dashboard (refresh to update UI)
            fetchNotifications();
        }
        
        setSelectedEvent(null);
    };

    const handleOpenParticipationModal = (event) => {
        setSelectedEvent(event);
        setShowParticipationModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your opportunities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 animate-slideInUp">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
                            Welcome, {user.fullName}! 👋
                        </h1>
                        <p className="text-lg text-gray-600 font-medium">Discover and join volunteer opportunities that match your unique skills</p>
                    </div>
                </div>

                {/* User Profile & Skills Card */}
                <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-8 mb-12 hover:shadow-md transition-all animate-slideInLeft">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all">
                                {user.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                                <p className="text-gray-500 text-base font-normal">{user.email}</p>
                            </div>
                        </div>
                        
                        {user.skills && user.skills.length > 0 && (
                            <div className="sm:text-right">
                                <p className="text-xs text-gray-600 font-semibold mb-3 uppercase tracking-wide">Your Expertise</p>
                                <div className="flex flex-wrap gap-2 sm:justify-end">
                                    {user.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-300 hover:border-indigo-400 hover:shadow-sm hover:scale-105 transition-all duration-300"
                                        >
                                            <Award size={15} className="text-gray-600" />
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rating Summary Section */}
                <RatingSummary />

                {/* Event Opportunities Section */}
                <div className="animate-slideInRight">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">📋</span>
                            <h2 className="text-3xl font-bold text-gray-900">Event Opportunities</h2>
                            {notifications.length > 0 && (
                                <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-full font-bold text-lg">
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                        <p className="text-lg text-gray-600 font-medium ml-9">Perfect matches based on your skills</p>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                            <Frown size={56} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-700 text-xl font-semibold mb-2">No opportunities at this moment</p>
                            <p className="text-gray-600 text-base">Check back soon or update your skills to unlock more opportunities</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {notifications.map((notification, index) => (
                                <div
                                    key={notification._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 p-6 group animate-slideInUp"
                                    style={{animationDelay: `${index * 0.05}s`}}
                                >
                                    {/* Event Title */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {notification.relatedId?.title}
                                    </h3>

                                    {/* Event Details */}
                                    <div className="space-y-3 mb-6">
                                        {notification.relatedId?.startDateTime && (
                                            <div className="flex items-center gap-3">
                                                <Calendar size={18} className="text-indigo-600 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">
                                                    {new Date(notification.relatedId.startDateTime).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })} at {new Date(notification.relatedId.startDateTime).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {notification.relatedId?.location && (
                                            <div className="flex items-center gap-3">
                                                <MapPin size={18} className="text-red-500 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">{notification.relatedId.location}</span>
                                            </div>
                                        )}

                                        {notification.relatedId?.volunteersNeeded && (
                                            <div className="flex items-center gap-3">
                                                <Users size={18} className="text-orange-500 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">{notification.relatedId.volunteersNeeded} volunteer{notification.relatedId.volunteersNeeded !== 1 ? 's' : ''} needed</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Matched Skills */}
                                    {notification.matchedSkills && notification.matchedSkills.length > 0 && (
                                        <div className="mb-6 pb-6 border-t border-gray-200 pt-4">
                                            <p className="text-xs text-gray-600 font-semibold mb-3 uppercase tracking-wide">Your Matching Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {notification.matchedSkills.map(skill => (
                                                    <span
                                                        key={skill}
                                                        className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-300 hover:shadow-sm hover:scale-105 transition-all duration-200"
                                                    >
                                                        ✓ {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        {(() => {
                                            const eventId = notification.relatedId?._id || notification.relatedId;
                                            const participationStatus = eventParticipationStatus[eventId];
                                            
                                            // If user has already responded, show status
                                            if (participationStatus === 'Accepted') {
                                                return (
                                                    <div className="flex-1 bg-green-50 border-2 border-green-500 rounded-lg p-4">
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle size={28} className="text-green-600 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="font-bold text-green-900 text-base">You're Participating!</p>
                                                                <p className="text-sm text-green-700">You have accepted this event</p>
                                                            </div>
                                                            <button
                                                                onClick={() => navigate(`/event/${eventId}`)}
                                                                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                            >
                                                                View Event
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            if (participationStatus === 'Declined') {
                                                return (
                                                    <div className="flex-1 bg-gray-50 border-2 border-gray-400 rounded-lg p-4">
                                                        <div className="flex items-center gap-3">
                                                            <XCircle size={28} className="text-gray-600 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="font-bold text-gray-900 text-base">Declined</p>
                                                                <p className="text-sm text-gray-700">You declined this event</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDismissEvent(notification._id)}
                                                                disabled={deletingId === notification._id}
                                                                className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                                                            >
                                                                Dismiss
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            // If no response yet, show participate button
                                            return (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            console.log('🔘 Will You Participate? button clicked');
                                                            console.log('   Event:', notification.relatedId);
                                                            
                                                            if (notification.relatedId?._id) {
                                                                const eventId = notification.relatedId._id;
                                                                const status = eventParticipationStatus[eventId];
                                                                
                                                                // If already decided, navigate directly to event page
                                                                if (status === 'Accepted') {
                                                                    navigate(`/event/${eventId}`);
                                                                } else if (status === 'Declined') {
                                                                    // Allow them to see the modal again if they declined
                                                                    handleOpenParticipationModal(notification.relatedId);
                                                                } else {
                                                                    // No decision yet, show modal
                                                                    handleOpenParticipationModal(notification.relatedId);
                                                                }
                                                            } else {
                                                                console.error('❌ No event ID found in notification');
                                                                alert('Event details are not available yet. Please try again in a moment.');
                                                            }
                                                        }}
                                                        disabled={!notification.relatedId?._id}
                                                        className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-base disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-sm"
                                                        title={!notification.relatedId?._id ? 'Event data is loading...' : 'Make your participation decision'}
                                                    >
                                                        <span className="flex flex-col items-center justify-center gap-1">
                                                            <span className="flex items-center gap-2">
                                                                Will You Participate?
                                                                <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                </svg>
                                                            </span>
                                                            <span className="text-xs text-indigo-200 font-normal">Click to view & decide</span>
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDismissEvent(notification._id)}
                                                        disabled={deletingId === notification._id}
                                                        className="px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 font-medium border border-gray-300 hover:border-red-300"
                                                        title="Remove this opportunity"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Help Requests Section */}
                {acceptedHelpRequests.length > 0 && (
                    <div className="mt-12 animate-slideInRight">
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">✅</span>
                                <h2 className="text-3xl font-bold text-gray-900">Your Participated Events</h2>
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg border-2 border-green-300">
                                    {acceptedHelpRequests.length}
                                </span>
                            </div>
                            <p className="text-lg text-gray-600 font-medium ml-9">Events and requests you have accepted</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {acceptedHelpRequests.map((request, index) => (
                                <div
                                    key={request._id}
                                    className="bg-green-50 rounded-xl shadow-sm border border-green-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 group animate-slideInUp"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                                            Accepted
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-300 text-gray-700 uppercase">
                                            {request.type === 'citizen' ? 'Help Request' : 'Organizer Event'}
                                        </span>
                                        {request.trackingStatus && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-300 text-gray-700 uppercase">
                                                {request.trackingStatus}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-green-700 transition-colors">
                                        {request.title}
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        {request.category && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500">📋</span>
                                                <span className="text-gray-700 font-medium">{request.category}</span>
                                            </div>
                                        )}

                                        {request.location && (
                                            <div className="flex items-center gap-3">
                                                <MapPin size={18} className="text-red-500 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">{request.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-green-200">
                                        <button
                                            onClick={() => navigate(`/event/${request._id}`)}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-base shadow-sm"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                {request.trackingStatus === 'Completed' ? 'View Details' : 'Continue Helping'}
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {availableHelpRequests.length > 0 && (
                    <div className="mt-12 animate-slideInRight">
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">🆘</span>
                                <h2 className="text-3xl font-bold text-gray-900">Help Requests</h2>
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold text-lg border-2 border-amber-300">
                                    {availableHelpRequests.length}
                                </span>
                            </div>
                            <p className="text-lg text-gray-600 font-medium ml-9">Citizens in need of your assistance</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {availableHelpRequests.map((request, index) => (
                                <div
                                    key={request._id}
                                    className={`bg-white rounded-xl shadow-sm border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 group animate-slideInUp ${
                                        request.isEmergency ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    style={{animationDelay: `${index * 0.05}s`}}
                                >
                                    {/* Emergency Badge */}
                                    {request.isEmergency && (
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                🚨 EMERGENCY
                                            </span>
                                        </div>
                                    )}

                                    {/* Request Title */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-amber-600 transition-colors">
                                        {request.title}
                                    </h3>

                                    {/* Request Details */}
                                    <div className="space-y-3 mb-6">
                                        {request.category && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500">📋</span>
                                                <span className="text-gray-700 font-medium">{request.category}</span>
                                            </div>
                                        )}
                                        
                                        {request.location && (
                                            <div className="flex items-center gap-3">
                                                <MapPin size={18} className="text-red-500 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">{request.location}</span>
                                            </div>
                                        )}

                                        {request.createdBy && (
                                            <div className="flex items-center gap-3">
                                                <Users size={18} className="text-blue-500 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">
                                                    Requested by {request.createdBy.fullName || 'Citizen'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Matched Skills */}
                                    {request.matchingSkills && request.matchingSkills.length > 0 && (
                                        <div className="mb-6 pb-6 border-t border-gray-200 pt-4">
                                            <p className="text-xs text-gray-600 font-semibold mb-3 uppercase tracking-wide">Your Matching Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {request.matchingSkills.map(skill => (
                                                    <span
                                                        key={skill}
                                                        className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-300 hover:shadow-sm hover:scale-105 transition-all duration-200"
                                                    >
                                                        ✓ {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => navigate(`/event/${request._id}`)}
                                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-base shadow-sm"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                View & Respond
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {availableOrganizerEvents.length > 0 && (
                    <div className="mt-12 animate-slideInRight">
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">📅</span>
                                <h2 className="text-3xl font-bold text-gray-900">Organizer Events</h2>
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold text-lg border-2 border-blue-300">
                                    {availableOrganizerEvents.length}
                                </span>
                            </div>
                            <p className="text-lg text-gray-600 font-medium ml-9">Community events currently open for volunteers</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {availableOrganizerEvents.map((event, index) => (
                                <div
                                    key={event._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 group animate-slideInUp"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {event.hasGeneralSupport && (
                                        <div className="mb-3">
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300 uppercase">
                                                Open to all volunteers
                                            </span>
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {event.title}
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        {event.startDateTime && (
                                            <div className="flex items-center gap-3">
                                                <Calendar size={18} className="text-blue-600 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">
                                                    {new Date(event.startDateTime).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}

                                        {event.location && (
                                            <div className="flex items-center gap-3">
                                                <MapPin size={18} className="text-red-500 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">{event.location}</span>
                                            </div>
                                        )}

                                        {event.createdBy && (
                                            <div className="flex items-center gap-3">
                                                <Users size={18} className="text-indigo-500 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">
                                                    Organized by {event.createdBy.fullName || 'Organizer'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {event.matchingSkills && event.matchingSkills.length > 0 && (
                                        <div className="mb-6 pb-6 border-t border-gray-200 pt-4">
                                            <p className="text-xs text-gray-600 font-semibold mb-3 uppercase tracking-wide">Your Matching Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {event.matchingSkills.map(skill => (
                                                    <span
                                                        key={skill}
                                                        className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-300"
                                                    >
                                                        ✓ {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => navigate(`/event/${event._id}`)}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-base shadow-sm"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                View Event
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Participation Decision Modal */}
            <ParticipationDecisionModal
                isOpen={showParticipationModal}
                onClose={() => {
                    setShowParticipationModal(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent || {}}
                onDecision={handleParticipationDecision}
            />
        </div>
    );
};

export default VolunteerDashboard;

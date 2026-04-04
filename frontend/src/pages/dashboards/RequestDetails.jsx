import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import socketService from '../../services/socketService';
import { API_BASE_URL } from '../../constants/api';

const RequestDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [request, setRequest] = useState(null);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [recommendationTitle, setRecommendationTitle] = useState('AI Recommended Volunteers');
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showFeedbackForm, setShowFeedbackForm] = useState(null);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const statusTrackerRef = useRef(null);

    const normalizeMessage = (message = {}) => {
        const senderId = message.senderId || message.sender?.id || message.sender?._id || message.sender;
        const senderName = message.senderName || message.sender?.name || message.sender?.fullName || 'Unknown';

        return {
            _id: message._id,
            senderId: senderId ? senderId.toString() : '',
            senderName,
            message: message.message || message.content || '',
            timestamp: message.timestamp || message.createdAt || new Date().toISOString()
        };
    };

    useEffect(() => {
        fetchRequestDetails();
        fetchMessages();
    }, [id, user?._id]);

    // Socket.IO setup for real-time communication
    useEffect(() => {
        if (request && user) {
            const socket = socketService.initializeSocket();

            const joinRealtimeRooms = () => {
                socketService.joinEventChat(id, user._id, user.fullName, user.role);
                socketService.joinEventRoom(id, user._id, user.fullName, user.role);
            };

            joinRealtimeRooms();
            socket.on('connect', joinRealtimeRooms);
            
            const handleNewMessage = (message) => {
                const normalizedMessage = normalizeMessage(message);
                setMessages(prev => {
                    if (normalizedMessage._id && prev.some(existing => existing._id === normalizedMessage._id)) {
                        return prev;
                    }
                    return [...prev, normalizedMessage];
                });
            };
            
            const handleStatusUpdate = (data) => {
                if (data.eventId?.toString() === id?.toString()) {
                    fetchRequestDetails();
                }
            };

            socketService.removeMessageListener();
            socketService.onReceiveMessage(handleNewMessage);
            socketService.onStatusUpdated(handleStatusUpdate);

            return () => {
                socket.emit('leaveEventChat');
                socket.emit('leaveEventRoom', { eventId: id });
                socket.off('connect', joinRealtimeRooms);
                socketService.removeMessageListener();
                socketService.offStatusUpdated(handleStatusUpdate);
            };
        }
    }, [request, user?._id, id]);

    const fetchRequestDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/citizen/request/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch help request');
            }

            const data = await response.json();
            setRequest(data.request || data);
            setAiRecommendations(Array.isArray(data.aiRecommendedVolunteers) ? data.aiRecommendedVolunteers : []);
            setRecommendationTitle(data.recommendationTitle || 'AI Recommended Volunteers');
        } catch (error) {
            console.error('Error fetching help request:', error);
            showToast({ type: 'error', message: 'Failed to load help request details' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/chat/event/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMessages((data.messages || []).map(normalizeMessage));
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim()) return;

        try {
            setSendingMessage(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_BASE_URL}/chat/event/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: newMessage })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            if (data?.messagePayload) {
                const normalizedMessage = normalizeMessage(data.messagePayload);
                setMessages(prev => {
                    if (normalizedMessage._id && prev.some(existing => existing._id === normalizedMessage._id)) {
                        return prev;
                    }
                    return [...prev, normalizedMessage];
                });
            }

            // Message will be added via socket
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            showToast({ type: 'error', message: 'Failed to send message' });
        } finally {
            setSendingMessage(false);
        }
    };

    const handleSubmitFeedback = async (volunteerId) => {
        if (feedbackComment.length < 10) {
            showToast({ type: 'error', message: 'Feedback must be at least 10 characters' });
            return;
        }

        try {
            setSubmittingFeedback(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_BASE_URL}/events/${id}/rate-volunteer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    volunteerId,
                    rating: feedbackRating,
                    feedback: feedbackComment
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit feedback');
            }

            showToast({ type: 'success', message: 'Thank you for your feedback!' });
            setShowFeedbackForm(null);
            setFeedbackRating(5);
            setFeedbackComment('');
            
            // Refresh to show updated rating
            await fetchRequestDetails();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showToast({ type: 'error', message: error.message });
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const getSkillColor = (skill) => {
        const colors = {
            'Medical': 'from-red-500 to-red-600',
            'Food Distribution': 'from-orange-500 to-orange-600',
            'Transportation': 'from-blue-500 to-blue-600',
            'Counseling': 'from-purple-500 to-purple-600',
            'Technical Support': 'from-green-500 to-green-600',
            'Education': 'from-yellow-500 to-yellow-600',
            'Legal Aid': 'from-indigo-500 to-indigo-600',
            'Construction': 'from-gray-500 to-gray-600'
        };
        return colors[skill] || 'from-gray-500 to-gray-600';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Assigned':
            case 'Accepted':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Completed':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const statusFlow = ['Pending', 'Assigned', 'In Progress', 'Completed'];

    const getAssignmentProgressStatus = (assignment = {}) => {
        if (assignment.participationStatus === 'Declined') return 'Declined';

        if (statusFlow.includes(assignment.status)) {
            return assignment.status;
        }

        if (assignment.participationStatus === 'Accepted') {
            return 'Assigned';
        }

        return 'Pending';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading help request...</p>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-gray-600 text-lg">Help request not found</p>
                    <button
                        onClick={() => navigate('/dashboard/user')}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard/user')}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                    <span className="text-xl">←</span>
                    <span>Back to Dashboard</span>
                </button>

                {/* Emergency Banner */}
                {request.isEmergency && (
                    <div className="mb-6 bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-xl shadow-2xl p-6 text-white animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="text-5xl">🚨</div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold uppercase tracking-wide mb-1">Emergency Help Request</h2>
                                <p className="text-red-100 text-lg">This request requires immediate attention and priority response.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-bold">{request.title}</h1>
                                        {request.isEmergency && (
                                            <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-red-500 text-white shadow-lg animate-pulse">
                                                🚨 EMERGENCY
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 backdrop-blur-sm bg-white/20 ${getStatusColor(request.trackingStatus || request.status)}`}>
                                            Status: {request.trackingStatus || request.status}
                                        </span>
                                        <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30">
                                            📅 {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                            <div className="space-y-5">
                                <div>
                                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Description</span>
                                    <p className="text-gray-700 mt-1 leading-relaxed">{request.description}</p>
                                </div>

                                {request.category && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Category</span>
                                        <p className="text-gray-700 mt-1">{request.category}</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100">
                                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Location</span>
                                    <p className="text-gray-700 mt-1">{request.location}</p>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Created</span>
                                    <p className="text-gray-700 mt-1">{new Date(request.createdAt).toLocaleDateString()}</p>
                                </div>

                                {request.requiredSkills?.length > 0 && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Required Skills</span>
                                        <div className="flex flex-wrap gap-2">
                                            {request.requiredSkills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1.5 bg-gradient-to-r ${getSkillColor(skill)} text-white rounded-lg text-sm font-medium shadow-sm`}
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {request.createdBy && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Requested By</span>
                                        <p className="text-gray-700 mt-1">{request.createdBy.fullName || 'You'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {aiRecommendations.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">{recommendationTitle}</h3>
                                <div className="space-y-3">
                                    {aiRecommendations.slice(0, 3).map((volunteer, index) => (
                                        <div key={volunteer.volunteerId || index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-semibold text-gray-800">{volunteer.rank || `Top ${index + 1}`}: {volunteer.fullName}</p>
                                                <span className="text-sm font-bold text-blue-700">{volunteer.scorePercentage || `${Math.round(volunteer.score || 0)}%`}</span>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                Skill: {Math.round(volunteer?.scoreBreakdown?.skillMatch || 0)}% · Rating: {Math.round(volunteer?.scoreBreakdown?.rating || 0)}% · Experience: {Math.round(volunteer?.scoreBreakdown?.experience || 0)}%
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Communication Panel */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Communication</h3>
                            
                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <div className="h-96 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-4xl mb-2 text-gray-300">💬</div>
                                                <p className="text-gray-500 text-sm">No messages yet</p>
                                                <p className="text-gray-400 text-xs mt-1">Start the conversation with volunteers!</p>
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`flex ${msg.senderId?.toString() === user?._id?.toString() ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
                                                        msg.senderId?.toString() === user?._id?.toString()
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white text-gray-800 border border-gray-200'
                                                    }`}
                                                >
                                                    <div className={`font-semibold text-xs mb-1 ${
                                                        msg.senderId?.toString() === user?._id?.toString() ? 'text-blue-100' : 'text-gray-600'
                                                    }`}>
                                                        {msg.senderName}
                                                    </div>
                                                    <div className="break-words">{msg.message}</div>
                                                    <div className={`text-xs mt-1 ${
                                                        msg.senderId?.toString() === user?._id?.toString() ? 'text-blue-200' : 'text-gray-400'
                                                    }`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sendingMessage || !newMessage.trim()}
                                            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        >
                                            {sendingMessage ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Status Tracker & Volunteers */}
                    <div className="space-y-6">
                        {/* Volunteer Status Tracker */}
                        <div ref={statusTrackerRef} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Volunteer Status Trackers</h3>

                            {/* Participating Volunteers */}
                            {request.volunteerAssignments?.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        Volunteers ({request.volunteerAssignments.length})
                                    </p>
                                    <div className="space-y-4">
                                        {request.volunteerAssignments.map((assignment, index) => {
                                            const volunteer = assignment.volunteerId;
                                            const isAccepted = assignment.participationStatus === 'Accepted';
                                            const isCompleted = assignment.status === 'Completed';
                                            const assignmentProgressStatus = getAssignmentProgressStatus(assignment);
                                            const assignmentStatusIndex = statusFlow.indexOf(assignmentProgressStatus);
                                            const isFormVisible = showFeedbackForm === volunteer?._id;
                                            const existingRating = assignment.ratings?.find(r => r.ratedBy?.toString() === user?._id?.toString());
                                            const allRatings = assignment.ratings || [];
                                            const avgRating = allRatings.length > 0 
                                                ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1)
                                                : null;
                                            
                                            return (
                                                <div 
                                                    key={index} 
                                                    className={`p-4 rounded-lg border-2 ${
                                                        isAccepted 
                                                            ? 'bg-green-50 border-green-200' 
                                                            : 'bg-gray-50 border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                                                                isAccepted ? 'bg-green-500' : 'bg-gray-400'
                                                            }`}>
                                                                {volunteer?.fullName?.[0] || 'V'}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">
                                                                    {volunteer?.fullName || 'Volunteer'}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                                        isAccepted 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-gray-200 text-gray-600'
                                                                    }`}>
                                                                        {assignment.participationStatus}
                                                                    </span>
                                                                    {isAccepted && (
                                                                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                                            isCompleted ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                                        }`}>
                                                                            {assignment.status}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {/* Show average rating */}
                                                                {avgRating && (
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <span className="text-yellow-400 text-sm">⭐</span>
                                                                        <span className="text-xs font-medium text-gray-700">{avgRating}</span>
                                                                        <span className="text-xs text-gray-500">({allRatings.length} review{allRatings.length !== 1 ? 's' : ''})</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-2xl">
                                                            {isAccepted ? '✓' : '✗'}
                                                        </div>
                                                    </div>

                                                    {assignment.participationStatus === 'Declined' ? (
                                                        <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-600 font-medium">
                                                            This volunteer declined the help request.
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-white">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Individual Progress</p>
                                                            <div className="space-y-2">
                                                                {statusFlow.map((status, statusIndex) => {
                                                                    const isReached = assignmentStatusIndex >= 0 && statusIndex <= assignmentStatusIndex;
                                                                    const isCurrent = status === assignmentProgressStatus;

                                                                    return (
                                                                        <div key={`${volunteer?._id || index}-${status}`} className="flex items-center gap-2">
                                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                                isReached
                                                                                    ? isCurrent
                                                                                        ? 'bg-blue-600 text-white'
                                                                                        : 'bg-green-500 text-white'
                                                                                    : 'bg-gray-200 text-gray-500'
                                                                            }`}>
                                                                                {isReached && !isCurrent ? '✓' : statusIndex + 1}
                                                                            </div>
                                                                            <span className={`text-sm ${isReached ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                                                                {status}
                                                                            </span>
                                                                            {isCurrent && (
                                                                                <span className="text-xs text-blue-600 font-semibold">Current</span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Rating Section - Only for Citizens and Completed Status */}
                                                    {isCompleted && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            {!existingRating && !isFormVisible && (
                                                                <button
                                                                    onClick={() => {
                                                                        setShowFeedbackForm(volunteer._id);
                                                                        setFeedbackRating(5);
                                                                        setFeedbackComment('');
                                                                    }}
                                                                    className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 shadow-md transition-all"
                                                                >
                                                                    ⭐ Rate Volunteer
                                                                </button>
                                                            )}

                                                            {existingRating && !isFormVisible && (
                                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                                    <p className="text-xs font-semibold text-green-800 mb-2">✓ You rated this volunteer</p>
                                                                    <div className="flex items-center gap-1 mb-1">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <span key={star} className={`text-lg ${star <= existingRating.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                                                ⭐
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-xs text-gray-700 mt-2">{existingRating.feedback}</p>
                                                                </div>
                                                            )}

                                                            {isFormVisible && !existingRating && (
                                                                <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-4 shadow-lg">
                                                                    <h4 className="font-bold text-purple-900 mb-3 text-sm">⭐ Rate {volunteer?.fullName}</h4>
                                                                    <div className="mb-3">
                                                                        <label className="block text-xs font-semibold text-purple-800 mb-2">Star Rating *</label>
                                                                        <div className="flex items-center gap-2">
                                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                                <button
                                                                                    key={star}
                                                                                    type="button"
                                                                                    onClick={() => setFeedbackRating(star)}
                                                                                    className="focus:outline-none transform hover:scale-125 transition-all"
                                                                                >
                                                                                    <span className={`text-2xl ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                                                        ⭐
                                                                                    </span>
                                                                                </button>
                                                                            ))}
                                                                            <span className="ml-2 text-sm font-bold text-purple-900">{feedbackRating}/5</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mb-3">
                                                                        <label className="block text-xs font-semibold text-purple-800 mb-2">
                                                                            Feedback * <span className="text-xs text-purple-600">(minimum 10 characters)</span>
                                                                        </label>
                                                                        <textarea
                                                                            value={feedbackComment}
                                                                            onChange={(e) => setFeedbackComment(e.target.value)}
                                                                            className="w-full border-2 border-purple-300 rounded-lg p-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
                                                                            rows="3"
                                                                            placeholder="Share your experience..."
                                                                        />
                                                                        <p className={`text-xs mt-1 font-semibold ${feedbackComment.length >= 10 ? 'text-green-600' : 'text-orange-600'}`}>
                                                                            {feedbackComment.length} / 10 characters {feedbackComment.length >= 10 ? '✓' : ''}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleSubmitFeedback(volunteer._id)}
                                                                            disabled={submittingFeedback || feedbackComment.length < 10}
                                                                            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                                                                        >
                                                                            {submittingFeedback ? 'Submitting...' : '✓ Submit'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setShowFeedbackForm(null)}
                                                                            disabled={submittingFeedback}
                                                                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-50 transition-all"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* No volunteers assigned message */}
                            {(!request.volunteerAssignments || request.volunteerAssignments.length === 0) && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="text-center py-6 text-gray-500">
                                        <div className="text-4xl mb-2">👥</div>
                                        <p className="text-sm font-medium">No volunteers yet</p>
                                        <p className="text-xs text-gray-400 mt-1">Volunteers will appear here once they accept your request</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetails;

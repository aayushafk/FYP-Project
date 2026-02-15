import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import socketService from '../services/socketService';
import { API_BASE_URL } from '../constants/api';

const HelpRequestDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const statusTrackerRef = useRef(null);

  useEffect(() => {
    fetchRequestDetails();
    fetchMessages();
  }, [id, user?._id]);

  // Socket.IO setup for real-time communication
  useEffect(() => {
    if (request && user) {
      socketService.joinEventChat(id, user._id, user.fullName, user.role);
      
      const handleNewMessage = (message) => {
        setMessages(prev => [...prev, message]);
      };
      
      const handleStatusUpdate = (data) => {
        if (data.eventId === id) {
          fetchRequestDetails();
        }
      };

      socketService.onNewMessage(handleNewMessage);
      socketService.onStatusUpdated(handleStatusUpdate);

      return () => {
        socketService.socket?.off('receiveMessage', handleNewMessage);
        socketService.socket?.off('volunteerStatusUpdated', handleStatusUpdate);
      };
    }
  }, [request, user?._id, id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = user?.role === 'citizen' || user?.role === 'user'
        ? `/citizen/request/${id}`
        : `/events/${id}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch help request');
      }

      const data = await response.json();
      setRequest(data.request || data);
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
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleAccept = async () => {
    if (user?.role !== 'volunteer') {
      showToast({ type: 'error', message: 'Only volunteers can accept requests' });
      return;
    }

    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/volunteer/event/${id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept request');
      }

      const data = await response.json();
      setRequest(data.event);
      
      showToast({ type: 'success', message: 'Help request accepted! You can now update the status.' });
      
      // Refresh request details to show updated state
      await fetchRequestDetails();
    } catch (error) {
      console.error('Error accepting request:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDecline = async () => {
    if (user?.role !== 'volunteer') {
      showToast({ type: 'error', message: 'Only volunteers can decline requests' });
      return;
    }

    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/volunteer/event/${id}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to decline request');
      }

      showToast({ type: 'success', message: 'Request declined' });
      
      // Refresh request details to show declined status
      await fetchRequestDetails();
    } catch (error) {
      console.error('Error declining request:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (user?.role !== 'volunteer' && user?.role !== 'citizen') {
      showToast({ type: 'error', message: 'Unauthorized to update status' });
      return;
    }

    // Check permission
    if (user.role === 'volunteer' && !canVolunteerUpdateStatus()) {
      showToast({ type: 'error', message: 'You must accept this help request to update status.' });
      return;
    }

    if (user.role === 'citizen' && !isCreator()) {
      showToast({ type: 'error', message: 'Only the creator can update this request' });
      return;
    }

    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');
      
      // Use appropriate endpoint based on role
      const endpoint = user.role === 'citizen' 
        ? `/citizen/request/${id}/status`
        : `/volunteer/event/${id}/status`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      const data = await response.json();
      setRequest(data.event || data.request);
      
      showToast({ type: 'success', message: 'Status updated successfully!' });
    } catch (error) {
      console.error('Error updating status:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      
      // Ensure socket is connected
      await socketService.ensureConnected();
      socketService.joinEventChat(id, user._id, user.fullName, user.role);

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

      const socket = socketService.getSocket();
      socket.emit('sendMessage', {
        eventId: id,
        message: newMessage,
        senderId: user._id,
        senderName: user.fullName
      });

      setNewMessage('');
      showToast({ type: 'success', message: 'Message sent!' });
    } catch (error) {
      console.error('Error sending message:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Progress':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSkillColor = (skill) => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('medical') || skillLower.includes('health')) return 'from-red-400 to-red-500';
    if (skillLower.includes('food') || skillLower.includes('cook')) return 'from-orange-400 to-orange-500';
    if (skillLower.includes('tech') || skillLower.includes('it')) return 'from-indigo-400 to-indigo-500';
    if (skillLower.includes('transport')) return 'from-blue-400 to-blue-500';
    if (skillLower.includes('rescue') || skillLower.includes('emergency')) return 'from-red-500 to-red-600';
    return 'from-gray-400 to-gray-500';
  };

  const isVolunteerAssigned = () => {
    if (!request || !user || user.role !== 'volunteer') return false;
    const assignedVolunteers = request.assignedVolunteers || [];
    return assignedVolunteers.some(v => {
      const volunteerId = v._id ? v._id.toString() : v.toString();
      return volunteerId === user._id.toString();
    });
  };

  const getVolunteerParticipationStatus = () => {
    if (!request || !user || user.role !== 'volunteer') return null;
    const volunteerAssignments = request.volunteerAssignments || [];
    const assignment = volunteerAssignments.find(a => {
      const volunteerId = a.volunteerId?._id ? a.volunteerId._id.toString() : a.volunteerId?.toString();
      return volunteerId === user._id.toString();
    });
    return assignment ? assignment.participationStatus : null;
  };

  const isCreator = () => {
    if (!request || !user) return false;
    const creatorId = request.createdBy?._id || request.createdBy;
    return creatorId?.toString() === user._id?.toString();
  };

  const canVolunteerUpdateStatus = () => {
    if (!request || !user || user.role !== 'volunteer') return false;
    const currentStatus = request.trackingStatus || request.status;
    return isVolunteerAssigned() && (currentStatus === 'Assigned' || currentStatus === 'Accepted');
  };

  const canUpdateStatus = () => {
    if (!request || !user) return false;
    // Citizen (creator) can always update
    if (user.role === 'citizen' && isCreator()) return true;
    // Volunteer can update only if assigned and status is Assigned/Accepted
    if (user.role === 'volunteer') return canVolunteerUpdateStatus();
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading help request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-3 text-red-500">⚠️</div>
          <p className="text-lg font-semibold text-gray-800">Help request not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2 transition-colors duration-200"
        >
          <span>←</span> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{request.title}</h1>
                  <div className="flex items-center gap-3 text-amber-100">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-white/20 backdrop-blur-sm">
                      🆘 Help Request
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(request.trackingStatus || request.status)}`}>
                      {request.trackingStatus || request.status || 'Pending'}
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
                    <p className="text-gray-700 mt-1">{request.createdBy.fullName || 'Citizen'}</p>
                  </div>
                )}
              </div>
            </div>

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
                        <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.senderId === user?._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
                            msg.senderId === user?._id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <div className={`font-semibold text-xs mb-1 ${
                            msg.senderId === user?._id ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {msg.senderName}
                          </div>
                          <div className="break-words">{msg.message}</div>
                          <div className={`text-xs mt-1 ${
                            msg.senderId === user?._id ? 'text-blue-200' : 'text-gray-400'
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

          {/* Right Column - Status Tracker */}
          <div className="space-y-6">
            <div ref={statusTrackerRef} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Status Tracker</h3>
              
              <div className="space-y-4">
                {['Pending', 'Assigned', 'In Progress', 'Completed'].map((status, index) => {
                  const currentStatusIndex = ['Pending', 'Assigned', 'In Progress', 'Completed'].indexOf(request.trackingStatus || request.status || 'Pending');
                  const isActive = index <= currentStatusIndex;
                  const isCurrent = status === (request.trackingStatus || request.status);
                  
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                        isActive 
                          ? isCurrent 
                            ? 'bg-blue-600 text-white ring-4 ring-blue-200' 
                            : 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isActive && !isCurrent ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                          {status}
                        </div>
                        {isCurrent && (
                          <div className="text-xs text-blue-600 font-medium">Current Status</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Accept/Decline Buttons - Only for volunteers who haven't accepted yet */}
              {user?.role === 'volunteer' && !isVolunteerAssigned() && (request.trackingStatus === 'Pending' || request.status === 'Pending') && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-gray-600 font-medium mb-3">Will you help with this request?</p>
                  <button
                    onClick={handleAccept}
                    disabled={updatingStatus}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {updatingStatus ? 'Processing...' : '✓ Accept Request'}
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={updatingStatus}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {updatingStatus ? 'Processing...' : '✗ Decline Request'}
                  </button>
                </div>
              )}

              {/* Participation Status - Show if volunteer has already responded */}
              {user?.role === 'volunteer' && getVolunteerParticipationStatus() && (
                <div className="mt-6">
                  {getVolunteerParticipationStatus() === 'Accepted' && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">
                          ✓
                        </div>
                        <div>
                          <p className="font-bold text-green-800">You're Participating!</p>
                          <p className="text-sm text-green-700">You accepted this help request</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {getVolunteerParticipationStatus() === 'Declined' && (
                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white text-xl">
                          ✗
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Request Declined</p>
                          <p className="text-sm text-gray-600">You declined this help request</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Update Section */}
              {(user?.role === 'citizen' || user?.role === 'volunteer') && (
                <div className="mt-6 space-y-2">
                  {/* Show message if volunteer can't update */}
                  {user?.role === 'volunteer' && !canUpdateStatus() && isVolunteerAssigned() && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-yellow-800 font-medium">
                        ℹ️ Status updates available after accepting the request.
                      </p>
                    </div>
                  )}
                  
                  {user?.role === 'volunteer' && !isVolunteerAssigned() && (request.trackingStatus !== 'Pending' && request.status !== 'Pending') && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-600 font-medium">
                        ℹ️ You must accept this help request to update status.
                      </p>
                    </div>
                  )}

                  {canUpdateStatus() && (
                    <>
                      <p className="text-sm text-gray-600 font-medium mb-3">Update Status:</p>
                      <div className="space-y-2">
                        {['Assigned', 'In Progress', 'Completed'].map(status => {
                          const currentStatus = request.trackingStatus || request.status;
                          const canUpdate = (
                            (status === 'Assigned' && currentStatus === 'Pending') ||
                            (status === 'In Progress' && (currentStatus === 'Assigned' || currentStatus === 'Pending' || currentStatus === 'Accepted')) ||
                            (status === 'Completed' && currentStatus === 'In Progress')
                          );

                          if (!canUpdate) return null;

                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(status)}
                              disabled={updatingStatus}
                              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white rounded-lg font-medium transition-all shadow-md text-sm"
                            >
                              {updatingStatus ? 'Updating...' : `Mark as ${status}`}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Participating Volunteers */}
              {request.volunteerAssignments?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Volunteers ({request.volunteerAssignments.length})
                  </p>
                  <div className="space-y-3">
                    {request.volunteerAssignments.map((assignment, index) => {
                      const volunteer = assignment.volunteerId;
                      const isAccepted = assignment.participationStatus === 'Accepted';
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                            isAccepted 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
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
                                  <span className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-800">
                                    {assignment.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl">
                            {isAccepted ? '✓' : '✗'}
                          </div>
                        </div>
                      );
                    })}
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

export default HelpRequestDetail;

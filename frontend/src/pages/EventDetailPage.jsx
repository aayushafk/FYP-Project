import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import socketService from '../services/socketService';
import { API_BASE_URL } from '../constants/api';
import LocationMap from '../components/messaging/LocationMap';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showParticipationModal, setShowParticipationModal] = useState(false);
  const [acceptingEvent, setAcceptingEvent] = useState(false);
  const [decliningEvent, setDecliningEvent] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(null); // volunteerId for whom to show form
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [location, setLocation] = useState(null); // {lat, lng, address}
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const statusTrackerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug modal state changes
  useEffect(() => {
    console.log('📋 Modal state changed:', showParticipationModal);
  }, [showParticipationModal]);

  // Debug user object on component mount
  useEffect(() => {
    console.log('🔍 EventDetailPage mounted');
    console.log('   - Has User:', !!user);
    console.log('   - User ID:', user?._id);
    console.log('   - User Role:', user?.role);
    console.log('   - User Name:', user?.fullName);
    console.log('   - Event ID:', eventId);
  }, []);

  // Fetch event details
  useEffect(() => {
    fetchEventDetails();
    fetchMessages();
    fetchFeedbacks();
  }, [eventId, user?._id]);

  // Check if volunteer needs to confirm participation
  useEffect(() => {
    console.log('📝 Checking participation modal...');
    console.log('   - Has Event:', !!event);
    console.log('   - User Role:', user?.role);
    console.log('   - Loading:', loading);
    console.log('   - User ID:', user?._id);
    console.log('   - Assigned Volunteers Count:', event?.assignedVolunteers?.length || 0);

    if (event && user?.role === 'volunteer' && !loading) {
      // Check if user is the organizer of this event
      const organizerId = event.organizer?._id || event.organizer || event.createdBy?._id || event.createdBy;
      const isOrganizer = organizerId && user._id && organizerId.toString() === user._id.toString();
      
      console.log('   - Event Organizer ID:', organizerId);
      console.log('   - Is User the Organizer:', isOrganizer);
      
      // Don't show modal if user is the organizer
      if (isOrganizer) {
        console.log('✋ User is the organizer, skipping modal');
        return;
      }
      
      // Check if volunteer has already made a decision (accepted or declined)
      const volunteerAssignments = event?.volunteerAssignments || [];
      const userId = user?._id?.toString();
      
      const existingAssignment = volunteerAssignments.find(a => {
        const volunteerId = a.volunteerId?._id ? a.volunteerId._id.toString() : a.volunteerId?.toString();
        return volunteerId === userId;
      });
      
      console.log('   - Volunteer Assignments:', volunteerAssignments);
      console.log('   - Current User ID:', userId);
      console.log('   - Existing Assignment:', existingAssignment);
      console.log('   - Participation Status:', existingAssignment?.participationStatus);
      
      // Only show modal if volunteer hasn't made any decision yet
      const hasNotDecided = !existingAssignment;
      
      console.log('✅ PARTICIPATION DECISION:');
      console.log('   - Has Made Decision:', !hasNotDecided);
      console.log('   - Will Show Modal:', hasNotDecided);
      
      if (hasNotDecided) {
        console.log('🚀 SETTING MODAL TO SHOW!');
        setShowParticipationModal(true);
      } else {
        console.log('✋ Volunteer already made a decision:', existingAssignment.participationStatus);
        setShowParticipationModal(false);
      }
    } else {
      console.log('⏭️  Skipping check - conditions not met');
      if (!event) console.log('      Reason: No event');
      if (user?.role !== 'volunteer') console.log('      Reason: Not a volunteer, role is:', user?.role);
      if (loading) console.log('      Reason: Still loading');
    }
  }, [event, user, loading]);

  // Setup socket connections
  useEffect(() => {
    if (!event || !user) return;

    const socket = socketService.initializeSocket();
    
    // Join event room for real-time updates
    socketService.joinEventChat(eventId, user._id, user.fullName, user.role);
    socket.emit('joinEventRoom', {
      eventId,
      userId: user._id,
      userName: user.fullName,
      userRole: user.role
    });

    // Listen for messages
    socketService.onReceiveMessage((message) => {
      console.log('📨 Received message via socket:', message);
      setMessages(prev => {
        const updated = [...prev, message];
        console.log('💬 Messages updated, count:', updated.length);
        return updated;
      });
    });

    // Listen for status updates
    socket.on('volunteerStatusUpdated', (data) => {
      console.log('📊 Status update received:', data);
      if (data.eventId === eventId) {
        setEvent(prev => {
          if (!prev) return prev;
          
          let updatedEvent = { ...prev };
          
          // Update individual volunteer's status if this is their update
          if (data.volunteerId && updatedEvent.volunteerAssignments) {
            updatedEvent.volunteerAssignments = updatedEvent.volunteerAssignments.map(assignment => {
              if (assignment.volunteerId._id === data.volunteerId || assignment.volunteerId === data.volunteerId) {
                return { ...assignment, status: data.newStatus };
              }
              return assignment;
            });
            
            // Calculate global event status based on all volunteers' statuses
            const allStatuses = updatedEvent.volunteerAssignments.map(a => a.status);
            const allCompleted = allStatuses.every(s => s === 'Completed');
            const anyInProgress = allStatuses.some(s => s === 'In Progress');
            
            if (allCompleted) {
              updatedEvent.trackingStatus = 'Completed';
            } else if (anyInProgress) {
              updatedEvent.trackingStatus = 'In Progress';
            } else {
              updatedEvent.trackingStatus = 'Assigned';
            }
          }
          
          console.log('✅ Event state updated:', { 
            globalStatus: updatedEvent.trackingStatus,
            volunteerAssignments: updatedEvent.volunteerAssignments?.map(a => ({ 
              id: a.volunteerId._id || a.volunteerId, 
              status: a.status 
            }))
          });
          
          return updatedEvent;
        });
        showToast({ type: 'success', message: `Status updated: ${data.newStatus}` });
      }
    });

    // Listen for status update errors
    socket.on('statusUpdateError', (data) => {
      console.error('❌ Status update error received:', data);
      showToast({ type: 'error', message: data.error || 'Failed to update status' });
      setUpdatingStatus(false);
    });

    // Cleanup
    return () => {
      socket.emit('leaveEventChat');
      socket.emit('leaveEventRoom', { eventId });
      socket.off('statusUpdated');
      socket.off('statusUpdateError');
    };
  }, [event, user?._id, eventId]);

  const fetchEventDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch event');

      const data = await response.json();
      setEvent(data.event);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      showToast({ type: 'error', message: 'Failed to load event details' });
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/event/${eventId}`, {
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

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/feedback/event/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  const handleSubmitFeedback = async (volunteerId) => {
    try {
      setSubmittingFeedback(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/feedback/event/${eventId}/volunteer/${volunteerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
      }

      showToast({ type: 'success', message: 'Feedback submitted successfully!' });
      setShowFeedbackForm(null);
      setFeedbackRating(5);
      setFeedbackComment('');
      fetchFeedbacks(); // Refresh feedbacks
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleAcceptEvent = async () => {
    try {
      setAcceptingEvent(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/volunteer/event/${eventId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept event');
      }

      const data = await response.json();
      
      // Close the modal first
      setShowParticipationModal(false);
      
      // Immediately re-fetch the event details to get updated participation status
      await fetchEventDetails();
      
      // Re-join the event room with socket to ensure real-time updates
      if (user) {
        const socket = socketService.getSocket();
        socket.emit('joinEventRoom', {
          eventId,
          userId: user._id,
          userName: user.fullName,
          userRole: user.role
        });
      }
      
      showToast({ type: 'success', message: 'Successfully joined the event! 🎉' });
    } catch (error) {
      console.error('Error accepting event:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setAcceptingEvent(false);
    }
  };

  const handleDeclineEvent = async () => {
    try {
      setDecliningEvent(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/volunteer/event/${eventId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to decline event');
      }

      const data = await response.json();
      
      // Close the modal first
      setShowParticipationModal(false);
      
      // Immediately re-fetch the event details to get updated participation status
      await fetchEventDetails();
      
      showToast({ type: 'info', message: 'You have declined this event' });
    } catch (error) {
      console.error('Error declining event:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setDecliningEvent(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const currentVolunteerStatus = getVolunteerStatus();
      console.log('📊 Updating status:', { from: currentVolunteerStatus, to: newStatus });
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/volunteer/event/${eventId}/status`, {
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
      console.log('✅ Status update response:', data);
      setEvent(data.event);
      
      // Emit socket event for real-time update
      const socket = socketService.getSocket();
      socket.emit('volunteerStatusUpdate', {
        eventId,
        volunteerId: user._id,
        volunteerName: user.fullName,
        newStatus,
        fromStatus: currentVolunteerStatus
      });

      showToast({ type: 'success', message: `Status updated to ${newStatus}!` });
    } catch (error) {
      console.error('❌ Error updating status:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast({ type: 'error', message: 'Image size should be less than 5MB' });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast({ type: 'error', message: 'Geolocation is not supported by your browser' });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          setLocation({
            lat: latitude,
            lng: longitude,
            address
          });
          setShowLocationPicker(true);
          showToast({ type: 'success', message: 'Location captured!' });
        } catch (error) {
          // If reverse geocoding fails, just use coordinates
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
          setShowLocationPicker(true);
        }
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        showToast({ type: 'error', message: 'Failed to get your location' });
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage && !location) return;

    console.log('📤 Starting to send message...', { hasText: !!newMessage.trim(), hasImage: !!selectedImage, hasLocation: !!location });

    try {
      setSendingMessage(true);
      
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        console.log('📷 Uploading image...');
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('eventId', eventId);

        const token = localStorage.getItem('token');
        const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
          console.log('✅ Image uploaded:', imageUrl);
        } else {
          throw new Error('Failed to upload image');
        }
        setUploadingImage(false);
      }

      // Check socket connection
      console.log('🔌 Ensuring socket connection...');
      await socketService.ensureConnected();
      
      // Join event chat if not already joined
      socketService.joinEventChat(eventId, user._id, user.fullName, user.role);
      console.log('✅ Socket connected and joined event chat');

      // Prepare message data
      let messageText = newMessage.trim();
      
      // If no text provided, create a default message based on attachments
      if (!messageText) {
        const parts = [];
        if (selectedImage || imageUrl) parts.push('📷 Image');
        if (location) parts.push('📍 Location');
        messageText = parts.join(' + ') || 'Message';
      }

      const messageData = {
        message: messageText,
      };

      if (imageUrl) {
        messageData.image = imageUrl;
      }

      if (location) {
        messageData.location = {
          lat: location.lat,
          lng: location.lng,
          address: location.address
        };
      }

      console.log('💾 Saving message to database...', messageData);

      // Save message to database
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/event/${eventId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save message');
      }

      const savedMessage = await response.json();
      console.log('✅ Message saved to database:', savedMessage);

      // Emit via socket for real-time delivery
      console.log('📡 Emitting message via socket...');
      socketService.sendMessage(eventId, messageData.message, imageUrl, location);
      console.log('✅ Message emitted via socket');

      // Clear form
      setNewMessage('');
      clearImage();
      setLocation(null);
      setShowLocationPicker(false);
      console.log('✅ Message sent successfully!');
      showToast({ type: 'success', message: 'Message sent!' });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      showToast({ type: 'error', message: error.message || 'Failed to send message' });
    } finally {
      setSendingMessage(false);
      setUploadingImage(false);
      console.log('🏁 Send message handler complete');
    }
  };

  const isVolunteerAssigned = () => {
    return event?.assignedVolunteers?.some(v => v._id === user?._id);
  };

  const getVolunteerStatus = () => {
    if (!event?.volunteerAssignments || !user?._id) return null;
    
    const assignment = event.volunteerAssignments.find(
      a => a.volunteerId?._id === user._id || a.volunteerId === user._id
    );
    
    return assignment?.status || null;
  };

  const getVolunteerParticipationStatus = () => {
    if (!event?.volunteerAssignments || !user?._id) return null;
    
    const assignment = event.volunteerAssignments.find(
      a => a.volunteerId?._id === user._id || a.volunteerId === user._id
    );
    
    return assignment?.participationStatus || null;
  };

  const canUpdateStatus = () => {
    const volunteerStatus = getVolunteerStatus();
    const participationStatus = getVolunteerParticipationStatus();
    return user?.role === 'volunteer' && isVolunteerAssigned() && participationStatus === 'Accepted' && volunteerStatus !== 'Completed';
  };

  const canAcceptEvent = () => {
    const participationStatus = getVolunteerParticipationStatus();
    return user?.role === 'volunteer' && !participationStatus;
  };

  // Helper function to get skill badge color
  const getSkillColor = (skill) => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes('medical') || skillLower.includes('health')) return 'from-red-400 to-red-500';
    if (skillLower.includes('food') || skillLower.includes('cook')) return 'from-orange-400 to-orange-500';
    if (skillLower.includes('tech') || skillLower.includes('it')) return 'from-indigo-400 to-indigo-500';
    if (skillLower.includes('general')) return 'from-teal-400 to-teal-500';
    return 'from-gray-400 to-gray-500';
  };

  const StatusTracker = ({ volunteerId, volunteerName, volunteerStatus, isReadOnly = false }) => {
    const statuses = [
      { name: 'Pending', color: 'orange', icon: '⏳' },
      { name: 'Assigned', color: 'blue', icon: '✓' },
      { name: 'In Progress', color: 'indigo', icon: '⚡' },
      { name: 'Completed', color: 'green', icon: '✓' }
    ];
    
    const colorClasses = {
      orange: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-200' },
      blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-200' },
      indigo: { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-600', ring: 'ring-indigo-200' },
      green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600', ring: 'ring-green-200' }
    };
    
    // Use the passed volunteer status
    const displayStatus = volunteerStatus || 'Assigned';
    const currentIndex = statuses.findIndex(s => s.name === displayStatus);
    
    // Check if current user is this volunteer and can update status
    const isCurrentVolunteer = user?._id === volunteerId;
    const canUpdate = !isReadOnly && isCurrentVolunteer && canUpdateStatus();

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">
          {isReadOnly ? (
            <span>{volunteerName}'s Status</span>
          ) : (
            <span>Your Status Tracker</span>
          )}
        </h3>
        <div className="flex items-center justify-between mb-6">
          {statuses.map((status, index) => {
            const colors = colorClasses[status.color];
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div key={status.name} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      isActive
                        ? `${colors.bg} text-white shadow-lg ${isCurrent ? `scale-110 ring-4 ${colors.ring}` : ''}`
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {status.icon}
                  </div>
                  <span className={`text-xs mt-2 text-center font-semibold ${
                    isActive ? colors.text : 'text-gray-400'
                  }`}>
                    {status.name}
                  </span>
                </div>
                {index < statuses.length - 1 && (
                  <div className={`flex-1 h-1.5 mx-2 rounded-full transition-all duration-500 ${
                    index < currentIndex ? colors.bg : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {canUpdate && displayStatus !== 'Completed' && (
          <div className="flex gap-3 justify-center pt-4 border-t border-gray-100">
            {displayStatus === 'Assigned' && (
              <button
                onClick={() => handleStatusUpdate('In Progress')}
                disabled={updatingStatus}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
              >
                Start Progress
              </button>
            )}
            {displayStatus === 'In Progress' && (
              <button
                onClick={() => handleStatusUpdate('Completed')}
                disabled={updatingStatus}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
              >
                Mark Complete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="text-5xl mb-3 text-red-500">⚠️</div>
          <p className="text-lg font-semibold text-gray-800">Event not found</p>
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

  // Participation Confirmation Modal for Volunteers
  if (showParticipationModal && user?.role === 'volunteer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Event Participation Confirmation</h2>
            <p className="text-blue-100">Please review the event details and confirm your participation</p>
          </div>

          {/* Event Details */}
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${
                event.type === 'citizen' 
                  ? 'bg-teal-100 text-teal-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {event.type === 'citizen' ? 'Citizen Request' : 'Organizer Event'}
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase">Description</p>
                  <p className="text-gray-700 mt-1">{event.description}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase">Location</p>
                  <p className="text-gray-700 mt-1">{event.location}</p>
                </div>
              </div>

              {event.category && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase">Category</p>
                    <p className="text-gray-700 mt-1">{event.category}</p>
                  </div>
                </div>
              )}

              {event.requiredSkills?.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {event.requiredSkills.map((skill, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1.5 bg-gradient-to-r ${getSkillColor(skill)} text-white rounded-lg text-sm font-medium shadow-sm`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Warning Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Before you participate</h4>
                  <p className="text-sm text-blue-800">By joining this event, you commit to contributing and communicating with the team. You'll be able to update status and coordinate with other volunteers.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleDeclineEvent}
                disabled={acceptingEvent || decliningEvent}
                className="flex-1 px-6 py-3 border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {decliningEvent ? (
                  <>
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </>
                ) : (
                  'No, I Decline'
                )}
              </button>
              <button
                onClick={handleAcceptEvent}
                disabled={acceptingEvent || decliningEvent}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {acceptingEvent ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Yes, I'll Participate
                  </>
                )}
              </button>
            </div>
          </div>
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

      {/* Participation Status Banner for Volunteers */}
      {user?.role === 'volunteer' && getVolunteerParticipationStatus() === 'Accepted' && (
        <div className="mb-6 rounded-xl border-l-4 bg-green-50 border-green-500 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">You are participating in this event</p>
              <p className="text-sm text-green-700">You can update the status and communicate with the team</p>
            </div>
          </div>
        </div>
      )}
      
      {user?.role === 'volunteer' && getVolunteerParticipationStatus() === 'Declined' && (
        <div className="mb-6 rounded-xl border-l-4 bg-gray-50 border-gray-500 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">You declined this event</p>
                <p className="text-sm text-gray-700">Changed your mind? You can still accept this event</p>
              </div>
            </div>
            <button
              onClick={handleAcceptEvent}
              disabled={acceptingEvent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
            >
              {acceptingEvent ? 'Accepting...' : 'Accept Event'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details Card */}
          <div className={`bg-white rounded-xl shadow-md border-l-4 ${
            event.type === 'citizen' ? 'border-teal-500' : 'border-purple-500'
          } p-8`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {event.title}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${
                    event.type === 'citizen' 
                      ? 'bg-teal-100 text-teal-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {event.type === 'citizen' ? 'Citizen Request' : 'Organizer Event'}
                  </span>
                  
                  {/* Show participation status badge */}
                  {user?.role === 'volunteer' && getVolunteerParticipationStatus() === 'Accepted' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-green-100 text-green-800 border border-green-300">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      You are participating
                    </span>
                  )}
                  
                  {user?.role === 'volunteer' && getVolunteerParticipationStatus() === 'Declined' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      You declined
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Description</span>
                <p className="text-gray-700 mt-1 leading-relaxed">{event.description}</p>
              </div>

              {event.category && (
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Category</span>
                  <p className="text-gray-700 mt-1">{event.category}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Location</span>
                <p className="text-gray-700 mt-1">{event.location}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Created</span>
                <p className="text-gray-700 mt-1">{new Date(event.createdAt).toLocaleDateString()}</p>
              </div>

              {event.requiredSkills?.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Required Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {event.requiredSkills.map((skill, index) => (
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
            </div>
          </div>

          {/* Communication Panel - Only for participating volunteers (Accepted), organizers, and citizens */}
          {(user?.role !== 'volunteer' || (isVolunteerAssigned() && getVolunteerParticipationStatus() === 'Accepted')) && (
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
                        className={`flex ${msg.sender?.id === user?._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
                            msg.sender?.id === user?._id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <div className={`font-semibold text-xs mb-1 ${
                            msg.sender?.id === user?._id ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {msg.sender?.id === user?._id 
                              ? 'You' 
                              : msg.sender?.role 
                                ? `${msg.sender.name} (${msg.sender.role.charAt(0).toUpperCase() + msg.sender.role.slice(1)})`
                                : msg.sender?.name
                            }
                          </div>
                          
                          {/* Message Text */}
                          {msg.message && (
                            <div className="break-words mb-2">{msg.message}</div>
                          )}
                          
                          {/* Image Display */}
                          {msg.image && (
                            <div className="mt-2 mb-2">
                              <img  
                                src={`${API_BASE_URL}${msg.image}`}
                                alt="Shared image"
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(`${API_BASE_URL}${msg.image}`, '_blank')}
                                style={{ maxHeight: '300px' }}
                              />
                            </div>
                          )}
                          
                          {/* Location Display with Map */}
                          {msg.location && msg.location.lat && msg.location.lng && (
                            <div className="mt-2">
                              <LocationMap location={msg.location} />
                            </div>
                          )}
                          
                          <div className={`text-xs mt-1 ${
                            msg.sender?.id === user?._id ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-blue-400" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  {/* Location Preview */}
                  {location && showLocationPicker && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-900">📍 Location Added</span>
                        <button
                          type="button"
                          onClick={() => { setLocation(null); setShowLocationPicker(false); }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-blue-700">{location.address}</p>
                    </div>
                  )}

                  {/* Uploading indicator */}
                  {uploadingImage && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-yellow-800">Uploading image...</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {/* Attachment Buttons - Available for all roles */}
                    <div className="flex gap-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Attach image"
                      >
                        📷
                      </button>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Share your location"
                      >
                        {gettingLocation ? '📡' : '📍'}
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || uploadingImage || (!newMessage.trim() && !selectedImage && !location)}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Message for non-participating or declined volunteers */}
          {user?.role === 'volunteer' && (!getVolunteerParticipationStatus() || getVolunteerParticipationStatus() === 'Declined') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-md p-8 text-center">
              <div className="text-5xl mb-3">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Communication Locked</h3>
              <p className="text-gray-600 mb-4">
                {getVolunteerParticipationStatus() === 'Declined' 
                  ? 'You declined this event. Communication is only available for participating volunteers.'
                  : 'You must participate in this event to access the communication panel and coordinate with the team.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Status & Info */}
        <div className="space-y-6">
          {/* Status Tracker - For Volunteers (Own Tracker Only) */}
          {user?.role === 'volunteer' && getVolunteerParticipationStatus() === 'Accepted' && (() => {
            const volunteerAssignment = event.volunteerAssignments?.find(
              va => va.volunteerId?._id === user._id || va.volunteerId === user._id
            );
            const volunteerStatus = volunteerAssignment?.status || 'Assigned';
            
            return (
              <div ref={statusTrackerRef}>
                <StatusTracker 
                  volunteerId={user._id}
                  volunteerName={user.fullName}
                  volunteerStatus={volunteerStatus}
                  isReadOnly={false}
                />
              </div>
            );
          })()}

          {/* Status Trackers - For Organizers/Citizens (All Volunteers - Read Only) */}
          {(user?.role === 'organizer' || user?.role === 'citizen' || user?.role === 'admin') && event.assignedVolunteers?.length > 0 && (() => {
            // Filter for volunteers who have accepted
            const acceptedVolunteers = event.assignedVolunteers.filter(volunteer => {
              const volunteerAssignment = event.volunteerAssignments?.find(
                va => va.volunteerId?._id === volunteer._id || va.volunteerId === volunteer._id
              );
              return volunteerAssignment?.participationStatus === 'Accepted';
            });

            if (acceptedVolunteers.length === 0) {
              return null;
            }

            return (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Volunteer Status Trackers</h3>
                {acceptedVolunteers.map((volunteer) => {
                  const volunteerAssignment = event.volunteerAssignments?.find(
                    va => va.volunteerId?._id === volunteer._id || va.volunteerId === volunteer._id
                  );
                  const volunteerStatus = volunteerAssignment?.status || 'Assigned';
                  
                  return (
                    <StatusTracker 
                      key={volunteer._id}
                      volunteerId={volunteer._id}
                      volunteerName={volunteer.fullName}
                      volunteerStatus={volunteerStatus}
                      isReadOnly={true}
                    />
                  );
                })}
              </div>
            );
          })()}

          {/* Assigned Volunteers */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Assigned Volunteers</h3>
            {event.assignedVolunteers?.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2 text-gray-300">👥</div>
                <p className="text-gray-500 text-sm">No volunteers assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {event.assignedVolunteers?.map((volunteer) => {
                  const isCurrentUser = volunteer._id === user?._id;
                  
                  // Find volunteer's individual status from volunteerAssignments
                  const volunteerAssignment = event.volunteerAssignments?.find(
                    va => va.volunteerId?._id === volunteer._id || va.volunteerId === volunteer._id
                  );
                  const volunteerStatus = volunteerAssignment?.status || 'Assigned';
                  
                  // Status badge colors
                  const statusColors = {
                    'Assigned': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '✓' },
                    'In Progress': { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: '⚡' },
                    'Completed': { bg: 'bg-green-100', text: 'text-green-700', icon: '✓' }
                  };
                  const statusStyle = statusColors[volunteerStatus] || statusColors['Assigned'];
                  
                  return (
                    <div 
                      key={volunteer._id} 
                      className={`p-4 rounded-lg border transition-colors duration-200 ${
                        isCurrentUser 
                          ? 'bg-green-50 border-green-400 hover:border-green-500' 
                          : 'bg-gray-50 border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-900">
                          {volunteer.fullName}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Show individual status for organizer/citizen */}
                          {(user?.role === 'organizer' || user?.role === 'citizen') && (
                            <span className={`px-2 py-0.5 ${statusStyle.bg} ${statusStyle.text} rounded text-xs font-semibold flex items-center gap-1`}>
                              <span>{statusStyle.icon}</span>
                              {volunteerStatus}
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-green-600 text-white rounded text-xs font-semibold">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {volunteer.email}
                      </div>
                      {volunteer.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {volunteer.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Feedback Section - Show for volunteers who completed their tasks */}
          {(user?.role === 'organizer' || user?.role === 'citizen' || user?.role === 'user') && event.assignedVolunteers?.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Volunteer Feedback & Ratings</h3>
              
              <div className="space-y-4">
                {event.assignedVolunteers.map((volunteer) => {
                  // Find volunteer's individual status
                  const volunteerAssignment = event.volunteerAssignments?.find(
                    va => va.volunteerId?._id === volunteer._id || va.volunteerId === volunteer._id
                  );
                  const volunteerStatus = volunteerAssignment?.status || 'Assigned';
                  
                  // Only show rating option for completed volunteers
                  if (volunteerStatus !== 'Completed') {
                    return null;
                  }
                  
                  const existingFeedback = feedbacks.find(
                    f => f.volunteerId._id === volunteer._id && f.ratedBy._id === user._id
                  );
                  const isFormVisible = showFeedbackForm === volunteer._id;

                  return (
                    <div key={volunteer._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{volunteer.fullName}</p>
                          <p className="text-sm text-gray-600">{volunteer.email}</p>
                          <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold mt-1">
                            <span>✓</span> Completed
                          </span>
                        </div>
                        {!existingFeedback && !isFormVisible && (
                          <button
                            onClick={() => {
                              setShowFeedbackForm(volunteer._id);
                              setFeedbackRating(5);
                              setFeedbackComment('');
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
                          >
                            Rate Volunteer
                          </button>
                        )}
                      </div>

                        {existingFeedback && (
                          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-5 h-5 ${star <= existingFeedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            {existingFeedback.comment && (
                              <p className="text-sm text-gray-700 mt-2">{existingFeedback.comment}</p>
                            )}
                            <p className="text-xs text-green-700 mt-2">✓ Feedback submitted</p>
                          </div>
                        )}

                        {isFormVisible && !existingFeedback && (
                          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="mb-3">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFeedbackRating(star)}
                                    className="focus:outline-none"
                                  >
                                    <svg
                                      className={`w-8 h-8 ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-300 transition-colors`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Comment (Optional)</label>
                              <textarea
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                rows="3"
                                placeholder="Share your experience working with this volunteer..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSubmitFeedback(volunteer._id)}
                                disabled={submittingFeedback}
                                className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                              >
                                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                              </button>
                              <button
                                onClick={() => setShowFeedbackForm(null)}
                                disabled={submittingFeedback}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }).filter(Boolean)}
                </div>

              {/* Show feedbacks for volunteers to view their own */}
              {user?.role === 'volunteer' && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Your Feedback</h4>
                  {feedbacks.filter(f => f.volunteerId._id === user._id).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-sm">No feedback received yet</p>
                    </div>
                  ) : (
                    feedbacks
                      .filter(f => f.volunteerId._id === user._id)
                      .map((feedback) => (
                        <div key={feedback._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-5 h-5 ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          {feedback.comment && (
                            <p className="text-sm text-gray-700 mb-2">{feedback.comment}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            From {feedback.ratedBy.fullName} ({feedback.ratedByRole})
                          </p>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Creator Info */}
          {event.createdBy && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Created By</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="font-semibold text-gray-900 mb-1">
                  {event.createdBy.fullName}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {event.createdBy.email}
                </div>
                {event.createdBy.phoneNumber && (
                  <div className="text-sm text-gray-600">
                    {event.createdBy.phoneNumber}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default EventDetailPage;

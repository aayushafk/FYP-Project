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
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [recommendationTitle, setRecommendationTitle] = useState('AI Recommended Volunteers');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [location, setLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const statusTrackerRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendLockRef = useRef(false);

  const normalizeMessage = (message = {}) => {
    const senderId = message.senderId || message.sender?.id || message.sender?._id || message.sender;
    const senderName = message.senderName || message.sender?.name || message.sender?.fullName || 'Unknown';
    const rawImage = message.image || message.imageUrl || message.imageData?.url || message.imageData?.path || null;
    const rawMessage = (message.message || message.content || '').toString();
    const isImageOnlyPlaceholder = Boolean(rawImage) && /^(?:📷\s*)?(?:image|shared image)$/i.test(rawMessage.trim());

    return {
      _id: message._id,
      senderId: senderId ? senderId.toString() : '',
      senderName,
      message: isImageOnlyPlaceholder ? '' : rawMessage,
      image: rawImage,
      location: message.location || message.locationData || null,
      timestamp: message.timestamp || message.createdAt || new Date().toISOString()
    };
  };

  const resolveImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') return '';

    const trimmed = imagePath.trim();
    if (!trimmed) return '';

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }

    const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    const normalizedPath = trimmed.replace(/\\/g, '/').replace(/\/+/g, '/');
    const pathWithSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

    if (pathWithSlash.startsWith('/api/')) {
      return `${apiOrigin}${pathWithSlash}`;
    }

    if (pathWithSlash.startsWith('/uploads/')) {
      return `${apiOrigin}/api${pathWithSlash}`;
    }

    if (pathWithSlash.startsWith('/api/uploads/')) {
      return `${apiOrigin}${pathWithSlash}`;
    }

    return `${API_BASE_URL}/${normalizedPath.replace(/^\/+/, '')}`;
  };

  const getLocationMapUrl = (locationData) => {
    if (!locationData) return null;
    if (locationData.lat && locationData.lng) {
      return `https://www.google.com/maps?q=${locationData.lat},${locationData.lng}`;
    }
    if (locationData.address) {
      return `https://www.google.com/maps?q=${encodeURIComponent(locationData.address)}`;
    }
    return null;
  };

  const hasUsableLocation = (locationData) => {
    if (!locationData) return false;
    if (locationData.lat && locationData.lng) return true;
    if (typeof locationData.address === 'string' && locationData.address.trim()) return true;
    return false;
  };

  useEffect(() => {
    fetchRequestDetails();
    fetchMessages();
  }, [id, user?._id]);

  // Socket.IO setup for real-time communication
  useEffect(() => {
    if (request && user) {
      socketService.joinEventChat(id, user._id, user.fullName, user.role);
      const socket = socketService.getSocket();
      
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
        if (data.eventId === id) {
          fetchRequestDetails();
        }
      };

      socket.off('receiveMessage', handleNewMessage);
      socket.on('receiveMessage', handleNewMessage);
      socketService.onStatusUpdated(handleStatusUpdate);

      return () => {
        socket.off('receiveMessage', handleNewMessage);
        socketService.offStatusUpdated(handleStatusUpdate);
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
        const normalizedMessages = Array.isArray(data.messages)
          ? data.messages.map(normalizeMessage)
          : [];
        setMessages(normalizedMessages);
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
      
      // Refresh request details and chat history so existing citizen messages
      // become visible immediately after acceptance.
      await Promise.all([fetchRequestDetails(), fetchMessages()]);
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
    if (user?.role !== 'volunteer') {
      showToast({ type: 'error', message: 'Unauthorized to update status' });
      return;
    }

    // Check permission
    if (user.role === 'volunteer' && !canVolunteerUpdateStatus()) {
      showToast({ type: 'error', message: 'You must accept this help request to update status.' });
      return;
    }

    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/volunteer/event/${id}/status`, {
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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'error', message: 'Image size should be less than 5MB' });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
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
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          setLocation({ lat: latitude, lng: longitude, address });
          setShowLocationPicker(true);
          showToast({ type: 'success', message: 'Location captured!' });
        } catch (error) {
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
          setShowLocationPicker(true);
        }
        setGettingLocation(false);
      },
      () => {
        setGettingLocation(false);
        showToast({ type: 'error', message: 'Failed to get your location' });
      }
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage && !location) return;
    if (sendLockRef.current) return;
    sendLockRef.current = true;

    try {
      setSendingMessage(true);
      let imageUrl = null;

      if (selectedImage) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('eventId', id);

        const token = localStorage.getItem('token');
        const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
        setUploadingImage(false);
      }
      
      // Ensure socket is connected
      await socketService.ensureConnected();
      socketService.joinEventChat(id, user._id, user.fullName, user.role);

      let outgoingMessage = newMessage.trim();
      if (!outgoingMessage) {
        const parts = [];
        if (imageUrl) parts.push('📷 Image');
        if (location) parts.push('📍 Location');
        outgoingMessage = parts.join(' + ') || 'Message';
      }

      socketService.sendMessage(id, outgoingMessage, imageUrl, location);

      setNewMessage('');
      clearImage();
      setLocation(null);
      setShowLocationPicker(false);
      showToast({ type: 'success', message: 'Message sent!' });
    } catch (error) {
      console.error('Error sending message:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setSendingMessage(false);
      setUploadingImage(false);
      sendLockRef.current = false;
    }
  };

  const handleSubmitFeedback = async (volunteerId) => {
    if (feedbackRating < 1 || feedbackRating > 5) {
      showToast({ type: 'error', message: 'Rating must be between 1 and 5 stars' });
      return;
    }
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
        throw new Error(error.message || 'Failed to submit rating');
      }

      showToast({ type: 'success', message: 'Rating submitted successfully!' });
      setShowFeedbackForm(null);
      setFeedbackRating(5);
      setFeedbackComment('');
      
      // Refresh request details
      await fetchRequestDetails();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast({ type: 'error', message: error.message });
    } finally {
      setSubmittingFeedback(false);
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
  const formatDate = (value) => {
    if (!value) return 'N/A';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return 'N/A';
    return parsedDate.toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) return '';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return '';
    return parsedDate.toLocaleTimeString();
  };

  const getVolunteerIdValue = (assignment = {}) => {
    const rawVolunteer = assignment?.volunteerId;
    if (rawVolunteer && typeof rawVolunteer === 'object') {
      return (rawVolunteer._id || rawVolunteer.id || '').toString();
    }
    return (rawVolunteer || '').toString();
  };

  const getVolunteerDisplayName = (assignment = {}, index = 0) => {
    const volunteer = assignment?.volunteerId;

    const candidateNames = [
      assignment?.volunteerName,
      assignment?.fullName,
      volunteer?.fullName,
      volunteer?.name,
      volunteer?.username,
      volunteer?.profile?.fullName,
      volunteer?.user?.fullName
    ];

    const resolvedName = candidateNames.find((name) => typeof name === 'string' && name.trim());
    if (resolvedName) {
      return resolvedName.trim();
    }

    const assignmentVolunteerId = getVolunteerIdValue(assignment);
    const assignedVolunteers = Array.isArray(request?.assignedVolunteers) ? request.assignedVolunteers : [];
    const matchingAssignedVolunteer = assignedVolunteers.find((assignedVolunteer) => {
      const assignedId = (assignedVolunteer?._id || assignedVolunteer?.id || assignedVolunteer || '').toString();
      return assignmentVolunteerId && assignedId === assignmentVolunteerId;
    });

    const assignedName = (
      matchingAssignedVolunteer?.fullName ||
      matchingAssignedVolunteer?.name ||
      matchingAssignedVolunteer?.username
    );

    if (typeof assignedName === 'string' && assignedName.trim()) {
      return assignedName.trim();
    }

    const emailCandidate = assignment?.email || volunteer?.email || matchingAssignedVolunteer?.email;
    if (typeof emailCandidate === 'string' && emailCandidate.includes('@')) {
      return emailCandidate.split('@')[0];
    }

    return `Volunteer ${index + 1}`;
  };

  const getSkillColor = (skill) => {
    const skillLabel = typeof skill === 'string'
      ? skill
      : (skill?.name || skill?.skill || String(skill || ''));
    const skillLower = skillLabel.toLowerCase();
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
            {/* Emergency Banner */}
            {request.isEmergency && (
              <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-5 text-white">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🚨</span>
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-wide text-white">Emergency Request</h3>
                    <p className="text-red-100 text-sm">This citizen requires immediate assistance. Urgent action needed!</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Header Card */}
            <div className={`rounded-xl shadow-lg p-6 text-white ${
              request.isEmergency
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-600'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2 text-white">{request.title}</h1>
                  <div className="flex items-center gap-3 text-amber-100">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold text-white bg-white/20 backdrop-blur-sm">
                      {request.isEmergency ? '🚨 EMERGENCY' : '🆘 Help Request'}
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
                  <p className="text-gray-700 mt-1">{formatDate(request.createdAt)}</p>
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
                          {typeof skill === 'string' ? skill : (skill?.name || skill?.skill || 'General Support')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {request.createdBy && (
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Requested By</span>
                    <p className="text-gray-700 mt-1">{request.createdBy?.fullName || 'Citizen'}</p>
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
                          {msg.message && <div className="break-words">{msg.message}</div>}

                          {msg.image && (
                            <div className="mt-2 mb-2">
                              <img
                                src={resolveImageUrl(msg.image)}
                                alt="Shared image"
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(resolveImageUrl(msg.image), '_blank')}
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                  const fallback = event.currentTarget.nextElementSibling;
                                  if (fallback) {
                                    fallback.classList.remove('hidden');
                                  }
                                }}
                                style={{ maxHeight: '300px' }}
                              />
                              <div className="hidden text-xs px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                                Image unavailable (file not found on server).
                              </div>
                            </div>
                          )}

                          {hasUsableLocation(msg.location) && (
                            <div
                              className={`mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg ${getLocationMapUrl(msg.location) ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''}`}
                              onClick={() => {
                                const url = getLocationMapUrl(msg.location);
                                if (url) window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              role={getLocationMapUrl(msg.location) ? 'button' : undefined}
                              tabIndex={getLocationMapUrl(msg.location) ? 0 : undefined}
                              onKeyDown={(event) => {
                                if ((event.key === 'Enter' || event.key === ' ') && getLocationMapUrl(msg.location)) {
                                  event.preventDefault();
                                  window.open(getLocationMapUrl(msg.location), '_blank', 'noopener,noreferrer');
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 text-blue-800">
                                <span className="text-lg">📍</span>
                                <div className="flex-1">
                                  <div className="font-semibold text-sm">Location Shared</div>
                                  {msg.location.address && (
                                    <div className="text-xs text-blue-700 mt-1">{msg.location.address}</div>
                                  )}
                                  {getLocationMapUrl(msg.location) && (
                                    <a
                                      href={getLocationMapUrl(msg.location)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(event) => event.stopPropagation()}
                                      className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                    >
                                      View on Google Maps →
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className={`text-xs mt-1 ${
                            msg.senderId === user?._id ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {formatTime(msg.timestamp || msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white">
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

                  {uploadingImage && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-yellow-800">Uploading image...</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
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
          </div>

          {/* Right Column - Status Tracker */}
          <div className="space-y-6">
            <div ref={statusTrackerRef} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Volunteer Status Trackers</h3>

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

              {/* Status Update Section (Volunteer only) */}
              {user?.role === 'volunteer' && (
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
              {Array.isArray(request.volunteerAssignments) && request.volunteerAssignments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Volunteers ({request.volunteerAssignments.length})
                  </p>
                  <div className="space-y-4">
                    {request.volunteerAssignments.map((assignment, index) => {
                      const volunteer = assignment.volunteerId;
                      const volunteerIdValue = getVolunteerIdValue(assignment);
                      const volunteerDisplayName = getVolunteerDisplayName(assignment, index);
                      const isAccepted = assignment.participationStatus === 'Accepted';
                      const isCompleted = assignment.status === 'Completed';

                      const assignmentProgressStatus = getAssignmentProgressStatus(assignment);
                      const assignmentStatusIndex = statusFlow.indexOf(assignmentProgressStatus);
                      const isFormVisible = showFeedbackForm === volunteerIdValue;
                      const safeRatings = Array.isArray(assignment.ratings) ? assignment.ratings : [];
                      const existingRating = safeRatings.find(r => r.ratedBy?.toString() === user?._id?.toString());
                      const allRatings = safeRatings;
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
                                {volunteerDisplayName?.[0]?.toUpperCase() || 'V'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {volunteerDisplayName}
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
                                    <div key={`${volunteerIdValue || index}-${status}`} className="flex items-center gap-2">
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
                          {user?.role === 'citizen' && isCompleted && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {!existingRating && !isFormVisible && (
                                <button
                                  onClick={() => {
                                    setShowFeedbackForm(volunteerIdValue);
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
                                      <span key={star} className={`text-base leading-none ${star <= existingRating.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                        ⭐
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-700 mt-2">{existingRating.feedback}</p>
                                </div>
                              )}

                              {isFormVisible && !existingRating && (
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Rate {volunteerDisplayName}</h4>
                                  <div className="mb-3">
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Star Rating *</label>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <div className="flex items-center gap-1 shrink-0 max-w-full">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFeedbackRating(star)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-md border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                              star <= feedbackRating
                                                ? 'bg-yellow-50 border-yellow-300 shadow-sm'
                                                : 'bg-white border-gray-200 hover:bg-gray-100 hover:border-blue-300 hover:shadow-sm'
                                            } hover:scale-105`}
                                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                          >
                                            <span className={`text-xl leading-none ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                              ⭐
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-800">
                                        {feedbackRating}/5
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                      Feedback * <span className="text-xs text-gray-500">(minimum 10 characters)</span>
                                    </label>
                                    <textarea
                                      value={feedbackComment}
                                      onChange={(e) => setFeedbackComment(e.target.value)}
                                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                                      rows="3"
                                      placeholder="Share your experience..."
                                    />
                                    <p className={`text-xs mt-1 font-medium ${feedbackComment.length >= 10 ? 'text-green-600' : 'text-amber-600'}`}>
                                      {feedbackComment.length} / 10 characters {feedbackComment.length >= 10 ? '✓' : ''}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSubmitFeedback(volunteerIdValue)}
                                      disabled={submittingFeedback || feedbackComment.length < 10 || !volunteerIdValue}
                                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
                                    </button>
                                    <button
                                      onClick={() => setShowFeedbackForm(null)}
                                      disabled={submittingFeedback}
                                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpRequestDetail;

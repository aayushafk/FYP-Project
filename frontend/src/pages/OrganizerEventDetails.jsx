import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import EventChat from '../components/events/EventChat';
import {
  Calendar,
  MapPin,
  Users,
  Award,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader,
  MessageSquare,
  Target,
  Trash2,
  Plus
} from 'lucide-react';

const OrganizerEventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(true);

  // Event-specific help requests
  const [helpRequests, setHelpRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Help request modal state
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    category: 'Medical',
    location: ''
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');

  // Load current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data.user);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Load event and volunteers
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/organizer/events/${eventId}`);
        setEvent(response.data);

        // Simulate loading volunteer details (in real app, backend would provide this)
        if (response.data.assignedVolunteers && response.data.assignedVolunteers.length > 0) {
          setVolunteers(
            response.data.assignedVolunteers.map((volunteerId, index) => ({
              _id: volunteerId._id || volunteerId,
              name: volunteerId.fullName || `Volunteer ${index + 1}`,
              skills: volunteerId.skills || [],
              status: ['Pending', 'Accepted', 'Active', 'Completed'][index % 4],
              joinedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            }))
          );
        }

        setError('');
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Could not load event details');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
      fetchEventHelpRequests();
    }
  }, [eventId]);

  // Fetch help requests specific to this event
  const fetchEventHelpRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await api.get('/organizer/help-requests');
      const allRequests = response.data.requests || [];
      
      // Filter to only show help requests associated with this event
      const eventRequests = allRequests.filter(req => req.eventId === eventId);
      setHelpRequests(eventRequests);
    } catch (err) {
      console.error('Error fetching event help requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Active':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Completed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={16} />;
      case 'Accepted':
        return <CheckCircle size={16} />;
      case 'Active':
        return <Target size={16} />;
      case 'Completed':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  const handleDeleteEvent = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/organizer/event/${eventId}`);
      alert('Event deleted successfully!');
      navigate('/organizer/dashboard');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  // Help request creation with automatic eventId
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setRequestSubmitting(true);
    try {
      // Automatically include eventId in the request body
      const requestData = {
        ...requestForm,
        eventId: eventId
      };
      
      await api.post('/requests', requestData);
      setRequestSuccess('Help request created successfully!');
      setShowCreateRequest(false);
      setRequestForm({ title: '', description: '', category: 'Medical', location: '' });
      fetchEventHelpRequests(); // Refresh the help requests list
      setTimeout(() => setRequestSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="full-height page-background flex-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="full-height page-background p-4">
        <button
          onClick={() => navigate('/organizer/dashboard')}
          className="flex items-center text-primary-600 mb-4 font-medium"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>
        <div className="white-background rounded-lg border border-red-200 p-6 text-center">
          <AlertCircle size={40} className="mx-auto text-red-600 mb-4" />
          <p className="text-red-700 font-medium">{error || 'Event not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="full-height page-background p-4">
      {/* Back Button and Actions */}
      <div className="flex-between mb-6" style={{maxWidth: '80rem', margin: '0 auto'}}>
        <button
          onClick={() => navigate('/organizer/dashboard')}
          className="flex items-center text-primary-600 font-medium"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateRequest(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus size={18} className="mr-2" />
            Create Help Request
          </button>
          <button
            onClick={handleDeleteEvent}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            <Trash2 size={18} className="mr-2" />
            Delete Event
          </button>
        </div>
      </div>

      <div style={{maxWidth: '80rem', margin: '0 auto'}}>
        {/* Header */}
        <div style={{background: 'linear-gradient(to right, var(--primary-600), var(--primary-700))'}} className="rounded-lg shadow-lg p-6 text-white mb-6">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p style={{color: '#bfdbfe'}} className="text-lg">{event.description}</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'}}>
          {/* Left Column - Event Info */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            {/* Event Details Card */}
            <div className="white-background rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Event Details</h2>
              </div>

              <div className="p-6" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {/* Date & Time */}
                <div className="flex items-start gap-4">
                  <Calendar className="text-primary-600 mt-1" style={{flexShrink: 0}} size={24} />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Date & Time</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      to {formatTime(event.endDateTime)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <MapPin className="text-primary-600 mt-1" style={{flexShrink: 0}} size={24} />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Location</p>
                    <p className="text-lg font-bold text-gray-900">{event.location}</p>
                  </div>
                </div>

                {/* Required Skills */}
                {event.requiredSkills && event.requiredSkills.length > 0 && (
                  <div className="flex items-start gap-4">
                    <Award className="text-primary-600 mt-1" style={{flexShrink: 0}} size={24} />
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {event.requiredSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              skill === 'General Support'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {skill === 'General Support' ? '🌍' : '•'} {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Volunteers Needed */}
                <div className="flex items-start gap-4">
                  <Users className="text-primary-600 mt-1" style={{flexShrink: 0}} size={24} />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Volunteers Needed</p>
                    <p className="text-lg font-bold text-gray-900">
                      {event.volunteersNeeded} volunteers
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.assignedVolunteers?.length || 0} joined (
                      {event.assignedVolunteers?.length > 0
                        ? Math.round((event.assignedVolunteers.length / event.volunteersNeeded) * 100)
                        : 0}
                      %)
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                {event.contactInfo && (
                  <div className="flex items-start gap-4">
                    <Phone className="text-primary-600 mt-1" style={{flexShrink: 0}} size={24} />
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Contact</p>
                      <p className="text-gray-900">{event.contactInfo}</p>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Volunteer Sign-up Progress</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        background: 'linear-gradient(to right, var(--primary-500), var(--primary-600))',
                        width: `${Math.min(
                          100,
                          ((event.assignedVolunteers?.length || 0) / event.volunteersNeeded) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Chat Card */}
            {currentUser && chatOpen && (
              <div className="white-background rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={24} className="text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-800">Event Chat</h2>
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Live
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Real-time communication with all event participants</p>
                    </div>
                    <button
                      onClick={() => setChatOpen(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <EventChat eventId={eventId} currentUser={currentUser} event={event} />
              </div>
            )}

            {!chatOpen && (
              <button
                onClick={() => setChatOpen(true)}
                className="bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold py-3 px-4 rounded-lg border-2 border-primary-200"
                style={{width: '100%'}}
              >
                Open Chat
              </button>
            )}
          </div>

          {/* Right Column - Volunteers List */}
          <div className="white-background rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200" style={{background: 'linear-gradient(to right, #f0f9ff, #f0fdf4)'}}>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users size={24} className="text-primary-600" />
                <span>Volunteers Joined</span>
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {event.assignedVolunteers?.length || 0} / {event.volunteersNeeded} volunteers
              </p>
            </div>

            <div style={{maxHeight: '24rem', overflowY: 'auto'}}>
              {event.assignedVolunteers && event.assignedVolunteers.length > 0 ? (
                event.assignedVolunteers.map((volunteer, index) => (
                  <div key={volunteer._id || index} className="p-4 border-b border-gray-200">
                    {/* Volunteer Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {volunteer.fullName || `Volunteer ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDate(volunteer.createdAt || new Date())}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                          volunteers[index]?.status || 'Pending'
                        )}`}
                      >
                        {getStatusIcon(volunteers[index]?.status || 'Pending')}
                        <span>{volunteers[index]?.status || 'Pending'}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    {volunteer.skills && volunteer.skills.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {volunteer.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium">
                        Message
                      </button>
                      <button className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium">
                        Mark Complete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Users size={32} className="mx-auto mb-2" style={{opacity: 0.5}} />
                  <p className="text-sm">No volunteers have joined this event yet.</p>
                  <p className="text-xs mt-2">
                    Once volunteers sign up, they'll appear here with their status.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Event Help Requests */}
          <div className="white-background rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200" style={{background: 'linear-gradient(to right, #fef3c7, #fed7aa)'}}>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle size={24} className="text-amber-600" />
                <span>Event Help Requests</span>
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {helpRequests.length} request{helpRequests.length !== 1 ? 's' : ''} for this event
              </p>
            </div>

            <div style={{maxHeight: '24rem', overflowY: 'auto'}}>
              {loadingRequests ? (
                <div className="p-8 text-center">
                  <Loader size={32} className="animate-spin text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading help requests...</p>
                </div>
              ) : helpRequests.length > 0 ? (
                helpRequests.map((request) => (
                  <div key={request._id} className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{request.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ml-3 whitespace-nowrap ${
                          request.trackingStatus === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.trackingStatus === 'Assigned'
                            ? 'bg-blue-100 text-blue-800'
                            : request.trackingStatus === 'In Progress'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {request.trackingStatus || 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {request.location}
                      </span>
                      {request.category && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {request.category}
                        </span>
                      )}
                      {request.createdBy && (
                        <span>
                          By: {request.createdBy.fullName || 'Unknown'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <AlertCircle size={32} className="mx-auto mb-2" style={{opacity: 0.5}} />
                  <p className="text-sm">No help requests for this event yet.</p>
                  <p className="text-xs mt-2">
                    Citizens can create help requests associated with this event.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Request Creation Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Help Request</h3>
              <button
                onClick={() => setShowCreateRequest(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  placeholder="Brief title for your help request"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={requestForm.category}
                  onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="Medical">Medical</option>
                  <option value="Food">Food</option>
                  <option value="Rescue">Rescue</option>
                  <option value="Transport">Transport</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows="4"
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  placeholder="Describe the situation, specific needs, and urgency..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={requestForm.location}
                  onChange={(e) => setRequestForm({ ...requestForm, location: e.target.value })}
                  placeholder="Location for this help request"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRequest(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {requestSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Message */}
      {requestSuccess && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          {requestSuccess}
        </div>
      )}
    </div>
  );
};

export default OrganizerEventDetails;

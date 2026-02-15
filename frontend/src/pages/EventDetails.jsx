import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Calendar, MapPin, Users, Award, AlertCircle, CheckCircle, ArrowLeft, Loader, Phone, Trash2, MessageCircle, HelpCircle } from 'lucide-react';
import EventChat from '../components/events/EventChat';
import UserHelpChat from '../components/messaging/UserHelpChat';
import VolunteerHelpChat from '../components/messaging/VolunteerHelpChat';
import EventErrorState from '../components/events/EventErrorState';
import EventLoadingState from '../components/events/EventLoadingState';
import FloatingHelpWidget from '../components/widgets/FloatingHelpWidget';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(null);
  const [showHelpChat, setShowHelpChat] = useState(false);

  // Get current user info
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (err) {
        console.error('Error fetching user info:', err);
        // Continue even if user fetch fails
      }
    };
    getUserInfo();
  }, []);

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setError('No event ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching event:', eventId);

        // Always try the public endpoint first - it's most reliable
        const response = await api.get(`/events/${eventId}`);
        
        console.log('Event response:', response.data);
        
        const eventData = response.data.event || response.data;
        if (!eventData) {
          setError('No event data received from server');
          setLoading(false);
          return;
        }
        
        setEvent(eventData);
        
        // Check if user has already joined
        if (eventData.assignedVolunteers && user?._id) {
          const hasUserJoined = eventData.assignedVolunteers.some(vol => 
            vol._id === user._id || vol === user._id || vol.toString() === user._id.toString()
          );
          setHasJoined(hasUserJoined);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(`Failed to load event: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, user?._id]);

  // Recheck hasJoined when user data becomes available or event changes
  useEffect(() => {
    if (event && user?._id && event.assignedVolunteers) {
      const hasUserJoined = event.assignedVolunteers.some(vol => 
        vol._id === user._id || vol === user._id || vol.toString() === user._id.toString()
      );
      setHasJoined(hasUserJoined);
    }
  }, [event, user?._id]);

  const handleJoinEvent = async () => {
    try {
      setIsJoining(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.post(`/volunteer/join-event/${eventId}`, {});
      
      setSuccessMessage('Successfully joined the event! You can now participate in the event chat below.');
      setHasJoined(true);
      
      // Refresh event data to include the current user in assigned volunteers
      if (event && user) {
        setEvent({
          ...event,
          assignedVolunteers: [...(event.assignedVolunteers || []), { _id: user._id, fullName: user.fullName }]
        });
      }
      
      // Scroll to chat section after a brief delay
      setTimeout(() => {
        const chatSection = document.querySelector('#event-chat-section');
        if (chatSection) {
          chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeleteEvent = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await api.delete(`/organizer/event/${eventId}`);
      alert('Event deleted successfully!');
      navigate('/organizer/dashboard');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid time';
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Invalid time';
    }
  };

  if (loading) {
    return <EventLoadingState />;
  }

  if (error && !event) {
    return (
      <>
        <EventErrorState 
          error={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            // Trigger refetch by resetting state
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }}
          onGoHome={() => navigate('/events')}
          eventId={eventId}
        />
        <FloatingHelpWidget eventId={eventId} isVisible={true} />
      </>
    );
  }

  if (!event) {
    return (
      <div className="full-height page-background py-8 px-4">
        <div style={{maxWidth: '42rem', margin: '0 auto'}}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-6 font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          
          <div className="white-background rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">Event not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.role === 'organizer' && user?._id === event.organizer?._id;
  const isVolunteer = user?.role === 'volunteer';
  const isCitizen = user?.role === 'citizen' || user?.role === 'user';
  const canAccessChat = hasJoined || isOrganizer || isCitizen;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button and Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          
          {isOrganizer && (
            <button
              onClick={handleDeleteEvent}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-md transition-all"
            >
              <Trash2 size={18} />
              Delete Event
            </button>
          )}
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-10 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 uppercase tracking-wide">{event.status || 'Active'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{event.title}</h1>
              <p className="text-blue-200 text-sm">Created on {formatDate(event.createdAt)}</p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mx-6 mt-6 flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600" style={{marginTop: '0.125rem', flexShrink: 0}} />
              <p className="text-red-700 mr-3">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mx-6 mt-6 flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={20} className="text-green-600" style={{marginTop: '0.125rem', flexShrink: 0}} />
              <p className="text-green-700 mr-3">{successMessage}</p>
            </div>
          )}

          {/* Info Box for Volunteers who haven't joined yet */}
          {isVolunteer && !isOrganizer && !hasJoined && (
            <div className="mx-6 mt-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex-shrink-0 shadow-lg">
                  <MessageCircle size={22} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg mb-3">What Happens When You Participate?</h4>
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-emerald-400 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                      <span className="text-white">Get instant access to <strong className="text-yellow-300">real-time chat</strong> with the organizer and other volunteers</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-emerald-400 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                      <span className="text-white">Coordinate event details and ask questions directly</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-emerald-400 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                      <span className="text-white">Receive updates and communicate with the team in real-time</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-emerald-400 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                      <span className="text-white">Make a difference in your community!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="p-6 sm:p-8 flex flex-col gap-8">
            {/* Event Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                About This Event
              </h2>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date & Time */}
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar size={22} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Date & Time</h3>
                  <p className="text-gray-600 text-sm">
                    {formatDate(event.startDateTime)}<br />
                    {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={22} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Location</h3>
                  <p className="text-gray-600 text-sm">{event.location}</p>
                </div>
              </div>

              {/* Volunteers Needed */}
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <Users size={22} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Volunteers Needed</h3>
                  <p className="text-gray-600 text-sm">
                    {event.volunteersNeeded} volunteer{event.volunteersNeeded !== 1 ? 's' : ''}
                  </p>
                  {event.joinedVolunteers && (
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      {event.joinedVolunteers.length} already joined
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {event.contactInfo && (
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Contact Info</h3>
                    <p className="text-gray-600 text-sm">{event.contactInfo}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Required Skills */}
            {event.requiredSkills && event.requiredSkills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={20} className="text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Required Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.requiredSkills.map((skill, idx) => {
                    const colors = [
                      'bg-blue-100 text-blue-700 border-blue-200',
                      'bg-emerald-100 text-emerald-700 border-emerald-200',
                      'bg-purple-100 text-purple-700 border-purple-200',
                      'bg-amber-100 text-amber-700 border-amber-200',
                      'bg-rose-100 text-rose-700 border-rose-200',
                      'bg-cyan-100 text-cyan-700 border-cyan-200'
                    ];
                    return (
                      <span
                        key={idx}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold border ${colors[idx % colors.length]}`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              {/* Participation Decision Buttons - Only for Volunteers who haven't joined yet */}
              {isVolunteer && !isOrganizer && !hasJoined && (
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 shadow-lg">
                  <h3 className="text-xl font-bold text-white mb-2 text-center">
                    Would you like to participate in this event?
                  </h3>
                  <p className="text-blue-100 text-center mb-6">
                    Join to coordinate with the organizer and other volunteers in real-time chat
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleJoinEvent}
                      disabled={isJoining}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {isJoining ? (
                        <>
                          <Loader size={22} className="animate-spin mr-2" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={22} className="mr-2" />
                          Yes, I Will Participate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/volunteer')}
                      disabled={isJoining}
                      className="bg-white hover:bg-gray-50 text-gray-600 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 flex items-center justify-center transition-all duration-300 hover:border-gray-300"
                    >
                      Not Interested
                    </button>
                  </div>
                </div>
              )}

              {event && event.organizer && user && user._id !== event.organizer._id && (
                <button
                  onClick={() => {
                    const organizerInfo = {
                      partnerId: event.organizer._id,
                      partnerName: event.organizer.fullName || event.organizer.organizationName,
                      eventId: eventId,
                      eventTitle: event.title
                    }
                    localStorage.setItem('selectedConversation', JSON.stringify(organizerInfo))
                    navigate('/messages')
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
                >
                  <MessageCircle size={20} />
                  Message Organizer
                </button>
              )}

              {hasJoined && isVolunteer && !isOrganizer && (
                <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex-shrink-0 shadow-lg">
                      <CheckCircle size={32} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        🎉 You're Participating!
                      </h3>
                      <p className="text-emerald-100 mb-3">
                        You have successfully joined this event. You can now communicate with the organizer and other volunteers in real-time using the <strong className="text-white">Event Chat</strong> section below.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-emerald-900 bg-white/90 rounded-lg px-3 py-2">
                        <MessageCircle size={16} />
                        <span className="font-medium">Scroll down to start chatting with the team!</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Participating Volunteers List - Show if user has joined or is organizer */}
              {canAccessChat && event.assignedVolunteers && event.assignedVolunteers.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 ring-1 ring-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Users className="text-indigo-600" size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Participating Volunteers
                      </h3>
                      <p className="text-sm text-gray-500">
                        {event.assignedVolunteers.length} volunteer{event.assignedVolunteers.length !== 1 ? 's' : ''} joined
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.assignedVolunteers.map((volunteer, idx) => {
                      const avatarColors = [
                        'from-blue-500 to-indigo-600',
                        'from-emerald-500 to-teal-600',
                        'from-purple-500 to-violet-600',
                        'from-amber-500 to-orange-600',
                        'from-rose-500 to-pink-600',
                        'from-cyan-500 to-blue-600'
                      ];
                      return (
                      <div
                        key={volunteer._id || idx}
                        className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 flex items-center gap-3 hover:shadow-md hover:bg-white transition-all"
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                          {volunteer.fullName ? volunteer.fullName.charAt(0).toUpperCase() : 'V'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {volunteer.fullName || 'Volunteer'}
                            {volunteer._id === user?._id && (
                              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">You</span>
                            )}
                          </p>
                          {volunteer.skills && volunteer.skills.length > 0 && (
                            <p className="text-xs text-gray-500 truncate">
                              {volunteer.skills.slice(0, 2).join(', ')}
                              {volunteer.skills.length > 2 && '...'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    💬 You can connect with all volunteers in the Event Chat below
                  </p>
                </div>
              )}

              {/* Help Request Button - Show for users/volunteers who joined */}
              {(hasJoined || event?.createdBy?._id === user?._id) && (
                <button
                  onClick={() => setShowHelpChat(!showHelpChat)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
                >
                  <HelpCircle size={20} />
                  {showHelpChat ? 'Hide Help Chat' : 'Request Help from Volunteers'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time Chat Section - Visible for joined volunteers, organizers, and citizens */}
        {canAccessChat && user && !showHelpChat && (
          <div id="event-chat-section" className="mt-8">
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 overflow-hidden">
              {/* Chat Header with Real-time Indicator */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <MessageCircle size={28} />
                    Event Chat
                  </h2>
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg"></span>
                    <span className="font-semibold text-sm">Live</span>
                  </div>
                </div>
                <p className="text-indigo-200">
                  {isOrganizer 
                    ? '💬 Coordinate with volunteers and participants in real-time' 
                    : isCitizen
                    ? '💬 Communicate with volunteers and the organizer in real-time'
                    : '💬 Chat with the organizer and other volunteers instantly'}
                </p>
              </div>
              
              {/* Chat Component */}
              <div className="p-6">
                <EventChat eventId={eventId} currentUser={user} event={event} />
              </div>
            </div>
          </div>
        )}

        {/* Help Chat Section - Only if user is volunteer or event creator and button is toggled */}
        {showHelpChat && event && user && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <HelpCircle className="text-amber-600" size={22} />
                </div>
                Help Request Chat
              </h2>
              
              {/* Show appropriate chat component based on user role */}
              {isVolunteer && hasJoined ? (
                // Volunteer sees all help requests in the event
                <VolunteerHelpChat 
                  eventId={eventId}
                  currentUserId={user._id}
                  eventData={event}
                />
              ) : (
                // User/citizen can request help from assigned volunteers
                <UserHelpChat
                  eventId={eventId}
                  currentUserId={user._id}
                  currentUserName={user.fullName || user.organizationName}
                  assignedVolunteers={event.assignedVolunteers || []}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Widget */}
      <FloatingHelpWidget eventId={eventId} isVisible={false} />
    </div>
  );
};

export default EventDetails;

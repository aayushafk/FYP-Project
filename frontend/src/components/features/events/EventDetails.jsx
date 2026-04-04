import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import EventChat from './EventChat';
import { Calendar, MapPin, Users, Award, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinStatus, setJoinStatus] = useState(null);

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

  // Load event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        
        let response;
        
        // Try role-specific endpoint first, then fall back to public endpoint
        if (currentUser) {
          try {
            if (currentUser.role === 'organizer') {
              response = await api.get(`/organizer/events/${eventId}`);
            } else if (currentUser.role === 'volunteer') {
              response = await api.get(`/volunteer/events/${eventId}`);
            } else {
              response = await api.get(`/events/${eventId}`);
            }
          } catch (roleSpecificError) {
            console.warn('Role-specific endpoint failed, trying public endpoint:', roleSpecificError.message);
            // Fall back to public endpoint
            response = await api.get(`/events/${eventId}`);
          }
        } else {
          // No user, use public endpoint
          response = await api.get(`/events/${eventId}`);
        }
        
        const eventData = response.data.event || response.data;
        setEvent(eventData);
        
        // Check if current user has already joined
        if (currentUser && eventData?.assignedVolunteers) {
          const hasJoined = eventData.assignedVolunteers.some(vol => 
            vol._id === currentUser._id || vol === currentUser._id || vol.toString() === currentUser._id.toString()
          );
          setHasJoined(hasJoined);
        }
        
        setError('');
      } catch (err) {
        console.error('Error loading event:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Could not load event details';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, currentUser]);

  const handleJoinEvent = async () => {
    if (!currentUser) {
      setError('You must be logged in to join');
      return;
    }

    try {
      setIsJoining(true);
      setJoinMessage('');
      setJoinStatus(null);

      const response = await api.post(`/volunteer/event/${eventId}/request`);

      setJoinStatus('success');
      setJoinMessage('Successfully joined the event!');
      setHasJoined(true);

      setTimeout(() => {
        setJoinMessage('');
        setJoinStatus(null);
      }, 3000);
    } catch (err) {
      setJoinStatus('error');
      const errorMessage = err.response?.data?.message || 'Failed to join event';
      setJoinMessage(errorMessage);

      setTimeout(() => {
        setJoinMessage('');
        setJoinStatus(null);
      }, 5000);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Go Back</span>
        </button>
        <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
          <AlertCircle size={40} className="mx-auto text-red-600 mb-4" />
          <p className="text-red-700 font-medium">{error || 'Event not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 md:p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
            <p className="text-blue-100 text-lg">{event.description}</p>
          </div>

          {/* Event Details Grid */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date & Time */}
            <div className="flex items-start space-x-4">
              <Calendar className="text-blue-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Date & Time</p>
                <p className="text-lg font-semibold">
                  {new Date(event.startDateTime).toLocaleString()}
                </p>
                <p className="text-gray-600 text-sm">
                  to {new Date(event.endDateTime).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start space-x-4">
              <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Location</p>
                <p className="text-lg font-semibold">{event.location}</p>
              </div>
            </div>

            {/* Volunteers Needed */}
            <div className="flex items-start space-x-4">
              <Users className="text-blue-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Volunteers Needed</p>
                <p className="text-lg font-semibold">
                  {event.volunteersNeeded} volunteers
                </p>
                <p className="text-gray-600 text-sm">
                  {event.assignedVolunteers?.length || 0} joined
                </p>
              </div>
            </div>

            {/* Required Skills */}
            <div className="flex items-start space-x-4">
              <Award className="text-blue-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Required Skills</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {event.requiredSkills && event.requiredSkills.length > 0 ? (
                    event.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No specific skills required</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <div className="px-6 md:px-8 pb-6 md:pb-8 border-t border-gray-200 pt-6">
            {joinMessage && (
              <div className={`flex items-center space-x-3 p-4 rounded-lg mb-4 ${
                joinStatus === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {joinStatus === 'success' ? (
                  <CheckCircle size={20} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={20} className="flex-shrink-0" />
                )}
                <p>{joinMessage}</p>
              </div>
            )}

            {!hasJoined && currentUser?.role === 'volunteer' && (
              <button
                onClick={handleJoinEvent}
                disabled={isJoining}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isJoining ? 'Joining...' : 'Join Event'}
              </button>
            )}

            {hasJoined && (
              <div className="flex items-center space-x-2 text-green-600 font-semibold p-3 bg-green-50 rounded-lg">
                <CheckCircle size={20} />
                <span>You have joined this event</span>
              </div>
            )}
          </div>
        </div>

        {/* Event Chat */}
        {hasJoined && currentUser && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <EventChat eventId={eventId} currentUser={currentUser} event={event} />
          </div>
        )}

        {!hasJoined && currentUser?.role !== 'organizer' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-700">
              <strong>Join the event</strong> to participate in the event chat
            </p>
          </div>
        )}

        {/* Organizer View */}
        {currentUser?.role === 'organizer' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Organizer Chat</h2>
              <EventChat eventId={eventId} currentUser={currentUser} event={event} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;

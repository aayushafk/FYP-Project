import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../constants/api';

const EventsList = ({ userRole }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'organizer', 'citizen'

  useEffect(() => {
    fetchEvents();
  }, [userRole, filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let endpoint = '';

      if (userRole === 'volunteer') {
        endpoint = `${API_BASE_URL}/volunteer/available-events`;
      } else if (userRole === 'citizen') {
        if (filter === 'citizen') {
          endpoint = `${API_BASE_URL}/citizen/requests`;
        } else {
          endpoint = `${API_BASE_URL}/citizen/events`;
        }
      } else if (userRole === 'organizer') {
        if (filter === 'organizer') {
          endpoint = `${API_BASE_URL}/organizer/my-events`;
        } else {
          endpoint = `${API_BASE_URL}/organizer/help-requests`;
        }
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allItems = data.events || data.requests || [];
        
        // Filter out help requests that are associated with specific events
        // Only show standalone help requests
        const filteredItems = allItems.filter(item => {
          // If it's a help request (type === 'citizen'), only show if no eventId
          if (item.type === 'citizen') {
            return !item.eventId;
          }
          // Show all organizer events
          return true;
        });
        
        setEvents(filteredItems);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    return type === 'citizen' 
      ? 'bg-orange-100 text-orange-800' 
      : 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          All Events
        </button>
        {userRole === 'citizen' && (
          <button
            onClick={() => setFilter('citizen')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              filter === 'citizen'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            My Requests
          </button>
        )}
        {userRole === 'organizer' && (
          <button
            onClick={() => setFilter('organizer')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              filter === 'organizer'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            My Events
          </button>
        )}
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event._id}
              onClick={() => navigate(`/event/${event._id}`)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              {/* Header with Type Badge */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(event.type)}`}>
                    {event.type === 'citizen' ? 'Help Request' : 'Organizer Event'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.trackingStatus)}`}>
                    {event.trackingStatus}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                  {event.title}
                </h3>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-gray-600 text-sm line-clamp-3">
                  {event.description}
                </p>

                {event.category && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-semibold">Category:</span>
                    <span className="ml-2">{event.category}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="line-clamp-1">{event.location}</span>
                </div>

                {event.requiredSkills && event.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.requiredSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {event.requiredSkills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                        +{event.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Volunteers */}
                {event.assignedVolunteers && event.assignedVolunteers.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{event.assignedVolunteers.length} volunteer(s) assigned</span>
                  </div>
                )}

                {/* Skill Match Indicator for Volunteers */}
                {userRole === 'volunteer' && event.matchCount > 0 && (
                  <div className="mt-2 px-3 py-1 bg-green-50 border border-green-200 rounded-md text-xs text-green-800">
                    ✓ {event.matchCount} matching skill(s)
                  </div>
                )}

                {/* Created Date */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created {new Date(event.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Footer Action */}
              <div className="px-4 py-3 bg-gray-50 flex justify-end">
                <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsList;

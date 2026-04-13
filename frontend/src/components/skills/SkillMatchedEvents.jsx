import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, MapPin, Clock, Users } from 'lucide-react';
import api from '../../utils/api';

const SkillMatchedEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [volunteerSkills, setVolunteerSkills] = useState([]);
    const [filter, setFilter] = useState('upcoming');

    useEffect(() => {
        fetchSkillMatchedEvents();
    }, [filter]);

    const fetchSkillMatchedEvents = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch volunteer's skills
            const skillsRes = await api.get('/volunteer/profile/skills');
            setVolunteerSkills(skillsRes.data.skills || []);

            // Fetch skill-matched events, including General Support events open to all
            const eventsRes = await api.get(`/volunteer/available-events`);
            const matchedEvents = Array.isArray(eventsRes.data?.events) ? eventsRes.data.events : [];
            setEvents(matchedEvents.filter((event) => {
                if (filter === 'upcoming') {
                    return (event.status || 'upcoming') === 'upcoming';
                }
                if (filter === 'ongoing') {
                    return (event.status || 'upcoming') === 'ongoing';
                }
                return true;
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching matched events');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMatchPercentageColor = (percentage) => {
        if (percentage === 100) return 'bg-green-100 text-green-800';
        if (percentage >= 75) return 'bg-blue-100 text-blue-800';
        if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
        return 'bg-orange-100 text-orange-800';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header with skills summary */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Skill-Matched Events</h2>
                <p className="text-gray-600 mb-4">Events that match your skills</p>

                {volunteerSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {volunteerSkills.slice(0, 5).map(skill => (
                            <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {skill}
                            </span>
                        ))}
                        {volunteerSkills.length > 5 && (
                            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                                +{volunteerSkills.length - 5} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Filter tabs */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
                {['upcoming', 'ongoing'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 font-medium text-sm transition-colors ${
                            filter === status
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Events list */}
            {events.length === 0 ? (
                <div className="text-center py-12">
                    <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-2">No matching events found</p>
                    <p className="text-gray-500 text-sm">
                        {volunteerSkills.length === 0
                            ? 'Add skills to your profile to see matching events'
                            : 'Check back later for new opportunities'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map(event => {
                        const matchedSkills = Array.isArray(event.matchedSkills)
                            ? event.matchedSkills
                            : Array.isArray(event.matchingSkills)
                                ? event.matchingSkills
                                : [];
                        const isOpen = Boolean(event.hasGeneralSupport || event.isOpenToAll || matchedSkills.includes('General Support'));
                        const matchPercentage = typeof event.matchPercentage === 'number'
                            ? event.matchPercentage
                            : (isOpen ? 100 : (matchedSkills.length > 0 ? 100 : 0));

                        return (
                        <div key={event._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            {/* Event title and match badge */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">{event.title}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                                </div>
                                <div className={`ml-4 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${getMatchPercentageColor(matchPercentage)}`}>
                                    🎯 {matchPercentage}% Match
                                </div>
                            </div>

                            {/* Matched skills highlight */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 mb-2">Your Matching Skills:</p>
                                <div className="flex flex-wrap gap-2">
                                    {matchedSkills.map(skill => (
                                        <span key={skill} className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-medium">
                                            ✓ {skill}
                                        </span>
                                    ))}
                                    {isOpen && !matchedSkills.includes('General Support') && (
                                        <span className="bg-green-200 text-green-900 px-2 py-1 rounded text-xs font-medium">
                                            🌍 General Support
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Event details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock size={16} />
                                    <span>{formatDate(event.startDateTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={16} />
                                    <span className="truncate">{event.location?.address || event.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Users size={16} />
                                    <span>{event.volunteersNeeded} needed</span>
                                </div>
                                {event.assignedVolunteers && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <CheckCircle size={16} />
                                        <span>{event.assignedVolunteers.length} assigned</span>
                                    </div>
                                )}
                            </div>

                            {/* Required skills that you don't have */}
                            {Array.isArray(event.requiredSkills) && event.requiredSkills.length > matchedSkills.length && !isOpen && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Also needs:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {event.requiredSkills
                                            .filter(skill => !matchedSkills.includes(skill))
                                            .map(skill => (
                                                <span key={skill} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                                                    {skill}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Action button */}
                            <div className="flex gap-2">
                                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                                    View Details
                                </button>
                                <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
                                    Express Interest
                                </button>
                            </div>
                        </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default SkillMatchedEvents;

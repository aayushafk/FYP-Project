import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Send skill-matched notifications to volunteers when an event is created
 * @param {Object} event - The event object created by organizer
 * @returns {Promise<Array>} - Array of created notifications
 */
export const notifyVolunteersBySkills = async (event) => {
    try {
        if (!event.requiredSkills || event.requiredSkills.length === 0) {
            return [];
        }

        // Check if "General Support" is in required skills
        const isGeneralSupport = event.requiredSkills.includes('General Support');
        
        let matchedVolunteers;
        
        if (isGeneralSupport) {
            // If General Support, notify ALL volunteers (no skill filtering)
            matchedVolunteers = await User.find({
                role: 'volunteer'
            });
            console.log(`General Support request - notifying ALL ${matchedVolunteers.length} volunteers`);
        } else {
            // Find all volunteers with matching skills
            // ONLY notify volunteers who have at least one of the required skills
            matchedVolunteers = await User.find({
                role: 'volunteer',
                skills: { $in: event.requiredSkills }
            });
            console.log(`Found ${matchedVolunteers.length} volunteers with matching skills`);
        }

        if (matchedVolunteers.length === 0) {
            console.log('No volunteers found with matching skills:', event.requiredSkills);
            return [];
        }

        // Create notifications for each matched volunteer
        const notifications = await Promise.all(
            matchedVolunteers.map(volunteer => {
                let matchedSkills;
                let notificationMessage;
                
                if (isGeneralSupport) {
                    // For General Support, show as general request
                    matchedSkills = ['General Support'];
                    notificationMessage = `🆘 General Support Needed! "${event.title}" is looking for volunteers. Will you help?`;
                } else {
                    // For skill-based requests, show matched skills
                    matchedSkills = volunteer.skills.filter(skill =>
                        event.requiredSkills.includes(skill)
                    );
                    notificationMessage = `🎯 New Event Opportunity! "${event.title}" is looking for volunteers with your skills: ${matchedSkills.join(', ')}. Will you participate?`;
                }

                console.log(`Notifying ${volunteer.fullName} (${volunteer.email}) - Matched skills:`, matchedSkills);

                return Notification.create({
                    user: volunteer._id,
                    type: 'skill_matched_event',
                    relatedId: event._id,
                    relatedType: 'Event',
                    message: notificationMessage,
                    matchedSkills: matchedSkills,
                    skillMatchCount: matchedSkills.length
                });
            })
        );

        return notifications;
    } catch (error) {
        console.error('Error notifying volunteers by skills:', error);
        throw error;
    }
};

/**
 * Send skill-matched notifications for help requests
 * @param {Object} request - The request object created
 * @returns {Promise<Array>} - Array of created notifications
 */
export const notifyVolunteersByRequestSkills = async (request) => {
    try {
        if (!request.requiredSkills || request.requiredSkills.length === 0) {
            return [];
        }

        // Find all volunteers with matching skills
        const matchedVolunteers = await User.find({
            role: 'volunteer',
            skills: { $in: request.requiredSkills },
            isVerified: true // Only notify verified volunteers
        });

        if (matchedVolunteers.length === 0) {
            return [];
        }

        // Create notifications for each matched volunteer
        const notifications = await Promise.all(
            matchedVolunteers.map(volunteer => {
                const matchedSkills = volunteer.skills.filter(skill =>
                    request.requiredSkills.includes(skill)
                );

                return Notification.create({
                    user: volunteer._id,
                    type: 'skill_matched_request',
                    relatedId: request._id,
                    relatedType: 'Request',
                    message: `A help request "${request.title}" matches your skills: ${matchedSkills.join(', ')}`,
                    matchedSkills: matchedSkills,
                    skillMatchCount: matchedSkills.length
                });
            })
        );

        return notifications;
    } catch (error) {
        console.error('Error notifying volunteers by request skills:', error);
        throw error;
    }
};

/**
 * Get skill-matched events for a volunteer
 * @param {String} volunteerId - The volunteer's user ID
 * @param {Object} filters - Optional filters (status, limit, offset)
 * @returns {Promise<Object>} - Object with matches and match details
 */
export const getSkillMatchedEvents = async (volunteerId, filters = {}) => {
    try {
        const volunteer = await User.findById(volunteerId);
        if (!volunteer || volunteer.role !== 'volunteer') {
            throw new Error('Volunteer not found');
        }

        if (!volunteer.skills || volunteer.skills.length === 0) {
            return {
                volunteer: volunteer.fullName,
                volunteerSkills: [],
                totalMatches: 0,
                events: []
            };
        }

        // Build query for matching events
        let query = {
            requiredSkills: { $in: volunteer.skills },
            status: filters.status || 'upcoming'
        };

        // Get matching events
        const events = await Event.find(query)
            .populate('organizer', 'fullName email organizationName')
            .sort({ startDateTime: 1 })
            .limit(filters.limit || 50)
            .skip(filters.offset || 0);

        // Add match details
        const eventsWithMatches = events.map(event => {
            const matchedSkills = volunteer.skills.filter(skill =>
                event.requiredSkills.includes(skill)
            );
            return {
                ...event.toObject(),
                matchedSkills,
                matchCount: matchedSkills.length,
                matchPercentage: Math.round((matchedSkills.length / event.requiredSkills.length) * 100)
            };
        }).sort((a, b) => b.matchCount - a.matchCount);

        return {
            volunteer: volunteer.fullName,
            volunteerSkills: volunteer.skills,
            totalMatches: eventsWithMatches.length,
            events: eventsWithMatches
        };
    } catch (error) {
        console.error('Error getting skill-matched events:', error);
        throw error;
    }
};

/**
 * Get skill-matched requests for a volunteer
 * @param {String} volunteerId - The volunteer's user ID
 * @param {Object} filters - Optional filters (category, limit, offset)
 * @returns {Promise<Object>} - Object with matches and match details
 */
export const getSkillMatchedRequests = async (volunteerId, filters = {}) => {
    try {
        const volunteer = await User.findById(volunteerId);
        if (!volunteer || volunteer.role !== 'volunteer') {
            throw new Error('Volunteer not found');
        }

        if (!volunteer.skills || volunteer.skills.length === 0) {
            return {
                volunteer: volunteer.fullName,
                volunteerSkills: [],
                totalMatches: 0,
                requests: []
            };
        }

        // Build query for matching requests
        let query = {
            requiredSkills: { $in: volunteer.skills },
            status: 'Pending'
        };

        if (filters.category) {
            query.category = filters.category;
        }

        // Get matching requests
        const Request = require('../models/Request.js').default;
        const requests = await Request.find(query)
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(filters.limit || 50)
            .skip(filters.offset || 0);

        // Add match details
        const requestsWithMatches = requests.map(request => {
            const matchedSkills = volunteer.skills.filter(skill =>
                request.requiredSkills.includes(skill)
            );
            return {
                ...request.toObject(),
                matchedSkills,
                matchCount: matchedSkills.length,
                matchPercentage: request.requiredSkills.length > 0 
                    ? Math.round((matchedSkills.length / request.requiredSkills.length) * 100)
                    : 0
            };
        }).sort((a, b) => b.matchCount - a.matchCount);

        return {
            volunteer: volunteer.fullName,
            volunteerSkills: volunteer.skills,
            totalMatches: requestsWithMatches.length,
            requests: requestsWithMatches
        };
    } catch (error) {
        console.error('Error getting skill-matched requests:', error);
        throw error;
    }
};

/**
 * Get skill analytics for an organizer
 * @param {String} organizerId - The organizer's user ID
 * @returns {Promise<Object>} - Skills distribution and volunteer statistics
 */
export const getSkillAnalytics = async (organizerId) => {
    try {
        const Event = require('../models/Event.js').default;

        // Get all events created by organizer
        const events = await Event.find({ createdBy: organizerId });

        // Aggregate required skills
        const skillFrequency = {};
        events.forEach(event => {
            if (event.requiredSkills && Array.isArray(event.requiredSkills)) {
                event.requiredSkills.forEach(skill => {
                    skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
                });
            }
        });

        // Sort skills by frequency
        const sortedSkills = Object.entries(skillFrequency)
            .sort(([, a], [, b]) => b - a)
            .map(([skill, count]) => ({ skill, count }));

        // Get volunteer count by skill
        const volunteersBySkill = await User.aggregate([
            { $match: { role: 'volunteer' } },
            { $unwind: '$skills' },
            { $group: { _id: '$skills', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        return {
            eventsCreated: events.length,
            requiredSkillsFrequency: sortedSkills,
            volunteerAvailabilityBySkill: volunteersBySkill
        };
    } catch (error) {
        console.error('Error getting skill analytics:', error);
        throw error;
    }
};

export default {
    notifyVolunteersBySkills,
    notifyVolunteersByRequestSkills,
    getSkillMatchedEvents,
    getSkillMatchedRequests,
    getSkillAnalytics
};

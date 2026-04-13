import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Feedback from '../models/Feedback.js';

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const average = (values = []) => {
    if (!values.length) return 0;
    return values.reduce((sum, current) => sum + current, 0) / values.length;
};

const buildRecommendationWeights = (includeAvailability = true) => ({
    skillMatch: 0.55,
    rating: 0.20,
    experience: 0.20,
    availability: includeAvailability ? 0.05 : 0
});

const buildRankedRecommendations = ({
    volunteers,
    feedbackMap,
    completedTaskMap,
    maxCompletedTasks,
    requiredSkills = [],
    location = '',
    includeAvailability = true
}) => {
    const normalizedRequiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills.filter(Boolean)
        : [];

    const weights = buildRecommendationWeights(includeAvailability);

    return volunteers
        .map((volunteer) => {
            const volunteerId = volunteer._id.toString();
            const volunteerSkills = Array.isArray(volunteer.skills) ? volunteer.skills : [];

            const matchedSkills = normalizedRequiredSkills.filter((skill) => volunteerSkills.includes(skill));
            const skillMatchRatio = normalizedRequiredSkills.length > 0
                ? matchedSkills.length / normalizedRequiredSkills.length
                : (volunteerSkills.length > 0 ? 0.5 : 0);

            const feedbackData = feedbackMap.get(volunteerId);
            const fallbackRatings = Array.isArray(volunteer.ratings)
                ? volunteer.ratings.map((item) => Number(item.stars || 0)).filter((value) => value > 0)
                : [];
            const averageRatingValue = feedbackData?.averageRating || average(fallbackRatings);
            const ratingScore = clamp01(averageRatingValue / 5);

            const completedTasks = completedTaskMap.get(volunteerId) || 0;
            const experienceScore = maxCompletedTasks > 0
                ? clamp01(completedTasks / maxCompletedTasks)
                : 0;

            const availabilityScore = includeAvailability
                ? (!volunteer.isDisabled ? (volunteer.isVerified ? 1 : 0.85) : 0)
                : 0;

            const weightedScore = (
                (skillMatchRatio * weights.skillMatch) +
                (ratingScore * weights.rating) +
                (experienceScore * weights.experience) +
                (availabilityScore * weights.availability)
            ) * 100;

            const hasLocationData = typeof volunteer.location === 'string' && volunteer.location.trim().length > 0;
            const locationMatch = Boolean(
                location &&
                hasLocationData &&
                volunteer.location.toLowerCase().includes(location.toLowerCase())
            );

            return {
                volunteerId: volunteer._id,
                fullName: volunteer.fullName,
                email: volunteer.email,
                phoneNumber: volunteer.phoneNumber,
                skills: volunteerSkills,
                matchedSkills,
                completedTasks,
                averageRating: Number(averageRatingValue.toFixed(2)),
                score: Number(weightedScore.toFixed(2)),
                scorePercentage: `${Math.round(weightedScore)}%`,
                scoreBreakdown: {
                    skillMatch: Number((skillMatchRatio * 100).toFixed(2)),
                    rating: Number((ratingScore * 100).toFixed(2)),
                    experience: Number((experienceScore * 100).toFixed(2)),
                    availability: Number((availabilityScore * 100).toFixed(2))
                },
                explainability: {
                    weights,
                    locationProvided: Boolean(location),
                    locationMatch,
                    locationNote: hasLocationData
                        ? (location ? 'Location compared where volunteer location data exists' : 'No location filter provided')
                        : 'Volunteer profile has no location metadata'
                }
            };
        })
        .sort((a, b) => b.score - a.score);
};

const getVolunteerScoringContext = async (requiredSkills = []) => {
    const normalizedRequiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills.filter(Boolean)
        : [];

    const volunteerQuery = {
        role: 'volunteer',
        isDisabled: { $ne: true }
    };

    if (normalizedRequiredSkills.length > 0) {
        volunteerQuery.skills = { $in: normalizedRequiredSkills };
    }

    const volunteers = await User.find(volunteerQuery)
        .select('fullName email phoneNumber skills ratings isVerified isDisabled location');

    if (!volunteers.length) {
        return {
            volunteers: [],
            feedbackMap: new Map(),
            completedTaskMap: new Map(),
            maxCompletedTasks: 0
        };
    }

    const volunteerIds = volunteers.map((volunteer) => volunteer._id);

    const [feedbackStats, completedTaskStats] = await Promise.all([
        Feedback.aggregate([
            { $match: { volunteerId: { $in: volunteerIds } } },
            {
                $group: {
                    _id: '$volunteerId',
                    averageRating: { $avg: '$rating' },
                    ratingCount: { $sum: 1 }
                }
            }
        ]),
        Event.aggregate([
            { $unwind: '$volunteerAssignments' },
            {
                $match: {
                    'volunteerAssignments.volunteerId': { $in: volunteerIds },
                    'volunteerAssignments.status': 'Completed'
                }
            },
            {
                $group: {
                    _id: '$volunteerAssignments.volunteerId',
                    completedTasks: { $sum: 1 }
                }
            }
        ])
    ]);

    const feedbackMap = new Map(
        feedbackStats.map((item) => [
            item._id.toString(),
            {
                averageRating: Number(item.averageRating || 0),
                ratingCount: item.ratingCount || 0
            }
        ])
    );

    const completedTaskMap = new Map(
        completedTaskStats.map((item) => [
            item._id.toString(),
            item.completedTasks || 0
        ])
    );

    const maxCompletedTasks = Math.max(
        ...volunteers.map((volunteer) => completedTaskMap.get(volunteer._id.toString()) || 0),
        0
    );

    return {
        volunteers,
        feedbackMap,
        completedTaskMap,
        maxCompletedTasks
    };
};

/**
 * Send skill-matched notifications to volunteers when an event is created
 * @param {Object} event - The event object created by organizer
 * @returns {Promise<Array>} - Array of created notifications
 */
export const notifyVolunteersBySkills = async (event, options = {}) => {
    try {
        const { restrictToVolunteerIds = null } = options;
        let matchedVolunteers;
        const availableVolunteerQuery = {
            role: 'volunteer',
            isDisabled: { $ne: true },
            isVerified: true
        };
        const requiredSkills = Array.isArray(event.requiredSkills)
            ? event.requiredSkills.filter(Boolean)
            : [];
        const hasGeneralSupport = requiredSkills.includes('General Support');
        
        // Check if this is an EMERGENCY help request
        if (event.type === 'citizen' && event.isEmergency) {
            // EMERGENCY: Notify all available volunteers regardless of skills.
            matchedVolunteers = await User.find(availableVolunteerQuery);
            console.log(`🚨 EMERGENCY request - notifying ALL available ${matchedVolunteers.length} volunteers`);
        } else if (hasGeneralSupport) {
            // GENERAL SUPPORT: Notify every available volunteer because the event is open to all.
            const volunteerQuery = { ...availableVolunteerQuery };

            if (Array.isArray(restrictToVolunteerIds) && restrictToVolunteerIds.length > 0) {
                volunteerQuery._id = { $in: restrictToVolunteerIds };
            }

            matchedVolunteers = await User.find(volunteerQuery);
            console.log(`🌍 General Support event - notifying ALL available ${matchedVolunteers.length} volunteers`);
        } else if (requiredSkills.length === 0) {
            // No skills specified and not emergency - don't notify anyone
            console.log('No required skills specified and not emergency - no notifications');
            return [];
        } else {
            // NORMAL: Find volunteers with matching skills ONLY
            // Only notify volunteers who have at least one of the required skills
            const volunteerQuery = {
                ...availableVolunteerQuery,
                skills: { $in: requiredSkills }
            };

            if (Array.isArray(restrictToVolunteerIds) && restrictToVolunteerIds.length > 0) {
                volunteerQuery._id = { $in: restrictToVolunteerIds };
            }

            matchedVolunteers = await User.find(volunteerQuery);
            console.log(`Found ${matchedVolunteers.length} volunteers with matching skills:`, requiredSkills);
        }

        if (matchedVolunteers.length === 0) {
            console.log('No volunteers found for this request');
            return [];
        }

        // Create notifications for each matched volunteer
        const notifications = await Promise.all(
            matchedVolunteers.map(volunteer => {
                let matchedSkills;
                let notificationMessage;
                let notificationType;
                
                // Check if it's an emergency help request
                if (event.type === 'citizen' && event.isEmergency) {
                    // EMERGENCY notification - all volunteers notified
                    notificationType = 'emergency_help_request';
                    notificationMessage = `🚨 EMERGENCY Help Request: "${event.title}" - Priority HIGH. Urgent assistance needed! Immediate action required.`;
                    // Show which skills match (if any)
                    if (requiredSkills.length > 0) {
                        matchedSkills = (volunteer.skills || []).filter(skill =>
                            requiredSkills.includes(skill)
                        );
                        if (matchedSkills.length === 0) {
                            matchedSkills = ['Emergency Response'];
                        }
                    } else {
                        matchedSkills = ['Emergency Response'];
                    }
                } else if (hasGeneralSupport) {
                    // GENERAL SUPPORT event - everyone can participate
                    matchedSkills = ['General Support'];
                    notificationType = 'skill_matched_event';
                    notificationMessage = `🌍 Open Volunteer Opportunity! "${event.title}" is open to all volunteers. Can you help?`;
                } else if (event.type === 'citizen') {
                    // NORMAL citizen help request - skill-matched volunteers only
                    matchedSkills = (volunteer.skills || []).filter(skill =>
                        requiredSkills.includes(skill)
                    );
                    notificationType = 'skill_matched_event';
                    notificationMessage = `🆘 Help Request: "${event.title}" - Your skills are needed: ${matchedSkills.join(', ')}. Can you help?`;
                } else {
                    // Organizer event
                    matchedSkills = (volunteer.skills || []).filter(skill =>
                        requiredSkills.includes(skill)
                    );
                    notificationType = 'skill_matched_event';
                    notificationMessage = `🎯 New Event Opportunity! "${event.title}" is looking for volunteers with your skills: ${matchedSkills.join(', ')}. Will you participate?`;
                }

                console.log(`Notifying ${volunteer.fullName} (${volunteer.email}) - Matched skills:`, matchedSkills);

                return Notification.create({
                    user: volunteer._id,
                    type: notificationType,
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

        const volunteerSkills = Array.isArray(volunteer.skills) ? volunteer.skills : [];
        const statusFilter = filters.status || 'upcoming';

        const events = await Event.find({ status: statusFilter })
            .populate('organizer', 'fullName email organizationName')
            .sort({ startDateTime: 1 })
            .limit(filters.limit || 50)
            .skip(filters.offset || 0);

        const eventsWithMatches = events
            .map(event => {
                const requiredSkills = Array.isArray(event.requiredSkills) ? event.requiredSkills.filter(Boolean) : [];
                const hasGeneralSupport = requiredSkills.includes('General Support');
                const matchedSkills = hasGeneralSupport
                    ? ['General Support']
                    : requiredSkills.filter(skill => volunteerSkills.includes(skill));
                const isMatched = hasGeneralSupport || matchedSkills.length > 0;

                return {
                    ...event.toObject(),
                    matchedSkills,
                    matchCount: hasGeneralSupport ? 1 : matchedSkills.length,
                    matchPercentage: hasGeneralSupport
                        ? 100
                        : (requiredSkills.length > 0
                            ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
                            : 0),
                    isMatched,
                    hasGeneralSupport
                };
            })
            .filter(event => event.isMatched)
            .sort((a, b) => b.matchCount - a.matchCount);

        return {
            volunteer: volunteer.fullName,
            volunteerSkills,
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

/**
 * AI-based volunteer recommendations using weighted scoring (rule-based AI)
 * @param {Object} options
 * @param {Array<string>} options.requiredSkills - Required skills for request/event
 * @param {string} options.location - Optional location filter input (for API compatibility)
 * @param {number} options.limit - Number of recommendations to return
 * @param {boolean} options.includeAvailability - Include availability in score
 * @returns {Promise<Object>} ranked recommendation payload
 */
export const getAIRecommendedVolunteers = async (options = {}) => {
    const {
        requiredSkills = [],
        location = '',
        limit = 3,
        includeAvailability = true
    } = options;

    const normalizedRequiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills.filter(Boolean)
        : [];

    const scoringContext = await getVolunteerScoringContext(normalizedRequiredSkills);
    const { volunteers } = scoringContext;

    if (!volunteers.length) {
        return {
            title: 'AI Recommended Volunteers',
            totalCandidates: 0,
            recommendations: []
        };
    }

    const rankedVolunteers = buildRankedRecommendations({
        ...scoringContext,
        requiredSkills: normalizedRequiredSkills,
        location,
        includeAvailability
    });

    const topRecommendations = rankedVolunteers.slice(0, Math.max(1, limit)).map((volunteer, index) => ({
        rank: `Top ${index + 1}`,
        ...volunteer
    }));

    return {
        title: 'AI Recommended Volunteers',
        totalCandidates: rankedVolunteers.length,
        recommendations: topRecommendations
    };
};

/**
 * Batch AI recommendations for many requests in one pass.
 * @param {Array<Object>} requests - Request/event objects
 * @param {Object} options
 * @param {number} options.limit - Max recommendations per request
 * @param {boolean} options.includeAvailability - Include availability in score
 * @returns {Promise<Object>} mapping requestId -> top recommendations
 */
export const getAIRecommendedVolunteersForRequests = async (requests = [], options = {}) => {
    const { limit = 3, includeAvailability = true } = options;

    if (!Array.isArray(requests) || requests.length === 0) {
        return {};
    }

    const allRequiredSkills = requests.flatMap((request) =>
        Array.isArray(request.requiredSkills) ? request.requiredSkills : []
    );
    const uniqueRequiredSkills = [...new Set(allRequiredSkills.filter(Boolean))];

    const scoringContext = await getVolunteerScoringContext(uniqueRequiredSkills);
    if (!scoringContext.volunteers.length) {
        return requests.reduce((accumulator, request) => {
            accumulator[request._id.toString()] = [];
            return accumulator;
        }, {});
    }

    return requests.reduce((accumulator, request) => {
        const rankedVolunteers = buildRankedRecommendations({
            ...scoringContext,
            requiredSkills: request.requiredSkills || [],
            location: request.location || '',
            includeAvailability
        });

        accumulator[request._id.toString()] = rankedVolunteers
            .slice(0, Math.max(1, limit))
            .map((volunteer) => ({
                volunteerId: volunteer.volunteerId,
                fullName: volunteer.fullName,
                skills: volunteer.skills,
                score: volunteer.score,
                scorePercentage: volunteer.scorePercentage
            }));

        return accumulator;
    }, {});
};

export default {
    notifyVolunteersBySkills,
    notifyVolunteersByRequestSkills,
    getSkillMatchedEvents,
    getSkillMatchedRequests,
    getSkillAnalytics,
    getAIRecommendedVolunteers,
    getAIRecommendedVolunteersForRequests
};

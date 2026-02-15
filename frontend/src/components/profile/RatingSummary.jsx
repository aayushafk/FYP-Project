import React, { useState, useEffect } from 'react';
import { Star, Award } from 'lucide-react';
import api from '../../utils/api';

const RatingSummary = () => {
    const [ratingData, setRatingData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRatings();
    }, []);

    const fetchRatings = async () => {
        try {
            const response = await api.get('/volunteer/profile/ratings');
            setRatingData(response.data);
        } catch (error) {
            console.error('Error fetching ratings:', error);
            // If no ratings exist, set empty state
            setRatingData({
                avgRating: 0,
                ratingCount: 0,
                ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                recentFeedback: []
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        );
    };

    const getRoleBadgeColor = (role) => {
        return role === 'organizer'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-20 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (!ratingData) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-all">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Award size={20} className="text-yellow-500" />
                <h3 className="text-lg font-bold text-gray-900">Your Ratings</h3>
            </div>

            {/* Rating Summary */}
            <div className="flex items-center gap-8 mb-6 pb-6 border-b border-gray-100">
                {/* Average Rating */}
                <div className="text-center">
                    <div className="flex items-center gap-2 mb-2">
                        <Star size={32} className="fill-yellow-400 text-yellow-400" />
                        <div>
                            <div className="text-3xl font-bold text-gray-900">
                                {ratingData.ratingCount > 0 ? ratingData.avgRating : '-'}
                            </div>
                            <div className="text-sm text-gray-500">/ 5.0</div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-600">
                        Based on <span className="font-semibold">{ratingData.ratingCount}</span> rating{ratingData.ratingCount !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Rating Breakdown */}
                {ratingData.ratingCount > 0 && (
                    <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = ratingData.ratingBreakdown[stars] || 0;
                            const percentage = ratingData.ratingCount > 0
                                ? (count / ratingData.ratingCount) * 100
                                : 0;

                            return (
                                <div key={stars} className="flex items-center gap-3 mb-1.5">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-sm font-medium text-gray-700">{stars}</span>
                                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent Feedback */}
            {ratingData.recentFeedback && ratingData.recentFeedback.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Feedback</h4>
                    <div className="space-y-3">
                        {ratingData.recentFeedback.map((feedback, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                        {renderStars(feedback.stars)}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(feedback.raterRole)}`}>
                                            {feedback.raterRole === 'organizer' ? 'Organizer' : 'Citizen'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">"{feedback.comment}"</p>
                                <p className="text-xs text-gray-500 italic">Event: {feedback.eventTitle}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Ratings Message */}
            {ratingData.ratingCount === 0 && (
                <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                        Complete events to receive ratings from organizers and citizens
                    </p>
                </div>
            )}
        </div>
    );
};

export default RatingSummary;

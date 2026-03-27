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
                        size={18}
                        className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        );
    };

    const getRoleBadgeColor = (role) => {
        return role === 'organizer'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-gray-50 text-gray-700 border border-gray-200';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div className="animate-pulse">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-40"></div>
                            <div className="h-3 bg-gray-100 rounded w-32"></div>
                        </div>
                    </div>
                    <div className="flex gap-8 mb-8">
                        <div className="w-[200px] h-48 bg-gray-100 rounded-2xl"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                            <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                            <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                            <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                            <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-48"></div>
                        <div className="h-32 bg-gray-50 rounded-xl border border-gray-200"></div>
                        <div className="h-32 bg-gray-50 rounded-xl border border-gray-200"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!ratingData) return null;

    return (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                    <Award size={24} className="text-blue-600" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                        Ratings & Reviews
                    </h3>
                    <p className="text-sm text-gray-500">Your performance overview</p>
                </div>
            </div>

            {/* Rating Summary */}
            <div className="flex items-start gap-8 mb-8 pb-8 border-b border-gray-200">
                {/* Average Rating */}
                <div className="text-center bg-gray-50 rounded-2xl p-6 border border-gray-200 min-w-[180px]">
                    <div className="flex flex-col items-center gap-3">
                        <Star size={40} className="fill-yellow-400 text-yellow-400" />
                        <div className="flex items-baseline gap-1">
                            <div className="text-5xl font-bold text-gray-900">
                                {ratingData.ratingCount > 0 ? ratingData.avgRating : '-'}
                            </div>
                            <div className="text-lg text-gray-500 font-medium">/ 5.0</div>
                        </div>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">{ratingData.ratingCount}</span> review{ratingData.ratingCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Rating Breakdown */}
                {ratingData.ratingCount > 0 && (
                    <div className="flex-1">
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = ratingData.ratingBreakdown[stars] || 0;
                                const percentage = ratingData.ratingCount > 0
                                    ? (count / ratingData.ratingCount) * 100
                                    : 0;

                                return (
                                    <div key={stars} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 w-12">
                                            <span className="text-sm font-medium text-gray-700">{stars}</span>
                                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                        </div>
                                        <div className="flex-1 relative h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                            {percentage > 0 ? `${Math.round(percentage)}%` : '0%'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Feedback */}
            {ratingData.recentFeedback && ratingData.recentFeedback.length > 0 && (
                <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-4">
                        Recent Feedback
                    </h4>
                    <div className="space-y-3">
                        {ratingData.recentFeedback.map((feedback, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        {renderStars(feedback.stars)}
                                        <span className={`text-xs font-medium px-3 py-1 rounded-lg ${getRoleBadgeColor(feedback.raterRole)}`}>
                                            {feedback.raterRole === 'organizer' ? 'Organizer' : 'Citizen'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                    "{feedback.comment}"
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="font-medium">Event:</span>
                                    <p className="text-gray-700">{feedback.eventTitle}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Ratings Message */}
            {ratingData.ratingCount === 0 && (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <Star size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm max-w-md mx-auto">
                        Complete events to receive ratings from organizers and citizens
                    </p>
                </div>
            )}
        </div>
    );
};

export default RatingSummary;

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Award, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

const ParticipationDecisionModal = ({ isOpen, onClose, event, onDecision }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [decision, setDecision] = useState(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            setShowConfirmation(false);
            setDecision(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        // Reset all states before closing
        setIsSubmitting(false);
        setShowConfirmation(false);
        setDecision(null);
        onClose();
    };

    const handleDecision = async (participationDecision) => {
        try {
            setIsSubmitting(true);
            setDecision(participationDecision);

            // Submit the participation decision to the backend
            const endpoint = participationDecision === 'Accepted' 
                ? `/volunteer/event/${event._id}/accept`
                : `/volunteer/event/${event._id}/decline`;
            
            await api.post(endpoint);

            // Show confirmation briefly
            setShowConfirmation(true);
            
            // Wait a moment then notify parent and proceed to event details
            setTimeout(() => {
                setShowConfirmation(false);
                onDecision(participationDecision);
            }, 1500);

        } catch (error) {
            console.error('Error submitting participation decision:', error);
            const errorMessage = error.response?.data?.message || 'Failed to submit your decision. Please try again.';
            
            // Check if already assigned or already made a decision - this is acceptable for accepting
            const isAlreadyAssigned = errorMessage.toLowerCase().includes('already assigned') || 
                                     errorMessage.toLowerCase().includes('already made a decision') ||
                                     errorMessage.toLowerCase().includes('already accepted') ||
                                     errorMessage.toLowerCase().includes('you are already');
            
            if (isAlreadyAssigned && participationDecision === 'Accepted') {
                // Don't show error - just navigate to event page as if accepted successfully
                console.log('✅ Already assigned, navigating to event page');
                setIsSubmitting(false);
                setShowConfirmation(false);
                onDecision('Accepted');
                return; // Exit early to prevent alert
            }
            
            // Only show alert for actual errors (not "already assigned")
            alert(errorMessage);
            setIsSubmitting(false);
            setDecision(null);
        }
    };

    // Confirmation Screen
    if (showConfirmation) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-scaleIn">
                    {decision === 'Accepted' ? (
                        <>
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={48} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Great Choice! 🎉</h3>
                            <p className="text-gray-600">You're now participating in this event</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle size={48} className="text-gray-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Decision Recorded</h3>
                            <p className="text-gray-600">You've declined this event</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Decision Screen
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 animate-scaleIn overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                        disabled={isSubmitting}
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold mb-2">Event Participation</h2>
                    <p className="text-indigo-100">Would you like to participate in this event?</p>
                </div>

                {/* Event Details */}
                <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">{event.title}</h3>
                    
                    {event.description && (
                        <div className="mb-6">
                            <p className="text-gray-700 leading-relaxed">{event.description}</p>
                        </div>
                    )}

                    {/* Key Information */}
                    <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-4">
                        {event.startDateTime && (
                            <div className="flex items-start gap-3">
                                <Calendar size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Date & Time</p>
                                    <p className="text-gray-900 font-semibold">
                                        {new Date(event.startDateTime).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-gray-700">
                                        {new Date(event.startDateTime).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {event.location && (
                            <div className="flex items-start gap-3">
                                <MapPin size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Location</p>
                                    <p className="text-gray-900 font-semibold">{event.location}</p>
                                </div>
                            </div>
                        )}

                        {event.volunteersNeeded && (
                            <div className="flex items-start gap-3">
                                <Users size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">Volunteers Needed</p>
                                    <p className="text-gray-900 font-semibold">
                                        {event.volunteersNeeded} volunteer{event.volunteersNeeded !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Required Skills */}
                    {event.requiredSkills && event.requiredSkills.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Award size={18} className="text-gray-600" />
                                <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">
                                    Required Skills
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {event.requiredSkills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-200"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => handleDecision('Accepted')}
                            disabled={isSubmitting}
                            className="flex-1 bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                            <CheckCircle size={24} />
                            {isSubmitting && decision === 'Accepted' ? 'Processing...' : 'Yes, I\'ll Participate!'}
                        </button>
                        <button
                            onClick={() => handleDecision('Declined')}
                            disabled={isSubmitting}
                            className="flex-1 bg-gray-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                            <XCircle size={24} />
                            {isSubmitting && decision === 'Declined' ? 'Processing...' : 'No, Not This Time'}
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        After making your decision, you'll be taken to the event details page
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ParticipationDecisionModal;

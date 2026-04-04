import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['organizer_registration', 'event_verification', 'assignment_alert', 'request_update', 'message_received', 'skill_matched_event', 'skill_matched_request', 'new_event_created', 'volunteer_joined_event', 'volunteer_accepted', 'volunteer_declined', 'account_status', 'emergency_help_request', 'status_updated']
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    relatedType: {
        type: String,
        enum: ['Event', 'Request', 'User'],
        default: null
    },
    // For skill-based notifications
    matchedSkills: [{
        type: String,
        default: []
    }],
    skillMatchCount: {
        type: Number,
        default: 0
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

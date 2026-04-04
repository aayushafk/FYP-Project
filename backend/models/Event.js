import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Event description is required']
    },
    category: {
        type: String,
        trim: true
    },
    // Type: differentiates between organizer events and citizen help requests
    type: {
        type: String,
        enum: ['organizer', 'citizen'],
        required: true,
        default: 'organizer'
    },
    // Emergency flag for help requests
    isEmergency: {
        type: Boolean,
        default: false
    },
    // Priority indicator for citizen requests
    priority: {
        type: String,
        enum: ['NORMAL', 'HIGH'],
        default: 'NORMAL'
    },
    // Request type indicator for citizen requests
    requestType: {
        type: String,
        enum: ['Normal', 'Emergency'],
        default: 'Normal'
    },
    // Timing
    startDateTime: {
        type: Date,
        required: function() {
            return this.type === 'organizer';
        }
    },
    endDateTime: {
        type: Date,
        required: function() {
            return this.type === 'organizer';
        }
    },
    isRepeating: {
        type: Boolean,
        default: false
    },
    // Location
    location: {
        type: String,
        required: [true, 'Location is required']
    },
    // Organizer/Team responsible
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return this.type === 'organizer';
        }
    },
    contactInfo: {
        type: String,
        trim: true
    },
    // Volunteer Requirements
    requiredSkills: {
        type: [String],
        default: []
    },
    volunteersNeeded: {
        type: Number,
        default: 0
    },
    volunteerRoles: {
        type: [String],
        default: []
    },
    eligibilityCriteria: {
        type: String,
        default: 'anyone' // e.g., 'verified only'
    },
    // Participation Details
    registrationDeadline: {
        type: Date
    },
    maxParticipants: {
        type: Number,
        default: 0
    },
    assignedVolunteers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    approvalType: {
        type: String,
        enum: ['Auto', 'Manual'],
        default: 'Manual'
    },
    // Metadata
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    // Tracking Status (for task completion)
    trackingStatus: {
        type: String,
        enum: ['Pending', 'Assigned', 'In Progress', 'Completed'],
        default: 'Pending'
    },
    // Volunteer Assignments with individual tracking
    volunteerAssignments: [{
        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        participationStatus: {
            type: String,
            enum: ['Accepted', 'Declined'],
            default: 'Accepted'
        },
        status: {
            type: String,
            enum: ['Pending', 'Assigned', 'In Progress', 'Completed'],
            default: 'Assigned'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        startedAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        },
        ratings: [{
            ratedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            role: {
                type: String,
                enum: ['citizen', 'organizer'],
                required: true
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            feedback: {
                type: String,
                required: true,
                minlength: 10
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    tags: {
        type: [String],
        default: []
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

export default Event;

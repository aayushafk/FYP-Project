import mongoose from 'mongoose';

const eventMessageSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderRole: {
        type: String,
        enum: ['volunteer', 'organizer', 'admin', 'citizen', 'user'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String, // URL to uploaded image
        default: null
    },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries by eventId
eventMessageSchema.index({ eventId: 1, timestamp: -1 });

const EventMessage = mongoose.model('EventMessage', eventMessageSchema);

export default EventMessage;

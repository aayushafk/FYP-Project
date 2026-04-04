import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    volunteerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ratedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ratedByRole: {
        type: String,
        enum: ['organizer', 'citizen', 'user'],
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate ratings
feedbackSchema.index({ eventId: 1, volunteerId: 1, ratedBy: 1 }, { unique: true });

// Index for efficient queries
feedbackSchema.index({ volunteerId: 1 });
feedbackSchema.index({ eventId: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;

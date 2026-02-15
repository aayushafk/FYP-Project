import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Medical', 'Food', 'Rescue', 'Transport', 'Other'],
        required: true
    },
    requiredSkills: {
        type: [String],
        default: []
    },
    image: {
        type: String, // URL or base64 string
        default: ''
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Assigned', 'In Progress', 'Completed'],
        default: 'Pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Request = mongoose.model('Request', requestSchema);

export default Request;

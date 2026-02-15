import mongoose from 'mongoose';

const userVolunteerMessageSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    default: null
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['user', 'volunteer'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'location'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  // For location messages: { latitude, longitude }
  locationData: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  // For image messages
  imageData: {
    url: String,
    fileName: String,
    uploadedAt: Date,
    expiresAt: Date
  },
  // Message expiry (auto-delete temporary content)
  expiresAt: {
    type: Date,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  // For moderation/reporting
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  indexes: [
    { eventId: 1, timestamp: -1 },
    { senderId: 1, recipientId: 1, timestamp: -1 },
    { expiresAt: 1 }
  ]
});

// TTL index to auto-delete expired messages
userVolunteerMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure messages are properly typed
userVolunteerMessageSchema.pre('save', async function(next) {
  // If message expires, set expiry time (e.g., 24 hours for images, 7 days for location)
  if (!this.expiresAt && (this.messageType === 'image' || this.messageType === 'location')) {
    const expiryHours = this.messageType === 'image' ? 24 : 168; // 24h for images, 7d for location
    this.expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  }
  next();
});

const UserVolunteerMessage = mongoose.model('UserVolunteerMessage', userVolunteerMessageSchema);

export default UserVolunteerMessage;

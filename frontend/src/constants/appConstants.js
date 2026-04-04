// User Roles
export const USER_ROLES = {
  CITIZEN: 'citizen',
  VOLUNTEER: 'volunteer',
  ORGANIZER: 'organizer',
  ADMIN: 'admin'
}

export const ROLE_LABELS = {
  [USER_ROLES.CITIZEN]: 'Citizen',
  [USER_ROLES.VOLUNTEER]: 'Volunteer',
  [USER_ROLES.ORGANIZER]: 'Organizer',
  [USER_ROLES.ADMIN]: 'Administrator'
}

// Role Permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.CITIZEN]: [
    'view_events',
    'create_requests',
    'view_volunteers',
    'chat_with_volunteers'
  ],
  [USER_ROLES.VOLUNTEER]: [
    'view_events',
    'join_events',
    'view_profile',
    'manage_skills',
    'chat_with_organizers'
  ],
  [USER_ROLES.ORGANIZER]: [
    'create_events',
    'manage_events',
    'view_volunteers',
    'assign_volunteers',
    'create_requests',
    'chat_with_volunteers'
  ],
  [USER_ROLES.ADMIN]: [
    'manage_all_users',
    'manage_all_events',
    'view_statistics',
    'manage_system'
  ]
}

// Event Status
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived'
}

export const EVENT_STATUS_LABELS = {
  [EVENT_STATUS.DRAFT]: 'Draft',
  [EVENT_STATUS.PUBLISHED]: 'Published',
  [EVENT_STATUS.ONGOING]: 'Ongoing',
  [EVENT_STATUS.COMPLETED]: 'Completed',
  [EVENT_STATUS.CANCELLED]: 'Cancelled',
  [EVENT_STATUS.ARCHIVED]: 'Archived'
}

// Event Status Colors
export const EVENT_STATUS_COLORS = {
  [EVENT_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
  [EVENT_STATUS.PUBLISHED]: 'bg-blue-100 text-blue-800',
  [EVENT_STATUS.ONGOING]: 'bg-green-100 text-green-800',
  [EVENT_STATUS.COMPLETED]: 'bg-purple-100 text-purple-800',
  [EVENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [EVENT_STATUS.ARCHIVED]: 'bg-gray-100 text-gray-600'
}

// Volunteer Status
export const VOLUNTEER_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  UNAVAILABLE: 'unavailable',
  ON_LEAVE: 'on_leave'
}

export const VOLUNTEER_STATUS_LABELS = {
  [VOLUNTEER_STATUS.AVAILABLE]: 'Available',
  [VOLUNTEER_STATUS.BUSY]: 'Busy',
  [VOLUNTEER_STATUS.UNAVAILABLE]: 'Unavailable',
  [VOLUNTEER_STATUS.ON_LEAVE]: 'On Leave'
}

// Request Status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.PENDING]: 'Pending',
  [REQUEST_STATUS.ACCEPTED]: 'Accepted',
  [REQUEST_STATUS.COMPLETED]: 'Completed',
  [REQUEST_STATUS.CANCELLED]: 'Cancelled'
}

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LOCATION: 'location',
  FILE: 'file',
  SYSTEM: 'system'
}

// Notification Types
export const NOTIFICATION_TYPES = {
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  VOLUNTEER_JOINED: 'volunteer_joined',
  VOLUNTEER_LEFT: 'volunteer_left',
  MESSAGE_RECEIVED: 'message_received',
  ASSIGNMENT_CHANGED: 'assignment_changed',
  SKILL_MATCH: 'skill_match',
  SYSTEM: 'system'
}

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.EVENT_CREATED]: 'Event Created',
  [NOTIFICATION_TYPES.EVENT_UPDATED]: 'Event Updated',
  [NOTIFICATION_TYPES.VOLUNTEER_JOINED]: 'Volunteer Joined',
  [NOTIFICATION_TYPES.VOLUNTEER_LEFT]: 'Volunteer Left',
  [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: 'Message Received',
  [NOTIFICATION_TYPES.ASSIGNMENT_CHANGED]: 'Assignment Changed',
  [NOTIFICATION_TYPES.SKILL_MATCH]: 'Skill Match',
  [NOTIFICATION_TYPES.SYSTEM]: 'System'
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZES: [5, 10, 20, 50]
}

// Date & Time
export const DATE_FORMAT = 'MMM DD, YYYY'
export const TIME_FORMAT = 'HH:mm'
export const DATETIME_FORMAT = 'MMM DD, YYYY HH:mm'

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\d\s\-\+\(\)]+$/,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20
}

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC_ERROR: 'An error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  BAD_REQUEST: 'Invalid request. Please check your input.',
  SERVER_ERROR: 'Server error. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED_SUCCESSFULLY: 'Saved successfully!',
  DELETED_SUCCESSFULLY: 'Deleted successfully!',
  UPDATED_SUCCESSFULLY: 'Updated successfully!',
  CREATED_SUCCESSFULLY: 'Created successfully!',
  LOGGED_IN_SUCCESSFULLY: 'Logged in successfully!',
  LOGGED_OUT_SUCCESSFULLY: 'Logged out successfully!'
}

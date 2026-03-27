// API Configuration
// REST API uses /api endpoint, Socket.IO uses root
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api'

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ADMIN_LOGIN: '/auth/admin-login',
    LOGOUT: '/auth/logout',
    GET_CURRENT_USER: '/auth/current-user',
    REFRESH_TOKEN: '/auth/refresh-token'
  },

  // User
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    GET_EVENTS: '/user/events',
    GET_REQUESTS: '/user/requests'
  },

  // Volunteer
  VOLUNTEER: {
    PROFILE: '/volunteer/profile',
    SKILLS: '/volunteer/profile/skills',
    AVAILABLE_SKILLS: '/volunteer/skills/available',
    MATCHED_EVENTS: '/volunteer/skill-matched-events',
    MATCHED_REQUESTS: '/volunteer/skill-matched-requests',
    JOIN_EVENT: '/volunteer/events/join',
    LEAVE_EVENT: '/volunteer/events/leave',
    MY_EVENTS: '/volunteer/my-events',
    MY_REQUESTS: '/volunteer/my-requests'
  },

  // Organizer
  ORGANIZER: {
    PROFILE: '/organizer/profile',
    CREATE_EVENT: '/organizer/events',
    UPDATE_EVENT: '/organizer/events/:id',
    DELETE_EVENT: '/organizer/events/:id',
    GET_EVENTS: '/organizer/events',
    GET_VOLUNTEERS: '/organizer/volunteers',
    ASSIGN_VOLUNTEERS: '/organizer/events/:eventId/assign',
    CREATE_REQUEST: '/organizer/requests',
    GET_REQUESTS: '/organizer/requests'
  },

  // Chat & Messaging
  CHAT: {
    SEND_MESSAGE: '/chat/send',
    GET_MESSAGES: '/chat/messages/:conversationId',
    GET_CONVERSATIONS: '/chat/conversations',
    GET_INBOX: '/chat/inbox'
  },

  // Events
  EVENTS: {
    GET_ALL: '/events',
    GET_ONE: '/events/:id',
    SEARCH: '/events/search',
    GET_BY_LOCATION: '/events/location/:location'
  },

  // Help Chat
  HELP_CHAT: {
    SEND_MESSAGE: '/user-volunteer-chat/send',
    GET_MESSAGES: '/user-volunteer-chat/messages/:eventId',
    GET_CONVERSATION: '/user-volunteer-chat/conversation/:eventId/:userId'
  },

  // Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    FILE: '/upload/file'
  },

  // Admin
  ADMIN: {
    GET_USERS: '/admin/users',
    GET_EVENTS: '/admin/events',
    GET_STATISTICS: '/admin/statistics',
    DELETE_USER: '/admin/users/:id',
    DELETE_EVENT: '/admin/events/:id'
  }
}

// Socket.io Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Chat
  SEND_MESSAGE: 'sendMessage',
  RECEIVE_MESSAGE: 'receiveMessage',
  MESSAGE_DELIVERED: 'messageDelivered',

  // Help Chat
  SEND_HELP_MESSAGE: 'sendHelpMessage',
  RECEIVE_HELP_MESSAGE: 'receiveHelpMessage',
  HELP_MESSAGE_ERROR: 'helpMessageError',

  // User Presence
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  USER_TYPING: 'userTyping',
  USER_STOP_TYPING: 'userStopTyping',

  // Notifications
  NEW_NOTIFICATION: 'newNotification',
  NOTIFICATION_READ: 'notificationRead',

  // Event Updates
  EVENT_UPDATED: 'eventUpdated',
  VOLUNTEER_ASSIGNED: 'volunteerAssigned',
  VOLUNTEER_REMOVED: 'volunteerRemoved'
}

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  USER_PREFERENCES: 'userPreferences',
  RECENT_SEARCHES: 'recentSearches'
}

// Default Config
export const DEFAULT_CONFIG = {
  ITEMS_PER_PAGE: 10,
  API_TIMEOUT: 10000,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DEBUG_MODE: import.meta.env.DEV
}

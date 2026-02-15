// Application Constants
export const VALID_ROLES = ['citizen', 'volunteer', 'organizer', 'admin']

export const SKILL_LIST = [
  'General Support',
  'First Aid',
  'Medical Assistance',
  'Food Distribution',
  'Logistics & Transport',
  'Crowd Management',
  'Teaching & Tutoring',
  'Disaster Relief',
  'Counseling Support',
  'Technical Support',
  'Translation'
]

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const NOTIFICATION_TYPES = {
  ORGANIZER_REGISTRATION: 'organizer_registration',
  EVENT_CREATED: 'event_created',
  VOLUNTEER_JOINED: 'volunteer_joined',
  MESSAGE_RECEIVED: 'message_received',
  EVENT_UPDATED: 'event_updated'
}

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}

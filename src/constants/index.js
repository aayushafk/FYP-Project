// Re-export all constants
export * from './api'
export * from './appConstants'
export * from './skills'

// Combined constants object
export const CONSTANTS = {
  ROLES: require('./appConstants').USER_ROLES,
  EVENT_STATUS: require('./appConstants').EVENT_STATUS,
  VOLUNTEER_STATUS: require('./appConstants').VOLUNTEER_STATUS,
  REQUEST_STATUS: require('./appConstants').REQUEST_STATUS,
  MESSAGE_TYPES: require('./appConstants').MESSAGE_TYPES,
  NOTIFICATION_TYPES: require('./appConstants').NOTIFICATION_TYPES,
  SKILLS: require('./skills').SKILLS,
  SKILL_LIST: require('./skills').SKILL_LIST,
  SKILL_MATCH: require('./skills').SKILL_MATCH
}

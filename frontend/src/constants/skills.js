// Skills List
export const SKILL_CATEGORIES = {
  GENERAL: 'General Support',
  MEDICAL: 'Medical & Health',
  EMERGENCY: 'Emergency & Rescue',
  LOGISTICS: 'Logistics & Support',
  EDUCATION: 'Education & Training',
  CARE: 'Care Services',
  EVENT: 'Event & Community',
  COMMUNICATION: 'Communication',
  PROFESSIONAL: 'Professional Services'
}

export const SKILLS = {
  [SKILL_CATEGORIES.GENERAL]: [
    'General Support'
  ],
  [SKILL_CATEGORIES.MEDICAL]: [
    'First Aid',
    'Medical Assistance',
    'Nursing',
    'CPR Certification',
    'Health Education'
  ],
  [SKILL_CATEGORIES.EMERGENCY]: [
    'Disaster Relief',
    'Emergency Response',
    'Crisis Management',
    'Search & Rescue',
    'Safety Management'
  ],
  [SKILL_CATEGORIES.LOGISTICS]: [
    'Logistics & Transport',
    'Inventory Management',
    'Food Distribution',
    'Supply Chain',
    'Warehouse Management'
  ],
  [SKILL_CATEGORIES.EDUCATION]: [
    'Teaching & Tutoring',
    'Curriculum Development',
    'Student Mentoring',
    'Training & Development',
    'Technical Training'
  ],
  [SKILL_CATEGORIES.CARE]: [
    'Childcare',
    'Elder Care',
    'Disability Support',
    'Mental Health Support',
    'Counseling Support'
  ],
  [SKILL_CATEGORIES.EVENT]: [
    'Event Planning',
    'Community Organizing',
    'Marketing & Outreach',
    'Public Relations',
    'Crowd Management'
  ],
  [SKILL_CATEGORIES.COMMUNICATION]: [
    'Translation',
    'Public Speaking',
    'Communication Skills',
    'Social Media Management',
    'Content Writing'
  ],
  [SKILL_CATEGORIES.PROFESSIONAL]: [
    'Technical Support',
    'IT Support',
    'Legal Services',
    'Financial Services',
    'Project Management'
  ]
}

// Get all skills as flat array
export const SKILL_LIST = Object.values(SKILLS).flat()

// Skill Levels
export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
}

export const SKILL_LEVEL_LABELS = {
  [SKILL_LEVELS.BEGINNER]: 'Beginner',
  [SKILL_LEVELS.INTERMEDIATE]: 'Intermediate',
  [SKILL_LEVELS.ADVANCED]: 'Advanced',
  [SKILL_LEVELS.EXPERT]: 'Expert'
}

// Skill Match Scoring
export const SKILL_MATCH = {
  PERFECT_MATCH: 100,
  STRONG_MATCH: 75,
  PARTIAL_MATCH: 50,
  WEAK_MATCH: 25,
  NO_MATCH: 0
}

export const SKILL_MATCH_LABELS = {
  [SKILL_MATCH.PERFECT_MATCH]: 'Perfect Match',
  [SKILL_MATCH.STRONG_MATCH]: 'Strong Match',
  [SKILL_MATCH.PARTIAL_MATCH]: 'Partial Match',
  [SKILL_MATCH.WEAK_MATCH]: 'Weak Match',
  [SKILL_MATCH.NO_MATCH]: 'No Match'
}

export const SKILL_MATCH_COLORS = {
  [SKILL_MATCH.PERFECT_MATCH]: 'bg-green-100 text-green-800 border-green-300',
  [SKILL_MATCH.STRONG_MATCH]: 'bg-blue-100 text-blue-800 border-blue-300',
  [SKILL_MATCH.PARTIAL_MATCH]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [SKILL_MATCH.WEAK_MATCH]: 'bg-orange-100 text-orange-800 border-orange-300',
  [SKILL_MATCH.NO_MATCH]: 'bg-gray-100 text-gray-800 border-gray-300'
}

// Related Skills (for suggestions)
export const RELATED_SKILLS = {
  'First Aid': ['CPR Certification', 'Medical Assistance', 'Emergency Response'],
  'CPR Certification': ['First Aid', 'Medical Assistance', 'Health Education'],
  'Medical Assistance': ['First Aid', 'CPR Certification', 'Nursing'],
  'Teaching & Tutoring': ['Curriculum Development', 'Student Mentoring', 'Training & Development'],
  'Disaster Relief': ['Emergency Response', 'Crisis Management', 'Search & Rescue'],
  'Event Planning': ['Community Organizing', 'Crowd Management', 'Marketing & Outreach'],
  'Translation': ['Public Speaking', 'Communication Skills', 'Content Writing'],
  'Technical Support': ['IT Support', 'Technical Training', 'Project Management'],
  'Food Distribution': ['Logistics & Transport', 'Inventory Management', 'Supply Chain'],
  'Childcare': ['Elder Care', 'Disability Support', 'Mental Health Support']
}

// Experience Points Per Skill
export const SKILL_XP_REWARDS = {
  BEGINNER: 10,
  INTERMEDIATE: 25,
  ADVANCED: 50,
  EXPERT: 100
}
